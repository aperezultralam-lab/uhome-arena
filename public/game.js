import * as THREE from "three";
import {PointerLockControls} from "three/addons/controls/PointerLockControls.js";

const $=id=>document.getElementById(id);

const renderer=new THREE.WebGLRenderer({canvas:$("game"),antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8aa8c2);
scene.fog=new THREE.FogExp2(0x8aa8c2,.0125);

const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.08,180);
camera.position.set(0,1.72,18);
scene.add(camera);
const controls=new PointerLockControls(camera,document.body);

scene.add(new THREE.HemisphereLight(0xdff4ff,0x3d332b,1.8));
const sun=new THREE.DirectionalLight(0xfff4df,3.6);
sun.position.set(16,30,12);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;
scene.add(sun);

const cool=new THREE.PointLight(0x2dd4ff,15,24,2);
cool.position.set(-8,5,-4);scene.add(cool);
const warm=new THREE.PointLight(0xffb45f,13,22,2);
warm.position.set(12,4,10);scene.add(warm);

function canvasTexture(kind,a,b){
 const c=document.createElement("canvas");c.width=c.height=256;
 const x=c.getContext("2d");
 x.fillStyle=a;x.fillRect(0,0,256,256);
 if(kind==="wood"){
  for(let i=0;i<34;i++){x.fillStyle=i%2?b:"rgba(255,255,255,.04)";x.fillRect(0,i*8,256,2+Math.random()*3)}
  for(let i=0;i<16;i++){x.strokeStyle="rgba(30,16,8,.10)";x.beginPath();x.moveTo(0,Math.random()*256);x.bezierCurveTo(70,Math.random()*256,160,Math.random()*256,256,Math.random()*256);x.stroke()}
 }else if(kind==="marble"){
  for(let i=0;i<15;i++){x.strokeStyle=i%3===0?"rgba(114,123,135,.40)":"rgba(144,151,161,.20)";x.lineWidth=1+Math.random()*3;x.beginPath();let y=Math.random()*256;x.moveTo(-20,y);x.bezierCurveTo(60,y+40*Math.random(),120,y-50*Math.random(),280,y+20*Math.random());x.stroke()}
 }else if(kind==="stone"){
  for(let i=0;i<1400;i++){const v=Math.floor(35+Math.random()*55);x.fillStyle="rgba("+v+","+v+","+v+",.10)";x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*2,1+Math.random()*2)}
 }else if(kind==="slat"){
  for(let i=0;i<20;i++){x.fillStyle=i%2?b:"rgba(0,0,0,.20)";x.fillRect(i*13,0,8,256)}
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}

const texSPC=canvasTexture("wood","#8c6749","#6f4d34");
const texLam=canvasTexture("slat","#8b5a38","#5c3521");
const texMarble=canvasTexture("marble","#e7e2d9","#afb4bb");
const texStone=canvasTexture("stone","#72675e","#544a43");
const texDark=canvasTexture("slat","#2a2f36","#14171c");

function mat(color,opts={}){
 return new THREE.MeshStandardMaterial({color,roughness:opts.roughness??.65,metalness:opts.metalness??.05,map:opts.map||null,emissive:opts.emissive||0x000000,emissiveIntensity:opts.emissiveIntensity||0});
}
const M={
 floor:mat(0xffffff,{map:texSPC,roughness:.72}),
 lam:mat(0xffffff,{map:texLam,roughness:.68}),
 marble:mat(0xffffff,{map:texMarble,roughness:.32}),
 stone:mat(0xffffff,{map:texStone,roughness:.88}),
 dark:mat(0xffffff,{map:texDark,roughness:.78}),
 black:mat(0x111827,{roughness:.55,metalness:.22}),
 cyan:mat(0x0ea5e9,{roughness:.35,metalness:.30,emissive:0x064968,emissiveIntensity:.5}),
 sand:mat(0xb99668,{roughness:.66}),
 white:mat(0xe5e7eb,{roughness:.52}),
 glass:new THREE.MeshPhysicalMaterial({color:0xbde8ff,roughness:.08,metalness:0,transmission:.35,transparent:true,opacity:.52})
};

const colliders=[];
function block(x,y,z,w,h,d,material,collide=true){
 const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;scene.add(q);
 if(collide)colliders.push({minX:x-w/2-.35,maxX:x+w/2+.35,minZ:z-d/2-.35,maxZ:z+d/2+.35,minY:y-h/2,maxY:y+h/2});
 return q;
}
function beam(x,y,z,w,d,material){return block(x,y,z,w,.32,d,material,false)}

