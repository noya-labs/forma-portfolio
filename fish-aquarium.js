import * as THREE from './media/three/three.module.js';
import {GLTFLoader} from './media/three/GLTFLoader.js';
const host=document.querySelector('.fish-tank'),canvas=host.querySelector('canvas'),status=host.querySelector('.tank-status');
const scene=new THREE.Scene();scene.background=new THREE.Color('#04202d');scene.fog=new THREE.FogExp2('#063341',.035);
const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(0,1,16);camera.lookAt(0,0,0);
let renderer,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,visible=false,elapsed=0,held=null,last=0;
const fish=[],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const pause=host.querySelector('.tank-pause');pause.textContent=paused?'הפעלת שחייה':'עצירת שחייה';pause.setAttribute('aria-pressed',String(paused));
scene.add(new THREE.HemisphereLight(0xbceaff,0x123c46,3));
const light=new THREE.DirectionalLight(0xfff1cc,4);light.position.set(3,8,5);scene.add(light);
const blue=new THREE.PointLight(0x19b7da,50);blue.position.set(-5,2,4);scene.add(blue);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(50,30),new THREE.MeshStandardMaterial({color:0x435e57,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-3.8;scene.add(floor);
for(let i=0;i<16;i++){const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.3+(i%4)*.2,1),new THREE.MeshStandardMaterial({color:i%2?0x496766:0x243f45,roughness:.95}));rock.position.set(Math.sin(i*12)*9,-3.6,Math.cos(i*8)*4-2);rock.scale.set(1.7,.8,1);scene.add(rock);}
const particles=[];for(let i=0;i<85;i++)particles.push(Math.sin(i*19)*12,Math.cos(i*13)*6,Math.sin(i*7)*5);
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(particles,3));const bubbles=new THREE.Points(geometry,new THREE.PointsMaterial({color:0x9ee0e8,size:.035,transparent:true,opacity:.5}));scene.add(bubbles);
function release(){if(held)held.userData.boost=1.8;held=null;status.textContent='החזיקו דג כדי לעצור אותו; שחררו כדי להמשיך.';canvas.style.cursor='default';}
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(fish,true)[0];if(!hit)return;held=hit.object;while(held.parent&&!fish.includes(held))held=held.parent;if(!fish.includes(held)){held=null;return;}status.textContent='אינטיאס · דגם מתוך הפרויקט · שחררו להמשך השחייה';canvas.setPointerCapture(e.pointerId);canvas.style.cursor='pointer';});
window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);canvas.addEventListener('keydown',e=>{if(e.key==='Escape')release();});
pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'הפעלת שחייה':'עצירת שחייה';pause.setAttribute('aria-pressed',String(paused));});
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const resize=()=>{renderer.setSize(host.clientWidth,host.querySelector('.tank-view').clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.position.z=camera.aspect<1?24:16;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05}).observe(host);
 new GLTFLoader().load('./media/fish-amberjack.glb',gltf=>{
  const box=new THREE.Box3().setFromObject(gltf.scene),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  gltf.scene.position.sub(center);
  for(let i=0;i<9;i++){const body=gltf.scene.clone(true),group=new THREE.Group();body.rotation.y=Math.PI/2;body.scale.setScalar((2.8+(i%3)*.4)/Math.max(size.x,size.z));group.add(body);group.userData={phase:i*.71,boost:0};scene.add(group);fish.push(group);}
  status.textContent='החזיקו דג כדי לעצור אותו; שחררו כדי להמשיך.';host.dataset.ready='true';
 },undefined,()=>{status.textContent='לא ניתן לטעון את הדגם. נסו לרענן את העמוד.';});
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!visible||document.hidden)return;if(!paused)elapsed+=dt;
  fish.forEach((f,i)=>{if(f===held)return;const p=f.userData.phase,t=elapsed*.22+p;f.userData.boost=Math.max(0,f.userData.boost-dt);f.position.set(Math.sin(t)*5.5,Math.sin(t*.8+p)*1.8+(i%3-1)*.45,Math.cos(t)*2.2-1);f.rotation.y=Math.atan2(Math.sin(t)*-2.2,Math.cos(t)*5.5);f.rotation.z=Math.cos(t*.8+p)*.025;f.children[0].rotation.z=Math.sin(elapsed*4+i)*.025;});
  bubbles.rotation.y=elapsed*.015;renderer.render(scene,camera);
 }requestAnimationFrame(frame);
}catch(error){status.textContent='תצוגת התלת־ממד אינה זמינה בדפדפן הזה.';}
