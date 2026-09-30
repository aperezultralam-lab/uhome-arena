import * as THREE from "three";
import {PointerLockControls} from "three/addons/controls/PointerLockControls.js";

const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({canvas:$("game"),antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.shadowMap.enabled=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xc9d9e7);
scene.fog=new THREE.Fog(0xc9d9e7,40,92);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.1,180);
camera.position.set(0,1.7,18);
const controls=new PointerLockControls(camera,document.body);

scene.add(new THREE.HemisphereLight(0xffffff,0x64748b,2.4));
const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(16,30,12);sun.castShadow=true;scene.add(sun);
const mats={floor:new THREE.MeshStandardMaterial({color:0xd9d1c4,roughness:.82}),dark:new THREE.MeshStandardMaterial({color:0x1e293b,roughness:.86}),blue:new THREE.MeshStandardMaterial({color:0x2563eb,roughness:.55}),sand:new THREE.MeshStandardMaterial({color:0xb99a6b,roughness:.65})};
function box(x,y,z,w,h,d,m){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,z);q.castShadow=q.receiveShadow=true;scene.add(q);return q}
box(0,-.25,0,54,.5,54,mats.floor);box(0,1.4,-26,54,2.8,1,mats.dark);box(0,1.4,26,54,2.8,1,mats.dark);box(-26,1.4,0,1,2.8,54,mats.dark);box(26,1.4,0,1,2.8,54,mats.dark);
box(-10,1.2,-2,12,2.4,4,mats.sand);box(11,1,2,11,2,4,mats.blue);box(0,.8,11,7,1.6,7,mats.dark);box(-17,.55,1,7,1.1,6,mats.blue);box(17,.55,-2,7,1.1,6,mats.sand);

