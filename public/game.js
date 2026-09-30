import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const $ = id => document.getElementById(id);

const LOBBY_WEAPONS = [
  {id:"spc_carbine",name:"SPC CARBINE",product:"Piso SPC Nogal Americano",damage:24,fireRate:120,range:70,mag:28,type:"AR",color:"#8b674b",accent:"#5eead4"},
  {id:"bamboo_smg",name:"BAMBOO SMG",product:"Placa Bamboo",damage:16,fireRate:75,range:48,mag:36,type:"SMG",color:"#9a7b55",accent:"#a7f3d0"},
  {id:"marmol_dmr",name:"MÁRMOL DMR",product:"Placa Mármol Statuario",damage:48,fireRate:380,range:95,mag:10,type:"DMR",color:"#e9e6df",accent:"#f59e0b"},
  {id:"ultraflex_cannon",name:"ULTRAFLEX CANNON",product:"Piedra Flexible Rough Cocoon",damage:74,fireRate:900,range:34,mag:5,type:"HEAVY",color:"#7c6554",accent:"#fb7185"},
  {id:"lambrin_burst",name:"LAMBRÍN BURST",product:"Lambrín Interior Parota",damage:31,fireRate:210,range:62,mag:21,type:"BURST",color:"#8a5c3d",accent:"#60a5fa"},
  {id:"wpc_heavy",name:"WPC HEAVY",product:"Viga WPC Teca",damage:58,fireRate:650,range:55,mag:8,type:"HEAVY",color:"#705038",accent:"#c084fc"}
];

let preselectedWeaponId = "spc_carbine";

function renderLobbyWeapons(){
  const box = $("loadoutCards");
  box.innerHTML = LOBBY_WEAPONS.map(w => `
    <div class="loadout-card ${w.id===preselectedWeaponId?"active":""}" data-id="${w.id}">
      <span>${w.type}</span>
      <b>${w.name}</b>
      <small>${w.product}</small>
    </div>
  `).join("");

  box.querySelectorAll(".loadout-card").forEach(el=>{
    el.onclick=()=>{
      preselectedWeaponId=el.dataset.id;
      renderLobbyWeapons();
      updateLobbyWeapon();
    };
  });
}
function pct(v,min,max){ return Math.max(8,Math.min(100,((v-min)/(max-min))*100)); }
function updateLobbyWeapon(){
  const w=LOBBY_WEAPONS.find(x=>x.id===preselectedWeaponId)||LOBBY_WEAPONS[0];
  $("lobbyWeaponName").textContent=w.name;
  $("lobbyProductName").textContent=w.product;
  $("statDamage").style.width=pct(w.damage,10,80)+"%";
  $("statFireRate").style.width=(100-pct(w.fireRate,60,900)+12)+"%";
  $("statRange").style.width=pct(w.range,25,100)+"%";
}
renderLobbyWeapons();
updateLobbyWeapon();

const renderer = new THREE.WebGLRenderer({
  canvas:$("game"),
  antialias:true,
  powerPreference:"high-performance",
  stencil:false
});
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth>3000?1.15:1.8));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.03;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fb2c1);
scene.fog = new THREE.FogExp2(0x8194a4,.0098);

const camera = new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.055,220);
camera.position.set(0,1.72,20);
camera.rotation.order="YXZ";
scene.add(camera);

const controls = new PointerLockControls(camera,document.body);

const pmrem = new THREE.PMREMGenerator(renderer);
const roomEnv = new RoomEnvironment();
scene.environment = pmrem.fromScene(roomEnv,.04).texture;
roomEnv.dispose();
pmrem.dispose();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.13,.42,.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.HemisphereLight(0xe7f3ff,0x52483e,1.65));
const sun = new THREE.DirectionalLight(0xfff3df,3.0);
sun.position.set(18,32,10);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-42;
sun.shadow.camera.right=42;
sun.shadow.camera.top=42;
sun.shadow.camera.bottom=-42;
sun.shadow.camera.near=.5;
sun.shadow.camera.far=90;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8dc9ff,.6);
fill.position.set(-20,10,-10);
scene.add(fill);

function texturePack(kind,baseA,baseB){
  const c=document.createElement("canvas");
  c.width=c.height=512;
  const x=c.getContext("2d");
  const bump=document.createElement("canvas");
  bump.width=bump.height=512;
  const b=bump.getContext("2d");
  x.fillStyle=baseA;x.fillRect(0,0,512,512);
  b.fillStyle="#7f7f7f";b.fillRect(0,0,512,512);

  if(kind==="wood"){
    for(let i=0;i<70;i++){
      const y=i*7.4;
      x.fillStyle=i%2?baseB:"rgba(255,255,255,.025)";
      x.fillRect(0,y,512,2+Math.random()*3);
      b.fillStyle=i%2?"#6e6e6e":"#888";
      b.fillRect(0,y,512,2);
    }
    for(let i=0;i<35;i++){
      const y=Math.random()*512;
      x.strokeStyle="rgba(33,19,10,.11)";
      x.lineWidth=.6+Math.random()*2;
      x.beginPath();x.moveTo(-20,y);
      x.bezierCurveTo(120,y+50*(Math.random()-.5),310,y+70*(Math.random()-.5),540,y+30*(Math.random()-.5));
      x.stroke();
    }
  }
  if(kind==="slat"){
    for(let i=0;i<34;i++){
      const px=i*15;
      x.fillStyle=i%2?baseB:"rgba(10,10,10,.16)";
      x.fillRect(px,0,9,512);
      x.fillStyle="rgba(255,255,255,.035)";
      x.fillRect(px+1,0,1,512);
      b.fillStyle=i%2?"#9a9a9a":"#555";
      b.fillRect(px,0,9,512);
    }
  }
  if(kind==="marble"){
    for(let i=0;i<27;i++){
      const y=Math.random()*512;
      x.strokeStyle=i%4===0?"rgba(80,93,104,.35)":"rgba(120,131,141,.18)";
      x.lineWidth=.5+Math.random()*3;
      x.beginPath();x.moveTo(-30,y);
      x.bezierCurveTo(120,y+80*(Math.random()-.5),300,y-90*(Math.random()-.5),550,y+60*(Math.random()-.5));
      x.stroke();
      b.strokeStyle=i%4===0?"#696969":"#858585";
      b.lineWidth=1;x.lineWidth=1;
      b.beginPath();b.moveTo(-30,y);b.bezierCurveTo(120,y+30,300,y-35,550,y+18);b.stroke();
    }
  }
  if(kind==="stone"){
    for(let i=0;i<5200;i++){
      const v=Math.floor(45+Math.random()*75);
      const px=Math.random()*512,py=Math.random()*512,s=.5+Math.random()*2.8;
      x.fillStyle=`rgba(${v},${v},${v},.10)`;x.fillRect(px,py,s,s);
      b.fillStyle=Math.random()>.5?"#999":"#626262";b.fillRect(px,py,s,s);
    }
  }
  if(kind==="concrete"){
    for(let i=0;i<3400;i++){
      const v=100+Math.floor(Math.random()*70);
      x.fillStyle=`rgba(${v},${v},${v},.06)`;
      x.fillRect(Math.random()*512,Math.random()*512,1,1);
    }
  }

  const map=new THREE.CanvasTexture(c);
  const bumpMap=new THREE.CanvasTexture(bump);
  [map,bumpMap].forEach(t=>{
    t.colorSpace=t===map?THREE.SRGBColorSpace:THREE.NoColorSpace;
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  });
  return {map,bumpMap};
}

