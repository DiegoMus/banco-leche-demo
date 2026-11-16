// Capa de datos. Usa Firestore si hay configuración; si no, localStorage.
// Colecciones: donantes, lotes (cada ingreso crea un lote), egresos.
import {
  collection, doc, addDoc, updateDoc, onSnapshot, runTransaction,
} from 'firebase/firestore';
import { db, firebaseActivo } from '../firebase';
import { DIAS_VIGENCIA_CRUDA, DIAS_VIGENCIA_PASTEURIZADA } from './catalogos';
import { ahoraLocal, hoyISO, sumarDias } from '../util';

// ---------- Modo local ----------
const CLAVE = 'bancoLecheDemo:v1';
let local = { donantes: [], lotes: [], egresos: [] };
try {
  const guardado = JSON.parse(localStorage.getItem(CLAVE));
  if (guardado) local = { ...local, ...guardado };
} catch { /* sin almacenamiento disponible: queda en memoria */ }

const oyentes = { donantes: new Set(), lotes: new Set(), egresos: new Set() };

function emitir(...nombres) {
  try { localStorage.setItem(CLAVE, JSON.stringify(local)); } catch { /* ignorar */ }
  nombres.forEach((n) => oyentes[n].forEach((cb) => cb([...local[n]])));
}

const nuevoId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ---------- Lectura en tiempo real ----------
export function suscribir(nombre, cb, onError) {
  if (firebaseActivo) {
    return onSnapshot(
      collection(db, nombre),
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onError,
    );
  }
  oyentes[nombre].add(cb);
  cb([...local[nombre]]);
  return () => oyentes[nombre].delete(cb);
}

async function crear(nombre, datos) {
  const registro = { ...datos, creadoEn: new Date().toISOString() };
  if (firebaseActivo) return (await addDoc(collection(db, nombre), registro)).id;
  const id = nuevoId();
  local[nombre].push({ id, ...registro });
  emitir(nombre);
  return id;
}

async function actualizar(nombre, id, cambios) {
  if (firebaseActivo) return updateDoc(doc(db, nombre, id), cambios);
  local[nombre] = local[nombre].map((x) => (x.id === id ? { ...x, ...cambios } : x));
  emitir(nombre);
}

// ---------- Donantes ----------
export const crearDonante = (d) =>
  crear('donantes', {
    nombre: d.nombre.trim(),
    identificacion: d.identificacion?.trim() || '',
    telefono: d.telefono?.trim() || '',
    fechaNacimiento: d.fechaNacimiento || '',
    estadoTamizaje: d.estadoTamizaje || 'pendiente',
    fechaTamizaje: d.fechaTamizaje || '',
  });

export const actualizarDonante = (id, cambios) => actualizar('donantes', id, cambios);

// ---------- Ingresos (crean un lote) ----------
function generarCodigo(fechaISO) {
  const azar = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `BL-${fechaISO.slice(2, 10).replaceAll('-', '')}-${azar}`;
}

export function registrarIngreso(d) {
  const volumen = Number(d.volumenMl);
  if (!d.donanteId) throw new Error('Selecciona una donante.');
  if (!(volumen > 0)) throw new Error('El volumen debe ser mayor que 0.');
  if (d.fechaExtraccion > d.fechaIngreso.slice(0, 10)) {
    throw new Error('La fecha de extracción no puede ser posterior al ingreso.');
  }
  return crear('lotes', {
    codigo: generarCodigo(d.fechaIngreso),
    donanteId: d.donanteId,
    donanteNombre: d.donanteNombre,
    fechaIngreso: d.fechaIngreso,
    fechaExtraccion: d.fechaExtraccion,
    tipoLeche: d.tipoLeche,
    procedencia: d.procedencia,
    volumenInicialMl: volumen,
    volumenDisponibleMl: volumen,
    estado: 'cruda',
    fechaPasteurizacion: null,
    fechaVencimiento: sumarDias(d.fechaExtraccion, DIAS_VIGENCIA_CRUDA),
    responsable: d.responsable?.trim() || '',
    observaciones: d.observaciones?.trim() || '',
  });
}

export const pasteurizarLote = (id, fecha = hoyISO()) =>
  actualizar('lotes', id, {
    estado: 'pasteurizada',
    fechaPasteurizacion: fecha,
    fechaVencimiento: sumarDias(fecha, DIAS_VIGENCIA_PASTEURIZADA),
  });

