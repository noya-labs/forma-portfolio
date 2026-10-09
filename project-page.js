const projectKey=document.body.dataset.project;
const details=projectInfo[projectKey];
document.title=details.name+' — FORMA';
document.querySelector('.project-category').textContent=details.category;
document.querySelector('h1').textContent=details.name;
document.querySelector('.project-summary').textContent=details.text;
document.querySelector('.project-tags').textContent=details.tags;
document.querySelector('.project-status').textContent=details.status||'';
const liveLink=document.querySelector('.project-live');liveLink.hidden=!details.url;if(details.url)liveLink.href=details.url;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('chapter-visible');observer.unobserve(entry.target);}});},{threshold:.12});
projectGalleries[projectKey].forEach(([src,title,text,source],i)=>{
 const chapter=document.createElement('section');chapter.className='project-chapter';
 const figure=document.createElement('figure');figure.className='chapter-image';
 const image=document.createElement('img');image.src=src;image.alt=title;image.decoding='async';image.loading=i===0?'eager':'lazy';
 const caption=document.createElement('figcaption');caption.textContent=source;figure.append(image,caption);
 const copy=document.createElement('div');copy.className='chapter-copy';
 const step=document.createElement('span');step.className='eyebrow';step.dir='ltr';step.textContent=String(i+1).padStart(2,'0')+' / '+String(projectGalleries[projectKey].length).padStart(2,'0');
 const heading=document.createElement('h2');heading.textContent=title;
 const paragraph=document.createElement('p');paragraph.textContent=text;copy.append(step,heading,paragraph);chapter.append(figure,copy);
 document.querySelector('#project-chapters').append(chapter);
 if(reducedMotion)chapter.classList.add('chapter-visible');else observer.observe(chapter);
});
const keys=Object.keys(projectPaths),position=keys.indexOf(projectKey);
[['.previous-work',keys[(position-1+keys.length)%keys.length],'← '],['.next-work',keys[(position+1)%keys.length],'הפרויקט הבא: ']].forEach(([selector,key,prefix])=>{const link=document.querySelector(selector);link.href=projectPaths[key];link.textContent=prefix+projectInfo[key].name;});

if(projectKey==='c1'){
 const cinema=document.querySelector('.noya-cinema');
 const firstChapter=document.querySelector('.project-chapter');
 cinema.classList.add('inline-cinema');
 firstChapter.querySelector('figure').replaceChildren(cinema);
 firstChapter.querySelector('.chapter-copy p').textContent='מסע תלת־ממדי דרך מכשיר השמיעה: התקרבות, מעבר בין הרכיבים וסיבוב משלוש זוויות. כל סצנה נמשכת 10 שניות.';
}

const marketing=projectMarketing[projectKey];
document.querySelector('.project-summary').textContent=marketing.intro;
const tagline=document.createElement('h2');tagline.className='project-tagline';tagline.textContent=marketing.headline;document.querySelector('.project-summary').before(tagline);
const chapters=[...document.querySelectorAll('.project-chapter')];
const placements=projectKey==='c1'?[0,3,2,1]:projectKey==='c6'?[0,4,5,1]:marketing.parts.map((_,i)=>i%chapters.length);
marketing.parts.forEach(([title,text],i)=>{
 const copy=chapters[placements[i]].querySelector('.chapter-copy');
 const part=document.createElement('div');part.className='chapter-detail';
 const heading=document.createElement('h3');heading.textContent=title;
 const paragraph=document.createElement('p');paragraph.textContent=text;
 part.append(heading,paragraph);copy.append(part);
});