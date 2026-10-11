const stage = document.querySelector('.stage');
const track = document.querySelector('.track');
const space = document.getElementById('space');
const index = document.getElementById('index');
const hint = document.getElementById('hint');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function setMode(isIndex) {
 document.body.classList.toggle('index-mode', isIndex);
 space.setAttribute('aria-pressed', String(!isIndex));
 index.setAttribute('aria-pressed', String(isIndex));
 hint.textContent = isIndex ? 'כל הפרויקטים במבט אחד' : matchMedia('(max-width:650px)').matches ? 'החליקו לצדדים כדי לגלות את העבודות' : 'גלגלת לדפדוף · חיצים לשני הכיוונים';
}
space.addEventListener('click', () => setMode(false));
index.addEventListener('click', () => setMode(true));
function reset(){track.style.removeProperty('--yaw');track.style.removeProperty('--pan');stage.scrollTo({left:0});}
stage.addEventListener('pointerleave', reset);
document.getElementById('reset').addEventListener('click',reset);
const dialog = document.getElementById('about-dialog');
document.getElementById('about').addEventListener('click',()=>dialog.showModal());
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
const img=document.querySelector('.c4 img');
img.addEventListener('error',()=>{img.hidden=true;});
setMode(false);
window.addEventListener('resize', () => setMode(document.body.classList.contains('index-mode')));
Object.entries(projectInfo).forEach(([key,data])=>{
 const card=document.querySelector('.'+key);if(!card)return;
 const coverCategory=card.classList.contains('c1')?'פיתוח BLE & App למכשירי שמיעה':data.category;card.title=coverCategory;card.querySelector('.bottom').textContent=coverCategory;
 card.href=projectPaths[key];card.removeAttribute('target');card.removeAttribute('rel');
});
const carouselCards = Array.from(document.querySelectorAll('.track>.card'));
let carouselPosition=0, manualUntil=0;
const controls=document.createElement('div');controls.className='carousel-controls';
controls.innerHTML='<button id="previous-project" aria-label="הפרויקט הקודם">הקודם</button><span id="carousel-count" dir="ltr">01 / 04</span><button id="next-project" aria-label="הפרויקט הבא">הבא</button>';
document.querySelector('footer').prepend(controls);
const sideNav=document.createElement('div');sideNav.className='side-navigation';
sideNav.innerHTML='<button class="gallery-arrow arrow-left" aria-label="דפדוף שמאלה">←</button><button class="gallery-arrow arrow-right" aria-label="דפדוף ימינה">→</button>';stage.append(sideNav);
function browse(step){manualUntil=Date.now()+10000;arrangeCarousel(step);}
sideNav.querySelector('.arrow-left').addEventListener('click',()=>browse(-1));
sideNav.querySelector('.arrow-right').addEventListener('click',()=>browse(1));
function arrangeCarousel(step=0){
 carouselPosition=(carouselPosition+step+carouselCards.length)%carouselCards.length;
 const indexed=document.body.classList.contains('index-mode');
 const reachable=innerWidth<=650?1:Math.max(1,Math.min(4,Math.floor((track.clientWidth+35)/(carouselCards[0].offsetWidth+35))));
 const gap=innerWidth<=650?28:35;
 const slideStep=innerWidth>1050?Math.max(carouselCards[0].offsetWidth+gap,(track.clientWidth-carouselCards[0].offsetWidth)/Math.max(1,reachable-1)):carouselCards[0].offsetWidth+gap;
 carouselCards.forEach((card,i)=>{
  const slot=(i-carouselPosition+carouselCards.length)%carouselCards.length;
  const oldSlot=Number(card.dataset.slot ?? slot);
  const wraps=step!==0&&Math.abs(slot-oldSlot)>1;
  card.classList.toggle('carousel-wrap',wraps);
  card.dataset.slot=String(slot);
  card.tabIndex=indexed||slot<reachable?0:-1;
  card.dataset.front=String(slot===0);card.dataset.visible=String(slot<reachable);
  card.style.setProperty('--i',indexed?i:slot);
  card.style.setProperty('--slide-x',(slot*slideStep)+'px');
  card.style.setProperty('--top',([34,5,28,-18][(indexed?i:slot)%4])+'px');
  if(wraps)requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.remove('carousel-wrap')));
 });
 document.querySelector('footer>span[dir=ltr]').textContent='SELECTED WORKS — '+carouselCards.length+' PROJECTS';
 document.getElementById('carousel-count').textContent=String(carouselPosition+1).padStart(2,'0')+' / '+String(carouselCards.length).padStart(2,'0');
}
document.getElementById('next-project').addEventListener('click',()=>browse(1));
document.getElementById('previous-project').addEventListener('click',()=>browse(-1));
space.addEventListener('click',()=>arrangeCarousel());index.addEventListener('click',()=>arrangeCarousel());
let dragStart=null,dragged=false;

