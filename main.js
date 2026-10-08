'use strict';
// One-shot motion leaves content visible if scripting or animation fails.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const activeMotion = new Set();
function playEntrance(element, delay = 0) {
  if (motionPreference.matches || !element.animate) return;
  const animation = element.animate([
    {opacity: 0, transform: 'translateY(14px)'},
    {opacity: 1, transform: 'translateY(0)'}
  ], {duration: 600, delay, easing: 'cubic-bezier(.16,1,.3,1)'});
  activeMotion.add(animation);
  animation.finished.then(() => activeMotion.delete(animation)).catch(() => activeMotion.delete(animation));
}
document.querySelectorAll('.hero-emblem, .hero-main > h1, .hero-main > h2, .hero-intro, .hero-main > .actions, .hero-main > .availability, .hero-stats').forEach((element, index) => playEntrance(element, index * 100));
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playEntrance(entry.target);
        reveal.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08});
  document.querySelectorAll('.project, .service-card').forEach(element => reveal.observe(element));
}
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) activeMotion.forEach(animation => animation.cancel());
});
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.project, .service-card').forEach(element => {
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    element.addEventListener('pointermove', event => {
      if (motionPreference.matches) return;
      const rect = element.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      if (!frame) frame = requestAnimationFrame(() => {
        element.style.setProperty('--glow-x', `${pointerX}px`);
        element.style.setProperty('--glow-y', `${pointerY}px`);
        frame = 0;
      });
    });
    element.addEventListener('pointerleave', () => {cancelAnimationFrame(frame); frame = 0;});
  });
}
const arabic = document.documentElement.lang === 'ar';
const serviceTabs = [...document.querySelectorAll('[data-service-tab]')];
const serviceResults = document.querySelector('#service-results');
function selectServiceTab(category, navigate = false, focus = false) {
  const selected = serviceTabs.find(tab => tab.dataset.serviceTab === category) || serviceTabs[0];
  if (!selected) return;
  category = selected.dataset.serviceTab;
  let count = 0;
  serviceResults.querySelectorAll('[data-service-group]').forEach(card => {
    card.hidden = category !== 'all' && card.dataset.serviceGroup !== category;
    if (!card.hidden) count++;
  });
  serviceTabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  serviceResults.setAttribute('aria-labelledby', selected.id);
  document.querySelector('#service-count').textContent = arabic ? `${count} خدمة` : `${count} services`;
  if (navigate) history.pushState(null, '', category === 'all' ? location.pathname + location.search : '#' + category);
  document.querySelector('a.language').hash = category === 'all' ? '' : category;
  if (focus) selected.focus({preventScroll: true});
  const strip = selected.parentElement;
  const bounds = strip.getBoundingClientRect();
  const tabBounds = selected.getBoundingClientRect();
  const offset = tabBounds.left < bounds.left ? tabBounds.left - bounds.left : tabBounds.right > bounds.right ? tabBounds.right - bounds.right : 0;
  strip.scrollBy({left: offset, behavior: 'instant'});
}
serviceTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectServiceTab(tab.dataset.serviceTab, true));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = serviceTabs.length - 1;
    if (event.key === 'ArrowRight') next = (index + (arabic ? -1 : 1) + serviceTabs.length) % serviceTabs.length;
    if (event.key === 'ArrowLeft') next = (index + (arabic ? 1 : -1) + serviceTabs.length) % serviceTabs.length;
    if (next === undefined) return;
    event.preventDefault();
    selectServiceTab(serviceTabs[next].dataset.serviceTab, true, true);
  });
});
if (serviceTabs.length) {
  const syncServiceTab = () => selectServiceTab(location.hash.slice(1));
  syncServiceTab();
  window.addEventListener('popstate', syncServiceTab);
  window.addEventListener('hashchange', syncServiceTab);
}
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
const mobileNavigation = matchMedia('(max-width: 760px)');
const menuBackground = [...document.querySelectorAll('main, footer, .whatsapp, .site-header')];
const headerInner = document.querySelector('.header-inner');
const menuOverlay = document.createElement('div');
menuOverlay.className = 'mobile-menu-panel';
menuOverlay.id = 'mobile-menu-panel';
menuOverlay.setAttribute('role','dialog');
menuOverlay.setAttribute('aria-modal','true');
menuOverlay.setAttribute('aria-label',arabic?'القائمة الرئيسية':'Main navigation');
menuOverlay.inert = true;
const menuTop = document.createElement('div');
menuTop.className = 'mobile-menu-top';
const menuBrand = document.querySelector('.site-header .brand')?.cloneNode(true);
if(menuBrand) menuTop.append(menuBrand);
const menuClose = document.createElement('button');
menuClose.className='menu-close';
menuClose.innerHTML=`${arabic?'إغلاق':'Close'} <span class="close-icon" aria-hidden="true"></span>`;
menuTop.append(menuClose);menuOverlay.append(menuTop);
const menuQuote = document.createElement('a');
menuQuote.className = 'button mobile-menu-quote';
menuQuote.href = document.querySelector('.site-header a[href$="services/index.html"]')?.href || 'services/index.html';
menuQuote.textContent = arabic ? 'اطلب عرض سعر' : 'Get a quote';
menuOverlay.append(menuQuote);document.body.append(menuOverlay);
let menuSequence=0;
let menuCleanup;
function setMenu(open, restoreFocus=false) {
  if(!toggle||!nav)return;
  open = open && mobileNavigation.matches;
  ++menuSequence;clearTimeout(menuCleanup);
  toggle.setAttribute('aria-expanded',String(open));
  menuOverlay.classList.toggle('is-open',open);
  menuOverlay.inert=!open;
  if(open) {
    document.body.classList.add('menu-is-open');
    menuBackground.forEach(el=>el.inert=true);
    menuClose.focus({preventScroll:true});
  } else {
    // Keep the page still while the panel quietly fades out.
    menuCleanup=setTimeout(()=>{
      document.body.classList.remove('menu-is-open');
      menuBackground.forEach(el=>el.inert=false);
      if(restoreFocus)toggle.focus({preventScroll:true});
    },motionPreference.matches?0:320);
  }
}
function placeNavigation(){
  setMenu(false);
  if(mobileNavigation.matches){menuOverlay.insertBefore(nav,menuQuote);toggle.setAttribute('aria-controls','mobile-menu-panel');}
  else{headerInner.append(nav);toggle.setAttribute('aria-controls','navigation');}
}
toggle?.addEventListener('click',()=>setMenu(true));
menuClose.addEventListener('click',()=>setMenu(false,true));
nav?.addEventListener('click',event=>{
  const link=event.target.closest('a');
  if(!link||!mobileNavigation.matches)return;
  const destination=new URL(link.href);
  if(destination.pathname===location.pathname && destination.hash){
    event.preventDefault();setMenu(false);
    setTimeout(()=>{
      history.pushState(null,'',destination.hash);
      document.querySelector(destination.hash)?.scrollIntoView({behavior:motionPreference.matches?'instant':'smooth'});
    },motionPreference.matches?0:330);
  }else setMenu(false);
});
mobileNavigation.addEventListener('change',placeNavigation);
placeNavigation();
document.addEventListener('keydown',event=>{
  if(!menuOverlay.classList.contains('is-open'))return;
  if(event.key==='Escape'){event.preventDefault();setMenu(false,true);}
  if(event.key==='Tab'){
    const items=[...menuOverlay.querySelectorAll('a,button')];
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
const filterButtons = document.querySelectorAll('[data-filter]');
const projectItems = document.querySelectorAll('.filter-project');
const projectCount = document.querySelector('#project-count');
function filterProjects(category) {
  let count = 0;
  projectItems.forEach(item => {
    item.hidden = category !== 'all' && !item.dataset.category.split(/\s+/).includes(category);
    if (!item.hidden) count++;
  });
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  if (projectCount) projectCount.textContent = arabic ? `${count} مشروع` : `${count} projects`;
}
filterButtons.forEach(button => button.addEventListener('click', () => filterProjects(button.dataset.filter)));
if (projectItems.length) filterProjects('all');
const form = document.querySelector('#contact-form');
function showFormResult(success, message) {
  const inlineStatus=document.querySelector('#form-status');if(inlineStatus)inlineStatus.hidden=true;
  let popup=document.querySelector('#form-result-dialog');
  if(!popup){
    popup=document.createElement('dialog');popup.id='form-result-dialog';popup.className='form-result-dialog';
    popup.setAttribute('aria-labelledby','form-result-title');popup.setAttribute('aria-describedby','form-result-message');
    popup.innerHTML='<div class="result-icon" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27"/><path class="result-check" d="m19 32 9 9 18-19"/><path class="result-error" d="m23 23 18 18m0-18-18 18"/></svg></div><h2 id="form-result-title"></h2><p id="form-result-message"></p><button class="button" type="button"></button>';
    document.body.append(popup);
    popup.querySelector('button').addEventListener('click',()=>popup.close());
    popup.addEventListener('click',event=>{if(event.target===popup){const r=popup.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)popup.close();}});
    popup.addEventListener('close',()=>{document.body.classList.remove('result-is-open');form?.querySelector('[type=submit]')?.focus({preventScroll:true});});
  }
  popup.dataset.state=success?'success':'error';
  popup.querySelector('h2').textContent=success?(arabic?'تم الإرسال بنجاح':'Sent successfully'):(arabic?'تعذّر الإرسال':'Could not send');
  popup.querySelector('p').textContent=message;
  popup.querySelector('button').textContent=success?(arabic?'تمام':'Done'):(arabic?'العودة والمحاولة مجددًا':'Back to try again');
  document.body.classList.add('result-is-open');popup.showModal();
}
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('[type=submit]');
  const status = document.querySelector('#form-status');
  if (button.disabled) return;
  button.disabled = true;
  status.hidden=false;
  status.textContent = arabic ? 'جارٍ إرسال رسالتك…' : 'Sending your message…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(form.action, {method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'}, signal: controller.signal});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.errors) throw new Error('Submission failed');
    if (!form.dataset.review) window.trackPortfolioEvent?.('generate_lead', {method: 'contact_form'});
    form.reset();
    status.textContent = form.dataset.review
      ? (arabic ? 'شكرًا لتقييمك. تم استلامه للمراجعة وفق تفضيل النشر الذي اخترته.' : 'Thank you. Your review was received for review according to your publication preference.')
      : (arabic ? 'تم استلام رسالتك بنجاح. سأرد عليك في أقرب وقت.' : 'Your message was received successfully. I’ll reply as soon as I can.');
    showFormResult(true,status.textContent);
  } catch (error) {
    status.textContent = arabic ? 'تعذّر إرسال الرسالة. جرّب مرة أخرى أو تواصل عبر واتساب أو البريد الإلكتروني.' : 'Your message could not be sent. Please try again, or contact me by WhatsApp or email.';
    showFormResult(false,status.textContent);
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
  }
});

