import {MODULES,PROJECTS,WHATSAPP_NUMBER,WHATSAPP_DISPLAY} from './config.js';
import {downloadWorkbook} from './excel.js';

const form=document.querySelector('#portalForm');let step=1;let acceptedQuote=null;let projectCode='';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);

function init(){renderModules();bind();addCatalogItem();updateQuote();showStep(1);}
function renderModules(){ $('#modulesGrid').innerHTML=MODULES.map(m=>`<label class="module-card"><input type="checkbox" name="module" value="${m.id}" data-price="${m.price}"><span class="choice-check"></span><h3>${m.name}</h3><p>${m.description}</p><strong>+${money(m.price)}</strong></label>`).join(''); }
function bind(){
  form.addEventListener('change',e=>{if(['projectType','module','webcare','catalogItems','catalogCategories'].includes(e.target.name)) updateQuote();});
  $$('.next').forEach(b=>b.addEventListener('click',()=>{if(validateStep(step)){if(step===1) renderQuoteSummary();if(step===3) renderFinal();showStep(step+1);}}));
  $$('.prev').forEach(b=>b.addEventListener('click',()=>showStep(step-1)));
  $('#quoteAccepted').addEventListener('change',e=>$('#acceptQuote').disabled=!e.target.checked);
  $('#acceptQuote').addEventListener('click',()=>{acceptedQuote=getQuote();showStep(3);});
  $('#addCatalogItem').addEventListener('click',addCatalogItem);
  form.addEventListener('submit',submitForm);
}
function getQuote(){
  const p=$('input[name="projectType"]:checked'); const project=p?PROJECTS[p.value]:null;
  const modules=$$('input[name="module"]:checked').map(i=>MODULES.find(m=>m.id===i.value));
  const catalogItems=Number(form.catalogItems?.value||0),catalogCategories=Number(form.catalogCategories?.value||0);
  const requiresReview=p?.value==='catalogo'&&(catalogItems>30||catalogCategories>5);
  const webcare=form.webcare.checked;return {projectId:p?.value||'',projectName:project?.name||'',basePrice:project?.price||0,modules,initialTotal:(project?.price||0)+modules.reduce((s,m)=>s+m.price,0),webcare,monthlyTotal:webcare?25:0,catalogItems,catalogCategories,requiresReview};
}
function updateQuote(){
  const q=getQuote(); $('#liveTotal').textContent=money(q.initialTotal);$('#monthlyTotal').textContent=q.monthlyTotal?`${money(q.monthlyTotal)}/mes`:'$0';
  const isCatalog=q.projectId==='catalogo';$('#catalogQuestions').classList.toggle('hidden',!isCatalog);$('#catalogWarning').classList.toggle('hidden',!q.requiresReview);
}
function renderQuoteSummary(){const q=getQuote();$('#quoteSummary').innerHTML=`
  <div class="summary-row"><span>Proyecto seleccionado</span><strong>${q.projectName}</strong></div>
  <div class="summary-row"><span>Precio del proyecto</span><strong>${money(q.basePrice)}</strong></div>
  ${q.modules.length?q.modules.map(m=>`<div class="summary-row"><span>${m.name}</span><strong>+${money(m.price)}</strong></div>`).join(''):'<div class="summary-row"><span>Módulos adicionales</span><strong>Ninguno</strong></div>'}
  <div class="summary-row summary-total"><span>Inversión inicial estimada</span><strong>${money(q.initialTotal)}</strong></div>
  <div class="summary-row"><span>ESG WebCare</span><strong>${q.webcare?`${money(25)}/mes`:'No seleccionado'}</strong></div>
  ${q.requiresReview?'<p class="notice warning">Este proyecto requiere una evaluación personalizada antes de confirmar el precio final. La calculadora mantiene el valor base sin añadir aumentos automáticos.</p>':''}`;}
