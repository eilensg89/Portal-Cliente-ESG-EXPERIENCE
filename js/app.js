import {CATALOG_TYPES,WHATSAPP_NUMBER,WHATSAPP_DISPLAY,FORM_SCHEMA} from './config.js';
import {downloadWorkbook} from './excel.js';

const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const form=$('#catalogForm');
let current=1, projectCode='', pendingData=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,120);

function init(){
  renderBusinessFields();
  renderShopifyGlobalFields();
  renderMaterials();
  addCategoryCard();
  bind();
  showStep(1,false);
}

function bind(){
  form.addEventListener('change',e=>{
    if(e.target.name==='catalogType') toggleCatalogMode();
  });
  $$('.next').forEach(b=>b.onclick=()=>next());
  $$('.prev').forEach(b=>b.onclick=()=>showStep(current-1));
  $('#catalogSearch').addEventListener('input',filterCatalog);
  form.onsubmit=prepareSubmit;
  $('#confirmDownload').onclick=finishSubmit;
  $('.modal-close').onclick=closeModal;
  $('#downloadModal').addEventListener('click',e=>{if(e.target.id==='downloadModal')closeModal();});
}

function showStep(n,scroll=true){
  current=n;
  $$('.step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===n));
  $('#progressLabel').textContent=`Paso ${n} de 3`;
  $('#progressBar').style.width=`${n*33.333}%`;
  if(scroll){const target=$(`.step[data-step="${n}"]`);requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));}
}

function next(){
  if(current===1){
    if(!form.elements.catalogType.value)return alert('Selecciona si el catálogo será para Shopify o para una web con WhatsApp.');
    toggleCatalogMode();
    return showStep(2);
  }
  if(current===2){
    if(!validateStep2())return;
    renderFinal();
    return showStep(3);
  }
}

function fieldHtml(f,attr='data-field'){
  const req=f.obligatorio?' required':'', mark=f.obligatorio?' *':'', help=f.ayuda?`<small class="helper">${esc(f.ayuda)}</small>`:'';
  if(f.tipo==='textarea')return `<label>${esc(f.etiqueta)}${mark}<textarea ${attr}="${esc(f.clave)}"${req} rows="3" placeholder="${esc(f.placeholder||'')}"></textarea>${help}</label>`;
  if(f.tipo==='select')return `<label>${esc(f.etiqueta)}${mark}<select ${attr}="${esc(f.clave)}"${req}><option value="">Selecciona</option>${String(f.ayuda||'').split('|').filter(Boolean).map(o=>`<option>${esc(o)}</option>`).join('')}</select>${help}</label>`;
  const step=f.tipo==='number'?' step="any"':'';
  return `<label>${esc(f.etiqueta)}${mark}<input type="${esc(f.tipo||'text')}" ${attr}="${esc(f.clave)}"${req}${step} placeholder="${esc(f.placeholder||'')}">${help}</label>`;
}

function renderBusinessFields(){
  $('#businessFields').innerHTML=(FORM_SCHEMA.camposNegocio||[]).filter(f=>f.activo!==false&&f.clave!=='materialsNotes').map(f=>fieldHtml(f,'data-business')).join('');
}
function renderShopifyGlobalFields(){
  $('#shopifyGlobalFields').innerHTML=(FORM_SCHEMA.camposShopifyGlobal||[]).filter(f=>f.activo!==false).map(f=>fieldHtml(f,'data-shopify-global')).join('');
  const currency=$('[data-shopify-global="shopifyCurrency"]'); if(currency)currency.value='USD';
}
function renderMaterials(){
  $('#materialsChecklist').innerHTML=(FORM_SCHEMA.materiales||[]).map(x=>`<label><input type="checkbox" name="materialChecklist" value="${esc(x)}">${esc(x)}</label>`).join('');
}
function toggleCatalogMode(){
  const isShopify=form.elements.catalogType.value==='shopify';
  $('#shopifyGlobalCard').classList.toggle('hidden',!isShopify);
  $$('.shopify-block').forEach(x=>x.classList.toggle('hidden',!isShopify));
  $$('.shopify-block [required]').forEach(el=>{el.dataset.requiredShopify='1';el.required=isShopify;});
}

