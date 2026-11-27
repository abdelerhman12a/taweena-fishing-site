import * as THREE from 'three';
import {RoomEnvironment} from './vendor/jsm/environments/RoomEnvironment.js';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture; scene.environmentIntensity=.95;
const cam = new THREE.PerspectiveCamera(32, 1, .1, 100); cam.position.set(0,0,12);
scene.add(new THREE.HemisphereLight(0xeef7ff, 0x263b55, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(3,5,6); scene.add(key);
const rim = new THREE.DirectionalLight(0x83cfff, 1.3); rim.position.set(-5,-2,-3); scene.add(rim);

const guideMat = new THREE.MeshStandardMaterial({color:0xb8c3d0, roughness:.18, metalness:.95});

// ---- lure: sleek chrome minnow with back shading and treble hook
const lure = new THREE.Group();
const bodyG = new THREE.LatheGeometry([[0,-1.55],[.06,-1.3],[.12,-.7],[.14,.05],[.12,.78],[.06,1.28],[0,1.5]].map(p=>new THREE.Vector2(p[0],p[1])),32);
const lureM = new THREE.MeshPhysicalMaterial({color:0xf4f9fd, roughness:.1, metalness:1, clearcoat:1, clearcoatRoughness:.08, envMapIntensity:1.3});
const lb = new THREE.Mesh(bodyG, lureM); lb.scale.set(1,1,.46); lure.add(lb);
const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,1.65,24,1,true,Math.PI*.7,Math.PI*.6), new THREE.MeshStandardMaterial({color:0x1b6896, roughness:.28, metalness:.55, side:THREE.DoubleSide}));
stripe.scale.set(1,1,.5); stripe.position.set(0,.02,-.02); lure.add(stripe);
for(const s of [-1,1]){
  const e = new THREE.Mesh(new THREE.SphereGeometry(.026,12,12), new THREE.MeshStandardMaterial({color:0x101418}));
  e.position.set(s*.062, 1.15, .07); lure.add(e);
}
// compact 3-prong treble hook at tail
const hookGrp = new THREE.Group(); hookGrp.position.set(0, -1.55, 0);
for(let i=0;i<3;i++){
  const h = new THREE.Mesh(new THREE.TorusGeometry(.11,.014,8,16,Math.PI*1.25), guideMat);
  h.rotation.y = i*(Math.PI*2/3); h.rotation.z = Math.PI*.65; h.position.y = -.11; hookGrp.add(h);
}
lure.add(hookGrp);
const line = new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,32,4), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.68}));
line.position.y = 16.4; lure.add(line);
lure.scale.setScalar(.62);
scene.add(lure);

// ---- sparse crisp bubbles
const N=28, pg=new THREE.BufferGeometry(), pa=new Float32Array(N*3), seed=[];
for(let i=0;i<N;i++){pa[i*3]=(Math.random()-.5)*11;pa[i*3+1]=(Math.random()-.5)*16;pa[i*3+2]=(Math.random()-.5)*4;seed.push(Math.random()*6.28);}
pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
const bc=document.createElement('canvas');bc.width=bc.height=64;const bg=bc.getContext('2d');
const gr=bg.createRadialGradient(26,24,2,32,32,28);
gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.45,'rgba(220,248,255,.55)');gr.addColorStop(.82,'rgba(180,238,255,.2)');gr.addColorStop(1,'rgba(255,255,255,0)');
bg.fillStyle=gr;bg.fillRect(0,0,64,64);
const bubbles=new THREE.Points(pg,new THREE.PointsMaterial({size:.22,map:new THREE.CanvasTexture(bc),transparent:true,depthWrite:false,opacity:0}));
scene.add(bubbles);

// ---- keyframes by scroll position s (in viewport heights past the hero intro)
// s=0..1  hero (300vh sticky) · s=1..2.6  depth zones (160vh) · s>=2.6  shop + footer
const ss=t=>t*t*(3-2*t);
function kf(s,keys){ if(s<=keys[0][0])return keys[0].slice(1); for(let i=1;i<keys.length;i++){ if(s<=keys[i][0]){const a=keys[i-1],b=keys[i];const t=ss((s-a[0])/(b[0]-a[0]));return a.slice(1).map((v,j)=>v+(b[j+1]-v)*t);} } return keys.at(-1).slice(1); }

// lure: [s, x, y, z, rz, spinOffset, scale]
const LURE=[
  [0,   .48,2.45,.7, .12,0,.15],
  [.8,  .32,1.95,.7, .12,0,.15],
  [1.15,1.05,12,0,   .08,0,.38],
  [1.35,1.05,1.2,.7, .08,0,.38],
  [1.55,1.05,1.0,.7, .08,0,.38],
  [1.8, 0.72,0.35,.7,.08,.03,.38],
  [2.0, 0.85,-0.15,.7,.06,.04,.38],
  [2.25,0.25,-2.8,.7,.06,.06,.38],
  [2.5, 0,-7.5,.7,   .06,.08,.38]
];

const cur={s:0}; let tgt=0;
function readScroll(){tgt=scrollY/innerHeight}
addEventListener('scroll',readScroll,{passive:true});
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
const navEl=document.querySelector('nav');
function navTheme(){navEl.classList.toggle('light', tgt>=2.55);}
const q=new URLSearchParams(location.search);
if(q.has('s')){scrollTo(0,(+q.get('s'))*innerHeight);}
readScroll();cur.s=tgt;
let vis=true;document.addEventListener('visibilitychange',()=>vis=!document.hidden);
const clock=new THREE.Clock();

function frame(){
  requestAnimationFrame(frame); if(!vis) return;
  const t=clock.getElapsedTime();
  cur.s = reduce||q.has('s') ? tgt : cur.s+(tgt-cur.s)*.12;
  const s=cur.s, wide=innerWidth>innerHeight, k=wide?1:.62;
  cam.position.set(0,0,12); cam.lookAt(0,0,0);
  cam.fov = wide ? 32 : 46; cam.updateProjectionMatrix();
  navTheme();

  // Lure (hero + underwater depth zones)
  const l=kf(s,LURE);
  lure.visible = (s>=.5&&s<.9) || (s>1.12&&s<2.52);
  lure.position.set(l[0]*k, l[1], l[2]);
  lure.rotation.set(0, (reduce?0:t*.12)+l[4], l[3]);
  lure.scale.setScalar(l[5]);
  line.visible = s<1.45 || s>1.95;
  hookGrp.visible = s>1.1;

  // Bubbles
  const bo = (s>=.5&&s<1.05) ? Math.max(.35,Math.min(1,(s+.3)/.6))*(1-Math.max(0,(s-.85)/.2))
           : (s>1.1&&s<2.5 ? .72 : 0);
  bubbles.material.opacity = bo*.85; bubbles.visible = bo>.01;
  if(!reduce){
    const a=pg.attributes.position;
    for(let i=0;i<N;i++){let y=a.getY(i)+.018+Math.sin(t+seed[i])*.003;if(y>8)y=-8;a.setY(i,y);}
    a.needsUpdate=true;
  }
  if(lure.visible||bubbles.visible) renderer.render(scene,cam); else renderer.clear();
}
frame();
