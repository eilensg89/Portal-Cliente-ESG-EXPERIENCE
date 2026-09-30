const COLORS={brown:'3D2010',brown2:'7B4F24',gold:'C9A646',cream:'F8F4EC',cream2:'EFE6D8',stone:'C8B49A',white:'FFFBF0',green:'55704D'};
const SOURCE_PRODUCT_CSV='https://help.shopify.com/en/manual/products/import-export/using-csv';
const SOURCE_VARIANTS='https://help.shopify.com/en/manual/products/variants/add-variants';
const SOURCE_INVENTORY='https://help.shopify.com/en/manual/products/inventory/setup/inventory-csv';
const SOURCE_MEDIA='https://help.shopify.com/en/manual/products/product-media/product-media-types';
const SOURCE_ADD_MEDIA='https://help.shopify.com/en/manual/products/product-media/add-media';

function title(ws,titleText,subtitle,cols){
  XLSX.utils.sheet_add_aoa(ws,[[titleText],[subtitle],[]],{origin:'A1'});
  ws['!merges']=[XLSX.utils.decode_range(`A1:${cols}1`),XLSX.utils.decode_range(`A2:${cols}2`)];
  ws.A1.s={font:{bold:true,sz:18,color:{rgb:COLORS.white}},fill:{fgColor:{rgb:COLORS.brown}},alignment:{horizontal:'left',vertical:'center'}};
  ws.A2.s={font:{italic:true,color:{rgb:COLORS.brown}},fill:{fgColor:{rgb:COLORS.cream2}},alignment:{wrapText:true}};
}
function styleTable(ws,ref){
  const r=XLSX.utils.decode_range(ref);
  for(let c=r.s.c;c<=r.e.c;c++){const cell=ws[XLSX.utils.encode_cell({r:r.s.r,c})];if(cell)cell.s={font:{bold:true,color:{rgb:COLORS.white}},fill:{fgColor:{rgb:COLORS.brown2}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{bottom:{style:'thin',color:{rgb:COLORS.gold}}}};}
  for(let rr=r.s.r+1;rr<=r.e.r;rr++)for(let c=r.s.c;c<=r.e.c;c++){const cell=ws[XLSX.utils.encode_cell({r:rr,c})];if(cell)cell.s={fill:{fgColor:{rgb:rr%2?COLORS.cream:COLORS.cream2}},font:{color:{rgb:COLORS.brown}},alignment:{vertical:'top',wrapText:true},border:{bottom:{style:'hair',color:{rgb:COLORS.stone}}}};}
}
function appendSheet(wb,name,titleText,subtitle,headers,rows,widths){
  const ws=XLSX.utils.aoa_to_sheet([]);title(ws,titleText,subtitle,XLSX.utils.encode_col(headers.length-1));
  const safeRows=rows.length?rows:[Array(headers.length).fill('')];
  XLSX.utils.sheet_add_aoa(ws,[headers,...safeRows],{origin:'A4'});
  styleTable(ws,`A4:${XLSX.utils.encode_col(headers.length-1)}${4+safeRows.length}`);
  ws['!cols']=widths.map(w=>({wch:w}));ws['!autofilter']={ref:`A4:${XLSX.utils.encode_col(headers.length-1)}${4+safeRows.length}`};ws['!freeze']={xSplit:0,ySplit:4};
  XLSX.utils.book_append_sheet(wb,ws,name);
}
const lines=v=>String(v||'').split(/\n|\|/).map(x=>x.trim()).filter(Boolean);
const imageColumns=v=>{const imgs=String(v||'').split(/\n|,/).map(s=>s.trim()).filter(Boolean);return [imgs[0]||'',imgs[1]||'',imgs[2]||'',imgs[3]||'',imgs[4]||'',imgs.slice(5).join(' | ')];};
const yesNo=v=>String(v||'').toLowerCase()==='sí'||String(v||'').toLowerCase()==='si'?'true':'false';
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,120);
function allProducts(categories){const out=[];(categories||[]).forEach(c=>{if(c.mode==='direct')(c.directProducts||[]).forEach(p=>out.push({category:c.name||'',subcategory:'',categoryImage:c.image||'',subcategoryImage:'',...p}));else(c.subcategories||[]).forEach(s=>(s.products||[]).forEach(p=>out.push({category:c.name||'',subcategory:s.name||'',categoryImage:c.image||'',subcategoryImage:s.image||'',...p})));});return out;}
function productMasterRow(p){return [p.Orden||'',p.category,p.subcategory,p.code||'',p.name||'',p.price||'',p.variants&&Array.isArray(p.variants)?p.variants.length:0,p.variantsGeneral||'',...imageColumns(p.images),p.featured||'',p.status||'',p.description||'',p.includes||'',p.specs||'',p.conditions||'',p.warranty||'',p.delivery||'',p.keywords||'',p.cta||'',p.handle||'',p.vendor||'',p.productCategory||'',p.productType||'',p.tags||'',p.collection||'',p.published||'',p.shopifyStatus||'',p.seoTitle||'',p.seoDescription||'',p.productImageUrls||'',p.imageAltBase||'',p.notes||''];}
function variantRows(products){const out=[];products.forEach(p=>(p.variants||[]).forEach(v=>out.push([p.category,p.subcategory,p.handle||slug(p.name),p.name,p.code||'',v.Orden||'',v.sku||'',v.barcodes||'',v.option1Name||'',v.option1Value||'',v.option2Name||'',v.option2Value||'',v.option3Name||'',v.option3Value||'',v.variantPrice||'',v.compareAtPrice||'',v.costPerItem||'',v.chargeTax||'',v.inventoryTracker||'',v.inventoryQuantity||'',v.inventoryByLocation||'',v.continueSelling||'',v.weightGrams||'',v.weightUnit||'',v.packedLength||'',v.packedWidth||'',v.packedHeight||'',v.packedDimensionUnit||'',v.requiresShipping||'',v.fulfillmentService||'',v.variantImageUrl||'',v.hsCode||'',v.countryOfOrigin||'',v.binName||''])));return out;}
function buildShopifyImportRows(data,products){
  const rows=[];const oneLocation=data.shopify.shopifyLocationsMode==='Una ubicación';
  products.forEach(p=>{
    const handle=p.handle||slug(p.name), imgs=lines(p.productImageUrls), variants=(p.variants||[]).length?p.variants:[{}];
    variants.forEach((v,idx)=>{
      const first=idx===0;
      rows.push([
        first?p.name||'':'',handle,first?p.description||'':'',first?(p.vendor||data.shopify.shopifyDefaultVendor||data.business.businessName||''):'',first?p.productCategory||'':'',first?p.productType||'':'',first?p.tags||'':'',first?yesNo(p.published):'',first?p.shopifyStatus||'active':'',
        v.sku||'',v.barcodes||'',v.option1Name||'Title',v.option1Value||'Default Title',v.option2Name||'',v.option2Value||'',v.option3Name||'',v.option3Value||'',v.variantPrice||p.price||'',v.compareAtPrice||'',v.costPerItem||'',yesNo(v.chargeTax||'Sí'),v.inventoryTracker==='No rastrear'?'':(v.inventoryTracker||'shopify'),oneLocation?(v.inventoryQuantity||''):'',v.continueSelling||'deny',v.weightGrams||'',v.weightUnit||'kg',v.packedLength||'',v.packedWidth||'',v.packedHeight||'',v.packedDimensionUnit||'',yesNo(v.requiresShipping||'Sí'),v.fulfillmentService||'manual',first?(imgs[0]||''):'',first&&imgs[0]?'1':'',first&&imgs[0]?(p.imageAltBase||p.name||''):'',v.variantImageUrl||'',first?p.seoTitle||'':'',first?p.seoDescription||'':'',first?yesNo(p.giftCard||'No'):'',first?p.collection||'':''
      ]);
    });
    imgs.slice(1).forEach((url,i)=>rows.push(['',handle,'','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',url,String(i+2),p.imageAltBase||p.name||'','','','','','']));
  });
  return rows;
}
function parseLocationInventory(text){
  return String(text||'').split(/\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const m=line.match(/^(.+?)\s*[=:]\s*(-?\d+)\s*$/);return m?{location:m[1].trim(),qty:m[2]}:{location:line,qty:''};});
}
function inventoryRows(products){const rows=[];products.forEach(p=>(p.variants||[]).forEach(v=>{parseLocationInventory(v.inventoryByLocation).forEach(loc=>rows.push([p.handle||slug(p.name),p.name||'',v.option1Name||'Title',v.option1Value||'Default Title',v.option2Name||'',v.option2Value||'',v.option3Name||'',v.option3Value||'',v.sku||'',loc.location,v.binName||'',v.hsCode||'',v.countryOfOrigin||'','',loc.qty,v.packedLength||'',v.packedWidth||'',v.packedHeight||'',v.packedDimensionUnit||'']))}));return rows;}
function multimediaRows(products){const rows=[];products.forEach(p=>{const fileNames=String(p.images||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean),urls=lines(p.productImageUrls);Math.max(fileNames.length,urls.length,1);const n=Math.max(fileNames.length,urls.length);for(let i=0;i<n;i++)rows.push([p.category,p.subcategory,p.handle||slug(p.name),p.name||'',i+1,fileNames[i]||'',urls[i]||'',p.imageAltBase||p.name||'',i===0?'Principal':'Adicional']);(p.variants||[]).filter(v=>v.variantImageUrl).forEach(v=>rows.push([p.category,p.subcategory,p.handle||slug(p.name),p.name||'','', '',v.variantImageUrl||'',`${p.name||''} ${v.option1Value||''} ${v.option2Value||''}`.trim(),'Variante']));});return rows;}