function makeFooter(addText,onAdd,removeText,onRemove){
  const d=document.createElement('div');d.className='item-actions';
  const add=document.createElement('button');add.type='button';add.className='btn small add-inline';add.textContent=`+ ${addText}`;add.onclick=onAdd;
  const rem=document.createElement('button');rem.type='button';rem.className='btn small danger';rem.textContent=removeText;rem.onclick=onRemove;
  d.append(add,rem);return d;
}
function confirmRemove(label){return confirm(`¿Deseas eliminar ${label}? Esta acción no se puede deshacer.`)}

function addCategoryCard(after=null){
  const wrap=$('#catalogBuilder'),cat=document.createElement('article');cat.className='category-card';
  cat.innerHTML=`<div class="catalog-item-head"><h4></h4></div><div class="fields two">${(FORM_SCHEMA.camposCategoria||[]).filter(f=>f.activo!==false).map(f=>fieldHtml(f,'data-category')).join('')}</div><div class="mode-choice"><p><strong>¿Cómo se organiza esta categoría?</strong></p><label><input type="radio" value="direct" checked> Productos directamente en la categoría</label><label><input type="radio" value="subcategories"> Tiene una o varias subcategorías</label></div><div class="direct-products"></div><div class="subcategories hidden"></div>`;
  const radios=$$('input[type="radio"]',cat),unique=`mode-${crypto.randomUUID()}`;radios.forEach(r=>r.name=unique);radios.forEach(r=>r.onchange=()=>switchCategoryMode(cat,r.value));
  addProductCard($('.direct-products',cat),null,'categoría');
  cat.append(makeFooter('Agregar otra categoría',()=>addCategoryCard(cat),'Eliminar esta categoría',()=>{if(wrap.children.length===1)return alert('Debe existir al menos una categoría.');if(confirmRemove('esta categoría completa')){cat.remove();renumberCategories();}}));
  after?after.after(cat):wrap.append(cat);renumberCategories();toggleCatalogMode();
  requestAnimationFrame(()=>cat.scrollIntoView({behavior:'smooth',block:'start'}));
}
function switchCategoryMode(cat,mode){
  const direct=$('.direct-products',cat),subs=$('.subcategories',cat);direct.classList.toggle('hidden',mode!=='direct');subs.classList.toggle('hidden',mode!=='subcategories');if(mode==='subcategories'&&!subs.children.length)addSubcategoryCard(subs);
}
function addSubcategoryCard(container,after=null){
  const sub=document.createElement('section');sub.className='subcategory-card';
  sub.innerHTML=`<div class="catalog-item-head"><h5></h5></div><div class="fields two">${(FORM_SCHEMA.camposSubcategoria||[]).filter(f=>f.activo!==false).map(f=>fieldHtml(f,'data-subcategory')).join('')}</div><div class="products-list"></div>`;
  addProductCard($('.products-list',sub),null,'subcategoría');
  sub.append(makeFooter('Agregar otra subcategoría',()=>addSubcategoryCard(container,sub),'Eliminar esta subcategoría',()=>{if(container.children.length===1)return alert('Debe existir al menos una subcategoría.');if(confirmRemove('esta subcategoría y sus productos')){sub.remove();renumberSubcategories(container);}}));
  after?after.after(sub):container.append(sub);renumberSubcategories(container);toggleCatalogMode();
  requestAnimationFrame(()=>sub.scrollIntoView({behavior:'smooth',block:'start'}));
}
function addProductCard(container,after=null,scope='categoría'){
  const product=document.createElement('div');product.className='product-card';
  product.innerHTML=`<div class="catalog-item-head"><h6></h6></div><div class="fields two">${(FORM_SCHEMA.camposProducto||[]).filter(f=>f.activo!==false).map(f=>fieldHtml(f,'data-product')).join('')}</div><section class="shopify-block hidden"><span class="mode-badge">Datos Shopify</span><h6>Configuración del producto</h6><div class="fields two">${(FORM_SCHEMA.camposShopifyProducto||[]).filter(f=>f.activo!==false).map(f=>fieldHtml(f,'data-shopify-product')).join('')}</div><div class="variant-list"></div></section>`;
  product.append(makeFooter(`Agregar otro producto a esta ${scope}`,()=>addProductCard(container,product,scope),'Eliminar este producto',()=>{if(container.children.length===1)return alert('Debe existir al menos un producto.');if(confirmRemove('este producto')){product.remove();renumberProducts(container);}}));
  const variantList=$('.variant-list',product);addVariantCard(variantList);
  after?after.after(product):container.append(product);renumberProducts(container);setShopifyProductDefaults(product);toggleCatalogMode();
  requestAnimationFrame(()=>product.scrollIntoView({behavior:'smooth',block:'start'}));
}
function addVariantCard(container,after=null){
  const v=document.createElement('div');v.className='variant-card';
  v.innerHTML=`<h6></h6><div class="fields two">${(FORM_SCHEMA.camposVarianteShopify||[]).filter(f=>f.activo!==false).map(f=>fieldHtml(f,'data-variant')).join('')}</div>`;
  v.append(makeFooter('Agregar otra variante',()=>addVariantCard(container,v),'Eliminar esta variante',()=>{if(container.children.length===1)return alert('Debe existir al menos una variante o variante por defecto.');if(confirmRemove('esta variante')){v.remove();renumberVariants(container);}}));
  after?after.after(v):container.append(v);renumberVariants(container);setVariantDefaults(v);
}

