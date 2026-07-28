function rowsFromObject(obj){return Object.entries(obj).map(([Campo,Valor])=>({Campo,Valor:Array.isArray(Valor)?Valor.join(', '):(Valor??'')}));}
export function buildWorkbook(data){
  const wb=XLSX.utils.book_new();
  const quote={
    'Código':data.projectCode,'Fecha':data.submittedAt,'Proyecto':data.quote.projectName,'Precio base':data.quote.basePrice,
    'Módulos':data.quote.modules.map(m=>`${m.name} (+$${m.price})`).join(' | '),'Total inicial':data.quote.initialTotal,
    'WebCare':data.quote.webcare?'Sí':'No','Costo mensual':data.quote.monthlyTotal,'Requiere revisión':data.quote.requiresReview?'Sí':'No',
    'Elementos estimados':data.quote.catalogItems||'','Categorías estimadas':data.quote.catalogCategories||''
  };
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rowsFromObject(quote)),'00_COTIZACION');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rowsFromObject(data.business)),'01_NEGOCIO');
  if(data.catalogItems.length){XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data.catalogItems),'02_CATALOGO');}
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data.files.map(f=>({Archivo:f.name,Tipo:f.type,Tamaño:`${Math.round(f.size/1024)} KB`}))),'03_ARCHIVOS');
  return wb;
}
export function workbookBlob(data){const wb=buildWorkbook(data);const arr=XLSX.write(wb,{bookType:'xlsx',type:'array'});return new Blob([arr],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});}
export function downloadWorkbook(data){const blob=workbookBlob(data);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ESG_${data.projectCode}_${slug(data.business.businessName||'proyecto')}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function slug(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);}
