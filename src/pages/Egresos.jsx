import { MOTIVOS_EGRESO, SERVICIOS, TIPOS_LECHE } from '../data/catalogos';
import { registrarEgreso } from '../data/store';
import { ahoraLocal, estadoVisible, fmtFecha, fmtMl } from '../util';
import { Campo, Mensajes, Opciones, useFormulario } from '../ui';

const inicial = () => ({
  motivo: 'dispensacion', loteId: '', volumenMl: '', fecha: ahoraLocal(),
  receptorExpediente: '', receptorNombre: '', servicio: SERVICIOS[0], prescriptor: '',
  responsable: '', observaciones: '',
});

export default function Egresos({ lotes, egresos }) {
  const { f, setF, set, enviar, error, ok, enviando } = useFormulario(inicial, async (datos) => {
    await registrarEgreso(datos);
    return 'Egreso registrado y descontado del lote.';
  });

  const esDispensacion = f.motivo === 'dispensacion';
  // Dispensación: solo pasteurizada vigente, primero la que vence antes.
  const disponibles = lotes
    .map((l) => ({ ...l, ev: estadoVisible(l) }))
    .filter((l) => (esDispensacion ? l.ev === 'pasteurizada' : ['cruda', 'pasteurizada', 'vencida'].includes(l.ev)))
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
  const lote = disponibles.find((l) => l.id === f.loteId);

  const cambiarMotivo = (e) => setF((prev) => ({ ...prev, motivo: e.target.value, loteId: '', volumenMl: '' }));
  const lista = [...egresos].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <header className="encabezado"><h1>Egresos de leche</h1></header>

      <form className="tarjeta formulario" onSubmit={enviar}>
        <h2>Nuevo egreso</h2>
        <div className="rejilla">
          <Campo etiqueta="Motivo">
            <select value={f.motivo} onChange={cambiarMotivo}><Opciones mapa={MOTIVOS_EGRESO} /></select>
          </Campo>
          <Campo etiqueta={esDispensacion ? 'Lote (pasteurizado vigente)' : 'Lote'}>
            <select value={f.loteId} onChange={set('loteId')} required>
              <option value="">Seleccionar…</option>
              {disponibles.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.codigo} · {TIPOS_LECHE[l.tipoLeche]} · {l.volumenDisponibleMl} ml · vence {fmtFecha(l.fechaVencimiento)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta={lote ? `Volumen (ml) · máx. ${lote.volumenDisponibleMl}` : 'Volumen (ml)'}>
            <input
              type="number" min="1" step="1" max={lote?.volumenDisponibleMl}
              value={f.volumenMl} onChange={set('volumenMl')} required
            />
          </Campo>
          <Campo etiqueta="Fecha y hora">
            <input type="datetime-local" value={f.fecha} onChange={set('fecha')} required />
          </Campo>
          {esDispensacion && (
            <>
              <Campo etiqueta="Expediente del receptor">
                <input value={f.receptorExpediente} onChange={set('receptorExpediente')} required />
              </Campo>
              <Campo etiqueta="Receptor (nombre o iniciales)">
                <input value={f.receptorNombre} onChange={set('receptorNombre')} />
              </Campo>
              <Campo etiqueta="Servicio">
                <select value={f.servicio} onChange={set('servicio')}>
                  {SERVICIOS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Médico que prescribe">
                <input value={f.prescriptor} onChange={set('prescriptor')} />
              </Campo>
            </>
          )}
          <Campo etiqueta="Responsable que entrega">
            <input value={f.responsable} onChange={set('responsable')} required />
          </Campo>
          <Campo etiqueta="Observaciones">
            <input value={f.observaciones} onChange={set('observaciones')} />
          </Campo>
        </div>
        {esDispensacion && disponibles.length === 0 && (
          <p className="aviso">No hay leche pasteurizada vigente. Marca un lote como pasteurizado en Inventario.</p>
        )}
        <Mensajes error={error} ok={ok} />
        <button className="primario" disabled={enviando}>Registrar egreso</button>
      </form>

      <section className="tarjeta">
        <h2>Historial de egresos</h2>
        {lista.length === 0 ? <p className="tenue">Sin egresos todavía.</p> : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Lote</th><th>Motivo</th><th>Receptor</th>
                <th>Servicio</th><th className="num">Volumen</th><th>Entregó</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id}>
                  <td>{fmtFecha(e.fecha)}</td>
                  <td className="mono">{e.loteCodigo}</td>
                  <td>{MOTIVOS_EGRESO[e.motivo]}</td>
                  <td>{e.receptorExpediente ? `${e.receptorExpediente}${e.receptorNombre ? ` · ${e.receptorNombre}` : ''}` : '—'}</td>
                  <td>{e.servicio || '—'}</td>
                  <td className="num">{fmtMl(e.volumenMl)}</td>
                  <td>{e.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
