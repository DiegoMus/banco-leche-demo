const p2 = (n) => String(n).padStart(2, '0');

const aFecha = (iso) => new Date(iso.length === 10 ? `${iso}T00:00` : iso);

export const aISOFecha = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

export const hoyISO = () => aISOFecha(new Date());

export const ahoraLocal = () => {
  const d = new Date();
  return `${aISOFecha(d)}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

export const sumarDias = (iso, dias) => {
  const d = aFecha(iso.slice(0, 10));
  d.setDate(d.getDate() + dias);
  return aISOFecha(d);
};

export const diasPara = (iso) =>
  Math.round((aFecha(iso.slice(0, 10)) - aFecha(hoyISO())) / 86400000);

export const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = aFecha(iso);
  const base = `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
  return iso.length > 10 ? `${base} ${p2(d.getHours())}:${p2(d.getMinutes())}` : base;
};

export const fmtMl = (n) => `${Number(n || 0).toLocaleString('es-GT')} ml`;

// Estado que se muestra: combina el estado guardado con stock y vencimiento.
export const estadoVisible = (lote) => {
  if (lote.estado === 'descartada') return 'descartada';
  if (Number(lote.volumenDisponibleMl) <= 0) return 'agotada';
  if (lote.fechaVencimiento < hoyISO()) return 'vencida';
  return lote.estado;
};

export const sumar = (lista, campo) => lista.reduce((t, x) => t + Number(x[campo] || 0), 0);