block(0,-.28,0,56,.55,56,M.floor,false);
block(0,2.2,-27.3,56,4.4,.8,M.dark,true);
block(0,2.2,27.3,56,4.4,.8,M.dark,true);
block(-27.3,2.2,0,.8,4.4,56,M.dark,true);
block(27.3,2.2,0,.8,4.4,56,M.dark,true);

block(-15,2.0,-11,12,4,.7,M.lam,true);
block(14,2.0,-12,13,4,.7,M.marble,true);
block(-17,2.0,8,9,4,.7,M.stone,true);
block(17,2.0,8,9,4,.7,M.lam,true);
block(0,1.1,0,10,2.2,3.2,M.black,true);
block(-8,.9,10,7,1.8,4.4,M.marble,true);
block(8,.9,11,7,1.8,4.4,M.stone,true);
block(-9,.9,-2,5,1.8,4,M.sand,true);
block(10,.9,-3,5,1.8,4,M.cyan,true);
block(0,.75,17,12,1.5,3,M.dark,true);
block(0,.75,-18,12,1.5,3,M.marble,true);

beam(0,4.6,-8,18,.5,M.sand);beam(-10,4.8,5,12,.45,M.dark);beam(11,4.7,4,11,.45,M.sand);
for(let x=-22;x<=22;x+=11){const l=new THREE.PointLight(x%22===0?0x22d3ee:0xffcc8a,5.5,11,2);l.position.set(x,3.8,-22);scene.add(l)}
for(let i=0;i<10;i++){block(-24+i*5.2,.11,23,3.3,.12,.45,i%2?M.cyan:M.sand,false)}

const banner=new THREE.Mesh(new THREE.PlaneGeometry(10,2.7),new THREE.MeshBasicMaterial({color:0x07111e}));
banner.position.set(0,3.1,-26.85);scene.add(banner);
const logoCanvas=document.createElement("canvas");logoCanvas.width=1024;logoCanvas.height=256;
const lc=logoCanvas.getContext("2d");lc.fillStyle="#07111e";lc.fillRect(0,0,1024,256);lc.font="900 86px Arial";lc.textAlign="center";lc.fillStyle="#ffffff";lc.fillText("UHOME",400,150);lc.fillStyle="#22d3ee";lc.fillText("ARENA",700,150);
const logoTex=new THREE.CanvasTexture(logoCanvas);logoTex.colorSpace=THREE.SRGBColorSpace;banner.material.map=logoTex;banner.material.needsUpdate=true;

const remotePlayers=new Map();
let socket,selfId,me,weapons=[],activeIndex=0,connected=false,alive=true;
let ammoMap={},roundEndsAt=Date.now()+300000,lastState=0,reloadUntil=0;
let firing=false,lastLocalShot=0,touchMove={x:0,y:0},touchJump=false;
let recoil=0,bobTime=0,weaponView=null,muzzle=null;