window.addEventListener('pointerup',()=>{dragStart=null;});
window.addEventListener('pointercancel',()=>{dragStart=null;dragged=false;});
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.target.closest('button')||document.body.classList.contains('index-mode'))return;dragStart=e.clientX;dragged=false;});
stage.addEventListener('pointerup',e=>{if(dragStart!==null&&Math.abs(e.clientX-dragStart)>45){dragged=true;browse(e.clientX<dragStart?1:-1);}dragStart=null;});
stage.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false;}},true);
stage.tabIndex=0;stage.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();browse(e.key==='ArrowRight'?1:-1);}});
setInterval(()=>{if(Date.now()>manualUntil&&!document.hidden&&dragStart===null&&!document.body.classList.contains('motion-paused')&&!document.body.classList.contains('index-mode')&&!document.querySelector('dialog[open]')&&!reduced)arrangeCarousel(1);},5000);
projectInfo.c3.category='אתר מסחר במטבעות דיגיטליים';projectInfo.c3.text='מערכת מסחר — אתר למסחר במטבעות דיגיטליים, עם חוויית משתמש סביב עולם הקריפטו והמסחר.';projectInfo.c3.tags='Crypto trading · Digital currencies';
document.querySelector('.c3 .bottom').textContent=projectInfo.c3.category;
document.querySelector('.c3').title=projectInfo.c3.category;

arrangeCarousel();





const signature=document.createElement('div');
signature.className='live-signature';
signature.innerHTML='<i aria-hidden="true"></i><span>DESIGN IN MOTION / CODE WITH CHARACTER</span>';
document.querySelector('.title').append(signature);
const exhibition=document.querySelector('.exhibition');
let wheelTotal=0,wheelLast=0,wheelLockedUntil=0;
stage.addEventListener('wheel',event=>{
 if(document.body.classList.contains('index-mode')||event.ctrlKey||document.querySelector('dialog[open]'))return;
 const bounds=stage.getBoundingClientRect();
 if(event.clientX<bounds.left+12||event.clientX>bounds.right-12||event.clientY<bounds.top+12||event.clientY>bounds.bottom-12)return;
 event.preventDefault();
 const now=Date.now();
 if(now<wheelLockedUntil)return;
 if(now-wheelLast>180)wheelTotal=0;
 const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
 wheelTotal+=delta*(event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1);wheelLast=now;
 if(Math.abs(wheelTotal)>=45){browse(wheelTotal>0?1:-1);wheelTotal=0;wheelLockedUntil=now+650;}
},{passive:false});
window.addEventListener('resize',()=>arrangeCarousel());

// Set a business contact destination once supplied by the portfolio owner.
const contactDestination={whatsapp:'',email:''};
const contactDialog=document.getElementById('contact-dialog');
document.querySelector('.start-project').addEventListener('click',()=>contactDialog.showModal());
contactDialog.querySelector('.close').addEventListener('click',()=>contactDialog.close());
document.getElementById('project-enquiry').addEventListener('submit',event=>{
 event.preventDefault();
 const brief=document.getElementById('project-brief').value.trim();
 if(!brief)return;
 const message='היי ניר, ראיתי את העבודות בפורמה ואשמח לדבר על פרויקט:\n'+brief;
 if(contactDestination.whatsapp){window.open('https://wa.me/'+contactDestination.whatsapp+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');}
 else if(contactDestination.email){location.href='mailto:'+contactDestination.email+'?subject='+encodeURIComponent('פרויקט חדש דרך FORMA')+'&body='+encodeURIComponent(message);}
 else {document.getElementById('contact-feedback').textContent='יצירת הקשר תיפתח בקרוב.';}
});