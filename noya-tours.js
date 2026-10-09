import * as THREE from './media/three/three.module.js';
const v=p=>new THREE.Vector3(...p);
export const tours=[
 {label:'חזית — לצד הסוללה והמעגלים',points:[[.5,.78,3.8],[.36,.71,1.35],[.28,.63,.66],[.27,.62,.28],[.26,.64,-.12],[.27,.65,-.53],[.32,.72,-1.3],[1.1,.92,-3.1]],focus:[[0,.62,0],[0,.63,.35],[0,.6,.42],[0,.53,0],[0,.5,0],[0,.47,-.65],[0,.65,0],[0,.65,0]]},
 {label:'הכיוון ההפוך — בין החיבורים',points:[[-.7,.84,-3.8],[-.4,.76,-1.35],[-.3,.67,-.7],[-.29,.65,-.36],[-.29,.67,.05],[-.3,.69,.43],[-.4,.82,1.3],[-1.2,1,3.1]],focus:[[0,.6,0],[0,.5,-.65],[0,.46,-.65],[0,.52,0],[0,.58,.15],[0,.67,.4],[0,.65,0],[0,.65,0]]},
 {label:'מבט צד — מעל המעגלים',points:[[3,.95,-.48],[1.1,.89,-.44],[.32,.87,-.4],[.16,.89,-.39],[-.07,.9,-.39],[-.28,.86,-.42],[-1.1,.94,-.5],[-3.1,1.05,-.6]],focus:[[0,.72,0],[0,.68,0],[0,.63,0],[0,.76,.1],[0,.63,.3],[0,.5,-.65],[0,.67,0],[0,.67,0]]}
].map(tour=>({...tour,path:new THREE.CatmullRomCurve3(tour.points.map(v),false,'centripetal'),target:new THREE.CatmullRomCurve3(tour.focus.map(v),false,'centripetal')}));
// Spend half of each 10-second scene inside the housing, with continuous easing.
export function tourProgress(t){const keys=[[0,0],[.25,.27],[.75,.73],[1,1]];for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){const [a,x]=keys[i-1],[b,y]=keys[i];const local=(t-a)/(b-a);return x+(y-x)*(local*local*(3-2*local));}}return 1;}
