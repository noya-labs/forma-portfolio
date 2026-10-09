const artCovers=[['c1','noya','NOYA'],['c2','bluebay','BLUE BAY'],['c3','nexora','NEXORA'],['c4','wcr','WEB CONTROL ROOM'],['c5','monopoly','NAHARIYA 1990'],['c6','ariel','ARIEL']];
artCovers.forEach(([selector,file,name])=>{
 const card=document.querySelector('.'+selector);card.classList.add('art-cover');
 const image=document.createElement('img');image.src=file==='ariel'?'./media/ariel-1.png':'./'+file+'-cover.'+(file==='monopoly'?'jpg':'png');image.alt=(file==='monopoly'?'לוח מונופול נהריה 1990':'כריכה רעיונית עבור '+name);image.className='concept-cover';image.draggable=false;card.prepend(image);
 const label=document.createElement('span');label.className='cover-name';label.textContent=name;card.insertBefore(label,card.querySelector('.bottom'));
});
const motionButton=document.createElement('button');motionButton.id='motion-toggle';motionButton.textContent='עצירת תנועה';motionButton.setAttribute('aria-pressed','false');document.querySelector('footer').append(motionButton);
function pauseMotion(paused){document.body.classList.toggle('motion-paused',paused);motionButton.textContent=paused?'הפעלת תנועה':'עצירת תנועה';motionButton.setAttribute('aria-pressed',String(paused));}
motionButton.addEventListener('click',()=>pauseMotion(!document.body.classList.contains('motion-paused')));
if(matchMedia('(prefers-reduced-motion: reduce)').matches)pauseMotion(true);