const T={
  walnut:texturePack("wood","#8b684c","#65472f"),
  parota:texturePack("slat","#895c3d","#4a2e20"),
  marble:texturePack("marble","#e5e2da","#b9bec6"),
  stone:texturePack("stone","#72675d","#554a42"),
  dark:texturePack("slat","#272d35","#12171d"),
  concrete:texturePack("concrete","#777f86","#59616a")
};
function pbr(pack,color=0xffffff,rough=.62,metal=.03,bumpScale=.06){
  return new THREE.MeshStandardMaterial({
    color, map:pack?.map||null, bumpMap:pack?.bumpMap||null, bumpScale,
    roughness:rough, metalness:metal
  });
}
const M={
  floor:pbr(T.walnut,0xffffff,.68,.02,.025),
  lambrin:pbr(T.parota,0xffffff,.58,.02,.05),
  marble:pbr(T.marble,0xffffff,.26,.03,.018),
  stone:pbr(T.stone,0xffffff,.86,.01,.075),
  dark:pbr(T.dark,0xffffff,.72,.16,.04),
  concrete:pbr(T.concrete,0xffffff,.82,.01,.018),
  black:new THREE.MeshStandardMaterial({color:0x10151c,roughness:.43,metalness:.42}),
  cyan:new THREE.MeshStandardMaterial({color:0x0e968d,roughness:.28,metalness:.34,emissive:0x043c38,emissiveIntensity:.7}),
  sand:new THREE.MeshStandardMaterial({color:0x9c7b5b,roughness:.62,metalness:.02}),
  white:new THREE.MeshStandardMaterial({color:0xe4e7eb,roughness:.40,metalness:.02}),
  glass:new THREE.MeshPhysicalMaterial({color:0xbce8ff,roughness:.08,transmission:.45,transparent:true,opacity:.42,metalness:0,ior:1.45}),
  emissive:new THREE.MeshStandardMaterial({color:0x56ffe8,emissive:0x27c9b8,emissiveIntensity:4,roughness:.35})
};

const colliders=[];
const worldMeshes=[];
function block(x,y,z,w,h,d,material,collide=true,cast=true){
  const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  q.position.set(x,y,z);q.castShadow=cast;q.receiveShadow=true;scene.add(q);worldMeshes.push(q);
  if(collide)colliders.push({minX:x-w/2-.34,maxX:x+w/2+.34,minZ:z-d/2-.34,maxZ:z+d/2+.34,w,d,x,z});
  return q;
}
function decoBlock(x,y,z,w,h,d,material){return block(x,y,z,w,h,d,material,false,true)}

block(0,-.28,0,62,.55,62,M.floor,false,false);
block(0,2.35,-30.4,62,4.7,.8,M.dark,true);
block(0,2.35,30.4,62,4.7,.8,M.dark,true);
block(-30.4,2.35,0,.8,4.7,62,M.dark,true);
block(30.4,2.35,0,.8,4.7,62,M.dark,true);

block(-17,2.05,-12,11,4.1,.65,M.lambrin,true);
block(16,2.05,-13,12,4.1,.65,M.marble,true);
block(-20,2.05,8,8,4.1,.65,M.stone,true);
block(19,2.05,10,9,4.1,.65,M.lambrin,true);

block(0,1.2,-2,10.5,2.4,3.5,M.black,true);
block(-9,.92,10,7.2,1.84,4.6,M.marble,true);
block(9,.92,11,7.2,1.84,4.6,M.stone,true);
block(-10,.92,-2,5.5,1.84,4.2,M.sand,true);
block(10,.92,-4,5.5,1.84,4.2,M.cyan,true);
block(0,.82,18,13,1.64,3.2,M.dark,true);
block(0,.82,-19,13,1.64,3.2,M.marble,true);

block(-23,1.45,-19,6,2.9,6,M.concrete,true);
block(23,1.45,19,6,2.9,6,M.concrete,true);
block(-23,1.45,19,6,2.9,6,M.marble,true);
block(23,1.45,-19,6,2.9,6,M.stone,true);

decoBlock(0,4.8,-8,20,.28,.45,M.sand);
decoBlock(-11,4.7,5,13,.3,.45,M.dark);
decoBlock(12,4.7,5,13,.3,.45,M.sand);
decoBlock(0,5.0,13,17,.22,.45,M.black);

for(let x=-26;x<=26;x+=8.6){
  const line=decoBlock(x,.12,26.5,4.2,.12,.33,Math.abs(x)%17<1?M.emissive:M.sand);
  line.castShadow=false;
}
for(let z=-25;z<=25;z+=10){
  const pillar=decoBlock(-28.5,2,z,.45,4,.45,M.black);
  const light=new THREE.PointLight(z%20===0?0x5eead4:0xffc98d,4.2,10,2);
  light.position.set(-27.4,3.3,z);scene.add(light);
}

const ceilingGlass=decoBlock(0,5.55,0,40,.08,18,M.glass);
ceilingGlass.material.side=THREE.DoubleSide;