export function buildWorkbook(data){
  const wb=XLSX.utils.book_new();
  wb.Props={Title:`ESG Experience · Catálogo · ${data.business.businessName||'Proyecto'}`,Subject:'Formulario Maestro de Catálogo',Author:'ESG Experience'};
  const products=allProducts(data.categories),variants=variantRows(products);
  appendSheet(wb,'00_RESUMEN','ESG EXPERIENCE · RESUMEN DEL CATÁLOGO','Vista general del proyecto y contenido recibido.',['Campo','Valor','Uso'],[
    ['Código',data.projectCode,'Control interno'],['Fecha',new Date(data.submittedAt).toLocaleString('es-US'),'Control interno'],['Destino',data.catalogTypeName,'Alcance'],['Responsable',data.business.clientName,'Contacto'],['Negocio',data.business.businessName,'Marca'],['Categorías',data.categories.length,'Contenido'],['Productos',products.length,'Contenido'],['Variantes',data.catalogType==='shopify'?variants.length:'No aplica','Shopify'],['Materiales marcados',data.materials.join(' | '),'Entrega']
  ],[30,74,24]);

  appendSheet(wb,'01_NEGOCIO','INFORMACIÓN DEL NEGOCIO','Datos de contacto, marca e identidad entregados por el cliente.',['Campo','Valor','Responsable'],Object.entries(data.business).map(([k,v])=>[k,Array.isArray(v)?v.join(', '):(v??''),'Cliente']),[34,90,18]);
  const catRows=(data.categories||[]).map(c=>[c.Orden||'',c.name||'',c.description||'',c.image||'',c.mode==='direct'?'Productos directos':'Con subcategorías',c.notes||'',c.directProducts?.length||0,c.subcategories?.length||0]);
  appendSheet(wb,'02_CATEGORIAS','ESTRUCTURA DE CATEGORÍAS','Organización principal del catálogo.',['Orden','Categoría','Descripción','Imagen de categoría','Organización','Observaciones ESG','Productos directos','Subcategorías'],catRows,[8,30,54,34,24,44,18,16]);
  const subRows=[];(data.categories||[]).forEach(c=>(c.subcategories||[]).forEach(s=>subRows.push([c.name||'',s.Orden||'',s.name||'',s.description||'',s.image||'',s.notes||'',s.products?.length||0])));
  appendSheet(wb,'03_SUBCATEGORIAS','SUBCATEGORÍAS DEL CATÁLOGO','Solo aparecen cuando una categoría fue dividida.',['Categoría','Orden','Subcategoría','Descripción','Imagen de subcategoría','Observaciones ESG','Cantidad de productos'],subRows,[28,8,30,54,32,44,20]);

  const masterHeaders=['Orden','Categoría','Subcategoría','Código','Producto','Precio ref.','Cantidad variantes Shopify','Variantes / presentaciones generales','Imagen 1','Imagen 2','Imagen 3','Imagen 4','Imagen 5','Imágenes adicionales','Destacado','Estado','Descripción','Qué incluye','Especificaciones','Condiciones','Garantía','Entrega','Palabras clave','CTA','Shopify handle','Vendor','Categoría estándar Shopify','Tipo de producto','Tags','Colección','Publicado','Estado Shopify','SEO title','SEO description','URLs imágenes Shopify','ALT base','Observaciones ESG'];
  appendSheet(wb,'04_PRODUCTOS_MASTER','PRODUCTOS · MAESTRO GENERAL','Una fila por producto. Esta es la referencia principal para ESG y funciona tanto para catálogo WhatsApp como para Shopify.',masterHeaders,products.map(productMasterRow),[8,25,26,14,34,16,16,30,24,24,24,24,24,34,12,14,54,40,40,40,20,22,28,24,24,24,38,26,28,26,12,14,34,48,54,32,42]);

  appendSheet(wb,'05_MULTIMEDIA','MULTIMEDIA Y RELACIÓN DE ARCHIVOS','Relaciona nombres de archivos con URLs públicas cuando existan.', ['Categoría','Subcategoría','Handle','Producto','Posición','Nombre de archivo','URL pública','Texto ALT','Uso'],multimediaRows(products),[25,25,28,34,10,34,58,42,16]);

  if(data.catalogType==='shopify'){
    appendSheet(wb,'06_CONFIG_SHOPIFY','CONFIGURACIÓN GENERAL SHOPIFY','Datos generales declarados por el cliente.',['Campo','Valor','Revisión ESG'],Object.entries(data.shopify).map(([k,v])=>[k,v,'Validar antes de importar']),[38,78,30]);
    appendSheet(wb,'07_VARIANTES_SHOPIFY','VARIANTES SHOPIFY','Una fila por variante. Shopify admite hasta 3 opciones por producto.', ['Categoría','Subcategoría','Handle','Producto','Código producto','Orden variante','SKU','Barcodes','Opción 1 nombre','Opción 1 valor','Opción 2 nombre','Opción 2 valor','Opción 3 nombre','Opción 3 valor','Precio','Compare-at','Costo','Cobra impuesto','Inventory tracker','Cantidad (1 ubicación)','Inventario por ubicación','Cuando se agote','Peso gramos','Unidad peso','Largo empacado','Ancho empacado','Alto empacado','Unidad dimensiones','Requiere envío','Fulfillment','Imagen variante URL','HS Code','COO','Bin'],variants,[24,24,28,32,14,12,20,28,18,20,18,20,18,20,14,14,14,14,18,18,34,16,14,14,16,16,16,16,16,20,48,16,12,16]);

    const shopHeaders=['Title','URL handle','Description','Vendor','Product category','Type','Tags','Published on online store','Status','SKU','Barcodes','Option1 name','Option1 value','Option2 name','Option2 value','Option3 name','Option3 value','Price','Compare-at price','Cost per item','Charge tax','Inventory tracker','Inventory quantity','Continue selling when out of stock','Weight value (grams)','Weight unit for display','Packed product length','Packed product width','Packed product height','Packed product dimension unit','Requires shipping','Fulfillment service','Product image URL','Image position','Image alt text','Variant image URL','SEO title','SEO description','Gift card','Collection'];
    appendSheet(wb,'08_SHOPIFY_IMPORT','PREPARACIÓN DE IMPORTACIÓN SHOPIFY','Estructura basada en el formato actual de Shopify. Revisar categorías, URLs de imágenes e inventario antes de convertir/exportar a CSV UTF-8.',shopHeaders,buildShopifyImportRows(data,products),[34,28,54,26,44,28,34,18,14,20,28,18,20,18,20,18,20,14,16,16,14,18,18,26,18,16,18,18,18,18,18,22,58,14,42,58,34,52,14,28]);

    appendSheet(wb,'09_INVENTARIO_UBICACIONES','INVENTARIO POR UBICACIÓN · SHOPIFY','Usar cuando existan varias ubicaciones. Para una importación real, conviene partir de un CSV de inventario exportado desde la tienda y completar On hand (new).',['Handle','Title','Option 1 Name','Option 1 Value','Option 2 Name','Option 2 Value','Option 3 Name','Option 3 Value','SKU','Location','Bin name','HS Code','COO','On hand (current)','On hand (new)','Variant Packed Length','Variant Packed Width','Variant Packed Height','Variant Packed Dimension Unit'],inventoryRows(products),[28,34,18,20,18,20,18,20,20,28,18,18,12,18,18,20,20,20,22]);

    const req=[
      ['Formato de importación','Shopify importa productos mediante CSV; para importación el CSV debe estar en UTF-8.','Preparar/exportar desde la hoja 08 después de revisión.',SOURCE_PRODUCT_CSV],
      ['Columnas mínimas','Para crear productos nuevos, Title es la única columna obligatoria; si hay variantes, URL handle también es necesario.','El portal genera handle cuando falta.',SOURCE_PRODUCT_CSV],
      ['Opciones y variantes','Hasta 3 opciones por producto y hasta 2,048 variantes por producto.','Usar Variante 1, 2, 3...; una variante por defecto usa Title / Default Title.',SOURCE_VARIANTS],
      ['Imágenes por CSV','El CSV admite URLs de imágenes públicas; las imágenes locales deben alojarse primero.','Enviar archivos aunque no tengas URL; ESG puede preparar la carga.',SOURCE_PRODUCT_CSV],
      ['Cantidad de imágenes','Shopify admite hasta 250 imágenes/media por producto; cada variante puede tener una imagen asignada.','Evitar duplicar URLs y mantener nombres claros.',SOURCE_VARIANTS],
      ['Imagen de variante','Cada variante puede tener una imagen asignada; video/3D no se asignan como imagen de variante.','Usar Variant image URL.', 'https://help.shopify.com/en/manual/products/product-media/add-images-variants'],
      ['Categoría estándar','Product category debe usar Shopify Standard Product Taxonomy.','ESG debe validar la categoría antes de importar.',SOURCE_PRODUCT_CSV],
      ['Tags','Máximo 250 tags por producto; separados por comas.','Evitar caracteres innecesarios.',SOURCE_PRODUCT_CSV],
      ['SEO title','Hasta 70 caracteres.','Si queda vacío, Shopify usa el Title.',SOURCE_PRODUCT_CSV],
      ['SEO description','Hasta 320 caracteres.','Si queda vacío, Shopify puede usar la descripción.',SOURCE_PRODUCT_CSV],
      ['Inventario · una ubicación','Inventory quantity en el CSV de producto aplica a tiendas con una sola ubicación.','Usar cantidad por variante.',SOURCE_PRODUCT_CSV],
      ['Inventario · varias ubicaciones','Usar el CSV de inventario; requiere Handle, Location y valores de opciones para identificar la variante.','Revisar hoja 09 y, antes de importar, exportar inventario desde Shopify cuando sea posible.',SOURCE_INVENTORY],
      ['Dimensiones empacadas','Si se completan dimensiones empacadas, deben completarse largo, ancho, alto y unidad; si se dejan parciales pueden causar error.','El formulario valida que estén las cuatro o ninguna.',SOURCE_PRODUCT_CSV],
      ['CSV máximo','Los CSV de importación de productos e inventario no pueden exceder 15 MB.','Dividir archivos grandes si es necesario.', 'https://help.shopify.com/en/manual/products/import-export/import-products'],
      ['Medios','PNG y JPEG son opciones recomendadas para imágenes de producto.','Mantener imágenes nítidas y consistentes.',SOURCE_MEDIA],
      ['URLs directas','Al agregar medios por URL, el enlace debe apuntar al archivo y ser accesible públicamente.','No usar enlaces de preview de Drive/Dropbox.',SOURCE_ADD_MEDIA],
      ['Gift cards','Una gift card no se crea como producto nuevo mediante CSV de productos.','Revisar manualmente en Shopify si aplica.',SOURCE_PRODUCT_CSV]
    ];
    appendSheet(wb,'10_REQUISITOS_SHOPIFY','REQUISITOS Y CONTROL SHOPIFY','Referencia operativa basada en documentación oficial de Shopify consultada por ESG Experience.',['Tema','Regla actual','Qué hacer','Fuente oficial'],req,[30,74,70,72]);
  }

  const checks=['Excel maestro generado','Logo oficial','Fotos originales identificadas','Lista de precios vigente','Manual de marca','Referencias visuales','Videos','Testimonios','Documentos legales o políticas','Fotos de productos nombradas por producto','Listado de SKUs / códigos de barras','Inventario por ubicación','Políticas de envío y devoluciones','Datos de peso y dimensiones','Información fiscal / impuestos aplicables'];
  appendSheet(wb,data.catalogType==='shopify'?'11_CHECKLIST':'06_CHECKLIST','CHECKLIST DE ENTREGA','Adjuntar el Excel y los materiales disponibles para revisión.',['Material','Estado declarado','Nota'],checks.map(x=>[x,data.materials.includes(x)?'DISPONIBLE':'NO MARCADO',x==='Excel maestro generado'?'OBLIGATORIO: adjuntar este archivo.':'Enviar si existe o aplica.']),[44,20,72]);
  return wb;
}

export function downloadWorkbook(data){
  const wb=buildWorkbook(data),arr=XLSX.write(wb,{bookType:'xlsx',type:'array',cellStyles:true});
  const blob=new Blob([arr],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`ESG_${data.projectCode}_${slug(data.business.businessName||'catalogo')}.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
