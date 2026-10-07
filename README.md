# Finanzas

App web para iPhone y escritorio, en español y USD. Suscripciones, pagos recurrentes variables, ahorro por cancelación y resumen anual con gráficos. Se puede añadir a la pantalla de inicio desde Safari.

## Uso

1. Crear una cuenta con el mismo correo de la cuenta propietaria de Supabase y confirmar el correo; después iniciar sesión. El servicio SMTP gratuito de Supabase solo envía a miembros de la organización. Para permitir otras direcciones debe configurarse un SMTP propio; no se desactivó la confirmación de correo.
2. Añadir servicios con importe, tarjeta (solo el nombre), frecuencia, fecha inicial y día de cobro.
3. Los cargos del calendario son **previstos**, no transacciones bancarias. Para contarlos como pagados, confirmar individualmente o confirmar los cargos vencidos. Al crear un servicio, hay una casilla opcional para confirmar los pagos anteriores del año elegido.
4. Un pago puede corregirse en cantidad, fecha prevista, fecha real, tarjeta, nota y estado. El total anual usa **la fecha real del pago**, hasta el mes seleccionado o hasta hoy si ese mes aún no ha terminado.
5. Los recibos variables permiten registrar un importe distinto cada mes. «Cambiar tarifa» comienza un calendario nuevo sin modificar los pagos confirmados anteriores.
6. «Ahorrar» registra una cancelación hecha con el proveedor. Conserva el historial, incluido un pago hecho el mismo día. Ese pago no cuenta como ahorro: se suman únicamente los cobros evitados. Reactivar cierra ese período de ahorro.
7. La sesión vive únicamente en memoria y permanece al cambiar temporalmente a Mensajes u otra app, cambiar de pestaña o suspender la página. No se cierra por visibilitychange ni al conservarse la página en bfcache. Una página realmente descartada, una recarga, un proceso terminado o el botón Cerrar sesión requieren iniciar sesión de nuevo. iOS no notifica siempre el cierre definitivo y puede descartar una app en segundo plano; por eso una recarga por el sistema también pierde la sesión. Se recuerda solo el correo, nunca la contraseña ni los tokens. Las operaciones pendientes no pueden volver a mostrar datos después del bloqueo.
7. El costo mensual es equivalente: los cargos anuales se dividen entre 12. El ahorro acumulado por una suscripción anual aparece cuando se evita su renovación, no cada mes.
8. En «Mi cuenta» se exportan CSV y respaldos JSON. Importar reemplaza el espacio actual, con confirmación.

## Datos y seguridad

Supabase Auth con correo/contraseña. Cada usuario tiene un documento JSON privado en `public.finance_workspaces`, protegido por RLS y acceso por `auth.uid()`. El documento guarda servicios, calendarios de tarifas, períodos de ahorro y pagos independientes. El guardado usa una revisión optimista para evitar sobrescribir cambios de otro dispositivo; si hay conflicto, actualizar y repetir la edición.

Solo se incluye una clave **publicable** en el navegador. No hay números de tarjeta, contraseñas guardadas por la app ni claves `service_role`. Las sesiones las administra Supabase. El service worker no almacena respuestas financieras. Se requiere conexión para cargar y guardar; la demostración es temporal y no guarda información en la cuenta.

El esquema completo está en `supabase/schema.sql`, ya aplicado al proyecto **Finanzas**. No ejecutar sobre una base existente con la misma tabla.

## Desarrollo

- React 19, TypeScript, Vinext/Vite, Recharts, Lucide y Supabase JS (versión exacta).
- Node 22.13 o superior y pnpm con el lockfile incluido.
- `pnpm install --frozen-lockfile`
- `pnpm dev:pages`
- `pnpm build:pages`
- `node --experimental-strip-types tests/finance.test.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`

El hosting es **GitHub Pages**: https://fravier3.github.io/Finanzas/. El workflow `.github/workflows/pages.yml` compila y publica cada cambio en main. Supabase protege los datos por cuenta; la página pública no revela los registros financieros. No añadir secretos al repositorio público.

### Face ID

Después del primer acceso con correo y contraseña, abrir Mi cuenta en el iPhone y pulsar Crear clave en este dispositivo. Guardar la clave en Contraseñas de iCloud. Después puede usarse Entrar con Face ID / clave de acceso. Se usa WebAuthn validado por Supabase, con RP ID `fravier3.github.io` y origen `https://fravier3.github.io`. Face ID, Touch ID o el código son seleccionados por el dispositivo. Supabase marca esta funcionalidad como experimental. No se guardan contraseñas para simular autenticación biométrica.

La opción «Crear clave en este dispositivo» usa la API de registro en dos pasos de Supabase y solicita authenticatorAttachment=platform, residentKey=required y userVerification=required. Mantiene el desafío, RP y verificación de Supabase; no se simula Face ID. Como alternativa, la ayuda en acceso y cuenta explica cómo guardar la contraseña existente en Contraseñas de iPhone y autorizar el autocompletado con Face ID. Una página web no puede abrir directamente el aviso biométrico de AutoFill: el usuario selecciona la contraseña desde el campo/teclado y iOS determina Face ID o código.

## Validación

Pruebas de calendarios mensuales y anuales, fin de mes, febrero bisiesto, importes variables, cambios de tarifa, cancelación, reactivación, renovación anual evitada, pagos entre años y validación de importación. Compilación de producción y revisión de seguridad de Supabase.

## Limitaciones

No se conecta a bancos, no cobra ni cancela servicios con proveedores, y no envía recordatorios push. Los próximos pagos se calculan al abrir la app. El ahorro es un cálculo de cargos evitados; no implica que ese dinero se haya transferido a una cuenta bancaria.