function bannerTexture(title,sub,accent="#5eead4"){
  const c=document.createElement("canvas");c.width=1536;c.height=512;
  const x=c.getContext("2d");x.fillStyle="#081019";x.fillRect(0,0,c.width,c.height);
  x.fillStyle="#121d29";for(let i=0;i<22;i++)x.fillRect(i*80,0,1,c.height);
  x.fillStyle=accent;x.fillRect(80,105,10,295);
  x.fillStyle="#f8fafc";x.font="900 94px Arial";x.fillText(title,125,245);
  x.fillStyle="#718096";x.font="700 32px Arial";x.fillText(sub,128,305);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function banner(x,y,z,ry,title,sub){
  const q=new THREE.Mesh(new THREE.PlaneGeometry(9,3),new THREE.MeshBasicMaterial({map:bannerTexture(title,sub),toneMapped:false}));
  q.position.set(x,y,z);q.rotation.y=ry;scene.add(q);return q;
}
banner(0,3.1,-29.95,0,"UHOME // MATERIAL COMBAT","SHOWROOM ARENA · FREE FOR ALL");
banner(-29.95,3.0,0,Math.PI/2,"MATERIALS AS WEAPONS","SPC · WPC · BAMBOO · PIEDRA · MÁRMOL");

for(let i=0;i<8;i++){
  const light=new THREE.RectAreaLight(i%2?0xd9f8ff:0xffe6c7,3.2,5,1.2);
  light.position.set(-21+i*6,5.2,0);
  light.rotation.x=-Math.PI/2;
  scene.add(light);
}

const remotePlayers=new Map();
const playerCache=new Map();
let socket,selfId,me,weapons=[],activeIndex=0,connected=false,alive=true;
let ammoMap={},roundEndsAt=Date.now()+300000,lastState=0,reloadUntil=0,reloading=false;
let firing=false,lastLocalShot=0;
let velocity=new THREE.Vector3();
let bobTime=0,recoil=0,streak=0;
let weaponView=null,muzzleLight=null,muzzleMesh=null;
let ads=false,adsAmount=0,swayX=0,swayY=0;
let touchMove={x:0,y:0},touchJump=false,touchSlide=false;
let slideActive=false,slideTime=0,slideVelocity=new THREE.Vector3();
let jumpsRemaining=2,jumpQueued=false;
let lastSnapshotPlayers=[];
const keys={};
const visualRay=new THREE.Raycaster();

function wsUrl(){return(location.protocol==="https:"?"wss":"ws")+"://"+location.host+"/ws"}

function feed(text,color="#5eead4"){
  const e=document.createElement("div");
  e.className="feed-item";e.textContent=text;e.style.borderRightColor=color;
  $("feed").appendChild(e);
  setTimeout(()=>e.remove(),3600);
}
function setHealth(v){
  const hp=Math.max(0,Math.min(100,v));
  $("health").textContent=Math.round(hp);
  $("healthFill").style.width=hp+"%";
  $("healthFill").style.background=hp>60
    ?"linear-gradient(90deg,#5eead4,#9fe870)"
    :hp>28?"linear-gradient(90deg,#f59e0b,#facc15)"
    :"linear-gradient(90deg,#ef4444,#fb7185)";
}
function playerName(id){
  if(id===selfId)return $("operatorName").textContent||"TÚ";
  return playerCache.get(id)?.name||"OPERADOR";
}
function scoreRows(list){
  lastSnapshotPlayers=list;
  list.forEach(p=>playerCache.set(p.id,p));
  const sorted=[...list].sort((a,b)=>b.kills-a.kills||b.score-a.score);

  $("scores").innerHTML=sorted.slice(0,7).map((p,i)=>
    '<div class="score-row"><span>'+(i+1)+'</span><span class="name">'+p.name+'</span><b>'+p.kills+'</b><em>'+p.deaths+'</em></div>'
  ).join("");

  $("tabScores").innerHTML=sorted.map((p,i)=>
    '<div class="tab-row"><span>'+(i+1)+'</span><span>'+p.name+'</span><b>'+p.kills+'</b><b>'+p.deaths+'</b><b>'+p.score+'</b></div>'
  ).join("");
}
function avatar(p){
  const g=new THREE.Group();
  g.userData.name=p.name;

  const bodyMat=new THREE.MeshStandardMaterial({color:p.id.charCodeAt(0)%2?0x174e70:0x355a4f,roughness:.50,metalness:.16});
  const darkMat=new THREE.MeshStandardMaterial({color:0x111820,roughness:.42,metalness:.36});
  const skin=new THREE.MeshStandardMaterial({color:0xd8ad89,roughness:.78});

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.36,.92,5,10),bodyMat);
  torso.position.y=.88;torso.castShadow=true;g.add(torso);

  const vest=new THREE.Mesh(new THREE.BoxGeometry(.64,.62,.34),darkMat);
  vest.position.set(0,.92,-.11);vest.castShadow=true;g.add(vest);

  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,18,14),skin);
  head.position.y=1.62;head.castShadow=true;g.add(head);

  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.265,18,10,0,Math.PI*2,0,Math.PI*.58),darkMat);
  helmet.position.y=1.69;helmet.castShadow=true;g.add(helmet);

  const gun=new THREE.Group();
  gun.position.set(.30,1.0,-.21);
  const receiver=new THREE.Mesh(new THREE.BoxGeometry(.17,.16,.58),darkMat);
  receiver.position.z=-.15;gun.add(receiver);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.48,8),darkMat);
  barrel.rotation.x=Math.PI/2;barrel.position.z=-.55;gun.add(barrel);
  g.add(gun);

  scene.add(g);
  const a={root:g,target:new THREE.Vector3(p.x,p.y-1.72,p.z),yaw:p.yaw,hp:p.hp};
  remotePlayers.set(p.id,a);
  return a;
}
function syncPlayers(list){
  const seen=new Set();
  for(const p of list){
    seen.add(p.id);
    playerCache.set(p.id,p);
    if(p.id===selfId){
      me=p;
      $("kills").textContent=p.kills;
      $("deaths").textContent=p.deaths;
      if(alive!==p.alive){
        alive=p.alive;
        if(!alive)showRespawn();
      }
      setHealth(p.hp);
      continue;
    }

    const r=remotePlayers.get(p.id)||avatar(p);
    r.root.userData.name=p.name;
    r.target.set(p.x,p.y-1.72,p.z);
    r.yaw=p.yaw;
    r.hp=p.hp;
    r.root.visible=p.alive;
  }

  for(const [id,r] of remotePlayers){
    if(!seen.has(id)){
      scene.remove(r.root);
      remotePlayers.delete(id);
    }
  }
}
function updateRemote(dt){
  for(const r of remotePlayers.values()){
    r.root.position.lerp(r.target,Math.min(1,dt*13));
    r.root.rotation.y=THREE.MathUtils.lerp(r.root.rotation.y,r.yaw,Math.min(1,dt*11));
  }
}

