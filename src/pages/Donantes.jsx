import { TAMIZAJE } from '../data/catalogos';
import { actualizarDonante, crearDonante } from '../data/store';
import { fmtFecha, fmtMl, hoyISO, sumar } from '../util';
import { Campo, Mensajes, Opciones, useFormulario } from '../ui';

const inicial = () => ({
  nombre: '', identificacion: '', telefono: '', fechaNacimiento: '',
  estadoTamizaje: 'pendiente', fechaTamizaje: '',
});

export default function Donantes({ donantes, lotes }) {
  const { f, set, enviar, error, ok, enviando } = useFormulario(inicial, async (datos) => {
    if (!datos.nombre.trim()) throw new Error('El nombre es obligatorio.');
    await crearDonante(datos);
    return 'Donante registrada.';
  });

  const lista = [...donantes].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const cambiarTamizaje = (d, estado) =>
    actualizarDonante(d.id, { estadoTamizaje: estado, fechaTamizaje: estado === 'pendiente' ? '' : hoyISO() });

  return (
    <>
      <header className="encabezado"><h1>Donantes</h1></header>

      <form className="tarjeta formulario" onSubmit={enviar}>
        <h2>Nueva donante</h2>
        <div className="rejilla">
          <Campo etiqueta="Nombre completo">
            <input value={f.nombre} onChange={set('nombre')} required />
          </Campo>
          <Campo etiqueta="Identificación (DPI)">
            <input value={f.identificacion} onChange={set('identificacion')} />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input value={f.telefono} onChange={set('telefono')} />
          </Campo>
          <Campo etiqueta="Fecha de nacimiento">
            <input type="date" value={f.fechaNacimiento} onChange={set('fechaNacimiento')} />
          </Campo>
          <Campo etiqueta="Tamizaje (serología y entrevista)">
            <select value={f.estadoTamizaje} onChange={set('estadoTamizaje')}><Opciones mapa={TAMIZAJE} /></select>
          </Campo>
          <Campo etiqueta="Fecha de tamizaje">
            <input type="date" value={f.fechaTamizaje} onChange={set('fechaTamizaje')} />
          </Campo>
        </div>
        <Mensajes error={error} ok={ok} />
        <button className="primario" disabled={enviando}>Registrar donante</button>
      </form>

      <section className="tarjeta">
        <h2>Donantes registradas</h2>
        {lista.length === 0 ? <p className="tenue">Sin donantes todavía.</p> : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th><th>Identificación</th><th>Teléfono</th><th>Tamizaje</th>
                <th>Fecha tamizaje</th><th className="num">Donaciones</th><th className="num">Total donado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((d) => {
                const suyos = lotes.filter((l) => l.donanteId === d.id);
                return (
                  <tr key={d.id}>
                    <td>{d.nombre}</td>
                    <td>{d.identificacion || '—'}</td>
                    <td>{d.telefono || '—'}</td>
                    <td>
                      <select
                        className={`tamizaje tamizaje-${d.estadoTamizaje}`}
                        value={d.estadoTamizaje}
                        onChange={(e) => cambiarTamizaje(d, e.target.value)}
                        aria-label={`Tamizaje de ${d.nombre}`}
                      >
                        <Opciones mapa={TAMIZAJE} />
                      </select>
                    </td>
                    <td>{fmtFecha(d.fechaTamizaje)}</td>
                    <td className="num">{suyos.length}</td>
                    <td className="num">{fmtMl(sumar(suyos, 'volumenInicialMl'))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
