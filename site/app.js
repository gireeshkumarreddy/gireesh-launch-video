(() => {
  'use strict';
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = t => 1 - Math.pow(1 - clamp(t), 3);
  let paused = reduced.matches;
  try { paused ||= localStorage.getItem('gireesh-motion-paused') === 'true'; } catch {}
  body.classList.add('js-ready');
  const motionButton = document.querySelector('.motion-toggle');
  const props = [...document.querySelectorAll('.prop')];
  const revealElements = [...document.querySelectorAll('.reveal')];
  const sequence = document.querySelector('.process-sequence');
  const sheets = [...document.querySelectorAll('.process-sheet')];
  const stage = document.querySelector('.process-stage');
  let timelineProgress = 0;
  let frame = 0;
  let layout = { reveals: [], top: 0, height: 1, stageWidth: 500, stageHeight: 500 };
  const baseTop = element => {
    let top = 0;
    for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  };
  function measure() {
    layout.reveals = revealElements.filter(el => !el.classList.contains('is-visible')).map(el => ({ el, top: baseTop(el) }));
    if (sequence) {
      layout.top = baseTop(sequence);
      layout.height = Math.max(1, sequence.offsetHeight - innerHeight + innerHeight * .25);
      layout.stageWidth = stage.clientWidth;
      layout.stageHeight = stage.clientHeight;
    }
    schedule();
  }
  function updateMotion() {
    body.classList.toggle('motion-paused', paused);
    motionButton?.setAttribute('aria-pressed', String(paused));
    motionButton?.setAttribute('aria-label', paused ? 'Enable animations' : 'Pause animations');
    if (motionButton) {
      motionButton.querySelector('.pause-icon').textContent = paused ? '▷' : 'Ⅱ';
      motionButton.querySelector('.motion-label').textContent = paused ? 'Motion off' : 'Motion on';
    }
    if (paused) {
      revealElements.forEach(el => el.classList.add('is-visible'));
      props.forEach(el => el.classList.add('motion-arrived'));
      sheets.forEach(el => el.removeAttribute('aria-hidden'));
    }
    requestAnimationFrame(measure);
  }
  motionButton?.addEventListener('click', () => {
    paused = !paused; updateMotion();
    try { localStorage.setItem('gireesh-motion-paused', String(paused)); } catch {}
  });
  reduced.addEventListener('change', e => { paused = e.matches; updateMotion(); });
  setTimeout(() => body.classList.add('intro-dismissed'), 1800);

  // Observe each object's stationary position, while its inner layer begins beyond the viewport.
  const propObserver = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    target.classList.add('motion-arrived');
    propObserver.unobserve(target);
  }), { threshold: .05, rootMargin: '0px 0px -30px 0px' });
  props.forEach((el, index) => {
    const image = el.querySelector('img');
    image.width ||= 512; image.height ||= 512;
    const layer = document.createElement('span'); layer.className = 'prop-motion';
    el.append(layer); layer.append(image);
    const fromLeft = /folder|glasses|ball/.test(el.className) && !el.classList.contains('contact-ball');
    layer.style.setProperty('--entry-x', fromLeft ? '-115vw' : '115vw');
    layer.style.setProperty('--entry-y', /scissors/.test(el.className) ? '-35vh' : '25vh');
    layer.style.setProperty('--entry-r', fromLeft ? '-85deg' : '95deg');
    const isHero = el.closest('.hero');
    layer.style.setProperty('--entry-delay', isHero ? `${2.1 + index * .2}s` : `${(index % 3) * .12}s`);
    el.dataset.motionReady = '';
    propObserver.observe(el);
    if (paused) el.classList.add('motion-arrived');
  });

  function renderSequence(progress) {
    if (!sequence || paused) return;
    const w = Math.max(innerWidth, layout.stageWidth);
    const h = Math.max(innerHeight, layout.stageHeight);
    const a = ease(progress / .18);
    const b = ease((progress - .28) / .21);
    const c = ease((progress - .62) / .21);
    const poses = [
      { x: -(1-a)*w*1.2 - b*22, y: (1-a)*h*.3 - b*12, r: -58*(1-a)-5-b*3, s: .72+a*.28-b*.045-c*.025, o: clamp(a*6) },
      { x: (1-b)*w*1.2 + c*18, y: (1-b)*h*.24-c*7, r: 65*(1-b)+3+c*3, s: .72+b*.28-c*.035, o: clamp(b*6) },
      { x: (1-c)*w*.5, y: (1-c)*h*1.2, r: -38*(1-c)-2, s: .65+c*.35, o: clamp(c*6) }
    ];
    const active = progress < .37 ? 0 : progress < .72 ? 1 : 2;
    sheets.forEach((el, i) => {
      const p = poses[i];
      el.style.transform = `translate3d(${p.x}px,${p.y}px,0) rotate(${p.r}deg) scale(${p.s})`;
      el.style.opacity = p.o;
      el.setAttribute('aria-hidden', String(i !== active));
    });
    const scissors = document.querySelector('.process-scissors');
    const pencil = document.querySelector('.process-pencil');
    const sc = ease((progress-.08)/.2);
    const pe = ease((progress-.37)/.2);
    scissors.style.transform = `translate3d(${(1-sc)*w}px,${-(1-sc)*h*.5}px,0) rotate(${100*(1-sc)-15+progress*18}deg)`;
    scissors.style.opacity = clamp(sc*5);
    pencil.style.transform = `translate3d(${-(1-pe)*w}px,${(1-pe)*h*.45}px,0) rotate(${-80*(1-pe)+12-progress*15}deg)`;
    pencil.style.opacity = clamp(pe*5);
    sequence.querySelector('.process-progress i').style.transform = `scaleX(${progress})`;
    sequence.querySelector('.process-counter').textContent = `0${active+1} / 03`;
    sequence.querySelector('.process-caption').textContent = ['Find the real question.', 'Make the idea tangible.', 'Make every detail count.'][active];
  }
  function tick() {
    frame = 0;
    const y = scrollY;
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    document.documentElement.style.setProperty('--progress', clamp(y/total));
    for (const item of layout.reveals) {
      if (item.top < y + innerHeight * .92) item.el.classList.add('is-visible');
    }
    layout.reveals = layout.reveals.filter(item => !item.el.classList.contains('is-visible'));
    if (sequence && !paused) {
      const target = clamp((y - layout.top + innerHeight * .25) / layout.height);
      timelineProgress += (target-timelineProgress)*.14;
      if (Math.abs(target-timelineProgress)<.0005) timelineProgress=target;
      renderSequence(timelineProgress);
      if (timelineProgress !== target) schedule();
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(tick); }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', measure, {passive:true});
  addEventListener('load', measure, {once:true});
  document.fonts?.ready.then(measure);
  updateMotion();
  measure();

  let pointerX=0,pointerY=0,currentX=0,currentY=0,pointerFrame=0;
  function parallax() {
    currentX += (pointerX-currentX)*.065; currentY += (pointerY-currentY)*.065;
    props.forEach(el => {
      const depth=Number(el.dataset.depth)||15;
      el.style.setProperty('--px', `${currentX*depth}px`); el.style.setProperty('--py', `${currentY*depth}px`);
    });
    if (Math.abs(pointerX-currentX)+Math.abs(pointerY-currentY)>.002&&!paused) pointerFrame=requestAnimationFrame(parallax);
    else pointerFrame=0;
  }
  addEventListener('pointermove',e=>{
    if(paused||!finePointer.matches||e.pointerType==='touch')return;
    pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5;
    if(!pointerFrame)pointerFrame=requestAnimationFrame(parallax);
  },{passive:true});
  props.forEach(el=>{
    let dragging=false,startX=0,startY=0,dx=0,dy=0;
    el.addEventListener('pointerdown',e=>{
      if(!finePointer.matches||e.button!==0)return;
      dragging=true;startX=e.clientX-dx;startY=e.clientY-dy;el.classList.add('dragging');el.setPointerCapture(e.pointerId);e.preventDefault();
    });
    el.addEventListener('pointermove',e=>{
      if(!dragging)return;
      dx=clamp(e.clientX-startX,-150,150);dy=clamp(e.clientY-startY,-150,150);
      el.style.setProperty('--dx',`${dx}px`);el.style.setProperty('--dy',`${dy}px`);
    });
    const finish=()=>{dragging=false;el.classList.remove('dragging');};
    el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish);
  });
  document.querySelectorAll('[data-tilt]').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      if(paused||!finePointer.matches||e.pointerType==='touch')return;
      const r=card.getBoundingClientRect(),x=((e.clientX-r.left)/r.width-.5)*5,y=((e.clientY-r.top)/r.height-.5)*-5;
      card.style.transform=`perspective(900px) rotate(var(--card-rotation)) rotateX(${y}deg) rotateY(${x}deg) translateY(-5px)`;
    });
    card.addEventListener('pointerleave',()=>{card.style.transform='';});
  });

  const tabs=[...document.querySelectorAll('[role="tab"]')];
  function activateTab(tab){tabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;});measure();}
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activateTab(tab));
    tab.addEventListener('keydown',e=>{
      let next=index;
      if(e.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(e.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
      else if(e.key==='Home')next=0;
      else if(e.key==='End')next=tabs.length-1;
      else return;
      e.preventDefault();activateTab(tabs[next]);tabs[next].focus();
    });
  });

  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    const filter=button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelectorAll('.archive-grid .project-card').forEach(card=>{card.hidden=filter!=='all'&&!card.dataset.categories.split(' ').includes(filter);});
    const note=document.querySelector('.archive-note');if(note)note.hidden=filter!=='all';
    const result=document.querySelector('.filter-result');if(result)result.textContent=`${document.querySelectorAll('.archive-grid .project-card:not([hidden])').length} projects shown`;
    requestAnimationFrame(measure);
  }));
  let remix=0;
  document.getElementById('remix-type')?.addEventListener('click',()=>{
    remix++;
    document.querySelectorAll('.type-toy>span').forEach((letter,i)=>{
      const reset=remix%3===0;
      letter.style.setProperty('--letter-r',reset?'0deg':`${Math.sin(i*2.4+remix)*19}deg`);
      letter.style.setProperty('--letter-x',reset?'0px':`${Math.cos(i+remix)*6}px`);
      letter.style.setProperty('--letter-y',reset?'0px':`${Math.sin(i*1.3+remix)*14}px`);
      letter.style.color=reset?'':i%2?'#8b314e':'#343a74';
    });
  });
  const palettes={pink:['#e8a4bb','#164e38'],blue:['#214be5','#e0f486'],yellow:['#efd881','#631f37'],purple:['#b9a2e0','#3e245e']};
  document.querySelectorAll('[data-palette]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const poster=document.querySelector('.palette-poster');const [bg,color]=palettes[button.dataset.palette];poster.style.background=bg;poster.style.color=color;
  }));
})();