function clearWeapon(){
  if(!weaponView)return;
  camera.remove(weaponView);
  weaponView.traverse(o=>{
    if(o.geometry)o.geometry.dispose();
    if(o.material&&o.material.dispose)o.material.dispose();
  });
  weaponView=null;
}
function meshBox(g,size,pos,material,rot=null){
  const m=new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]),material);
  m.position.set(pos[0],pos[1],pos[2]);
  if(rot)m.rotation.set(rot[0],rot[1],rot[2]);
  m.castShadow=false;g.add(m);return m;
}
function meshCylinder(g,r1,r2,len,pos,rot,material,segments=12){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,segments),material);
  m.position.set(...pos);m.rotation.set(...rot);g.add(m);return m;
}
function buildWeapon(w){
  clearWeapon();
  const g=new THREE.Group();
  g.position.set(.43,-.36,-.74);
  g.rotation.set(-.055,-.015,0);

  const base=new THREE.Color(w.color);
  const accent=new THREE.Color(w.accent);
  const receiverMat=new THREE.MeshStandardMaterial({color:base,roughness:.28,metalness:.62});
  const metalMat=new THREE.MeshStandardMaterial({color:0x202832,roughness:.23,metalness:.83});
  const polymerMat=new THREE.MeshStandardMaterial({color:0x10161d,roughness:.47,metalness:.18});
  const accentMat=new THREE.MeshStandardMaterial({color:accent,roughness:.22,metalness:.38,emissive:accent,emissiveIntensity:.42});

  meshBox(g,[.25,.20,.72],[0,0,-.10],receiverMat);
  meshBox(g,[.18,.15,.46],[0,.15,-.16],polymerMat);
  meshBox(g,[.19,.12,.52],[0,-.05,-.56],polymerMat);
  meshCylinder(g,.040,.050,.58,[0,0,-.96],[Math.PI/2,0,0],metalMat);
  meshCylinder(g,.060,.064,.15,[0,0,-1.28],[Math.PI/2,0,0],metalMat);
  meshBox(g,[.12,.35,.17],[0,-.27,.08],polymerMat,[-.17,0,0]);
  meshBox(g,[.17,.17,.38],[0,.0,.47],receiverMat);
  meshBox(g,[.15,.05,.86],[0,.18,-.16],metalMat);
  meshBox(g,[.06,.045,.28],[0,.225,-.15],accentMat);

  const mag=meshBox(g,[.14,.37,.19],[0,-.28,-.19],polymerMat,[.10,0,0]);
  mag.name="magazine";

  if(w.id==="marmol_dmr"){
    meshCylinder(g,.058,.058,.32,[0,.28,-.05],[0,0,Math.PI/2],metalMat);
    meshCylinder(g,.082,.082,.08,[-.18,.28,-.05],[0,0,Math.PI/2],polymerMat);
    meshCylinder(g,.082,.082,.08,[.18,.28,-.05],[0,0,Math.PI/2],polymerMat);
  }
  if(w.id==="ultraflex_cannon"){
    g.scale.set(1.22,1.18,1.15);
    meshCylinder(g,.072,.082,.62,[0,.01,-.98],[Math.PI/2,0,0],metalMat,16);
  }
  if(w.id==="bamboo_smg"){
    g.scale.set(.92,.92,.82);
    g.position.z=-.68;
  }
  if(w.id==="wpc_heavy"){
    meshBox(g,[.24,.10,.42],[0,-.13,-.48],receiverMat);
    g.scale.set(1.12,1.08,1.08);
  }

  muzzleLight=new THREE.PointLight(accent,0,5.5,2);
  muzzleLight.position.set(0,.01,-1.40);
  g.add(muzzleLight);

  muzzleMesh=new THREE.Mesh(
    new THREE.ConeGeometry(.11,.32,9),
    new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  muzzleMesh.rotation.x=-Math.PI/2;
  muzzleMesh.position.set(0,.01,-1.43);
  g.add(muzzleMesh);

  camera.add(g);
  weaponView=g;
}
function renderWeapons(){
  $("weaponBar").innerHTML=weapons.map((w,i)=>
    '<div class="weapon-slot '+(i===activeIndex?"active":"")+'"><b>'+(i+1)+'</b><span>'+w.name+'</span></div>'
  ).join("");
}
function selectWeapon(i){
  if(!weapons.length)return;
  activeIndex=(i+weapons.length)%weapons.length;
  const w=weapons[activeIndex];
  preselectedWeaponId=w.id;
  $("weaponName").textContent=w.name;
  $("productName").textContent=w.product;
  $("mag").textContent=w.mag;
  $("ammo").textContent=ammoMap[w.id]??w.mag;
  $("reloadHint").classList.toggle("hidden",(ammoMap[w.id]??w.mag)>Math.ceil(w.mag*.2));
  renderWeapons();
  buildWeapon(w);
  reloadUntil=0;
  reloading=false;
}
function currentWeapon(){return weapons[activeIndex]}
function setAmmo(id,n){
  ammoMap[id]=n;
  const w=weapons.find(x=>x.id===id);
  if(currentWeapon()?.id===id){
    $("ammo").textContent=n;
    $("reloadHint").classList.toggle("hidden",n>Math.ceil((w?.mag||30)*.2));
  }
}

let audioCtx=null;
function initAudio(){
  if(audioCtx)return;
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
}
function noiseBurst(duration=.055,volume=.12,filterFreq=1300){
  if(!audioCtx)return;
  const frames=Math.floor(audioCtx.sampleRate*duration);
  const buf=audioCtx.createBuffer(1,frames,audioCtx.sampleRate);
  const data=buf.getChannelData(0);
  for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*(1-i/frames);
  const src=audioCtx.createBufferSource();src.buffer=buf;
  const filter=audioCtx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=filterFreq;
  const gain=audioCtx.createGain();gain.gain.value=volume;
  src.connect(filter).connect(gain).connect(audioCtx.destination);src.start();
}
function tone(freq,duration=.05,volume=.05,type="square"){
  if(!audioCtx)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
  o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
}
function shotAudio(w){
  noiseBurst(w.id==="ultraflex_cannon"?.12:.055,w.id==="ultraflex_cannon"?.20:.105,w.id==="bamboo_smg"?1800:1150);
  tone(w.id==="marmol_dmr"?105:w.id==="ultraflex_cannon"?68:145,.045,.028,"sawtooth");
}
function hitAudio(killed){tone(killed?880:640,killed?.09:.04,killed?.065:.035,"sine")}

function localImpact(){
  const dir=new THREE.Vector3();camera.getWorldDirection(dir);
  visualRay.set(camera.position,dir);
  visualRay.far=currentWeapon()?.range||70;
  const hit=visualRay.intersectObjects(worldMeshes,false)[0];
  if(!hit)return;

  const mat=new THREE.MeshBasicMaterial({color:0xffe6b0,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
  const spark=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),mat);
  spark.position.copy(hit.point);
  scene.add(spark);
  let t=0;
  const animate=()=>{
    t+=.045;
    spark.scale.setScalar(1+t*5);
    spark.material.opacity=1-t*2.4;
    if(t<.40)requestAnimationFrame(animate);
    else{scene.remove(spark);spark.geometry.dispose();spark.material.dispose()}
  };
  animate();

  for(let i=0;i<4;i++){
    const p=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,.055),new THREE.MeshBasicMaterial({color:0xffc56f}));
    p.position.copy(hit.point);
    scene.add(p);
    const v=new THREE.Vector3((Math.random()-.5)*3,Math.random()*2.7,(Math.random()-.5)*3);
    let life=0;
    const tick=()=>{
      life+=.032;p.position.addScaledVector(v,.032);v.y-=3*.032;
      if(life<.25)requestAnimationFrame(tick);else{scene.remove(p);p.geometry.dispose();p.material.dispose()}
    };
    tick();
  }
}
function ejectShell(){
  if(!weaponView)return;
  const shell=new THREE.Mesh(
    new THREE.CylinderGeometry(.013,.013,.065,7),
    new THREE.MeshStandardMaterial({color:0xc59a4b,roughness:.35,metalness:.72})
  );
  camera.add(shell);
  shell.position.set(.52,-.22,-.76);
  shell.rotation.z=Math.PI/2;
  const v=new THREE.Vector3(.8,.5,.4);
  let life=0;
  const tick=()=>{
    life+=.016;
    shell.position.addScaledVector(v,.016);
    shell.rotation.x+=.25;shell.rotation.z+=.18;v.y-=1.5*.016;
    if(life<.35)requestAnimationFrame(tick);
    else{camera.remove(shell);shell.geometry.dispose();shell.material.dispose()}
  };
  tick();
}
function tracer(origin,dir,color,hitId){
  const start=new THREE.Vector3(origin.x,origin.y,origin.z);
  let end=start.clone().add(new THREE.Vector3(dir.x,dir.y,dir.z).multiplyScalar(72));
  if(hitId){
    const r=remotePlayers.get(hitId);
    if(r)end=r.root.position.clone().add(new THREE.Vector3(0,1.05,0));
  }
  const geo=new THREE.BufferGeometry().setFromPoints([start,end]);
  const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.92,blending:THREE.AdditiveBlending}));
  scene.add(line);
  setTimeout(()=>{scene.remove(line);geo.dispose();line.material.dispose()},72);
}
function sparkAtPlayer(id,color){
  const r=remotePlayers.get(id);if(!r)return;
  for(let i=0;i<7;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(.021,5,4),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));
    m.position.copy(r.root.position).add(new THREE.Vector3((Math.random()-.5)*.7,.65+Math.random()*1.1,(Math.random()-.5)*.7));
    scene.add(m);
    const v=new THREE.Vector3((Math.random()-.5)*2.5,Math.random()*2.3,(Math.random()-.5)*2.5);
    let t=0;
    const tick=()=>{
      t+=.03;m.position.addScaledVector(v,.03);m.material.opacity=1-t*2.3;
      if(t<.42)requestAnimationFrame(tick);else{scene.remove(m);m.geometry.dispose();m.material.dispose()}
    };
    tick();
  }
}
function hitmarker(killed=false){
  const h=$("hitmarker");
  h.textContent=killed?"✦":"×";
  h.style.color=killed?"#fb7185":"#ffffff";
  h.classList.remove("hidden");
  hitAudio(killed);
  setTimeout(()=>h.classList.add("hidden"),killed?190:105);
}
function flashDamage(){
  $("damageFlash").style.opacity="1";
  setTimeout(()=>$("damageFlash").style.opacity="0",90);
}
function showRespawn(){
  $("respawn").classList.remove("hidden");
  firing=false;ads=false;streak=0;$("streak").textContent=streak;
}

