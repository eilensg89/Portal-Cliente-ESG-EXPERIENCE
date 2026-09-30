# Control Shopify · ESG Experience

Datos revisados contra documentación oficial de Shopify al preparar este portal:

- Para crear productos por CSV, `Title` es la columna mínima; si hay variantes se necesita también `URL handle`.
- Shopify admite hasta **3 opciones** y hasta **2,048 variantes por producto**.
- Las imágenes incluidas por CSV deben usar **URLs públicas**; los archivos locales deben alojarse primero.
- Un producto puede tener hasta **250 media items**; cada variante puede tener una imagen asignada.
- `Product category` debe corresponder a Shopify Standard Product Taxonomy.
- `SEO title`: hasta 70 caracteres.
- `SEO description`: hasta 320 caracteres.
- `Inventory quantity` en el CSV de producto se usa directamente para una tienda con una sola ubicación. Con varias ubicaciones se usa el CSV de inventario.
- Si se informan dimensiones empacadas, Shopify exige completar largo, ancho, alto y unidad juntos.
- Los CSV de productos e inventario no pueden exceder 15 MB.

Fuentes:
https://help.shopify.com/en/manual/products/import-export/using-csv
https://help.shopify.com/en/manual/products/import-export/import-products
https://help.shopify.com/en/manual/products/variants/add-variants
https://help.shopify.com/en/manual/products/inventory/setup/inventory-csv
https://help.shopify.com/en/manual/products/product-media/add-media
