(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),story=document.querySelector('.v-story'),device=document.querySelector('.v-device');
 const tabs=[...document.querySelectorAll('[data-v-slide]')],frames=[...document.querySelectorAll('[data-v-frame]')];
 const laptopBase=document.querySelector('.v-laptop-base'),phone=document.querySelector('.v-phone'),phoneStage=document.querySelector('.v-phone-stage'),note=document.querySelector('.v-order-note');
 const printStory=document.querySelector('.v-print-story'),feed=document.querySelector('.v-paper-feed'),close=document.querySelector('.v-label-close'),printStatus=document.querySelector('.v-print-status');
 const clamp=v=>Math.max(0,Math.min(1,v));
 const titles=['Tudo começa\ncom uma venda.','Cada item.\nCada detalhe.','A próxima venda\ncomeça no contato.'];
 const copies=['Escolha a peça, confira a cor e o tamanho. PDV e estoque acompanham o mesmo atendimento.','Cor, tamanho, preço e código de barras. Imprima as etiquetas dos itens que você precisa, direto do cadastro.','O histórico encontra o estoque. Você vê quem chamar, o que oferecer e o motivo para retomar a conversa.'];
 let current=-1,last=-1,queued=false;
 function show(i){if(i===current)return;current=i;tabs.forEach((t,n)=>t.setAttribute('aria-pressed',String(n===i)));frames.forEach((f,n)=>f.hidden=n!==i);document.getElementById('v-story-title').innerText=titles[i];document.getElementById('v-story-copy').textContent=copies[i];document.querySelector('.v-step').textContent=`0${i+1} / 03`;}
 tabs.forEach((t,i)=>t.addEventListener('click',()=>{show(i);if(!reduced.matches&&innerWidth>700){const top=story.getBoundingClientRect().top+scrollY;const range=story.offsetHeight-innerHeight+76;scrollTo({top:top-76+range*((i+.2)/3),behavior:'smooth'});}}));show(0);
 function update(){
  queued=false;
  if(reduced.matches){[device,laptopBase,phone,note,feed,close].forEach(el=>el?.style.removeProperty('transform'));close?.style.removeProperty('opacity');if(printStatus)printStatus.textContent='Etiqueta impressa · Visual ampliado';return;}
  const heroProgress=clamp(scrollY/(innerHeight*.85));
  const phoneRect=phoneStage?.getBoundingClientRect();
  const phoneProgress=phoneRect?clamp((innerHeight-phoneRect.top)/(innerHeight+phoneRect.height)):0;
  const printRect=printStory?.getBoundingClientRect();
  const printProgress=printRect?clamp((innerHeight*.3-printRect.top)/(printStory.offsetHeight-innerHeight*.65)):0;
  device.style.transform=`rotateX(${16-heroProgress*22}deg) rotateY(${-13+heroProgress*22}deg) rotateZ(${-2+heroProgress*3}deg) scale(${.93+heroProgress*.07})`;
  if(laptopBase)laptopBase.style.transform=`perspective(1500px) rotateY(${-13+heroProgress*22}deg) rotateZ(${-2+heroProgress*3}deg) scale(${.93+heroProgress*.07})`;
  if(phone)phone.style.transform=`rotateY(${-30+phoneProgress*58}deg) rotateX(${10-phoneProgress*18}deg) rotateZ(${-9+phoneProgress*17}deg) translateY(${25-phoneProgress*50}px)`;
  if(note)note.style.transform=`translateY(${35-phoneProgress*60}px) rotate(${5-phoneProgress*7}deg)`;
  if(feed)feed.style.transform=`translateY(${-103+clamp(printProgress/.65)*96}%)`;
  const zoom=clamp((printProgress-.38)/.42);
  if(close){close.style.opacity=String(zoom);close.style.transform=`translateY(${60-zoom*60}px) rotate(${-12+zoom*15}deg) scale(${.7+zoom*.3})`;}
  if(printStatus)printStatus.textContent=printProgress<.08?'01 / Pronta para imprimir':printProgress<.65?'02 / Imprimindo sua etiqueta':'03 / Cada detalhe, de perto';
  if(innerWidth>700){const p=clamp((76-story.getBoundingClientRect().top)/(story.offsetHeight-innerHeight+76));const i=Math.min(2,Math.floor(p*3));if(i!==last){show(i);last=i;}}
 }
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);reduced.addEventListener('change',update);update();
 if('IntersectionObserver' in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.v-statement,.v-section-head,.v-segment-card,.v-proof-grid,.v-catalog-grid,.v-reconnect-bottom').forEach(el=>{el.classList.add('reveal');observer.observe(el);});}
 function openHash(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const el=document.getElementById(id);if(el?.matches('.v-segment-details details'))el.open=true;}
 document.querySelectorAll('.v-segment-card').forEach(a=>a.addEventListener('click',()=>{const el=document.querySelector(a.getAttribute('href'));if(el)el.open=true;}));addEventListener('hashchange',openHash);openHash();
})();