function handle(msg){
  if(msg.type==="welcome"){
    selfId=msg.id;me=msg.player;weapons=msg.weapons;ammoMap=msg.ammo||{};
    connected=true;alive=true;roundEndsAt=msg.snapshot.roundEndsAt;
    camera.position.set(me.x,me.y,me.z);
    $("operatorName").textContent=me.name.toUpperCase();
    const wanted=weapons.findIndex(w=>w.id===preselectedWeaponId);
    selectWeapon(wanted>=0?wanted:0);
    $("hud").classList.remove("hidden");
    $("menu").classList.add("hidden");
    if(innerWidth<821)$("touchControls").classList.remove("hidden");else controls.lock();
    syncPlayers(msg.snapshot.players);
    scoreRows(msg.snapshot.players);
    setHealth(100);
    feed("ENTRANDO A SHOWROOM ARENA");
  }

  if(msg.type==="snapshot"){
    roundEndsAt=msg.roundEndsAt;
    $("round").textContent=msg.round;
    syncPlayers(msg.players);
    scoreRows(msg.players);
    $("players").textContent=msg.players.length+" JUGADOR"+(msg.players.length===1?"":"ES");
  }

  if(msg.type==="ammo"){
    setAmmo(msg.weaponId,msg.ammo);
    if(msg.reloaded){
      reloading=false;
      reloadUntil=0;
      tone(260,.035,.022,"square");
    }
  }

  if(msg.type==="empty"){
    if(msg.weaponId===currentWeapon()?.id)reload();
  }

  if(msg.type==="shot"){
    const w=weapons.find(x=>x.id===msg.weaponId);
    tracer(msg.origin,msg.dir,w?.accent||"#fff",msg.hitId);
    if(msg.shooterId===selfId){
      if(muzzleLight)muzzleLight.intensity=35;
      if(muzzleMesh)muzzleMesh.material.opacity=1;
      setTimeout(()=>{
        if(muzzleLight)muzzleLight.intensity=0;
        if(muzzleMesh)muzzleMesh.material.opacity=0;
      },38);
    }
    if(msg.hitId)sparkAtPlayer(msg.hitId,w?.accent||"#fff");
  }

  if(msg.type==="hitConfirm")hitmarker(msg.killed);

  if(msg.type==="damage"&&msg.targetId===selfId){
    setHealth(msg.hp);
    flashDamage();
  }

  if(msg.type==="elimination"){
    const killer=playerName(msg.killerId);
    const victim=playerName(msg.victimId);
    const w=weapons.find(x=>x.id===msg.weaponId);
    feed(killer+"  //  "+(w?.name||"WEAPON")+"  //  "+victim,msg.killerId===selfId?"#5eead4":"#fb7185");

    if(msg.killerId===selfId){
      streak++;
      $("streak").textContent=streak;
    }
    if(msg.victimId===selfId){
      alive=false;
      setHealth(0);
      showRespawn();
    }
  }

  if(msg.type==="respawn"){
    if(msg.player.id===selfId){
      alive=true;
      camera.position.set(msg.player.x,msg.player.y,msg.player.z);
      velocity.set(0,0,0);
      jumpsRemaining=2;
      setHealth(100);
      $("respawn").classList.add("hidden");
      feed("OPERADOR REINSERTADO");
    }else{
      const r=remotePlayers.get(msg.player.id);
      if(r)r.root.visible=true;
    }
  }

  if(msg.type==="roundReset"){
    roundEndsAt=msg.roundEndsAt;
    $("round").textContent=msg.round;
    streak=0;$("streak").textContent=0;
    feed("NUEVA RONDA","#f59e0b");
  }

  if(msg.type==="playerJoined"&&msg.player.id!==selfId)feed(msg.player.name+" CONECTADO");
  if(msg.type==="playerLeft"){
    const r=remotePlayers.get(msg.id);
    if(r){scene.remove(r.root);remotePlayers.delete(msg.id)}
  }
  if(msg.type==="error")feed(msg.message||"ERROR","#fb7185");
}