// ---------- Egresos ----------
function validarEgreso(lote, d) {
  const volumen = Number(d.volumenMl);
  const disponible = Number(lote.volumenDisponibleMl);
  if (!(volumen > 0)) throw new Error('El volumen debe ser mayor que 0.');
  if (lote.estado === 'descartada') throw new Error('El lote ya fue descartado.');
  if (volumen > disponible) {
    throw new Error(`El lote solo tiene ${disponible} ml disponibles.`);
  }
  if (d.motivo === 'dispensacion') {
    if (lote.estado !== 'pasteurizada') {
      throw new Error('Solo se puede dispensar leche pasteurizada.');
    }
    if (lote.fechaVencimiento < hoyISO()) throw new Error('El lote está vencido.');
    if (!d.receptorExpediente?.trim()) throw new Error('Indica el expediente del receptor.');
  }
  const restante = disponible - volumen;
  const esDescarte = d.motivo === 'descarte' || d.motivo === 'vencimiento';
  return {
    cambiosLote: {
      volumenDisponibleMl: restante,
      ...(esDescarte && restante === 0 ? { estado: 'descartada' } : {}),
    },
    egreso: {
      loteId: d.loteId,
      loteCodigo: lote.codigo,
      fecha: d.fecha || ahoraLocal(),
      motivo: d.motivo,
      volumenMl: volumen,
      receptorExpediente: d.motivo === 'dispensacion' ? d.receptorExpediente.trim() : '',
      receptorNombre: d.motivo === 'dispensacion' ? d.receptorNombre?.trim() || '' : '',
      servicio: d.motivo === 'dispensacion' ? d.servicio || '' : '',
      prescriptor: d.motivo === 'dispensacion' ? d.prescriptor?.trim() || '' : '',
      responsable: d.responsable?.trim() || '',
      observaciones: d.observaciones?.trim() || '',
      creadoEn: new Date().toISOString(),
    },
  };
}

// Descuenta del lote y crea el egreso de forma atómica (transacción en Firestore).
export async function registrarEgreso(d) {
  if (!d.loteId) throw new Error('Selecciona un lote.');
  if (firebaseActivo) {
    return runTransaction(db, async (tx) => {
      const refLote = doc(db, 'lotes', d.loteId);
      const snap = await tx.get(refLote);
      if (!snap.exists()) throw new Error('El lote no existe.');
      const { cambiosLote, egreso } = validarEgreso(snap.data(), d);
      tx.update(refLote, cambiosLote);
      tx.set(doc(collection(db, 'egresos')), egreso);
    });
  }
  const lote = local.lotes.find((l) => l.id === d.loteId);
  if (!lote) throw new Error('El lote no existe.');
  const { cambiosLote, egreso } = validarEgreso(lote, d);
  local.lotes = local.lotes.map((l) => (l.id === d.loteId ? { ...l, ...cambiosLote } : l));
  local.egresos.push({ id: nuevoId(), ...egreso });
  emitir('lotes', 'egresos');
}

// ---------- Datos de ejemplo (ficticios) ----------
export async function cargarDatosDemo() {
  const hoy = hoyISO();
  const dia = (n) => sumarDias(hoy, -n);
  const donantes = {};
  for (const [clave, nombre, estado] of [
    ['maria', 'María López (ficticia)', 'apta'],
    ['ana', 'Ana Pérez (ficticia)', 'apta'],
    ['lucia', 'Lucía Hernández (ficticia)', 'apta'],
    ['sofia', 'Sofía Castillo (ficticia)', 'pendiente'],
  ]) {
    donantes[clave] = {
      nombre,
      id: await crearDonante({
        nombre,
        identificacion: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        telefono: '5555-0000',
        estadoTamizaje: estado,
        fechaTamizaje: estado === 'apta' ? dia(30) : '',
      }),
    };
  }
  const ingreso = (quien, hace, tipo, ml, procedencia = 'banco') =>
    registrarIngreso({
      donanteId: donantes[quien].id,
      donanteNombre: donantes[quien].nombre,
      fechaIngreso: `${dia(hace)}T08:30`,
      fechaExtraccion: dia(hace),
      tipoLeche: tipo,
      procedencia,
      volumenMl: ml,
      responsable: 'Enf. Demo',
    });
  const egreso = (loteId, hace, motivo, ml, extra = {}) =>
    registrarEgreso({
      loteId, motivo, volumenMl: ml, fecha: `${dia(hace)}T10:00`, responsable: 'Enf. Demo', ...extra,
    });
  const receptor = (n, servicio) => ({
    receptorExpediente: `EXP-DEMO-${n}`, receptorNombre: `RN ${n}`, servicio, prescriptor: 'Dra. Demo',
  });

  const l1 = await ingreso('maria', 20, 'madura', 180);
  await pasteurizarLote(l1, dia(18));
  await egreso(l1, 5, 'dispensacion', 60, receptor('01', 'UCIN'));
  await egreso(l1, 2, 'dispensacion', 40, receptor('02', 'Neonatología'));

  const l2 = await ingreso('ana', 12, 'calostro', 60, 'hospitalizacion');
  await pasteurizarLote(l2, dia(10));
  await egreso(l2, 1, 'dispensacion', 30, receptor('01', 'UCIN'));

  const l3 = await ingreso('lucia', 9, 'transicion', 120, 'domicilio');
  await pasteurizarLote(l3, dia(7));
  await egreso(l3, 7, 'analisis', 5, { observaciones: 'Control microbiológico' });

  await ingreso('maria', 3, 'madura', 150);
  await ingreso('ana', 1, 'madura', 200, 'domicilio');

  const l6 = await ingreso('lucia', 16, 'madura', 100);
  await egreso(l6, 0, 'vencimiento', 100, { observaciones: 'No se pasteurizó a tiempo' });
}