function showStep(n){step=n;$$('.step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n));$('#progressLabel').textContent=`Paso ${n} de 4`;$('#progressBar').style.width=`${n*25}%`;scrollTo({top:0,behavior:'smooth'});}
function validateStep(n){clearErrors();if(n===1&&!form.projectType.value){markError($('input[name="projectType"]')?.closest('.choice-grid'),'Selecciona una estructura principal.');return false;}if(n===3){let ok=true;$$('[data-step="3"] [required]').forEach(el=>{if(!el.value.trim()){markError(el,'Este dato es necesario para continuar.');ok=false;}});const cards=collectOfferings();if(!cards.length){markError($('#catalogItems'),'Agrega al menos un servicio, producto o elemento con título y descripción.');ok=false;}return ok;}return true;}
function markError(el,msg){if(!el)return;el.classList.add('error');const p=document.createElement('p');p.className='error-text';p.textContent=msg;el.after(p);}
function clearErrors(){$$('.error').forEach(e=>e.classList.remove('error'));$$('.error-text').forEach(e=>e.remove());}
function addCatalogItem(){
  const i=$$('#catalogItems .catalog-item').length+1;const div=document.createElement('div');div.className='catalog-item';
  div.innerHTML=`<div class="catalog-item-head"><h4>Tarjeta ${i}</h4><button type="button" class="remove-item">Eliminar</button></div>
  <div class="fields two">
    <label>Título oficial *<input data-cat="name" required placeholder="Ej. Pantalla LED de 40 pulgadas"></label>
    <label>Tipo o categoría (opcional)<input data-cat="category" placeholder="Ej. Interior, exterior, residencial"></label>
    <label>Precio o desde (opcional)<input data-cat="price" placeholder="Ej. Desde $499 / Cotización personalizada"></label>
    <label>Nombre de la foto que enviarás<input data-cat="image" placeholder="Ej. Pantalla-LED-40.jpg"></label>
  </div>
  <label>Descripción completa *<textarea data-cat="description" required rows="4" placeholder="Explica qué es, para quién es y sus características principales."></textarea></label>
  <label>Qué incluye el servicio o producto<textarea data-cat="includes" rows="3" placeholder="Ej. instalación, soporte, montaje, garantía, accesorios..."></textarea></label>
  <div class="fields two"><label>Duración, medidas o especificaciones<textarea data-cat="specs" rows="3" placeholder="Ej. 40 pulgadas, resolución, tiempo de instalación, materiales..."></textarea></label><label>Condiciones o información importante<textarea data-cat="conditions" rows="3" placeholder="Ej. requiere evaluación del espacio, depósito, área de servicio..."></textarea></label></div>
  <label>Llamada a la acción de esta tarjeta (opcional)<input data-cat="cta" placeholder="Ej. Solicitar cotización por WhatsApp"></label>`;
  div.querySelector('.remove-item').onclick=()=>{if($$('#catalogItems .catalog-item').length>1)div.remove();};$('#catalogItems').append(div);
}
function collectOfferings(){return $$('#catalogItems .catalog-item').map((el,idx)=>({
  Orden:idx+1,
  Titulo:el.querySelector('[data-cat="name"]').value.trim(),
  Categoria:el.querySelector('[data-cat="category"]').value.trim(),
  Precio:el.querySelector('[data-cat="price"]').value.trim(),
  Foto_identificada:el.querySelector('[data-cat="image"]').value.trim(),
  Descripcion:el.querySelector('[data-cat="description"]').value.trim(),
  Incluye:el.querySelector('[data-cat="includes"]').value.trim(),
  Especificaciones:el.querySelector('[data-cat="specs"]').value.trim(),
  Condiciones:el.querySelector('[data-cat="conditions"]').value.trim(),
  CTA:el.querySelector('[data-cat="cta"]').value.trim()
})).filter(x=>x.Titulo||x.Descripcion);}
function collectData(){
  const fd=new FormData(form);const quote=acceptedQuote||getQuote();if(!projectCode)projectCode=`ESG-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  return {projectCode,submittedAt:new Date().toISOString(),quote,business:{clientName:fd.get('clientName'),clientEmail:fd.get('clientEmail'),clientPhone:fd.get('clientPhone'),businessName:fd.get('businessName'),businessType:fd.get('businessType'),serviceArea:fd.get('serviceArea'),businessDescription:fd.get('businessDescription'),websiteGoal:fd.get('websiteGoal'),instagram:fd.get('instagram'),socialOther:fd.get('socialOther'),address:fd.get('address'),hours:fd.get('hours'),hasLogo:fd.get('hasLogo'),brandColors:fd.get('brandColors'),desiredStyle:fd.get('desiredStyle'),references:fd.get('references'),catalogItemLabel:fd.get('catalogItemLabel'),heroContent:fd.get('heroContent'),promoBanner:fd.get('promoBanner'),extraContent:fd.get('extraContent'),referenceLinks:fd.get('referenceLinks'),materialsNotes:fd.get('materialsNotes')},catalogItems:collectOfferings(),materials:fd.getAll('materialChecklist')};
}
function renderFinal(){const d=collectData();$('#finalSummary').innerHTML=`<div class="summary-row"><span>Cliente</span><strong>${d.business.clientName}</strong></div><div class="summary-row"><span>Negocio</span><strong>${d.business.businessName}</strong></div><div class="summary-row"><span>Proyecto</span><strong>${d.quote.projectName}</strong></div><div class="summary-row"><span>Tarjetas registradas</span><strong>${d.catalogItems.length}</strong></div><div class="summary-row"><span>Inversión inicial estimada</span><strong>${money(d.quote.initialTotal)}</strong></div><div class="summary-row"><span>Costo mensual</span><strong>${d.quote.monthlyTotal?`${money(d.quote.monthlyTotal)}/mes`:'No seleccionado'}</strong></div>`;}
function submitForm(e){
  e.preventDefault();clearErrors();if(!$('#dataConsent').checked){markError($('#dataConsent').closest('.acceptance'),'Debes autorizar la revisión de la información.');return;}
  const btn=$('#submitBtn'),msg=$('#submitMessage');btn.disabled=true;btn.textContent='Preparando Excel y WhatsApp...';
  const data=collectData();downloadWorkbook(data);
  const whatsappText=`Hola, ESG Experience.\n\nHe completado la información inicial de mi proyecto web.\n\nCódigo del proyecto: ${data.projectCode}\nCliente: ${data.business.clientName}\nNegocio: ${data.business.businessName}\nArquitectura: ${data.quote.projectName}\nTarjetas de servicios/productos: ${data.catalogItems.length}\nEstimado inicial: ${money(data.quote.initialTotal)}${data.quote.monthlyTotal?`\nESG WebCare: ${money(data.quote.monthlyTotal)}/mes`:''}${data.quote.requiresReview?'\nNota: el alcance requiere revisión personalizada.':''}\n\nAhora adjuntaré en este chat:\n1. El Excel descargado por el portal.\n2. El logo oficial en su mejor calidad.\n3. Las fotos originales de cada servicio o producto, identificadas con el mismo título usado en el Excel.\n4. Listas de precios, PDFs, catálogos o documentos oficiales disponibles.\n5. Links o imágenes de páginas de referencia.\n6. Videos, testimonios y materiales adicionales disponibles.\n\nPor favor, revisen el Excel y los materiales adjuntos para confirmar el alcance final.`;
  const whatsappUrl=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;const popup=window.open(whatsappUrl,'_blank','noopener,noreferrer');if(!popup)window.location.href=whatsappUrl;
  msg.className='notice success-message';msg.innerHTML=`<strong>Tu Excel fue descargado y WhatsApp está listo.</strong><br>Adjunta primero el archivo <strong>ESG_${data.projectCode}_...</strong>. Después agrega el logo oficial, las fotos originales identificadas, documentos, precios y referencias.<br><small>WhatsApp de ESG Experience: ${WHATSAPP_DISPLAY} · Código: ${data.projectCode}</small>`;
  btn.disabled=false;btn.textContent='Abrir WhatsApp otra vez';btn.onclick=()=>window.open(whatsappUrl,'_blank','noopener,noreferrer');
}
init();
