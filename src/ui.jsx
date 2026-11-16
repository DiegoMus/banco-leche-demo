import { useState } from 'react';
import { ESTADOS_LOTE } from './data/catalogos';

export function Campo({ etiqueta, ancho, children }) {
  return (
    <label className={`campo ${ancho ? 'campo-ancho' : ''}`}>
      <span>{etiqueta}</span>
      {children}
    </label>
  );
}

export function EstadoLote({ estado }) {
  return <span className={`badge badge-${estado}`}>{ESTADOS_LOTE[estado] || estado}</span>;
}

export function Opciones({ mapa }) {
  return Object.entries(mapa).map(([valor, texto]) => (
    <option key={valor} value={valor}>{texto}</option>
  ));
}

// Estado y envío de un formulario: limpia al guardar y muestra errores.
export function useFormulario(inicial, guardar) {
  const [f, setF] = useState(inicial);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (e) => {
    setOk('');
    setF((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    setEnviando(true);
    try {
      const mensaje = await guardar(f);
      setF(inicial());
      setOk(mensaje || 'Guardado.');
    } catch (x) {
      setError(x.message || 'No se pudo guardar.');
    } finally {
      setEnviando(false);
    }
  };

  return { f, setF, set, enviar, error, ok, enviando };
}

export function Mensajes({ error, ok }) {
  return (
    <>
      {error && <p className="aviso aviso-error" role="alert">{error}</p>}
      {ok && <p className="aviso aviso-ok" role="status">{ok}</p>}
    </>
  );
}