function wsUrl(){return(location.protocol==="https:"?"wss":"ws")+"://"+location.host+"/ws"}
function feed(t,color="#22d3ee"){
 const e=document.createElement("div");e.className="feed-item";e.textContent=t;e.style.borderLeftColor=color;$("feed").appendChild(e);setTimeout(()=>e.remove(),3300)
}
function setHealth(v){
 const hp=Math.max(0,Math.min(100,v));$("health").textContent=Math.round(hp);$("healthFill").style.width=hp+"%";
 $("healthFill").style.background=hp>60?"linear-gradient(90deg,#22c55e,#84cc16)":hp>28?"linear-gradient(90deg,#f59e0b,#facc15)":"linear-gradient(90deg,#ef4444,#fb7185)";
}
function scoreRows(list){
 $("scores").innerHTML=[...list].sort((a,b)=>b.kills-a.kills||b.score-a.score).slice(0,9).map((p,i)=>
  '<div class="score-row"><span>'+(i+1)+'</span><span class="name">'+p.name+'</span><b>'+p.kills+'</b><em>'+p.deaths+'</em></div>'
 ).join("");
}
function avatar(p){
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.37,.44,1.18,10),mat(0x1d4ed8,{roughness:.55,metalness:.15}));body.position.y=.72;body.castShadow=true;g.add(body);
 const vest=new THREE.Mesh(new THREE.BoxGeometry(.62,.58,.34),mat(0x111827,{roughness:.68}));vest.position.set(0,.82,-.12);g.add(vest);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),mat(0xe9b98f,{roughness:.72}));head.position.y=1.53;head.castShadow=true;g.add(head);
 const gun=new THREE.Group();gun.position.set(.34,.92,-.16);const gb=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.78),mat(0x414a55,{roughness:.4,metalness:.55}));gb.rotation.x=.05;gun.add(gb);g.add(gun);
 scene.add(g);
 const a={root:g,target:new THREE.Vector3(p.x,p.y-1.72,p.z),yaw:p.yaw,hp:p.hp};remotePlayers.set(p.id,a);return a;
}
function syncPlayers(list){
 const seen=new Set();
 for(const p of list){
  seen.add(p.id);
  if(p.id===selfId){
   me=p;$("kills").textContent=p.kills;$("deaths").textContent=p.deaths;
   if(alive!==p.alive){alive=p.alive;if(!alive)showRespawn()}
   setHealth(p.hp);
   continue;
  }
  const r=remotePlayers.get(p.id)||avatar(p);
  r.target.set(p.x,p.y-1.72,p.z);r.yaw=p.yaw;r.hp=p.hp;r.root.visible=p.alive;
 }
 for(const [id,r] of remotePlayers){if(!seen.has(id)){scene.remove(r.root);remotePlayers.delete(id)}}
}
function updateRemote(dt){for(const r of remotePlayers.values()){r.root.position.lerp(r.target,Math.min(1,dt*12));r.root.rotation.y=THREE.MathUtils.lerp(r.root.rotation.y,r.yaw,Math.min(1,dt*10))}}

function clearWeapon(){if(weaponView){camera.remove(weaponView);weaponView.traverse(o=>{if(o.geometry)o.geometry.dispose()});weaponView=null}}
function buildWeapon(w){
 clearWeapon();
 const g=new THREE.Group();g.position.set(.42,-.38,-.72);g.rotation.set(-.06,-.02,0);
 const baseColor=new THREE.Color(w.color),accent=new THREE.Color(w.accent);
 const bodyMat=new THREE.MeshStandardMaterial({color:baseColor,roughness:.34,metalness:.58});
 const darkMat=new THREE.MeshStandardMaterial({color:0x111827,roughness:.42,metalness:.7});
 const accentMat=new THREE.MeshStandardMaterial({color:accent,roughness:.22,metalness:.4,emissive:accent,emissiveIntensity:.45});
 const body=new THREE.Mesh(new THREE.BoxGeometry(.24,.22,.82),bodyMat);body.position.z=-.10;g.add(body);
 const top=new THREE.Mesh(new THREE.BoxGeometry(.13,.09,.46),accentMat);top.position.set(0,.14,-.12);g.add(top);
 const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.62,12),darkMat);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.01,-.72);g.add(barrel);
 const grip=new THREE.Mesh(new THREE.BoxGeometry(.12,.34,.16),darkMat);grip.rotation.x=-.20;grip.position.set(0,-.24,.12);g.add(grip);
 const stock=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.34),bodyMat);stock.position.set(0,.0,.48);g.add(stock);
 if(w.id==="ultraflex_cannon"){body.scale.set(1.35,1.35,1.15);barrel.scale.set(1.45,1.45,1.15)}
 if(w.id==="marmol_dmr"){const scope=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.3,12),darkMat);scope.rotation.z=Math.PI/2;scope.position.set(0,.22,-.02);g.add(scope)}
 if(w.id==="bamboo_smg"){body.scale.set(.92,.9,.78);stock.scale.set(.8,.8,.55)}
 muzzle=new THREE.PointLight(accent,0,5,2);muzzle.position.set(0,.02,-1.04);g.add(muzzle);
 camera.add(g);weaponView=g;
}
function renderWeapons(){
 $("weaponBar").innerHTML=weapons.map((w,i)=>'<div class="weapon-slot '+(i===activeIndex?"active":"")+'"><b>'+(i+1)+'</b><span>'+w.name+'</span></div>').join("")
}
function selectWeapon(i){
 if(!weapons.length)return;
 activeIndex=(i+weapons.length)%weapons.length;
 const w=weapons[activeIndex];$("weaponName").textContent=w.name;$("productName").textContent=w.product;$("mag").textContent=w.mag;
 $("ammo").textContent=ammoMap[w.id]??w.mag;renderWeapons();buildWeapon(w);reloadUntil=0
}
function currentWeapon(){return weapons[activeIndex]}
function setAmmo(id,n){ammoMap[id]=n;if(currentWeapon()?.id===id)$("ammo").textContent=n}

