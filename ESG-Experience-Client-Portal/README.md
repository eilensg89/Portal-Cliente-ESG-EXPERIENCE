# ESG Experience — Portal de Inicio de Proyecto

Aplicación profesional con:

- Calculadora inteligente de cotización.
- Web Informativa ($150) o Web con Catálogo Inteligente (desde $350).
- Módulos independientes y precio en tiempo real.
- ESG WebCare separado como $25/mes.
- Aviso automático para catálogos de más de 30 elementos o 5 categorías.
- Resumen y aceptación de cotización.
- Formulario de recopilación de información.
- Catálogo universal: productos, servicios, obras, joyas, juguetes, tratamientos, propiedades, tours o cualquier colección.
- Campos opcionales; ESG puede organizar categorías y contenido.
- Excel automático separado por hojas.
- Envío por correo a `info@reeymultiservices.com`.
- Confirmación automática al cliente.
- Descarga local de respaldo del Excel.

## Publicar en GitHub y Vercel

1. Descomprime la carpeta.
2. Crea un repositorio nuevo en GitHub.
3. Sube todo el contenido de esta carpeta.
4. En Vercel, selecciona **Add New → Project** e importa el repositorio.
5. En **Settings → Environment Variables**, agrega:

```text
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=ESG Experience <onboarding@tu-dominio-verificado.com>
TO_EMAIL=info@reeymultiservices.com
MAX_ATTACHMENT_MB=8
```

6. Haz **Redeploy**.

## Configurar el correo

El envío usa Resend. Crea una cuenta, verifica el dominio que utilizarás para enviar y copia la API key. El correo receptor ya está fijado en `info@reeymultiservices.com`.

Mientras no se configure Resend, el portal sigue funcionando: genera y descarga el Excel, y muestra instrucciones para enviarlo manualmente por correo o WhatsApp como documento.

## Archivos grandes

El correo no es adecuado para videos o carpetas muy pesadas. El límite predeterminado del portal es 8 MB en total. Para conservar calidad, el cliente debe:

- enviar los archivos originales como documentos por WhatsApp; o
- adjuntarlos a un correo separado; o
- compartir una carpeta de Google Drive/Dropbox.

Puedes cambiar el límite mediante `MAX_ATTACHMENT_MB`, respetando los límites de Vercel y del proveedor de correo.

## Integración futura

El portal es independiente y puede insertarse antes de la web general de ESG Experience. `index.html` puede alojarse como página propia o integrarse como ruta `/cotizacion`.
