const [cfgResponse, formResponse] = await Promise.all([
  fetch('./data/esg-config.json', {cache:'no-store'}),
  fetch('./data/formulario.json', {cache:'no-store'})
]);
if (!cfgResponse.ok || !formResponse.ok) throw new Error('No se pudo cargar la configuración maestra.');
export const SYSTEM_CONFIG = await cfgResponse.json();
export const FORM_SCHEMA = await formResponse.json();
export const MODULES = SYSTEM_CONFIG.modulos.map(m=>({id:m.id,name:m.nombre,price:Number(m.precio)||0,description:m.descripcion||''}));
export const PROJECTS = Object.fromEntries(Object.entries(SYSTEM_CONFIG.proyectos).map(([id,p])=>[id,{name:p.nombre,price:Number(p.precio)||0,description:p.descripcion||''}]));
export const WHATSAPP_NUMBER = SYSTEM_CONFIG.whatsapp.numero;
export const WHATSAPP_DISPLAY = SYSTEM_CONFIG.whatsapp.visible;
export const WEBCARE_PRICE = Number(SYSTEM_CONFIG.webcare.precioMensual)||0;
export const CATALOG_REFERENCE = SYSTEM_CONFIG.catalogo;