function connect(name){
  socket=new WebSocket(wsUrl());
  socket.onopen=()=>socket.send(JSON.stringify({type:"join",name}));
  socket.onmessage=e=>{try{handle(JSON.parse(e.data))}catch(err){console.error(err)}};
  socket.onclose=()=>{connected=false;feed("CONEXIÓN PERDIDA","#fb7185")};
}

function collides(x,z){
  for(const c of colliders){
    if(x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ)return true;
  }
  return false;
}
function beginSlide(){
  if(slideActive||!alive)return;
  const planar=new THREE.Vector3(velocity.x,0,velocity.z);
  if(planar.length()<7.5)return;
  slideActive=true;slideTime=0;
  slideVelocity.copy(planar).normalize().multiplyScalar(Math.max(planar.length()*1.22,13.4));
}
function endSlide(){slideActive=false;slideTime=0}
function queueJump(){jumpQueued=true}

function move(dt){
  if(!connected||!alive)return;
  const touch=innerWidth<821;
  if(!controls.isLocked&&!touch)return;

  const grounded=camera.position.y<=1.721;
  if(grounded){
    camera.position.y=1.72;
    if(velocity.y<0)velocity.y=0;
    jumpsRemaining=2;
  }

  if((keys.ControlLeft||keys.ControlRight||touchSlide)&&grounded)beginSlide();
  if(slideActive){
    slideTime+=dt;
    slideVelocity.multiplyScalar(Math.pow(.22,dt));
    velocity.x=slideVelocity.x;velocity.z=slideVelocity.z;
    if(slideTime>.78||slideVelocity.length()<5.4||(!keys.ControlLeft&&!keys.ControlRight&&!touchSlide))endSlide();
  }else{
    const sprint=keys.ShiftLeft||keys.ShiftRight;
    const speed=sprint?12.6:8.25;
    const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();
    const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
    const wish=new THREE.Vector3();
    const fy=(keys.KeyW?1:0)-(keys.KeyS?1:0)+touchMove.y;
    const fx=(keys.KeyD?1:0)-(keys.KeyA?1:0)+touchMove.x;
    if(fy)wish.addScaledVector(forward,fy);
    if(fx)wish.addScaledVector(right,fx);
    if(wish.lengthSq()>1)wish.normalize();
    wish.multiplyScalar(speed);

    const damp=grounded?25:7.2;
    velocity.x=THREE.MathUtils.damp(velocity.x,wish.x,damp,dt);
    velocity.z=THREE.MathUtils.damp(velocity.z,wish.z,damp,dt);
  }

  if(jumpQueued||touchJump){
    jumpQueued=false;touchJump=false;
    if(grounded||jumpsRemaining>0){
      if(!grounded)jumpsRemaining--;
      else jumpsRemaining=1;
      velocity.y=9.55;
      if(Math.hypot(velocity.x,velocity.z)>8){
        const dir=new THREE.Vector3(velocity.x,0,velocity.z).normalize();
        velocity.x+=dir.x*.65;velocity.z+=dir.z*.65;
      }
      endSlide();
    }
  }

  velocity.y-=25.2*dt;

  const nx=THREE.MathUtils.clamp(camera.position.x+velocity.x*dt,-29.7,29.7);
  const nz=THREE.MathUtils.clamp(camera.position.z+velocity.z*dt,-29.7,29.7);

  if(!collides(nx,camera.position.z))camera.position.x=nx;else velocity.x=0;
  if(!collides(camera.position.x,nz))camera.position.z=nz;else velocity.z=0;

  camera.position.y+=velocity.y*dt;
  if(camera.position.y<1.72){camera.position.y=1.72;velocity.y=0}

  const planarSpeed=Math.hypot(velocity.x,velocity.z);
  bobTime+=dt*planarSpeed*.38;

  adsAmount=THREE.MathUtils.damp(adsAmount,ads?1:0,14,dt);
  camera.fov=THREE.MathUtils.lerp(76,55,adsAmount);
  camera.updateProjectionMatrix();

  const crossSpread=3+Math.min(8,planarSpeed*.5)+recoil*4;
  const cross=$("crosshair");
  const lines=cross.querySelectorAll("i");
  lines[0].style.transform=`translateX(-${crossSpread}px)`;
  lines[1].style.transform=`translateX(${crossSpread}px)`;
  lines[2].style.transform=`translateY(-${crossSpread}px)`;
  lines[3].style.transform=`translateY(${crossSpread}px)`;

  if(weaponView){
    const moving=planarSpeed>.6;
    const baseX=THREE.MathUtils.lerp(.43,.03,adsAmount);
    const baseY=THREE.MathUtils.lerp(-.36,-.20,adsAmount);
    const baseZ=THREE.MathUtils.lerp(-.74,-.62,adsAmount);

    const bobX=moving&&!ads?Math.sin(bobTime*6.8)*.014:0;
    const bobY=moving&&!ads?Math.abs(Math.cos(bobTime*6.8))*.013:0;
    const reloadDrop=reloading?Math.sin(Math.min(1,(Date.now()-(reloadUntil-currentWeapon().reload))/currentWeapon().reload)*Math.PI)*.26:0;

    weaponView.position.x=baseX+bobX+swayX*(ads?.00025:.0006);
    weaponView.position.y=baseY+bobY-recoil*.026-reloadDrop;
    weaponView.position.z=baseZ;
    weaponView.rotation.x=-.055+recoil*.065+swayY*.0005;
    weaponView.rotation.y=-.015+swayX*.0007;
    weaponView.rotation.z=slideActive?-.09:0;

    recoil=THREE.MathUtils.damp(recoil,0,18,dt);
    swayX=THREE.MathUtils.damp(swayX,0,10,dt);
    swayY=THREE.MathUtils.damp(swayY,0,10,dt);
  }
}
function network(now){
  if(socket?.readyState===1&&selfId&&now-lastState>66){
    lastState=now;
    socket.send(JSON.stringify({
      type:"state",x:camera.position.x,y:camera.position.y,z:camera.position.z,
      yaw:camera.rotation.y,pitch:camera.rotation.x,weaponId:currentWeapon()?.id
    }));
  }
}
function shoot(now=performance.now()){
  if(!connected||!alive||Date.now()<reloadUntil)return;
  const w=currentWeapon();if(!w)return;
  const localAmmo=ammoMap[w.id]??w.mag;
  if(localAmmo<=0){reload();return}
  if(now-lastLocalShot<w.fireRate)return;

  lastLocalShot=now;
  ammoMap[w.id]=localAmmo-1;
  setAmmo(w.id,localAmmo-1);

  const dir=new THREE.Vector3();camera.getWorldDirection(dir);
  const recoilYaw=(Math.random()-.5)*(ads?.0008:.0023);
  const recoilPitch=(ads?.0014:.0034);
  dir.applyAxisAngle(new THREE.Vector3(0,1,0),recoilYaw);
  camera.rotation.x=Math.max(-1.45,camera.rotation.x-recoilPitch);

  socket.send(JSON.stringify({type:"shoot",weaponId:w.id,dir:{x:dir.x,y:dir.y,z:dir.z}}));

  recoil=Math.min(2.4,recoil+(w.id==="ultraflex_cannon"?1.75:w.id==="marmol_dmr"?1.2:.82));
  if(muzzleLight)muzzleLight.intensity=44;
  if(muzzleMesh)muzzleMesh.material.opacity=1;
  setTimeout(()=>{
    if(muzzleLight)muzzleLight.intensity=0;
    if(muzzleMesh)muzzleMesh.material.opacity=0;
  },34);

  shotAudio(w);
  localImpact();
  ejectShell();
}
function reload(){
  if(!connected||!alive)return;
  const w=currentWeapon();if(!w)return;
  if((ammoMap[w.id]??w.mag)>=w.mag||Date.now()<reloadUntil)return;
  reloadUntil=Date.now()+w.reload;
  reloading=true;
  firing=false;
  socket.send(JSON.stringify({type:"reload",weaponId:w.id}));
  $("ammo").textContent="R";
  $("reloadHint").classList.add("hidden");
  tone(180,.025,.018,"square");
  setTimeout(()=>tone(240,.025,.018,"square"),Math.max(120,w.reload-260));
}
function firingLoop(now){
  if(firing&&alive&&currentWeapon()?.mode==="auto")shoot(now);
}
function timer(){
  const s=Math.ceil(Math.max(0,roundEndsAt-Date.now())/1000);
  $("timer").textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
}

