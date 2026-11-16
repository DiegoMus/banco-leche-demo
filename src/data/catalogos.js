// Catálogos y parámetros del banco. Ajustar según el protocolo del hospital.

// Vigencia en congelación (días). Valores de referencia; validar con la norma local.
export const DIAS_VIGENCIA_CRUDA = 15;
export const DIAS_VIGENCIA_PASTEURIZADA = 180;

export const TIPOS_LECHE = {
  calostro: 'Calostro',
  transicion: 'Transición',
  madura: 'Madura',
};

export const PROCEDENCIAS = {
  banco: 'Extracción en el banco',
  domicilio: 'Extracción en domicilio',
  hospitalizacion: 'Madre hospitalizada',
};

export const TAMIZAJE = {
  apta: 'Apta',
  pendiente: 'Pendiente',
  no_apta: 'No apta',
};

export const MOTIVOS_EGRESO = {
  dispensacion: 'Dispensación a receptor',
  analisis: 'Muestra para análisis',
  descarte: 'Descarte (no conforme)',
  vencimiento: 'Descarte por vencimiento',
};

export const SERVICIOS = ['UCIN', 'Intermedios neonatales', 'Neonatología', 'Pediatría', 'Otro'];

export const ESTADOS_LOTE = {
  cruda: 'Cruda (en espera)',
  pasteurizada: 'Pasteurizada',
  vencida: 'Vencida',
  agotada: 'Agotada',
  descartada: 'Descartada',
};
