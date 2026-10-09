import {tours,tourProgress} from './noya-tours.js';
import * as THREE from './media/three/three.module.js';
import {RoomEnvironment} from './media/three/RoomEnvironment.js';
import {GLTFLoader} from './media/three/GLTFLoader.js';
const container=document.querySelector('.noya-cinema');
const canvas=container.querySelector('canvas');
const view=container.querySelector('.cinema-view');
const status=container.querySelector('.cinema-status');
const progress=container.querySelector('.cinema-progress i');
const pauseButton=container.querySelector('.cinema-pause');
const buttons=[...container.querySelectorAll('[data-scene]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,model,visible=true,paused=reduced,elapsed=0,last=0,sceneIndex=-1;
const scene=new THREE.Scene();scene.background=null;
const camera=new THREE.PerspectiveCamera(43,1,.004,100);
scene.add(new THREE.HemisphereLight(0xffffff,0x64738b,1.2));
[[4,5,5,2,0xffe9c9],[-4,2,-3,1.5,0xc7deff],[1,-3,2,.6,0xffffff]].forEach(([x,y,z,power,color])=>{const light=new THREE.DirectionalLight(color,power);light.position.set(x,y,z);scene.add(light);});



function updateControls(index){buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));status.textContent=tours[index].label+' / 10 שניות';container.dataset.scene=String(index+1);}
function resize(){const width=view.clientWidth,height=view.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
function positionCamera(time){
 const index=Math.floor(time/10)%3,t=(time%10)/10;
 if(index!==sceneIndex){sceneIndex=index;updateControls(index);}
 const u=tourProgress(t),tour=tours[index];
 camera.position.copy(tour.path.getPoint(u));
 camera.lookAt(tour.target.getPoint(u));
 camera.fov=43+24*Math.sin(Math.PI*t);camera.updateProjectionMatrix();
 canvas.style.opacity=String(paused?1:Math.min(1,t/.04,(1-t)/.04));
 progress.style.transform='scaleX('+t+')';
 container.dataset.sceneSeconds=(t*10).toFixed(1);
}
function frame(now){requestAnimationFrame(frame);if(!model||!visible||document.hidden){last=now;return;}if(last&&!paused)elapsed+=Math.min((now-last)/1000,.1);last=now;positionCamera(elapsed);renderer.render(scene,camera);}
try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 const studio=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.04).texture;scene.environmentIntensity=.6;studio.dispose();pmrem.dispose();
 renderer.setClearColor(0x000000,0);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;
 new ResizeObserver(resize).observe(view);resize();
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;},{threshold:.05}).observe(view);
 new GLTFLoader().load('./media/noya_hero.glb',gltf=>{
  model=gltf.scene;model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),centre=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const scale=2.5/Math.max(size.x,size.y,size.z);model.position.sub(centre);const pivot=new THREE.Group();pivot.add(model);pivot.scale.setScalar(scale);scene.add(pivot);
  // The receiver sits below the housing; target the body above the overall centre.

  model.traverse(mesh=>{if(!mesh.isMesh)return;const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];materials.forEach(material=>{material.side=THREE.DoubleSide;});});
  container.classList.add('cinema-ready');container.dataset.loaded='true';elapsed=0;updateControls(0);requestAnimationFrame(frame);
 },undefined,()=>{status.textContent='המודל לא נטען — מוצגת תמונת המכשיר';container.dataset.loaded='false';});
}catch(error){status.textContent='תצוגת תלת־ממד אינה זמינה בדפדפן הזה';container.dataset.loaded='false';}
pauseButton.textContent=paused?'הפעלת תנועה':'עצירת תנועה';
pauseButton.setAttribute('aria-pressed',String(paused));
pauseButton.addEventListener('click',()=>{paused=!paused;pauseButton.textContent=paused?'הפעלת תנועה':'עצירת תנועה';pauseButton.setAttribute('aria-pressed',String(paused));last=0;});
buttons.forEach((button,index)=>button.addEventListener('click',()=>{elapsed=index*10;sceneIndex=-1;last=0;}));
