function rowsFromObject(obj){return Object.entries(obj).map(([Campo,Valor])=>({Campo,Valor:Array.isArray(Valor)?Valor.join(', '):(Valor??'')}));}
function setWidths(ws,widths){ws['!cols']=widths.map(w=>({wch:w}));}
export function buildWorkbook(data){
  const wb=XLSX.utils.book_new();
  const quote={'Código':data.projectCode,'Fecha':data.submittedAt,'Proyecto':data.quote.projectName,'Precio base':data.quote.basePrice,'Módulos':data.quote.modules.map(m=>`${m.name} (+$${m.price})`).join(' | '),'Total inicial':data.quote.initialTotal,'WebCare':data.quote.webcare?'Sí':'No','Costo mensual':data.quote.monthlyTotal,'Requiere revisión':data.quote.requiresReview?'Sí':'No','Elementos estimados':data.quote.catalogItems||'','Categorías estimadas':data.quote.catalogCategories||''};
  const wsQuote=XLSX.utils.json_to_sheet(rowsFromObject(quote));setWidths(wsQuote,[28,80]);XLSX.utils.book_append_sheet(wb,wsQuote,'00_COTIZACION');
  const wsBusiness=XLSX.utils.json_to_sheet(rowsFromObject(data.business));setWidths(wsBusiness,[34,100]);XLSX.utils.book_append_sheet(wb,wsBusiness,'01_NEGOCIO');
  const wsCards=XLSX.utils.json_to_sheet(data.catalogItems.length?data.catalogItems:[{Orden:'',Titulo:'',Categoria:'',Precio:'',Foto_identificada:'',Descripcion:'',Incluye:'',Especificaciones:'',Condiciones:'',CTA:''}]);setWidths(wsCards,[8,34,22,20,30,65,55,55,55,32]);XLSX.utils.book_append_sheet(wb,wsCards,'02_TARJETAS');
  const checklist=[
    {Material:'Excel generado por el portal',Estado:'OBLIGATORIO',Nota:'Adjuntar este archivo en WhatsApp.'},
    {Material:'Logo oficial',Estado:'SI EXISTE',Nota:'PNG transparente, SVG, PDF o AI; no captura de pantalla.'},
    {Material:'Fotos originales por tarjeta',Estado:'OBLIGATORIO SI HAY FOTOS',Nota:'Nombrarlas igual que el título o completar Foto_identificada.'},
    {Material:'Lista de precios o documentos oficiales',Estado:'SI EXISTE',Nota:'PDF, Excel, catálogo, menú o documento vigente.'},
    {Material:'Links o imágenes de referencia',Estado:'RECOMENDADO',Nota:'Páginas que le gusten al cliente.'},
    {Material:'Colores y manual de marca',Estado:'SI EXISTE',Nota:'Códigos de color, tipografías y usos de logo.'},
    {Material:'Videos originales',Estado:'OPCIONAL',Nota:'Enviar directamente por WhatsApp.'},
    {Material:'Testimonios autorizados',Estado:'OPCIONAL',Nota:'Texto, nombre y autorización de publicación.'}
  ];
  const wsChecklist=XLSX.utils.json_to_sheet(checklist);setWidths(wsChecklist,[40,24,85]);XLSX.utils.book_append_sheet(wb,wsChecklist,'03_CHECKLIST_ENVIO');
  const selected=(data.materials||[]).map(x=>({Material_marcado_por_cliente:x}));const wsSelected=XLSX.utils.json_to_sheet(selected.length?selected:[{Material_marcado_por_cliente:'Sin selección previa'}]);setWidths(wsSelected,[90]);XLSX.utils.book_append_sheet(wb,wsSelected,'04_MATERIALES_DECLARADOS');
  return wb;
}
export function downloadWorkbook(data){const wb=buildWorkbook(data);const arr=XLSX.write(wb,{bookType:'xlsx',type:'array'});const blob=new Blob([arr],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ESG_${data.projectCode}_${slug(data.business.businessName||'proyecto')}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function slug(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);}