function setShopifyProductDefaults(product){
  const defaults={published:'Sí',shopifyStatus:'active',giftCard:'No'};
  Object.entries(defaults).forEach(([k,val])=>{const el=product.querySelector(`[data-shopify-product="${k}"]`);if(el&&!el.value)el.value=val;});
}
function setVariantDefaults(v){
  const defaults={option1Name:'Title',option1Value:'Default Title',chargeTax:'Sí',inventoryTracker:'shopify',continueSelling:'deny',weightUnit:'kg',requiresShipping:'Sí',fulfillmentService:'manual'};
  Object.entries(defaults).forEach(([k,val])=>{const el=v.querySelector(`[data-variant="${k}"]`);if(el&&!el.value)el.value=val;});
}
function renumberCategories(){$$('#catalogBuilder > .category-card > .catalog-item-head h4').forEach((h,i)=>h.textContent=`Categoría ${i+1}`)}
function renumberSubcategories(container){$$(':scope > .subcategory-card > .catalog-item-head h5',container).forEach((h,i)=>h.textContent=`Subcategoría ${i+1}`)}
function renumberProducts(container){$$(':scope > .product-card > .catalog-item-head h6',container).forEach((h,i)=>h.textContent=`Producto ${i+1}`)}
function renumberVariants(container){$$(':scope > .variant-card > h6',container).forEach((h,i)=>h.textContent=`Variante ${i+1}`)}

