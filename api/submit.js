import Busboy from 'busboy';
import {Resend} from 'resend';

export const config={api:{bodyParser:false}};
function parse(req){return new Promise((resolve,reject)=>{const bb=Busboy({headers:req.headers,limits:{files:30,fileSize:12*1024*1024,fields:10}});const fields={};const files=[];bb.on('field',(n,v)=>fields[n]=v);bb.on('file',(n,stream,info)=>{const chunks=[];stream.on('data',d=>chunks.push(d));stream.on('limit',()=>reject(new Error(`El archivo ${info.filename} excede el límite permitido.`)));stream.on('end',()=>files.push({field:n,filename:info.filename,mimeType:info.mimeType,buffer:Buffer.concat(chunks)}));});bb.on('error',reject);bb.on('finish',()=>resolve({fields,files}));req.pipe(bb);});}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
  try{
    if(!process.env.RESEND_API_KEY)throw new Error('Falta configurar RESEND_API_KEY en Vercel.');
    const {fields,files}=await parse(req);const data=JSON.parse(fields.data||'{}');
    const maxMb=Number(process.env.MAX_ATTACHMENT_MB||8);const total=files.reduce((s,f)=>s+f.buffer.length,0);if(total>maxMb*1024*1024)throw new Error(`Los adjuntos suman más de ${maxMb} MB. Envía los materiales pesados como documento por correo o WhatsApp.`);
    const resend=new Resend(process.env.RESEND_API_KEY);const to=process.env.TO_EMAIL||'info@reeymultiservices.com';const from=process.env.FROM_EMAIL||'ESG Experience <onboarding@resend.dev>';
    const q=data.quote||{},b=data.business||{};
    const html=`<div style="font-family:Arial,sans-serif;color:#17120f"><h1>Nuevo proyecto ESG Experience</h1><p><b>Código:</b> ${esc(data.projectCode)}</p><p><b>Cliente:</b> ${esc(b.clientName)}<br><b>Negocio:</b> ${esc(b.businessName)}<br><b>Correo:</b> ${esc(b.clientEmail)}<br><b>WhatsApp:</b> ${esc(b.clientPhone)}</p><h2>Cotización</h2><p><b>Proyecto:</b> ${esc(q.projectName)}<br><b>Total inicial estimado:</b> $${esc(q.initialTotal)}<br><b>WebCare:</b> ${q.webcare?'$25/mes':'No'}<br><b>Revisión personalizada:</b> ${q.requiresReview?'Sí':'No'}</p><p><b>Módulos:</b> ${(q.modules||[]).map(m=>esc(m.name)).join(', ')||'Ninguno'}</p><h2>Información</h2><p>${esc(b.businessDescription).replace(/\n/g,'<br>')}</p><p><b>Objetivo:</b> ${esc(b.websiteGoal)}</p><p>Se adjunta el Excel maestro y los archivos permitidos por tamaño.</p></div>`;
    const attachments=files.map(f=>({filename:f.filename,content:f.buffer}));
    const result=await resend.emails.send({from,to,replyTo:b.clientEmail||undefined,subject:`[ESG EXPERIENCE] Nueva solicitud — ${b.businessName||data.projectCode}`,html,attachments});
    if(result.error)throw new Error(result.error.message);
    if(b.clientEmail){await resend.emails.send({from,to:b.clientEmail,subject:`ESG Experience recibió tu proyecto — ${data.projectCode}`,html:`<div style="font-family:Arial,sans-serif"><h1>Proyecto recibido</h1><p>Gracias, ${esc(b.clientName)}. Recibimos la información de <b>${esc(b.businessName)}</b>.</p><p><b>Código:</b> ${esc(data.projectCode)}</p><p>La cotización enviada es estimada y será revisada antes de confirmar el precio final.</p><p>ESG Experience<br>info@reeymultiservices.com</p></div>`});}
    return res.status(200).json({ok:true,id:result.data?.id});
  }catch(error){return res.status(400).json({error:error.message||'No se pudo procesar la solicitud.'});}
}
