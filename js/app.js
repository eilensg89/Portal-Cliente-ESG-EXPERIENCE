import {MODULES,PROJECTS,WHATSAPP_NUMBER,WHATSAPP_DISPLAY} from './config.js';
import {downloadWorkbook,workbookBlob} from './excel.js';

const form=document.querySelector('#portalForm');let step=1;let acceptedQuote=null;
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
  $('#attachments').addEventListener('change',e=>$('#fileList').textContent=e.target.files.length?[...e.target.files].map(f=>f.name).join(' · '):'Ningún archivo seleccionado');
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
  const isCatalog=q.projectId==='catalogo';$('#catalogQuestions').classList.toggle('hidden',!isCatalog);$('#catalogBlock').classList.toggle('hidden',!isCatalog);$('#simpleServicesBlock').classList.toggle('hidden',isCatalog);
  $('#catalogWarning').classList.toggle('hidden',!q.requiresReview);
}
function renderQuoteSummary(){const q=getQuote();$('#quoteSummary').innerHTML=`
  <div class="summary-row"><span>Proyecto seleccionado</span><strong>${q.projectName}</strong></div>
  <div class="summary-row"><span>Precio del proyecto</span><strong>${money(q.basePrice)}</strong></div>
  ${q.modules.length?q.modules.map(m=>`<div class="summary-row"><span>${m.name}</span><strong>+${money(m.price)}</strong></div>`).join(''):'<div class="summary-row"><span>Módulos adicionales</span><strong>Ninguno</strong></div>'}
  <div class="summary-row summary-total"><span>Inversión inicial estimada</span><strong>${money(q.initialTotal)}</strong></div>
  <div class="summary-row"><span>ESG WebCare</span><strong>${q.webcare?`${money(25)}/mes`:'No seleccionado'}</strong></div>
  ${q.requiresReview?'<p class="notice warning">Este proyecto requiere una evaluación personalizada antes de confirmar el precio final. La calculadora mantiene el valor base sin añadir aumentos automáticos.</p>':''}`;}
