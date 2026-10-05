/* Shared behaviors restored for the supplied static pages. No analytics loaded. */
(() => {
 const form=document.getElementById('form-lead');
 if(form)form.addEventListener('submit',event=>{
  event.preventDefault();if(event.defaultPrevented&&form.querySelector('[aria-invalid="true"]'))return;
  if(!form.reportValidity())return;
  const labels={nome:'Nome',empresa:'Empresa',loja:'Loja',whatsapp:'WhatsApp',email:'E-mail',cidade:'Cidade',assunto:'Assunto',mensagem:'Mensagem',segmento:'Segmento'};
  const lines=[form.dataset.msg||'Olá! Quero saber mais.',`Origem: ${form.dataset.msOrigem||'site'}`];
  for(const [key,value] of new FormData(form)){if(value&&key!=='aceite')lines.push(`${labels[key]||key}: ${value}`);}
  if(form.elements.aceite?.checked)lines.push('Quero receber conteúdo por e-mail.');
  const url='https://wa.me/5561999032545?text='+encodeURIComponent(lines.join('\n'));
  window.location.assign(url);
 });
 document.querySelectorAll('a[data-zap]').forEach(a=>{const url=new URL(a.href,location.href);let message=a.dataset.zap||url.searchParams.get('text')||'Olá! Quero conhecer o Vende+.';if(a.dataset.msOrigem&&!message.includes('Origem:'))message+='\nOrigem: '+a.dataset.msOrigem;a.href='https://wa.me/5561999032545?text='+encodeURIComponent(message);});
 // No analytics are loaded. Only persist acknowledgment of the truthful notice.
 document.querySelectorAll('.lgpd').forEach(el=>{if(!document.body.classList.contains('vende-premium')){el.remove();return;}try{if(localStorage.getItem('ms-privacy-notice')==='acknowledged')el.hidden=true;}catch{}el.querySelector('[data-lgpd-ok]')?.addEventListener('click',()=>{el.hidden=true;try{localStorage.setItem('ms-privacy-notice','acknowledged');}catch{}});});
 document.querySelectorAll('[data-instagram][href="#"]').forEach(el=>el.closest('li')?.remove());
})();