function drawMinimap(){
  const c=$("minimap");if(!c)return;
  const x=c.getContext("2d"),w=c.width,h=c.height;
  x.clearRect(0,0,w,h);
  x.fillStyle="#060b11";x.fillRect(0,0,w,h);

  const scale=w/62;
  const tx=v=>(v+31)*scale;
  const tz=v=>(v+31)*scale;

  x.strokeStyle="rgba(255,255,255,.07)";
  x.lineWidth=1;
  for(let i=0;i<=62;i+=10){
    x.beginPath();x.moveTo(i*scale,0);x.lineTo(i*scale,h);x.stroke();
    x.beginPath();x.moveTo(0,i*scale);x.lineTo(w,i*scale);x.stroke();
  }

  x.fillStyle="rgba(148,163,184,.18)";
  for(const c0 of colliders){
    if(c0.w>40||c0.d>40)continue;
    x.fillRect(tx(c0.minX),tz(c0.minZ),(c0.maxX-c0.minX)*scale,(c0.maxZ-c0.minZ)*scale);
  }

  for(const p of lastSnapshotPlayers){
    if(!p.alive)continue;
    x.beginPath();
    x.fillStyle=p.id===selfId?"#5eead4":"#fb7185";
    x.arc(tx(p.x),tz(p.z),p.id===selfId?4.2:3,0,Math.PI*2);
    x.fill();
  }

  if(selfId){
    x.save();
    x.translate(tx(camera.position.x),tz(camera.position.z));
    x.rotate(-camera.rotation.y);
    x.fillStyle="#ffffff";
    x.beginPath();x.moveTo(0,-8);x.lineTo(4,4);x.lineTo(-4,4);x.closePath();x.fill();
    x.restore();
  }

  const grad=x.createRadialGradient(w/2,h/2,20,w/2,h/2,w*.72);
  grad.addColorStop(0,"rgba(0,0,0,0)");
  grad.addColorStop(1,"rgba(0,0,0,.55)");
  x.fillStyle=grad;x.fillRect(0,0,w,h);
}