const glassHeader = document.querySelector('.site-header');
if (glassHeader && 'IntersectionObserver' in window) {
  const boundary = document.createElement('div');
  boundary.setAttribute('aria-hidden', 'true');
  boundary.style.cssText = 'position:absolute;top:0;width:1px;height:180px;pointer-events:none';
  document.body.prepend(boundary);
  new IntersectionObserver(([entry]) => glassHeader.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(boundary);
}


'use strict';

// Final Matrix background: crisp glyphs everywhere, a few independently paced IN highlights.
const matrixHero = document.querySelector('.home-page .hero');
if (matrixHero) {
  const matrixCanvas = document.createElement('canvas');
  matrixCanvas.className='matrix-canvas';matrixCanvas.setAttribute('aria-hidden','true');
  matrixHero.prepend(matrixCanvas);
  const context=matrixCanvas.getContext('2d');
  if(context){
    let width=0,height=0,clock=0,frame=0,last=0,visible=true;
    const seed=n=>((Math.sin(n*127.1+19.7)*43758.5453)%1+1)%1;
    const glyphs=['{','}','[',']','<','>','/',';','=',':','&','|'];
    function draw(){
      context.clearRect(0,0,width,height);
      context.textAlign='center';context.font='12px monospace';context.shadowBlur=0;
      const spacing=width<600?36:44;
      const columns=Math.ceil(width/spacing);
      for(let col=0;col<columns;col++){
        const x=col*spacing+18;
        const speed=10+seed(col+70)*24;
        const range=height+200;
        const head=(seed(col+20)*range+clock*speed)%range-70;
        for(let n=0;n<8;n++){
          const y=head-n*24;
          if(y<0||y>height)continue;
          context.fillStyle=`rgba(215,237,135,${.035+(1-n/9)*.08})`;
          context.fillText(glyphs[(col*5+n*3)%glyphs.length],x,y);
        }
        if(col%6===2){
          // Independent speed, separate from the column, without flashing.
          const y=(seed(col+130)*range+clock*(19+seed(col+150)*31))%range-70;
          const alpha=.38+Math.sin(clock*.6+col)*.1;
          context.font='600 13px monospace';
          context.fillStyle=`rgba(215,237,135,${alpha})`;
          context.shadowColor='rgba(215,237,135,.55)';context.shadowBlur=8;
          context.fillText('IN',x,y);context.shadowBlur=0;context.font='12px monospace';
        }
      }
    }
    function tick(now){
      if(now-last>=40){clock+=Math.min((now-last)/1000,.1);last=now;draw();}
      frame=requestAnimationFrame(tick);
    }
    function sync(){
      cancelAnimationFrame(frame);last=performance.now();draw();
      if(visible&&!document.hidden&&!motionPreference.matches)frame=requestAnimationFrame(tick);
    }
    function resize(){
      width=matrixHero.clientWidth;height=matrixHero.clientHeight;
      const ratio=Math.min(devicePixelRatio||1,2);
      matrixCanvas.width=Math.round(width*ratio);matrixCanvas.height=Math.round(height*ratio);
      context.setTransform(ratio,0,0,ratio,0,0);sync();
    }
    new ResizeObserver(resize).observe(matrixHero);
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(matrixHero);
    document.addEventListener('visibilitychange',sync);motionPreference.addEventListener('change',sync);resize();
  }
}