function tracer(origin,dir,color,hitId){
 const start=new THREE.Vector3(origin.x,origin.y,origin.z);
 let end=start.clone().add(new THREE.Vector3(dir.x,dir.y,dir.z).multiplyScalar(70));
 if(hitId){
  const r=remotePlayers.get(hitId);
  if(r)end=r.root.position.clone().add(new THREE.Vector3(0,1.0,0));
 }
 const geo=new THREE.BufferGeometry().setFromPoints([start,end]);
 const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.92}));
 scene.add(line);
 setTimeout(()=>{scene.remove(line);geo.dispose();line.material.dispose()},80);
}
function sparkAtPlayer(id,color){
 const r=remotePlayers.get(id);if(!r)return;
 for(let i=0;i<5;i++){
  const m=new THREE.Mesh(new THREE.SphereGeometry(.025,5,4),new THREE.MeshBasicMaterial({color}));
  m.position.copy(r.root.position).add(new THREE.Vector3((Math.random()-.5)*.8,.7+Math.random(),(Math.random()-.5)*.8));
  scene.add(m);const v=new THREE.Vector3((Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2);
  let t=0;const tick=()=>{t+=.03;m.position.addScaledVector(v,.03);m.material.opacity=1-t*2;if(t<.45)requestAnimationFrame(tick);else{scene.remove(m);m.geometry.dispose();m.material.dispose()}};tick()
 }
}
function hitmarker(killed=false){
 const h=$("hitmarker");h.textContent=killed?"✦":"×";h.style.color=killed?"#fb7185":"#ffffff";h.classList.remove("hidden");setTimeout(()=>h.classList.add("hidden"),killed?180:110)
}
function flashDamage(){const f=$("damageFlash");f.style.opacity="1";setTimeout(()=>f.style.opacity="0",90)}
function showRespawn(){$("respawn").classList.remove("hidden");$("respawn").textContent="REAPARECIENDO...";firing=false}

function handle(msg){
 if(msg.type==="welcome"){
  selfId=msg.id;me=msg.player;weapons=msg.weapons;ammoMap=msg.ammo||{};connected=true;alive=true;roundEndsAt=msg.snapshot.roundEndsAt;
  camera.position.set(me.x,me.y,me.z);selectWeapon(0);$("hud").classList.remove("hidden");$("menu").classList.add("hidden");
  if(innerWidth<901)$("touchControls").classList.remove("hidden");else controls.lock();
  syncPlayers(msg.snapshot.players);scoreRows(msg.snapshot.players);setHealth(100);feed("Combate iniciado. Cambia de arma con 1–6.")
 }
 if(msg.type==="snapshot"){
  roundEndsAt=msg.roundEndsAt;$("round").textContent=msg.round;syncPlayers(msg.players);scoreRows(msg.players);
  $("players").textContent=msg.players.length+" jugador"+(msg.players.length===1?"":"es")
 }
 if(msg.type==="ammo")setAmmo(msg.weaponId,msg.ammo);
 if(msg.type==="empty"){if(msg.weaponId===currentWeapon()?.id)reload()}
 if(msg.type==="shot"){
  const w=weapons.find(x=>x.id===msg.weaponId);tracer(msg.origin,msg.dir,w?.accent||"#ffffff",msg.hitId);
  if(msg.shooterId===selfId&&muzzle){muzzle.intensity=40;setTimeout(()=>{if(muzzle)muzzle.intensity=0},45)}
  if(msg.hitId)sparkAtPlayer(msg.hitId,w?.accent||"#ffffff")
 }
 if(msg.type==="hitConfirm")hitmarker(msg.killed);
 if(msg.type==="damage"&&msg.targetId===selfId){setHealth(msg.hp);flashDamage()}
 if(msg.type==="elimination"){
  const killer=msg.killerId===selfId?"TÚ":remotePlayers.get(msg.killerId)?.root.userData?.name||"Jugador";
  const victim=msg.victimId===selfId?"TÚ":remotePlayers.get(msg.victimId)?.root.userData?.name||"Jugador";
  const w=weapons.find(x=>x.id===msg.weaponId);feed(killer+" eliminó a "+victim+" · "+(w?.name||""),msg.killerId===selfId?"#22d3ee":"#fb7185");
  if(msg.victimId===selfId){alive=false;setHealth(0);showRespawn()}
 }
 if(msg.type==="respawn"){
  if(msg.player.id===selfId){alive=true;camera.position.set(msg.player.x,msg.player.y,msg.player.z);setHealth(100);$("respawn").classList.add("hidden");feed("Reapareciste")}
  else{const r=remotePlayers.get(msg.player.id);if(r)r.root.visible=true}
 }
 if(msg.type==="roundReset"){roundEndsAt=msg.roundEndsAt;$("round").textContent=msg.round;feed("Nueva ronda","#f59e0b")}
 if(msg.type==="playerJoined"&&msg.player.id!==selfId)feed(msg.player.name+" se unió");
 if(msg.type==="playerLeft"){const r=remotePlayers.get(msg.id);if(r){scene.remove(r.root);remotePlayers.delete(msg.id)}}
 if(msg.type==="error")feed(msg.message||"Error","#fb7185")
}

function connect(name){
 socket=new WebSocket(wsUrl());
 socket.onopen=()=>socket.send(JSON.stringify({type:"join",name}));
 socket.onmessage=e=>{try{handle(JSON.parse(e.data))}catch(err){console.error(err)}};
 socket.onclose=()=>{connected=false;feed("Conexión perdida","#fb7185")}
}

const keys={};let velocity=new THREE.Vector3();
function collides(x,z){
 for(const c of colliders){if(x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ)return true}
 return false
}
function move(dt){
 if(!connected||!alive)return;
 const touch=innerWidth<901;if(!controls.isLocked&&!touch)return;
 const speed=(keys.ShiftLeft||keys.ShiftRight)?11.7:7.9;
 const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();
 const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
 const wish=new THREE.Vector3();
 const fy=(keys.KeyW?1:0)-(keys.KeyS?1:0)+touchMove.y,fx=(keys.KeyD?1:0)-(keys.KeyA?1:0)+touchMove.x;
 if(fy)wish.addScaledVector(forward,fy);if(fx)wish.addScaledVector(right,fx);if(wish.lengthSq()>1)wish.normalize();wish.multiplyScalar(speed);
 velocity.x=THREE.MathUtils.damp(velocity.x,wish.x,28,dt);velocity.z=THREE.MathUtils.damp(velocity.z,wish.z,28,dt);velocity.y-=25*dt;
 if(camera.position.y<=1.72){camera.position.y=1.72;velocity.y=Math.max(0,velocity.y);if(keys.Space||touchJump){velocity.y=9.8;touchJump=false}}
 const nx=THREE.MathUtils.clamp(camera.position.x+velocity.x*dt,-26.2,26.2);
 const nz=THREE.MathUtils.clamp(camera.position.z+velocity.z*dt,-26.2,26.2);
 if(!collides(nx,camera.position.z))camera.position.x=nx;else velocity.x=0;
 if(!collides(camera.position.x,nz))camera.position.z=nz;else velocity.z=0;
 camera.position.y+=velocity.y*dt;
 bobTime+=dt*Math.hypot(velocity.x,velocity.z)*.18;
 if(weaponView){
  const moving=Math.hypot(velocity.x,velocity.z)>.6;
  weaponView.position.x=.42+(moving?Math.sin(bobTime*8)*.012:0);
  weaponView.position.y=-.38+(moving?Math.abs(Math.cos(bobTime*8))*.014:0)-recoil*.03;
  weaponView.rotation.x=-.06+recoil*.07;
  recoil=THREE.MathUtils.damp(recoil,0,16,dt);
 }
}
function network(now){
 if(socket?.readyState===1&&selfId&&now-lastState>70){
  lastState=now;socket.send(JSON.stringify({type:"state",x:camera.position.x,y:camera.position.y,z:camera.position.z,yaw:camera.rotation.y,pitch:camera.rotation.x,weaponId:currentWeapon()?.id}))
 }
}
function shoot(now=performance.now()){
 if(!connected||!alive||Date.now()<reloadUntil)return;
 const w=currentWeapon();if(!w)return;
 const localAmmo=ammoMap[w.id]??w.mag;
 if(localAmmo<=0){reload();return}
 if(now-lastLocalShot<w.fireRate)return;
 lastLocalShot=now;ammoMap[w.id]=localAmmo-1;setAmmo(w.id,localAmmo-1);
 const dir=new THREE.Vector3();camera.getWorldDirection(dir);
 socket.send(JSON.stringify({type:"shoot",weaponId:w.id,dir:{x:dir.x,y:dir.y,z:dir.z}}));
 recoil=Math.min(2.2,recoil+1);if(muzzle){muzzle.intensity=45;setTimeout(()=>{if(muzzle)muzzle.intensity=0},40)}
}
function reload(){
 if(!connected||!alive)return;const w=currentWeapon();if(!w)return;
 if((ammoMap[w.id]??w.mag)>=w.mag||Date.now()<reloadUntil)return;
 reloadUntil=Date.now()+w.reload;socket.send(JSON.stringify({type:"reload",weaponId:w.id}));
 $("ammo").textContent="R";feed("Recargando "+w.name+"...");
 setTimeout(()=>{if(currentWeapon()?.id===w.id)$("ammo").textContent=ammoMap[w.id]??w.mag},w.reload+80)
}
function firingLoop(now){
 if(firing&&alive){const w=currentWeapon();if(w?.mode==="auto")shoot(now)}
}
function timer(){
 const s=Math.ceil(Math.max(0,roundEndsAt-Date.now())/1000);$("timer").textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")
}

document.addEventListener("mousedown",e=>{
 if(e.button!==0||!controls.isLocked)return;
 const w=currentWeapon();if(!w)return;firing=true;shoot();if(w.mode!=="auto")firing=false
});
document.addEventListener("mouseup",e=>{if(e.button===0)firing=false});
document.addEventListener("wheel",e=>{if(connected)selectWeapon(activeIndex+(e.deltaY>0?1:-1))},{passive:true});
addEventListener("keydown",e=>{
 keys[e.code]=true;
 if(/^Digit[1-6]$/.test(e.code))selectWeapon(Number(e.code.slice(5))-1);
 if(e.code==="KeyR")reload()
});
addEventListener("keyup",e=>keys[e.code]=false);

$("play").onclick=()=>{
 if(connected){$("menu").classList.add("hidden");if(innerWidth>=901)controls.lock();return}
 connect($("name").value.trim()||"Jugador")
};
controls.addEventListener("unlock",()=>{if(connected&&innerWidth>=901){$("menu").classList.remove("hidden");$("play").textContent="VOLVER AL COMBATE"}});

let stickId=null,lookId=null,lastLook={x:0,y:0};
const base=$("stickBase"),knob=$("stickKnob"),look=$("lookPad");
base.addEventListener("touchstart",e=>{stickId=e.changedTouches[0].identifier},{passive:false});
base.addEventListener("touchmove",e=>{e.preventDefault();const t=[...e.changedTouches].find(x=>x.identifier===stickId);if(!t)return;const q=base.getBoundingClientRect(),cx=q.left+q.width/2,cy=q.top+q.height/2;let dx=t.clientX-cx,dy=t.clientY-cy;const len=Math.hypot(dx,dy),max=42;if(len>max){dx=dx/len*max;dy=dy/len*max}touchMove.x=dx/max;touchMove.y=-dy/max;knob.style.transform="translate("+dx+"px,"+dy+"px)"},{passive:false});
base.addEventListener("touchend",()=>{touchMove={x:0,y:0};knob.style.transform="translate(0,0)"});
look.addEventListener("touchstart",e=>{const t=e.changedTouches[0];lookId=t.identifier;lastLook={x:t.clientX,y:t.clientY}},{passive:false});
look.addEventListener("touchmove",e=>{e.preventDefault();const t=[...e.changedTouches].find(x=>x.identifier===lookId);if(!t)return;const dx=t.clientX-lastLook.x,dy=t.clientY-lastLook.y;lastLook={x:t.clientX,y:t.clientY};camera.rotation.order="YXZ";camera.rotation.y-=dx*.0042;camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-dy*.0042,-1.45,1.45)},{passive:false});
$("jumpBtn").addEventListener("touchstart",e=>{e.preventDefault();touchJump=true},{passive:false});
$("reloadBtn").addEventListener("touchstart",e=>{e.preventDefault();reload()},{passive:false});
$("actionBtn").addEventListener("touchstart",e=>{e.preventDefault();firing=true;shoot()},{passive:false});
$("actionBtn").addEventListener("touchend",e=>{e.preventDefault();firing=false},{passive:false});

let prev=performance.now();
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min(.045,(now-prev)/1000);prev=now;
 move(dt);updateRemote(dt);network(now);firingLoop(now);timer();renderer.render(scene,camera)
}
requestAnimationFrame(loop);

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)}
addEventListener("resize",resize);resize();