document.addEventListener("contextmenu",e=>e.preventDefault());
document.addEventListener("mousedown",e=>{
  if(!controls.isLocked)return;
  if(e.button===0){
    const w=currentWeapon();if(!w)return;
    firing=true;shoot();
    if(w.mode!=="auto")firing=false;
  }
  if(e.button===2)ads=true;
});
document.addEventListener("mouseup",e=>{
  if(e.button===0)firing=false;
  if(e.button===2)ads=false;
});
document.addEventListener("mousemove",e=>{
  if(!controls.isLocked)return;
  swayX=Math.max(-18,Math.min(18,swayX+e.movementX));
  swayY=Math.max(-14,Math.min(14,swayY+e.movementY));
});
document.addEventListener("wheel",e=>{
  if(connected)selectWeapon(activeIndex+(e.deltaY>0?1:-1));
},{passive:true});

addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(/^Digit[1-6]$/.test(e.code)&&connected)selectWeapon(Number(e.code.slice(5))-1);
  if(e.code==="KeyR")reload();
  if(e.code==="Space"){e.preventDefault();queueJump()}
  if(e.code==="Tab"){e.preventDefault();$("tabBoard").classList.remove("hidden")}
  if((e.code==="ControlLeft"||e.code==="ControlRight")&&!e.repeat)beginSlide();
});
addEventListener("keyup",e=>{
  keys[e.code]=false;
  if(e.code==="Tab")$("tabBoard").classList.add("hidden");
  if(e.code==="ControlLeft"||e.code==="ControlRight")endSlide();
});

$("play").onclick=()=>{
  initAudio();
  if(connected){
    $("menu").classList.add("hidden");
    if(innerWidth>=821)controls.lock();
    return;
  }
  connect($("name").value.trim()||"OPERADOR");
};
controls.addEventListener("unlock",()=>{
  ads=false;firing=false;
  if(connected&&innerWidth>=821){
    $("menu").classList.remove("hidden");
    $("play").querySelector("span").textContent="VOLVER AL COMBATE";
  }
});

let stickId=null,lookId=null,lastLook={x:0,y:0};
const base=$("stickBase"),knob=$("stickKnob"),look=$("lookPad");
base.addEventListener("touchstart",e=>{stickId=e.changedTouches[0].identifier},{passive:false});
base.addEventListener("touchmove",e=>{
  e.preventDefault();
  const t=[...e.changedTouches].find(x=>x.identifier===stickId);if(!t)return;
  const q=base.getBoundingClientRect(),cx=q.left+q.width/2,cy=q.top+q.height/2;
  let dx=t.clientX-cx,dy=t.clientY-cy;
  const len=Math.hypot(dx,dy),max=42;
  if(len>max){dx=dx/len*max;dy=dy/len*max}
  touchMove.x=dx/max;touchMove.y=-dy/max;
  knob.style.transform="translate("+dx+"px,"+dy+"px)";
},{passive:false});
base.addEventListener("touchend",()=>{touchMove={x:0,y:0};knob.style.transform="translate(0,0)"});

look.addEventListener("touchstart",e=>{
  const t=e.changedTouches[0];lookId=t.identifier;lastLook={x:t.clientX,y:t.clientY}
},{passive:false});
look.addEventListener("touchmove",e=>{
  e.preventDefault();
  const t=[...e.changedTouches].find(x=>x.identifier===lookId);if(!t)return;
  const dx=t.clientX-lastLook.x,dy=t.clientY-lastLook.y;
  lastLook={x:t.clientX,y:t.clientY};
  camera.rotation.y-=dx*.0041;
  camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-dy*.0041,-1.45,1.45);
},{passive:false});

$("jumpBtn").addEventListener("touchstart",e=>{e.preventDefault();touchJump=true},{passive:false});
$("slideBtn").addEventListener("touchstart",e=>{e.preventDefault();touchSlide=true;beginSlide()},{passive:false});
$("slideBtn").addEventListener("touchend",e=>{e.preventDefault();touchSlide=false;endSlide()},{passive:false});
$("reloadBtn").addEventListener("touchstart",e=>{e.preventDefault();reload()},{passive:false});
$("actionBtn").addEventListener("touchstart",e=>{e.preventDefault();firing=true;shoot()},{passive:false});
$("actionBtn").addEventListener("touchend",e=>{e.preventDefault();firing=false},{passive:false});

let prev=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(.042,(now-prev)/1000);prev=now;
  move(dt);
  updateRemote(dt);
  network(now);
  firingLoop(now);
  timer();
  drawMinimap();
  composer.render();
}
requestAnimationFrame(loop);

function resize(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth>3000?1.15:1.8));
  renderer.setSize(innerWidth,innerHeight,false);
  composer.setSize(innerWidth,innerHeight);
  bloom.setSize(innerWidth,innerHeight);
  $("qualityBadge").textContent=innerWidth>=3000?"ULTRA // 4K NATIVE":"ULTRA // HIGH";
}
addEventListener("resize",resize);
resize();

setTimeout(()=>{
  $("boot").style.opacity="0";
  setTimeout(()=>$("boot").remove(),480);
},650);
