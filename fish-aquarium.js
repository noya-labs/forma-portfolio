import * as THREE from './media/three/three.module.js';
import {GLTFLoader} from './media/three/GLTFLoader.js';
const host=document.querySelector('.fish-tank'),canvas=host.querySelector('canvas'),status=host.querySelector('.tank-status');
const scene=new THREE.Scene();scene.background=new THREE.Color('#04202d');scene.fog=new THREE.FogExp2('#063341',.035);
const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(0,1,16);camera.lookAt(0,0,0);
let renderer,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,visible=false,elapsed=0,held=null,last=0;
const fish=[],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let seeking=false,pointerSeen=false;
const bait=new THREE.Vector3(),waterPlane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
const targetPosition=new THREE.Vector3(),direction=new THREE.Vector3();
function trackBait(e){if(e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();
 pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(waterPlane,bait)){
  bait.y=THREE.MathUtils.clamp(bait.y,-2.5,4);seeking=true;pointerSeen=true;
 }
}
canvas.addEventListener('pointermove',trackBait);
canvas.addEventListener('pointerleave',()=>{seeking=false;});
window.addEventListener('blur',()=>{seeking=false;});
const pause=host.querySelector('.tank-pause');pause.textContent=paused?'הפעלת שחייה':'עצירת שחייה';pause.setAttribute('aria-pressed',String(paused));
scene.add(new THREE.HemisphereLight(0xbceaff,0x123c46,3));
const light=new THREE.DirectionalLight(0xfff1cc,4);light.position.set(3,8,5);scene.add(light);
const blue=new THREE.PointLight(0x19b7da,50);blue.position.set(-5,2,4);scene.add(blue);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(50,30),new THREE.MeshStandardMaterial({color:0x435e57,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-3.8;scene.add(floor);
for(let i=0;i<16;i++){const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.3+(i%4)*.2,1),new THREE.MeshStandardMaterial({color:i%2?0x496766:0x243f45,roughness:.95}));rock.position.set(Math.sin(i*12)*9,-3.6,Math.cos(i*8)*4-2);rock.scale.set(1.7,.8,1);scene.add(rock);}
const particles=[];for(let i=0;i<85;i++)particles.push(Math.sin(i*19)*12,Math.cos(i*13)*6,Math.sin(i*7)*5);
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(particles,3));const bubbles=new THREE.Points(geometry,new THREE.PointsMaterial({color:0x9ee0e8,size:.035,transparent:true,opacity:.5}));scene.add(bubbles);
function release(){if(held)held.userData.boost=1.8;held=null;status.textContent='הזיזו את הסמן והדגים יתקרבו; החזיקו דג כדי לעצור אותו.';canvas.style.cursor='default';}
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(fish,true)[0];if(!hit)return;held=hit.object;while(held.parent&&!fish.includes(held))held=held.parent;if(!fish.includes(held)){held=null;return;}status.textContent='אינטיאס · דגם מתוך הפרויקט · שחררו להמשך השחייה';canvas.setPointerCapture(e.pointerId);canvas.style.cursor='pointer';});
window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);canvas.addEventListener('keydown',e=>{if(e.key==='Escape')release();});
pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'הפעלת שחייה':'עצירת שחייה';pause.setAttribute('aria-pressed',String(paused));});
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const resize=()=>{renderer.setSize(host.clientWidth,host.querySelector('.tank-view').clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.position.z=camera.aspect<1?24:16;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05}).observe(host);
 new GLTFLoader().load('./media/fish-amberjack-v2.glb',gltf=>{
  const box=new THREE.Box3().setFromObject(gltf.scene),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  gltf.scene.position.sub(center);
  for(let i=0;i<9;i++){const body=gltf.scene.clone(true),group=new THREE.Group();body.rotation.y=Math.PI/2;body.scale.setScalar((2.8+(i%3)*.4)/Math.max(size.x,size.z));group.add(body);// Bend the rear half of the actual mesh, strongest at the tail tip.
   const swimTime={value:0},swimPhase={value:i*1.37},mouthOpen={value:0};
   body.traverse(mesh=>{if(!mesh.isMesh)return;
    const prepare=source=>{const material=source.clone();material.onBeforeCompile=shader=>{
     shader.uniforms.swimTime=swimTime;shader.uniforms.swimPhase=swimPhase;shader.uniforms.mouthOpen=mouthOpen;
     shader.vertexShader='uniform float swimTime; uniform float swimPhase; uniform float mouthOpen;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float tailWeight = smoothstep(0.05, 0.95, -position.z);
      float tailWave = sin(swimTime * 10.4 + swimPhase + position.z * 2.4);
      transformed.x += tailWave * tailWeight * tailWeight * 0.16;
      float muzzle = smoothstep(0.68, 0.94, position.z);
      float lowerJaw = 1.0 - smoothstep(-0.015, 0.045, position.y);
      transformed.y -= mouthOpen * muzzle * lowerJaw * 0.075;
      transformed.y += mouthOpen * muzzle * (1.0-lowerJaw) * 0.015;
     `);
    };material.customProgramCacheKey=()=> 'fish-swim-mouth-v2';return material;};
    mesh.material=Array.isArray(mesh.material)?mesh.material.map(prepare):prepare(mesh.material);
   });
   group.position.set(Math.sin(i*.71)*5.5,Math.sin(i*.71*1.8)*1.8+(i%3-1)*.45,Math.cos(i*.71)*2.2-1);
   group.userData={phase:i*.71,pathTime:i*.71,boost:0,swimTime,mouthOpen,nextMouth:Math.random()*5,mouthStart:-10,mouthDuration:0.9+Math.random()*.35};scene.add(group);fish.push(group);}
  status.textContent='הזיזו את הסמן והדגים יתקרבו; החזיקו דג כדי לעצור אותו.';host.dataset.ready='true';
 },undefined,()=>{status.textContent='לא ניתן לטעון את הדגם. נסו לרענן את העמוד.';});
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!visible||document.hidden)return;if(!paused)elapsed+=dt;
  fish.forEach((f,i)=>{if(f===held||paused)return;
   const d=f.userData,p=d.phase;
   const speed=1+Math.sin(elapsed*.65+p*2.7)*.32+Math.sin(elapsed*.23+p)*.12;
   d.boost=Math.max(0,d.boost-dt);d.pathTime+=dt*.44*speed;
   const t=d.pathTime;
   d.swimTime.value+=dt*speed;
   if(elapsed>=d.nextMouth){d.mouthStart=elapsed;d.mouthDuration=.9+Math.random()*.35;d.nextMouth=elapsed+4.5+Math.random();}
   const mouthCycle=(elapsed-d.mouthStart)/d.mouthDuration;
   let opening=mouthCycle>=0&&mouthCycle<1?Math.sin(mouthCycle*Math.PI):0;
   if(seeking){
    // Approach from different sides, leaving enough room for each fish's nose.
    const angle=p*2.4+elapsed*.12,radius=1.6+(i%3)*.4;
    targetPosition.set(bait.x+Math.cos(angle)*radius,bait.y+Math.sin(angle)*radius*.6,Math.sin(p*3)*1.2);
    direction.subVectors(bait,f.position);
    const distance=direction.length();
    f.position.lerp(targetPosition,1-Math.exp(-dt*(.75+speed*.3)));
    if(distance<4)opening=Math.max(opening,Math.pow((Math.sin(elapsed*4.5+p*5)+1)/2,2));
   }else{
    targetPosition.set(Math.sin(t)*5.5,Math.sin(t*.8+p)*1.8+(i%3-1)*.45,Math.cos(t)*2.2-1);
    if(pointerSeen)f.position.lerp(targetPosition,1-Math.exp(-dt*1.2));else f.position.copy(targetPosition);
    direction.set(Math.cos(t)*5.5,Math.cos(t*.8+p)*1.44,-Math.sin(t)*2.2);
   }
   const yaw=Math.atan2(-direction.z,direction.x);
   const turn=THREE.MathUtils.euclideanModulo(yaw-f.rotation.y+Math.PI,Math.PI*2)-Math.PI;
   f.rotation.y+=turn*(1-Math.exp(-dt*3));
   const pitch=THREE.MathUtils.clamp(Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),-.3,.3);
   f.rotation.z=THREE.MathUtils.lerp(f.rotation.z,pitch,1-Math.exp(-dt*3));
   d.mouthOpen.value=opening;f.children[0].rotation.z=Math.sin(d.swimTime.value*5.2+i)*.012;
  });
  bubbles.rotation.y=elapsed*.015;renderer.render(scene,camera);
 }requestAnimationFrame(frame);
}catch(error){status.textContent='תצוגת התלת־ממד אינה זמינה בדפדפן הזה.';}

