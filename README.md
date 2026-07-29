# ESG Experience Client Portal v2.3 · Sistema Maestro

## Archivos principales

- `index.html`: portal para el cliente.
- `data/esg-config.json`: precios, módulos, WhatsApp y reglas de cotización.
- `data/formulario.json`: campos del negocio y campos repetibles de cada ficha.
- `admin/ESG_Experience_Excel_Maestro_Portal_v2.3.xlsx`: Excel interno con exactamente dos hojas.
- `tools/actualizar-json-desde-excel.html`: convierte el Excel maestro en los dos JSON.

## Flujo de actualización interno

1. Abre el Excel de la carpeta `admin`.
2. En `ESG_CONFIG`, cambia precios, módulos, WhatsApp o nombres.
3. En `FORMULARIO`, cambia etiquetas, activa/desactiva campos o agrega nuevas filas.
4. Guarda el Excel.
5. Abre `tools/actualizar-json-desde-excel.html` en el navegador.
6. Selecciona el Excel actualizado y descarga los dos JSON.
7. Reemplaza los archivos de la carpeta `data`.
8. Publica nuevamente en Vercel.

La estructura visual de la web no necesita modificarse para estos cambios.

## Descarga móvil

En Android, el Excel del cliente se guarda normalmente en `Descargas`. En iPhone, suele encontrarse en `Archivos > Descargas` o `iCloud Drive > Downloads`. WhatsApp se abre con una lista explícita de los materiales que el cliente debe adjuntar manualmente.
