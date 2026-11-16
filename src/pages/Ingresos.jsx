import { PROCEDENCIAS, TIPOS_LECHE } from '../data/catalogos';
import { registrarIngreso } from '../data/store';
import { ahoraLocal, estadoVisible, fmtFecha, fmtMl, hoyISO } from '../util';
import { Campo, EstadoLote, Mensajes, Opciones, useFormulario } from '../ui';

const inicial = () => ({
  donanteId: '', fechaIngreso: ahoraLocal(), fechaExtraccion: hoyISO(), tipoLeche: 'madura',
  procedencia: 'banco', volumenMl: '', responsable: '', observaciones: '',
});

export default function Ingresos({ donantes, lotes, irA }) {
  const aptas = donantes
    .filter((d) => d.estadoTamizaje === 'apta')
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const { f, set, enviar, error, ok, enviando } = useFormulario(inicial, async (datos) => {
    const donante = aptas.find((d) => d.id === datos.donanteId);
    await registrarIngreso({ ...datos, donanteNombre: donante?.nombre || '' });
    return 'Ingreso registrado. El lote queda como leche cruda en espera de pasteurización.';
  });

  const lista = [...lotes].sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso));

  return (
    <>
      <header className="encabezado"><h1>Ingresos de leche</h1></header>

      <form className="tarjeta formulario" onSubmit={enviar}>
        <h2>Nuevo ingreso</h2>
        {aptas.length === 0 && (
          <p className="aviso">
            No hay donantes con tamizaje apto.{' '}
            <button type="button" className="enlace" onClick={() => irA('donantes')}>Registrar donante</button>
          </p>
        )}
        <div className="rejilla">
          <Campo etiqueta="Donante (solo aptas)">
            <select value={f.donanteId} onChange={set('donanteId')} required>
              <option value="">Seleccionar…</option>
              {aptas.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Volumen (ml)">
            <input type="number" min="1" step="1" value={f.volumenMl} onChange={set('volumenMl')} required />
          </Campo>
          <Campo etiqueta="Fecha de extracción">
            <input type="date" max={hoyISO()} value={f.fechaExtraccion} onChange={set('fechaExtraccion')} required />
          </Campo>
          <Campo etiqueta="Fecha y hora de ingreso">
            <input type="datetime-local" value={f.fechaIngreso} onChange={set('fechaIngreso')} required />
          </Campo>
          <Campo etiqueta="Tipo de leche">
            <select value={f.tipoLeche} onChange={set('tipoLeche')}><Opciones mapa={TIPOS_LECHE} /></select>
          </Campo>
          <Campo etiqueta="Procedencia">
            <select value={f.procedencia} onChange={set('procedencia')}><Opciones mapa={PROCEDENCIAS} /></select>
          </Campo>
          <Campo etiqueta="Responsable que recibe">
            <input value={f.responsable} onChange={set('responsable')} required />
          </Campo>
          <Campo etiqueta="Observaciones">
            <input value={f.observaciones} onChange={set('observaciones')} />
          </Campo>
        </div>
        <Mensajes error={error} ok={ok} />
        <button className="primario" disabled={enviando}>Registrar ingreso</button>
      </form>

      <section className="tarjeta">
        <h2>Historial de ingresos</h2>
        {lista.length === 0 ? <p className="tenue">Sin ingresos todavía.</p> : (
          <table>
            <thead>
              <tr>
                <th>Ingreso</th><th>Lote</th><th>Donante</th><th>Tipo</th>
                <th>Procedencia</th><th className="num">Volumen</th><th>Estado</th><th>Recibió</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((l) => (
                <tr key={l.id}>
                  <td>{fmtFecha(l.fechaIngreso)}</td>
                  <td className="mono">{l.codigo}</td>
                  <td>{l.donanteNombre}</td>
                  <td>{TIPOS_LECHE[l.tipoLeche]}</td>
                  <td>{PROCEDENCIAS[l.procedencia]}</td>
                  <td className="num">{fmtMl(l.volumenInicialMl)}</td>
                  <td><EstadoLote estado={estadoVisible(l)} /></td>
                  <td>{l.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
