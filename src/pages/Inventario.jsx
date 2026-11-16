import { useState } from 'react';
import { ESTADOS_LOTE, TIPOS_LECHE } from '../data/catalogos';
import { pasteurizarLote } from '../data/store';
import { estadoVisible, fmtFecha, fmtMl } from '../util';
import { EstadoLote, Opciones } from '../ui';

export default function Inventario({ lotes }) {
  const [filtro, setFiltro] = useState('activos');
  const [error, setError] = useState('');

  const lista = lotes
    .map((l) => ({ ...l, ev: estadoVisible(l) }))
    .filter((l) => {
      if (filtro === 'todos') return true;
      if (filtro === 'activos') return ['cruda', 'pasteurizada', 'vencida'].includes(l.ev);
      return l.ev === filtro;
    })
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));

  const pasteurizar = async (lote) => {
    setError('');
    try {
      await pasteurizarLote(lote.id);
    } catch (x) {
      setError(x.message);
    }
  };

  return (
    <>
      <header className="encabezado">
        <h1>Inventario por lote</h1>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
          <option value="activos">Con existencia</option>
          <option value="todos">Todos</option>
          <Opciones mapa={ESTADOS_LOTE} />
        </select>
      </header>

      {error && <p className="aviso aviso-error" role="alert">{error}</p>}

      <section className="tarjeta">
        {lista.length === 0 ? <p className="tenue">No hay lotes con este filtro.</p> : (
          <table>
            <thead>
              <tr>
                <th>Lote</th><th>Donante</th><th>Tipo</th><th>Extracción</th><th>Pasteurización</th>
                <th>Vence</th><th className="num">Disponible / inicial</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.codigo}</td>
                  <td>{l.donanteNombre}</td>
                  <td>{TIPOS_LECHE[l.tipoLeche]}</td>
                  <td>{fmtFecha(l.fechaExtraccion)}</td>
                  <td>{fmtFecha(l.fechaPasteurizacion)}</td>
                  <td>{fmtFecha(l.fechaVencimiento)}</td>
                  <td className="num">{fmtMl(l.volumenDisponibleMl)} / {fmtMl(l.volumenInicialMl)}</td>
                  <td><EstadoLote estado={l.ev} /></td>
                  <td>
                    {l.ev === 'cruda' && (
                      <button onClick={() => pasteurizar(l)}>Marcar pasteurizada</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <p className="tenue">
        La lista se ordena por vencimiento más próximo. La vigencia se calcula desde la extracción (cruda)
        o desde la pasteurización; los días se configuran en <code>src/data/catalogos.js</code>.
      </p>
    </>
  );
}