const zoneMeshes=new Map(),remotePlayers=new Map();
let socket,selfId,me,products=[],zones=[],activeIndex=0,connected=false,roundEndsAt=Date.now()+300000,lastState=0;
function wsUrl(){return (location.protocol==="https:"?"wss":"ws")+"://"+location.host+"/ws"}
function feed(t){const e=document.createElement("div");e.className="feed-item";e.textContent=t;$("feed").appendChild(e);setTimeout(()=>e.remove(),3200)}
function makeZone(z){const mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.65,transparent:true,opacity:.62,emissive:0x0b4d73,emissiveIntensity:.13});const m=new THREE.Mesh(new THREE.BoxGeometry(z.w,z.h,z.d),mat);m.position.set(z.x,z.y,z.z);m.userData.zone=z;m.castShadow=m.receiveShadow=true;scene.add(m);zoneMeshes.set(z.id,m)}
function colorMat(id){const p=products.find(x=>x.id===id);return new THREE.MeshStandardMaterial({color:p?p.color:"#64748b",roughness:.62})}
function avatar(p){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CapsuleGeometry(.4,.9,4,8),new THREE.MeshStandardMaterial({color:0x2563eb}));b.position.y=.85;g.add(b);const h=new THREE.Mesh(new THREE.SphereGeometry(.27,14,10),new THREE.MeshStandardMaterial({color:0xefc6a5}));h.position.y=1.68;g.add(h);scene.add(g);const a={root:g,target:new THREE.Vector3(p.x,p.y-1.7,p.z),yaw:p.yaw};remotePlayers.set(p.id,a);return a}
function renderInventory(){$("inventoryBar").innerHTML=products.map((p,i)=>'<div class="slot '+(i===activeIndex?"active":"")+'"><b>'+(i+1)+'</b><span>'+p.name+'</span></div>').join("")}
function select(i){if(!products.length)return;activeIndex=(i+products.length)%products.length;const p=products[activeIndex];$("materialName").textContent=p.name;$("materialType").textContent={wall:"Muro",floor:"Piso",beam:"Viga",ceiling:"Plafón"}[p.category]||p.category;renderInventory()}
function scores(list){$("scores").innerHTML=[...list].sort((a,b)=>b.score-a.score).slice(0,8).map((p,i)=>'<div class="score-row"><span>'+(i+1)+'</span><span class="name">'+p.name+'</span><b>'+p.score+'</b></div>').join("")}
function syncPlayers(list){const active=new Set();for(const p of list){active.add(p.id);if(p.id===selfId){me=p;continue}const r=remotePlayers.get(p.id)||avatar(p);r.target.set(p.x,p.y-1.7,p.z);r.yaw=p.yaw}for(const [id,r] of remotePlayers){if(!active.has(id)){scene.remove(r.root);remotePlayers.delete(id)}}}
function syncZones(list){for(const z of list){const m=zoneMeshes.get(z.zoneId);if(!m)continue;if(m.userData.materialId!==z.materialId){m.userData.materialId=z.materialId;m.material.dispose();m.material=z.materialId?colorMat(z.materialId):new THREE.MeshStandardMaterial({color:0xffffff,roughness:.65,transparent:true,opacity:.62,emissive:0x0b4d73,emissiveIntensity:.13})}}}
function handle(msg){
 if(msg.type==="welcome"){selfId=msg.id;me=msg.player;products=msg.materials;zones=msg.zones;zones.forEach(makeZone);roundEndsAt=msg.snapshot.roundEndsAt;connected=true;camera.position.set(me.x,me.y,me.z);select(0);$("hud").classList.remove("hidden");$("menu").classList.add("hidden");if(innerWidth<900)$("touchControls").classList.remove("hidden");else controls.lock();feed("Busca una zona y aplica el material correcto.");syncPlayers(msg.snapshot.players);scores(msg.snapshot.players)}
 if(msg.type==="snapshot"){roundEndsAt=msg.roundEndsAt;$("round").textContent=msg.round;syncPlayers(msg.players);syncZones(msg.zones);scores(msg.players);$("players").textContent=msg.players.length+" jugador"+(msg.players.length===1?"":"es")}
 if(msg.type==="claimed"){if(msg.player.id===selfId)feed("+"+msg.material.points+" · "+msg.material.name)}
 if(msg.type==="playerJoined"&&msg.player.id!==selfId)feed(msg.player.name+" entró a la arena");
 if(msg.type==="playerLeft"){const r=remotePlayers.get(msg.id);if(r){scene.remove(r.root);remotePlayers.delete(msg.id)}}
 if(msg.type==="error")feed(msg.message||"Error")
}
function connect(name){socket=new WebSocket(wsUrl());socket.onopen=()=>socket.send(JSON.stringify({type:"join",name}));socket.onmessage=e=>handle(JSON.parse(e.data));socket.onclose=()=>{connected=false;feed("Conexión perdida")}}

