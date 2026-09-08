(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const reveal=[...document.querySelectorAll('.band .section-title,.band .lead,.band .card,.spotlight,.facts')];
 if('IntersectionObserver' in window){
  document.documentElement.classList.add('motion-ready');
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.08});
  reveal.forEach(el=>{el.classList.add('reveal');observer.observe(el);});
 }
 const progress=document.createElement('div');progress.className='scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 const screen=document.querySelector('.screen-window'), story=document.querySelector('.product-story'),visual=document.querySelector('.story-visual');
 const buttons=[...document.querySelectorAll('.story-tab')],frames=[...document.querySelectorAll('[data-story-frame]')];
 const title=document.getElementById('story-title'),copy=document.getElementById('story-copy'),count=document.getElementById('story-count');
 const slides=[['O próximo contato. A próxima venda.','O Vende+ cruza o gosto de cada cliente com seu estoque. Você sabe quem chamar, qual peça oferecer e por quê.'],['Do atendimento à venda. Sem desvios.','PDV com grade de tamanhos, estoque e financeiro conectados. Cada venda mantém a operação em dia.'],['A conversa certa. Na hora certa.','Transforme uma oportunidade em uma mensagem pronta para o WhatsApp. Com contexto para um atendimento mais próximo.']];
 let current=-1,lastScrollIndex=-1,ticking=false;
 function show(i){if(i===current)return;current=i;buttons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));frames.forEach((f,n)=>f.hidden=n!==i);if(title){title.textContent=slides[i][0];copy.textContent=slides[i][1];count.textContent=`0${i+1} / 03 — VENDE+ EM DETALHE`;}}
 buttons.forEach((b,i)=>b.addEventListener('click',()=>show(i)));if(buttons.length)show(0);
 function update(){ticking=false;const y=window.scrollY,max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?y/max:0})`;
  if(!reduced.matches){if(screen)screen.style.transform=`rotateX(${Math.max(0,9-y*.025)}deg) scale(${1+Math.min(y/800,.08)})`;
   if(story&&innerWidth>600){const r=story.getBoundingClientRect();const p=Math.min(1,Math.max(0,(76-r.top)/(story.offsetHeight-innerHeight+76)));const i=Math.min(2,Math.floor(p*3));if(i!==lastScrollIndex){show(i);lastScrollIndex=i;}visual.style.transform=`translateX(${4-p*4}%) scale(${.95+p*.05})`;}}
 }
 addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true;}},{passive:true});addEventListener('resize',update);reduced.addEventListener('change',update);update();
 const menu=document.getElementById('menu-btn'),nav=document.getElementById('nav-mob');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav){nav.classList.remove('aberta');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');menu.focus();}});
})();
