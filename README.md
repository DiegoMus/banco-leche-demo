# Banco de Leche Humana · Demo (React + Firebase)

Registro de ingresos y egresos de leche humana con inventario por lote.
Es una demo: usar solo datos ficticios.

## Correr la demo

```bash
npm install
npm run dev
```

Sin configurar nada, la app arranca en **modo local** (guarda en el navegador) para que
puedas probarla de inmediato. El botón "Cargar datos de ejemplo" llena la demo.

## Conectar Firebase

1. En https://console.firebase.google.com crea un proyecto y agrega una **app web**.
2. En *Firestore Database* crea la base de datos.
3. Copia `.env.example` como `.env` y pega los valores de configuración de la app web.
4. En *Firestore > Reglas* pega el contenido de `firestore.rules` (reglas abiertas solo para demo).
5. Reinicia `npm run dev`. En la barra lateral debe decir "Firebase conectado".

Las colecciones se crean solas al guardar el primer registro.

## Modelo de datos

**donantes**
`nombre`, `identificacion`, `telefono`, `fechaNacimiento`,
`estadoTamizaje` (apta | pendiente | no_apta), `fechaTamizaje`

**lotes** (cada ingreso crea un lote/frasco)
`codigo` (BL-AAMMDD-XXX), `donanteId`, `donanteNombre`, `fechaIngreso`, `fechaExtraccion`,
`tipoLeche` (calostro | transicion | madura), `procedencia` (banco | domicilio | hospitalizacion),
`volumenInicialMl`, `volumenDisponibleMl`, `estado` (cruda | pasteurizada | descartada),
`fechaPasteurizacion`, `fechaVencimiento`, `responsable`, `observaciones`

**egresos**
`loteId`, `loteCodigo`, `fecha`, `motivo` (dispensacion | analisis | descarte | vencimiento),
`volumenMl`, `receptorExpediente`, `receptorNombre`, `servicio`, `prescriptor`,
`responsable`, `observaciones`

## Reglas de negocio incluidas

- Solo donantes con tamizaje **apta** pueden registrar ingresos.
- Todo ingreso entra como leche **cruda**; se marca pasteurizada desde Inventario.
- Solo se **dispensa** leche pasteurizada y vigente; el selector ordena por vencimiento más próximo.
- Un egreso nunca puede superar el volumen disponible del lote. En Firestore el descuento
  y el egreso se guardan en una **transacción**.
- Vigencia: 15 días cruda (desde extracción) y 180 días pasteurizada. Son valores de
  referencia: ajústalos en `src/data/catalogos.js` según el protocolo del hospital.

## Antes de usarlo con datos reales

- Firebase Authentication y reglas de Firestore por rol (hoy no hay inicio de sesión).
- Bitácora de auditoría (quién registró y modificó cada movimiento).
- Control de calidad por lote: acidez Dornic, crematocrito, cultivo, temperatura de recepción.
- Lotes de pasteurización que agrupen varios frascos, e impresión de etiquetas.