function showStep(n){step=n;$$('.step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n));$('#progressLabel').textContent=`Paso ${n} de 4`;$('#progressBar').style.width=`${n*25}%`;scrollTo({top:0,behavior:'smooth'});}
function validateStep(n){clearErrors();if(n===1&&!form.projectType.value){markError($('input[name="projectType"]')?.closest('.choice-grid'),'Selecciona una estructura principal.');return false;}if(n===3){let ok=true;$$('[data-step="3"] [required]').forEach(el=>{if(!el.value.trim()){markError(el,'Este dato es necesario para contactarte.');ok=false;}});return ok;}return true;}
function markError(el,msg){if(!el)return;el.classList.add('error');const p=document.createElement('p');p.className='error-text';p.textContent=msg;el.after(p);}
function clearErrors(){$$('.error').forEach(e=>e.classList.remove('error'));$$('.error-text').forEach(e=>e.remove());}
function addCatalogItem(){const i=$$('#catalogItems .catalog-item').length+1;const div=document.createElement('div');div.className='catalog-item';div.innerHTML=`<div class="catalog-item-head"><h4>Elemento ${i}</h4><button type="button" class="remove-item">Eliminar</button></div><div class="fields two"><label>Nombre<input data-cat="name" placeholder="Nombre o referencia"></label><label>Precio (opcional)<input data-cat="price" placeholder="$"></label><label>Categoría (opcional)<input data-cat="category" placeholder="Puedes dejarlo vacío"></label><label>Imagen o nombre de archivo<input data-cat="image" placeholder="También puedes subirla en Archivos"></label></div><label>Descripción u observaciones (opcional)<textarea data-cat="description" rows="3"></textarea></label>`;div.querySelector('.remove-item').onclick=()=>div.remove();$('#catalogItems').append(div);}
function collectData(){const fd=new FormData(form);const files=[...$('#attachments').files];const quote=acceptedQuote||getQuote();const catalogItems=$$('#catalogItems .catalog-item').map((el,idx)=>({Orden:idx+1,Nombre:el.querySelector('[data-cat="name"]').value,Precio:el.querySelector('[data-cat="price"]').value,Categoria:el.querySelector('[data-cat="category"]').value,Imagen:el.querySelector('[data-cat="image"]').value,Descripcion:el.querySelector('[data-cat="description"]').value})).filter(x=>Object.values(x).some(v=>String(v).trim()&&v!==x.Orden));return {projectCode:`ESG-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`,submittedAt:new Date().toISOString(),quote,business:{clientName:fd.get('clientName'),clientEmail:fd.get('clientEmail'),clientPhone:fd.get('clientPhone'),businessName:fd.get('businessName'),businessType:fd.get('businessType'),serviceArea:fd.get('serviceArea'),businessDescription:fd.get('businessDescription'),websiteGoal:fd.get('websiteGoal'),instagram:fd.get('instagram'),socialOther:fd.get('socialOther'),address:fd.get('address'),hours:fd.get('hours'),hasLogo:fd.get('hasLogo'),brandColors:fd.get('brandColors'),desiredStyle:fd.get('desiredStyle'),references:fd.get('references'),servicesList:fd.get('servicesList'),catalogItemLabel:fd.get('catalogItemLabel'),extraContent:fd.get('extraContent')},catalogItems,files:files.map(f=>({name:f.name,type:f.type,size:f.size})),rawFiles:files};}
function renderFinal(){const d=collectData();$('#finalSummary').innerHTML=`<div class="summary-row"><span>Cliente</span><strong>${d.business.clientName}</strong></div><div class="summary-row"><span>Negocio</span><strong>${d.business.businessName}</strong></div><div class="summary-row"><span>Proyecto</span><strong>${d.quote.projectName}</strong></div><div class="summary-row"><span>Inversión inicial estimada</span><strong>${money(d.quote.initialTotal)}</strong></div><div class="summary-row"><span>Costo mensual</span><strong>${d.quote.monthlyTotal?`${money(d.quote.monthlyTotal)}/mes`:'No seleccionado'}</strong></div><div class="summary-row"><span>Archivos</span><strong>${d.files.length}</strong></div>`;}
async function submitForm(e){
  e.preventDefault();
  clearErrors();
  if(!$('#dataConsent').checked){
    markError($('#dataConsent').closest('.acceptance'),'Debes autorizar la revisión de la información.');
    return;
  }

  const btn=$('#submitBtn');
  const msg=$('#submitMessage');
  btn.disabled=true;
  btn.textContent='Preparando Excel y WhatsApp...';

  const data=collectData();
  downloadWorkbook(data);

  const fileNames=data.files.length
    ? data.files.map(f=>`• ${f.name}`).join('\n')
    : '• No seleccioné archivos adicionales todavía.';

  const whatsappText=`Hola, ESG Experience.\n\nHe completado la información inicial de mi proyecto web.\n\nCódigo del proyecto: ${data.projectCode}\nCliente: ${data.business.clientName}\nNegocio: ${data.business.businessName}\nArquitectura: ${data.quote.projectName}\nEstimado inicial: ${money(data.quote.initialTotal)}${data.quote.monthlyTotal?`\nESG WebCare: ${money(data.quote.monthlyTotal)}/mes`:''}${data.quote.requiresReview?'\nNota: el alcance requiere revisión personalizada.':''}\n\nEl portal descargó mi Excel. Lo adjuntaré en este chat junto con las fotografías y documentos disponibles.\n\nArchivos seleccionados en el portal:\n${fileNames}`;

  const whatsappUrl=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
  const popup=window.open(whatsappUrl,'_blank','noopener,noreferrer');
  if(!popup) window.location.href=whatsappUrl;

  msg.className='notice success-message';
  msg.innerHTML=`<strong>Tu Excel fue descargado y WhatsApp está listo.</strong><br>
  Busca el archivo <strong>ESG_${data.projectCode}_...</strong> en Descargas y adjúntalo en el chat. Después agrega tus fotografías, logo, videos y documentos disponibles.<br>
  <small>WhatsApp de ESG Experience: ${WHATSAPP_DISPLAY} · Código: ${data.projectCode}</small>`;

  btn.disabled=false;
  btn.textContent='Abrir WhatsApp otra vez';
  btn.onclick=()=>window.open(whatsappUrl,'_blank','noopener,noreferrer');
}

init();
