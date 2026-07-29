import {MODULES,PROJECTS,WHATSAPP_NUMBER,WHATSAPP_DISPLAY,FORM_SCHEMA,WEBCARE_PRICE,CATALOG_REFERENCE} from './config.js';
import {downloadWorkbook} from './excel.js';
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const form=$('#portalForm');let current=1,acceptedQuote=null,projectCode='';
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
function init(){renderModules();applyBusinessSchema();bind();addOffering();updateQuote();showStep(1);}
function renderModules(){$('#modulesGrid').innerHTML=MODULES.map(m=>`<label class="module-card"><input type="checkbox" name="modules" value="${m.id}" data-price="${m.price}"><span class="choice-check"></span><h3>${m.name}</h3><p>${m.description}</p><strong>+$${m.price}</strong></label>`).join('');}
function bind(){form.addEventListener('change',e=>{if(e.target.matches('[name="projectType"],[name="modules"],[name="webcare"],[name="catalogItems"],[name="catalogCategories"]'))updateQuote();});$$('.next').forEach(b=>b.onclick=()=>next());$$('.prev').forEach(b=>b.onclick=()=>showStep(current-1));$('#quoteAccepted').onchange=e=>$('#acceptQuote').disabled=!e.target.checked;$('#acceptQuote').onclick=()=>{acceptedQuote=getQuote();showStep(3)};$('#addCatalogItem').onclick=addOffering;form.onsubmit=submitForm;}
function getQuote(){const project=form.elements.projectType.value;const p=PROJECTS[project]||{name:'Sin seleccionar',price:0};const modules=$$('[name="modules"]:checked').map(x=>MODULES.find(m=>m.id===x.value)).filter(Boolean);const items=Number(form.elements.catalogItems?.value||0),cats=Number(form.elements.catalogCategories?.value||0);return{projectType:project,projectName:p.name,basePrice:p.price,modules,initialTotal:p.price+modules.reduce((a,m)=>a+m.price,0),webcare:form.elements.webcare.checked,monthlyTotal:form.elements.webcare.checked?WEBCARE_PRICE:0,catalogItems:items,catalogCategories:cats,requiresReview:project==='catalogo'&&(items>Number(CATALOG_REFERENCE.referenciaItems||30)||cats>Number(CATALOG_REFERENCE.referenciaCategorias||5))};}
function updateQuote(){const q=getQuote();$('#liveTotal').textContent=money(q.initialTotal);$('#monthlyTotal').textContent=money(q.monthlyTotal);$('#catalogQuestions').classList.toggle('hidden',q.projectType!=='catalogo');$('#catalogWarning').classList.toggle('hidden',!q.requiresReview);}
function next(){if(current===1&&!form.elements.projectType.value)return alert('Selecciona una arquitectura.');if(current===3&&!validateStep3())return; if(current===1){renderQuote();showStep(2)}else if(current===3){renderFinal();showStep(4)}}
function showStep(n){current=n;$$('.step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===n));$('#progressLabel').textContent=`Paso ${n} de 4`;$('#progressBar').style.width=`${n*25}%`;scrollTo({top:0,behavior:'smooth'});}
function renderQuote(){const q=getQuote();$('#quoteSummary').innerHTML=`<div class="summary-row"><span>Arquitectura</span><strong>${q.projectName}</strong></div><div class="summary-row"><span>Precio base</span><strong>${money(q.basePrice)}</strong></div>${q.modules.map(m=>`<div class="summary-row"><span>${m.name}</span><strong>+${money(m.price)}</strong></div>`).join('')}<div class="summary-row summary-total"><span>Total inicial estimado</span><strong>${money(q.initialTotal)}</strong></div><div class="summary-row"><span>ESG WebCare</span><strong>${q.monthlyTotal?money(q.monthlyTotal)+'/mes':'No seleccionado'}</strong></div>`;}
function validateStep3(){let ok=true;$$('[data-step="3"] [required]').forEach(el=>{el.classList.remove('error');if(!String(el.value||'').trim()){el.classList.add('error');ok=false;}});if(!collectOfferings().length){alert('Agrega al menos una ficha de servicio o producto.');ok=false;}if(!ok)alert('Completa los campos obligatorios marcados.');return ok;}

function businessFieldHtml(f){
  const req=f.obligatorio?' required':'';
  const mark=f.obligatorio?' *':'';
  const help=f.ayuda?`<small class="helper">${f.ayuda}</small>`:'';
  if(f.tipo==='textarea') return `<label>${f.etiqueta}${mark}<textarea name="${f.clave}"${req} rows="4" placeholder="${f.placeholder||''}"></textarea>${help}</label>`;
  if(f.tipo==='select') return `<label>${f.etiqueta}${mark}<select name="${f.clave}"${req}><option value="">Selecciona</option>${String(f.ayuda||'').split('|').filter(Boolean).map(o=>`<option>${o}</option>`).join('')}</select></label>`;
  return `<label>${f.etiqueta}${mark}<input type="${f.tipo||'text'}" name="${f.clave}"${req} placeholder="${f.placeholder||''}">${help}</label>`;
}
function applyBusinessSchema(){
  const extras=[];
  FORM_SCHEMA.camposNegocio.filter(f=>f.activo!==false).forEach(f=>{
    const el=form.elements[f.clave];
    if(el){
      el.required=!!f.obligatorio;
      if(f.placeholder) el.placeholder=f.placeholder;
      const label=el.closest('label');
      if(label){
        const first=label.childNodes[0];
        if(first&&first.nodeType===Node.TEXT_NODE) first.textContent=f.etiqueta+(f.obligatorio?' *':'');
      }
    } else extras.push(f);
  });
  if(extras.length){
    $('#customFieldsBlock').classList.remove('hidden');
    $('#customBusinessFields').innerHTML=extras.map(businessFieldHtml).join('');
  }
}
function fieldHtml(f){
  const req=f.obligatorio?' required':'';
  const mark=f.obligatorio?' *':'';
  const help=f.ayuda?`<small class="helper">${f.ayuda}</small>`:'';
  if(f.tipo==='textarea') return `<label>${f.etiqueta}${mark}<textarea data-cat="${f.clave}"${req} rows="3" placeholder="${f.placeholder||''}"></textarea>${help}</label>`;
  if(f.tipo==='select') return `<label>${f.etiqueta}${mark}<select data-cat="${f.clave}"${req}><option value="">Selecciona</option>${String(f.ayuda||'').split('|').filter(Boolean).map(o=>`<option>${o}</option>`).join('')}</select></label>`;
  return `<label>${f.etiqueta}${mark}<input type="${f.tipo||'text'}" data-cat="${f.clave}"${req} placeholder="${f.placeholder||''}">${help}</label>`;
}
function addOffering(){
  const i=$$('#catalogItems .catalog-item').length+1,div=document.createElement('div');
  div.className='catalog-item';
  const fields=FORM_SCHEMA.camposFicha.filter(f=>f.activo!==false);
  div.innerHTML=`<div class="catalog-item-head"><h4>Ficha ${i}</h4><button type="button" class="remove-item">Eliminar</button></div><div class="fields two">${fields.map(fieldHtml).join('')}</div>`;
  div.querySelector('.remove-item').onclick=()=>{if($$('#catalogItems .catalog-item').length>1){div.remove();renumber();}};
  $('#catalogItems').append(div);
}
function renumber(){$$('#catalogItems .catalog-item h4').forEach((h,i)=>h.textContent=`Ficha ${i+1}`)}
function collectOfferings(){
  return $$('#catalogItems .catalog-item').map((el,idx)=>{
    const item={Orden:idx+1};
    FORM_SCHEMA.camposFicha.filter(f=>f.activo!==false).forEach(f=>{
      const input=el.querySelector(`[data-cat="${f.clave}"]`);
      item[f.clave]=input?String(input.value||'').trim():'';
    });
    return item;
  }).filter(x=>x.name||x.description);
}
function collectData(){const fd=new FormData(form),quote=acceptedQuote||getQuote();if(!projectCode)projectCode=`ESG-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;const business={};FORM_SCHEMA.camposNegocio.filter(f=>f.activo!==false).forEach(f=>business[f.clave]=fd.get(f.clave)||'');return{projectCode,submittedAt:new Date().toISOString(),quote,business,items:collectOfferings(),materials:fd.getAll('materialChecklist')};}
function renderFinal(){const d=collectData();$('#finalSummary').innerHTML=`<div class="summary-row"><span>Cliente</span><strong>${d.business.clientName}</strong></div><div class="summary-row"><span>Negocio</span><strong>${d.business.businessName}</strong></div><div class="summary-row"><span>Arquitectura</span><strong>${d.quote.projectName}</strong></div><div class="summary-row"><span>Fichas completas</span><strong>${d.items.length}</strong></div><div class="summary-row"><span>Estimado inicial</span><strong>${money(d.quote.initialTotal)}</strong></div>`;}
function submitForm(e){e.preventDefault();if(!$('#dataConsent').checked)return alert('Confirma la autorización para continuar.');const btn=$('#submitBtn');btn.disabled=true;btn.textContent='Generando Excel maestro...';const data=collectData();downloadWorkbook(data);const text=`Hola, ESG Experience.\n\nHe completado el Formulario Maestro de mi proyecto web.\n\nCódigo: ${data.projectCode}\nCliente: ${data.business.clientName}\nNegocio: ${data.business.businessName}\nArquitectura: ${data.quote.projectName}\nFichas registradas: ${data.items.length}\nEstimado inicial: ${money(data.quote.initialTotal)}\n\nAdjunto en este chat:\n1. El Excel maestro descargado por el portal.\n2. El logo oficial en su mejor calidad.\n3. Las fotos originales identificadas con los nombres escritos en cada ficha.\n4. Lista de precios, catálogos, PDFs o documentos oficiales vigentes.\n5. Links o imágenes de páginas de referencia.\n6. Manual de marca, testimonios, videos, políticas y cualquier material adicional disponible.\n\nPor favor, revisen el Excel y los archivos para confirmar el alcance final.`;const url=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;window.open(url,'_blank','noopener,noreferrer')|| (location.href=url);$('#submitMessage').className='notice success-message';$('#submitMessage').innerHTML=`<strong>Excel maestro descargado.</strong><br>Adjúntalo en WhatsApp junto con logo, fotos identificadas, documentos oficiales y referencias. Código: <strong>${data.projectCode}</strong> · ${WHATSAPP_DISPLAY}`;btn.disabled=false;btn.textContent='Abrir WhatsApp otra vez';btn.onclick=()=>window.open(url,'_blank','noopener,noreferrer');}
init();
