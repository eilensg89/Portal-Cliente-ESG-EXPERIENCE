const [cfgResponse, formResponse] = await Promise.all([
  fetch('./data/esg-config.json', {cache:'no-store'}),
  fetch('./data/formulario.json', {cache:'no-store'})
]);
if (!cfgResponse.ok || !formResponse.ok) throw new Error('No se pudo cargar la configuración del formulario.');
export const SYSTEM_CONFIG = await cfgResponse.json();
export const FORM_SCHEMA = await formResponse.json();
export const CATALOG_TYPES = SYSTEM_CONFIG.catalogo.tipos;
export const WHATSAPP_NUMBER = SYSTEM_CONFIG.whatsapp.numero;
export const WHATSAPP_DISPLAY = SYSTEM_CONFIG.whatsapp.visible;
