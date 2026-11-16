import { useEffect, useState } from 'react';
import { firebaseActivo } from './firebase';
import { suscribir, cargarDatosDemo } from './data/store';
import Panel from './pages/Panel';
import Ingresos from './pages/Ingresos';
import Inventario from './pages/Inventario';
import Egresos from './pages/Egresos';
import Donantes from './pages/Donantes';

const PAGINAS = [
  ['panel', 'Panel'],
  ['ingresos', 'Ingresos'],
  ['inventario', 'Inventario'],
  ['egresos', 'Egresos'],
  ['donantes', 'Donantes'],
];

function useColeccion(nombre, onError) {
  const [datos, setDatos] = useState([]);
  useEffect(() => suscribir(nombre, setDatos, onError), [nombre, onError]);
  return datos;
}

// En móvil las tablas se muestran como tarjetas (ver styles.css): cada celda
// toma su etiqueta del encabezado de su columna.
function useEtiquetasDeTabla() {
  useEffect(() => {
    const etiquetar = () => {
      document.querySelectorAll('table').forEach((tabla) => {
        const titulos = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent);
        tabla.querySelectorAll('tbody tr').forEach((tr) => {
          [...tr.children].forEach((td, i) => {
            const titulo = titulos[i] || '';
            if (td.dataset.label !== titulo) td.dataset.label = titulo;
          });
        });
      });
    };
    etiquetar();
    const observador = new MutationObserver(etiquetar);
    observador.observe(document.getElementById('root'), { childList: true, subtree: true });
    return () => observador.disconnect();
  }, []);
}

export default function App() {
  const [pagina, setPagina] = useState('panel');
  const [errorDatos, setErrorDatos] = useState(null);
  const [sembrando, setSembrando] = useState(false);
  const donantes = useColeccion('donantes', setErrorDatos);
  const lotes = useColeccion('lotes', setErrorDatos);
  const egresos = useColeccion('egresos', setErrorDatos);
  const vacio = donantes.length === 0 && lotes.length === 0;

  const sembrar = async () => {
    setSembrando(true);
    try {
      await cargarDatosDemo();
    } catch (x) {
      setErrorDatos(x);
    } finally {
      setSembrando(false);
    }
  };

  const props = { donantes, lotes, egresos, irA: setPagina };

  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <strong>Banco de Leche Humana</strong>
          <small>Registro de ingresos y egresos</small>
        </div>
        <nav>
          {PAGINAS.map(([clave, texto]) => (
            <button
              key={clave}
              className={pagina === clave ? 'activo' : ''}
              onClick={() => setPagina(clave)}
            >
              {texto}
            </button>
          ))}
        </nav>
        <div className="pie">
          <span className={`modo ${firebaseActivo ? 'modo-fb' : 'modo-local'}`}>
            {firebaseActivo ? 'Firebase conectado' : 'Modo local (sin Firebase)'}
          </span>
          <small>Demo · usar solo datos ficticios</small>
        </div>
      </aside>

      <main className="contenido">
        {errorDatos && (
          <p className="aviso aviso-error" role="alert">
            Error de datos: {errorDatos.message}. Revisa el archivo .env y las reglas de Firestore.
          </p>
        )}
        {vacio && (
          <div className="tarjeta vacio">
            <div>
              <strong>Aún no hay registros.</strong>
              <p>Carga datos de ejemplo ficticios para ver la demo completa, o empieza registrando una donante.</p>
            </div>
            <button className="primario" onClick={sembrar} disabled={sembrando}>
              {sembrando ? 'Cargando…' : 'Cargar datos de ejemplo'}
            </button>
          </div>
        )}
        {pagina === 'panel' && <Panel {...props} />}
        {pagina === 'ingresos' && <Ingresos {...props} />}
        {pagina === 'inventario' && <Inventario {...props} />}
        {pagina === 'egresos' && <Egresos {...props} />}
        {pagina === 'donantes' && <Donantes {...props} />}
      </main>
    </div>
  );
}