function valuesFrom(el,attr,fields){
  const out={};(fields||[]).filter(f=>f.activo!==false).forEach(f=>{const input=el.querySelector(`[${attr}="${CSS.escape(f.clave)}"]`);out[f.clave]=input?String(input.value||'').trim():''});return out;
}
function collectBusiness(){const out={};(FORM_SCHEMA.camposNegocio||[]).filter(f=>f.activo!==false).forEach(f=>{if(f.clave==='materialsNotes')return;const el=form.querySelector(`[data-business="${CSS.escape(f.clave)}"]`);out[f.clave]=el?String(el.value||'').trim():''});out.materialsNotes=String(form.elements.materialsNotes?.value||'').trim();return out;}
function collectShopifyGlobal(){const out={};(FORM_SCHEMA.camposShopifyGlobal||[]).filter(f=>f.activo!==false).forEach(f=>{const el=form.querySelector(`[data-shopify-global="${CSS.escape(f.clave)}"]`);out[f.clave]=el?String(el.value||'').trim():''});return out;}
function collectVariants(product){return $$('.variant-list > .variant-card',product).map((v,i)=>({Orden:i+1,...valuesFrom(v,'data-variant',FORM_SCHEMA.camposVarianteShopify)}));}
function collectProduct(product,order){
  const base={Orden:order,...valuesFrom(product,'data-product',FORM_SCHEMA.camposProducto)};
  base.variantsGeneral=base.variants||'';
  if(form.elements.catalogType.value==='shopify'){
    Object.assign(base,valuesFrom(product,'data-shopify-product',FORM_SCHEMA.camposShopifyProducto));
    base.handle=base.handle||slug(base.name);
    base.variants=collectVariants(product);
  }else base.variants=[];
  return base;
}
function collectCatalog(){
  return $$('#catalogBuilder > .category-card').map((cat,ci)=>{
    const category=valuesFrom(cat,'data-category',FORM_SCHEMA.camposCategoria),mode=$('input[type="radio"]:checked',cat)?.value||'direct';
    const result={Orden:ci+1,...category,mode,directProducts:[],subcategories:[]};
    if(mode==='direct')result.directProducts=$$('.direct-products > .product-card',cat).map((p,pi)=>collectProduct(p,pi+1)).filter(x=>x.name||x.description);
    else result.subcategories=$$('.subcategories > .subcategory-card',cat).map((sub,si)=>({Orden:si+1,...valuesFrom(sub,'data-subcategory',FORM_SCHEMA.camposSubcategoria),products:$$('.products-list > .product-card',sub).map((p,pi)=>collectProduct(p,pi+1)).filter(x=>x.name||x.description)}));
    return result;
  }).filter(x=>x.name||x.directProducts.length||x.subcategories.length);
}
function flattenProducts(categories){const rows=[];(categories||[]).forEach(c=>{if(c.mode==='direct'){(c.directProducts||[]).forEach(p=>rows.push({category:c.name||'',subcategory:'',...p}))}else{(c.subcategories||[]).forEach(s=>(s.products||[]).forEach(p=>rows.push({category:c.name||'',subcategory:s.name||'',...p})))}});return rows;}

function validateStep2(){
  let ok=true;
  const isShopify=form.elements.catalogType.value==='shopify';
  $$('[data-step="2"] [required]').forEach(el=>{
    if(el.closest('.hidden'))return;
    if(el.closest('.shopify-block')&&!isShopify)return;
    el.classList.remove('error');
    if(!String(el.value||'').trim()){el.classList.add('error');ok=false;}
  });
  const cats=collectCatalog();
  if(!cats.length){alert('Completa al menos una categoría.');return false;}
  for(const c of cats){
    if(!c.name){alert('Cada categoría necesita un nombre.');ok=false;break;}
    if(c.mode==='direct'&&!c.directProducts.length){alert(`La categoría “${c.name}” necesita al menos un producto.`);ok=false;break;}
    if(c.mode==='subcategories'){
      if(!c.subcategories.length){alert(`La categoría “${c.name}” necesita al menos una subcategoría.`);ok=false;break;}
      if(c.subcategories.some(s=>!s.name||!s.products.length)){alert(`Cada subcategoría de “${c.name}” necesita nombre y al menos un producto.`);ok=false;break;}
    }
  }
  if(isShopify){
    const products=flattenProducts(cats);
    for(const p of products){
      if(!p.variants?.length){alert(`El producto “${p.name}” necesita al menos una variante o variante por defecto.`);ok=false;break;}
      for(const v of p.variants){
        const dims=[v.packedLength,v.packedWidth,v.packedHeight,v.packedDimensionUnit].filter(Boolean).length;
        if(dims>0&&dims<4){alert(`En “${p.name}” debes completar las cuatro columnas de dimensiones empacadas o dejarlas todas vacías.`);ok=false;break;}
        if(v.option2Name&&!v.option2Value||v.option2Value&&!v.option2Name||v.option3Name&&!v.option3Value||v.option3Value&&!v.option3Name){alert(`Revisa nombres y valores de opciones en “${p.name}”. Cada opción usada necesita nombre y valor.`);ok=false;break;}
      }
      if(!ok)break;
    }
  }
  if(!ok)alert('Revisa los campos obligatorios o las reglas indicadas.');
  return ok;
}