const ray=new THREE.Raycaster();
function install(){if(!connected)return;ray.setFromCamera(new THREE.Vector2(0,0),camera);const h=ray.intersectObjects([...zoneMeshes.values()])[0];if(!h||h.distance>7)return;const z=h.object.userData.zone,p=products[activeIndex];if(p.category!==z.type){feed("Ese producto no corresponde a esta zona");return}socket.send(JSON.stringify({type:"claim",zoneId:z.id,materialId:p.id}))}
document.addEventListener("mousedown",e=>{if(e.button===0&&controls.isLocked)install()});
const keys={};let velocity=new THREE.Vector3();
addEventListener("keydown",e=>{keys[e.code]=true;if(/^Digit[1-8]$/.test(e.code))select(Number(e.code.slice(5))-1)});
addEventListener("keyup",e=>keys[e.code]=false);
function move(dt){if(!connected)return;const touch=innerWidth<900;if(!controls.isLocked&&!touch)return;const speed=(keys.ShiftLeft||keys.ShiftRight)?10.5:7.2;const f=new THREE.Vector3();camera.getWorldDirection(f);f.y=0;f.normalize();const r=new THREE.Vector3().crossVectors(f,new THREE.Vector3(0,1,0)).normalize();const w=new THREE.Vector3();const fy=(keys.KeyW?1:0)-(keys.KeyS?1:0)+touchMove.y,fx=(keys.KeyD?1:0)-(keys.KeyA?1:0)+touchMove.x;if(fy)w.addScaledVector(f,fy);if(fx)w.addScaledVector(r,fx);if(w.lengthSq()>1)w.normalize();w.multiplyScalar(speed);velocity.x=THREE.MathUtils.damp(velocity.x,w.x,30,dt);velocity.z=THREE.MathUtils.damp(velocity.z,w.z,30,dt);velocity.y-=24*dt;if(camera.position.y<=1.7){camera.position.y=1.7;velocity.y=Math.max(0,velocity.y);if(keys.Space||touchJump){velocity.y=9.2;touchJump=false}}camera.position.addScaledVector(velocity,dt);camera.position.x=THREE.MathUtils.clamp(camera.position.x,-24.5,24.5);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-24.5,24.5)}
function network(now){if(socket?.readyState===1&&selfId&&now-lastState>80){lastState=now;socket.send(JSON.stringify({type:"state",x:camera.position.x,y:camera.position.y,z:camera.position.z,yaw:camera.rotation.y,pitch:camera.rotation.x}))}}
function updateRemote(dt){for(const r of remotePlayers.values()){r.root.position.lerp(r.target,Math.min(1,dt*12));r.root.rotation.y=THREE.MathUtils.lerp(r.root.rotation.y,r.yaw,Math.min(1,dt*10))}}
function timer(){const s=Math.ceil(Math.max(0,roundEndsAt-Date.now())/1000);$("timer").textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
$("play").onclick=()=>{if(connected){if(innerWidth>=900)controls.lock();$("menu").classList.add("hidden");return}connect($("name").value.trim()||"Diseñador")};
controls.addEventListener("unlock",()=>{if(connected&&innerWidth>=900){$("menu").classList.remove("hidden");$("play").textContent="VOLVER A LA ARENA"}});

let touchMove={x:0,y:0},touchJump=false,stickId=null,lookId=null,lastLook={x:0,y:0};
const base=$("stickBase"),knob=$("stickKnob"),look=$("lookPad");
base.addEventListener("touchstart",e=>{stickId=e.changedTouches[0].identifier},{passive:false});
base.addEventListener("touchmove",e=>{e.preventDefault();const t=[...e.changedTouches].find(x=>x.identifier===stickId);if(!t)return;const q=base.getBoundingClientRect(),cx=q.left+q.width/2,cy=q.top+q.height/2;let dx=t.clientX-cx,dy=t.clientY-cy;const len=Math.hypot(dx,dy),max=42;if(len>max){dx=dx/len*max;dy=dy/len*max}touchMove.x=dx/max;touchMove.y=-dy/max;knob.style.transform="translate("+dx+"px,"+dy+"px)"},{passive:false});
base.addEventListener("touchend",()=>{touchMove={x:0,y:0};knob.style.transform="translate(0,0)"});
look.addEventListener("touchstart",e=>{const t=e.changedTouches[0];lookId=t.identifier;lastLook={x:t.clientX,y:t.clientY}},{passive:false});
look.addEventListener("touchmove",e=>{e.preventDefault();const t=[...e.changedTouches].find(x=>x.identifier===lookId);if(!t)return;const dx=t.clientX-lastLook.x,dy=t.clientY-lastLook.y;lastLook={x:t.clientX,y:t.clientY};camera.rotation.order="YXZ";camera.rotation.y-=dx*.004;camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-dy*.004,-1.45,1.45)},{passive:false});
$("jumpBtn").addEventListener("touchstart",e=>{e.preventDefault();touchJump=true},{passive:false});
$("actionBtn").addEventListener("touchstart",e=>{e.preventDefault();install()},{passive:false});

let prev=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.04,(now-prev)/1000);prev=now;move(dt);updateRemote(dt);network(now);timer();renderer.render(scene,camera)}
requestAnimationFrame(loop);
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)}
addEventListener("resize",resize);resize();