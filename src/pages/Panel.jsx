import { MOTIVOS_EGRESO } from '../data/catalogos';
import { diasPara, estadoVisible, fmtFecha, fmtMl, hoyISO, sumar } from '../util';
import { EstadoLote } from '../ui';

export default function Panel({ lotes, egresos, irA }) {
  const mes = hoyISO().slice(0, 7);
  const conEstado = lotes.map((l) => ({ ...l, ev: estadoVisible(l) }));
  const pasteurizada = conEstado.filter((l) => l.ev === 'pasteurizada');
  const cruda = conEstado.filter((l) => l.ev === 'cruda');
  const egresosMes = egresos.filter((e) => e.fecha.startsWith(mes));
  const porVencer = conEstado
    .filter((l) => (l.ev === 'cruda' || l.ev === 'pasteurizada') && diasPara(l.fechaVencimiento) <= 7)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
  const vencidos = conEstado.filter((l) => l.ev === 'vencida');

  const movimientos = [
    ...lotes.map((l) => ({
      id: `i-${l.id}`, fecha: l.fechaIngreso, tipo: 'Ingreso', codigo: l.codigo,
      detalle: l.donanteNombre, ml: Number(l.volumenInicialMl),
    })),
    ...egresos.map((e) => ({
      id: `e-${e.id}`, fecha: e.fecha, tipo: 'Egreso', codigo: e.loteCodigo,
      detalle: MOTIVOS_EGRESO[e.motivo] + (e.servicio ? ` · ${e.servicio}` : ''), ml: -Number(e.volumenMl),
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 10);

  return (
    <>
      <header className="encabezado">
        <h1>Panel</h1>
        <div className="acciones">
          <button className="primario" onClick={() => irA('ingresos')}>Registrar ingreso</button>
          <button onClick={() => irA('egresos')}>Registrar egreso</button>
        </div>
      </header>

      <section className="kpis">
        <div className="kpi kpi-principal">
          <span>Lista para dispensar</span>
          <strong>{fmtMl(sumar(pasteurizada, 'volumenDisponibleMl'))}</strong>
          <small>{pasteurizada.length} lotes pasteurizados vigentes</small>
        </div>
        <div className="kpi">
          <span>Cruda en espera</span>
          <strong>{fmtMl(sumar(cruda, 'volumenDisponibleMl'))}</strong>
          <small>{cruda.length} lotes por pasteurizar</small>
        </div>
        <div className="kpi">
          <span>Ingresado este mes</span>
          <strong>{fmtMl(sumar(lotes.filter((l) => l.fechaIngreso.startsWith(mes)), 'volumenInicialMl'))}</strong>
          <small>Volumen recibido</small>
        </div>
        <div className="kpi">
          <span>Dispensado este mes</span>
          <strong>{fmtMl(sumar(egresosMes.filter((e) => e.motivo === 'dispensacion'), 'volumenMl'))}</strong>
          <small>
            Descartado: {fmtMl(sumar(egresosMes.filter((e) => e.motivo === 'descarte' || e.motivo === 'vencimiento'), 'volumenMl'))}
          </small>
        </div>
      </section>

      {(porVencer.length > 0 || vencidos.length > 0) && (
        <section className="tarjeta">
          <h2>Atención</h2>
          <table>
            <thead>
              <tr><th>Lote</th><th>Estado</th><th>Disponible</th><th>Vence</th><th></th></tr>
            </thead>
            <tbody>
              {[...vencidos, ...porVencer].map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.codigo}</td>
                  <td><EstadoLote estado={l.ev} /></td>
                  <td>{fmtMl(l.volumenDisponibleMl)}</td>
                  <td>{fmtFecha(l.fechaVencimiento)}</td>
                  <td className="tenue">
                    {l.ev === 'vencida' ? 'Registrar descarte por vencimiento' : `Vence en ${diasPara(l.fechaVencimiento)} días`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="tarjeta">
        <h2>Últimos movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="tenue">Sin movimientos todavía.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th>Lote</th><th>Detalle</th><th className="num">Volumen</th></tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{fmtFecha(m.fecha)}</td>
                  <td>{m.tipo}</td>
                  <td className="mono">{m.codigo}</td>
                  <td>{m.detalle}</td>
                  <td className={`num ${m.ml < 0 ? 'resta' : 'suma'}`}>
                    {m.ml > 0 ? '+' : '−'}{fmtMl(Math.abs(m.ml))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
