// Inicio de sesión con correo y contraseña (Firebase Authentication).
// Los usuarios se crean en la consola de Firebase; no hay registro público.
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, firebaseActivo } from './firebase';

const ERRORES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-disabled': 'Este usuario está deshabilitado.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está habilitado en Firebase.',
};

// Envuelve la app: solo la muestra si hay sesión. En modo local no pide acceso.
export default function Acceso({ children }) {
  const [usuario, setUsuario] = useState(undefined); // undefined = verificando sesión

  useEffect(() => (firebaseActivo ? onAuthStateChanged(auth, setUsuario) : undefined), []);

  if (!firebaseActivo) return children;
  if (usuario === undefined) return <div className="acceso"><p className="tenue">Cargando…</p></div>;
  if (!usuario) return <Login />;
  return children;
}

function Login() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await signInWithEmailAndPassword(auth, correo.trim(), clave);
    } catch (x) {
      setError(ERRORES[x.code] || 'No se pudo iniciar sesión.');
      setEnviando(false);
    }
  };

  return (
    <div className="acceso">
      <form className="tarjeta acceso-tarjeta" onSubmit={entrar}>
        <div>
          <h1>Banco de Leche Humana</h1>
          <p className="tenue">Ingresa con tu usuario para continuar.</p>
        </div>
        <label className="campo">
          <span>Correo</span>
          <input
            type="email" autoComplete="username" value={correo}
            onChange={(e) => setCorreo(e.target.value)} required autoFocus
          />
        </label>
        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password" autoComplete="current-password" value={clave}
            onChange={(e) => setClave(e.target.value)} required
          />
        </label>
        {error && <p className="aviso aviso-error" role="alert">{error}</p>}
        <button className="primario" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}

// Usuario actual y botón para salir; se muestra en la barra lateral.
export function Sesion() {
  if (!firebaseActivo || !auth.currentUser) return null;
  return (
    <div className="sesion">
      <span title={auth.currentUser.email}>{auth.currentUser.email}</span>
      <button onClick={() => signOut(auth)}>Salir</button>
    </div>
  );
}