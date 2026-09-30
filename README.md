# ESG Experience · Formulario de Catálogo Shopify / WhatsApp

Formulario independiente para clientes que ya contrataron un catálogo o una tienda y necesitan entregar la información de productos de manera estructurada.

## Qué se eliminó del portal anterior

- Selección de precios.
- Cotización de web.
- Módulos adicionales.
- WebCare.
- Pantallas de aceptación de estimado.

Este portal **no vende** el servicio. Solo recopila la información del catálogo.

## Flujo

1. Elegir destino: **Catálogo web + WhatsApp** o **Shopify**.
2. Completar responsable, marca y presencia.
3. Crear categorías, subcategorías y productos.
4. Si es Shopify, completar datos extra de producto y variantes.
5. Revisar resumen.
6. Descargar Excel maestro.
7. Abrir WhatsApp y adjuntar Excel + fotos/materiales.

## Shopify

La ruta Shopify añade:

- Vendor.
- Shopify Standard Product Taxonomy / categoría estándar.
- Product type, tags y colección.
- Estado/publicación.
- SEO title y SEO description.
- URLs públicas de imágenes.
- Variantes con hasta 3 opciones.
- SKU y barcodes.
- Precio, compare-at y costo.
- Impuestos.
- Inventario de una ubicación o inventario por ubicación.
- Continuar vendiendo sin stock.
- Peso y dimensiones empacadas.
- Shipping / fulfillment.
- Imagen de variante.
- HS Code, COO y bin opcionales.

El Excel generado incluye una hoja `SHOPIFY_IMPORT` preparada con los encabezados actuales de Shopify y una hoja separada de inventario para múltiples ubicaciones.

## Referencias oficiales utilizadas

- Product CSV: https://help.shopify.com/en/manual/products/import-export/using-csv
- Import products: https://help.shopify.com/en/manual/products/import-export/import-products
- Variants: https://help.shopify.com/en/manual/products/variants/add-variants
- Inventory CSV: https://help.shopify.com/en/manual/products/inventory/setup/inventory-csv
- Product media: https://help.shopify.com/en/manual/products/product-media/product-media-types
- Add media: https://help.shopify.com/en/manual/products/product-media/add-media

## Despliegue

Es un sitio estático. Sube la carpeta completa a GitHub y conecta el repositorio en Vercel. `vercel.json` ya redirige las rutas a `index.html`.

## Excel de referencia

`admin/ESG_Catalogo_Shopify_Plantilla_Maestra.xlsx` sirve como referencia estructural del resultado que genera la aplicación.