function collectData(){
  if(!projectCode)projectCode=`ESG-CAT-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const catalogType=form.elements.catalogType.value;
  return{
    projectCode,
    submittedAt:new Date().toISOString(),
    catalogType,
    catalogTypeName:CATALOG_TYPES[catalogType]?.nombre||catalogType,
    business:collectBusiness(),
    shopify:catalogType==='shopify'?collectShopifyGlobal():{},
    categories:collectCatalog(),
    materials:new FormData(form).getAll('materialChecklist')
  };
}
function countProducts(data){return flattenProducts(data.categories).length}
function countVariants(data){return flattenProducts(data.categories).reduce((n,p)=>n+(p.variants?.length||0),0)}
function renderFinal(){
  const d=collectData(),products=countProducts(d),variants=countVariants(d);
  $('#finalSummary').innerHTML=`<div class="summary-row"><span>Responsable</span><strong>${esc(d.business.clientName)}</strong></div><div class="summary-row"><span>Negocio</span><strong>${esc(d.business.businessName)}</strong></div><div class="summary-row"><span>Destino</span><strong>${esc(d.catalogTypeName)}</strong></div><div class="summary-row"><span>Categorías</span><strong>${d.categories.length}</strong></div><div class="summary-row"><span>Productos</span><strong>${products}</strong></div>${d.catalogType==='shopify'?`<div class="summary-row"><span>Variantes Shopify</span><strong>${variants}</strong></div>`:''}<div class="summary-row summary-total"><span>Archivo final</span><strong>Excel maestro</strong></div>`;
}
function filterCatalog(){
  const q=$('#catalogSearch').value.trim().toLowerCase();
  $$('.category-card').forEach(cat=>{
    let categoryMatch=(cat.querySelector('[data-category="name"]')?.value||'').toLowerCase().includes(q);
    let any=false;
    $$('.product-card',cat).forEach(p=>{
      const text=[p.querySelector('[data-product="name"]')?.value,p.querySelector('[data-product="code"]')?.value,p.querySelector('[data-product="description"]')?.value].join(' ').toLowerCase();
      const match=!q||categoryMatch||text.includes(q);p.classList.toggle('filtered-out',!match);if(match)any=true;
    });
    cat.classList.toggle('filtered-out',!!q&&!categoryMatch&&!any);
  });
}

function prepareSubmit(e){
  e.preventDefault();
  if(!$('#dataConsent').checked)return alert('Confirma la autorización para continuar.');
  pendingData=collectData();
  $('#downloadModal').classList.remove('hidden');document.body.classList.add('modal-open');$('#confirmDownload').focus();
}
function closeModal(){$('#downloadModal').classList.add('hidden');document.body.classList.remove('modal-open');}
function finishSubmit(){
  if(!pendingData)return;const data=pendingData;closeModal();const btn=$('#submitBtn');btn.disabled=true;btn.textContent='Generando Excel maestro...';
  downloadWorkbook(data);
  const products=countProducts(data),variants=countVariants(data);
  const text=`Hola, ESG Experience.\n\nCompleté el formulario de catálogo.\n\nCódigo: ${data.projectCode}\nCliente: ${data.business.clientName}\nNegocio: ${data.business.businessName}\nDestino: ${data.catalogTypeName}\nCategorías: ${data.categories.length}\nProductos: ${products}${data.catalogType==='shopify'?`\nVariantes Shopify: ${variants}`:''}\n\nAdjunto en este chat:\n1. Excel maestro descargado.\n2. Fotos originales de productos con los nombres indicados.\n3. Logo y material de marca disponible.\n4. Lista de precios, políticas, inventario u otros documentos aplicables.\n\nPor favor, revisen el Excel y los archivos para continuar con la preparación del catálogo.`;
  const url=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url,'_blank','noopener,noreferrer')||(location.href=url);
  $('#submitMessage').className='notice success-message';$('#submitMessage').innerHTML=`<strong>Excel maestro descargado.</strong><br>Adjúntalo por WhatsApp junto con las fotos y materiales. Código: <strong>${esc(data.projectCode)}</strong> · ${esc(WHATSAPP_DISPLAY)}`;
  btn.disabled=false;btn.textContent='Abrir WhatsApp otra vez';btn.onclick=()=>window.open(url,'_blank','noopener,noreferrer');
}

init();
