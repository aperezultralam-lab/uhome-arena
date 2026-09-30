const express=require("express");
const http=require("http");
const path=require("path");
const crypto=require("crypto");
const {WebSocketServer}=require("ws");

const PORT=process.env.PORT||3000;
const MAX_PLAYERS=Number(process.env.MAX_PLAYERS||32);
const ROUND_MS=5*60*1000;
const RESPAWN_MS=2200;

const app=express();
app.disable("x-powered-by");
app.use(express.static(path.join(__dirname,"public"),{maxAge:"5m"}));
const server=http.createServer(app);
const wss=new WebSocketServer({server,path:"/ws"});

const WEAPONS=[
 {id:"spc_carbine",name:"SPC CARBINE",product:"Piso SPC Nogal Americano",damage:24,fireRate:120,range:70,mag:28,reload:1350,mode:"auto",color:"#8b674b",accent:"#22d3ee"},
 {id:"bamboo_smg",name:"BAMBOO SMG",product:"Placa Bamboo",damage:16,fireRate:75,range:48,mag:36,reload:1200,mode:"auto",color:"#9a7b55",accent:"#a7f3d0"},
 {id:"marmol_dmr",name:"MÁRMOL DMR",product:"Placa Mármol Statuario",damage:48,fireRate:380,range:95,mag:10,reload:1650,mode:"semi",color:"#e9e6df",accent:"#f59e0b"},
 {id:"ultraflex_cannon",name:"ULTRAFLEX CANNON",product:"Piedra Flexible Rough Cocoon",damage:74,fireRate:900,range:34,mag:5,reload:1900,mode:"semi",color:"#7c6554",accent:"#fb7185"},
 {id:"lambrin_burst",name:"LAMBRÍN BURST",product:"Lambrín Interior Parota",damage:31,fireRate:210,range:62,mag:21,reload:1450,mode:"semi",color:"#8a5c3d",accent:"#60a5fa"},
 {id:"wpc_heavy",name:"WPC HEAVY",product:"Viga WPC Teca",damage:58,fireRate:650,range:55,mag:8,reload:2100,mode:"semi",color:"#705038",accent:"#c084fc"}
];

const SPAWNS=[
 [-24,1.72,24],[24,1.72,24],[-24,1.72,-24],[24,1.72,-24],
 [0,1.72,25],[0,1.72,-25],[-25,1.72,0],[25,1.72,0]
];

const WORLD_LIMIT=29.2;
const BLOCKERS=[
 // perimeter
 {minX:-31,maxX:31,minY:0,maxY:4.8,minZ:-31,maxZ:-30},
 {minX:-31,maxX:31,minY:0,maxY:4.8,minZ:30,maxZ:31},
 {minX:-31,maxX:-30,minY:0,maxY:4.8,minZ:-31,maxZ:31},
 {minX:30,maxX:31,minY:0,maxY:4.8,minZ:-31,maxZ:31},
 // feature walls
 {minX:-22.5,maxX:-11.5,minY:0,maxY:4.2,minZ:-12.4,maxZ:-11.6},
 {minX:10,maxX:22,minY:0,maxY:4.2,minZ:-13.4,maxZ:-12.6},
 {minX:-24,maxX:-16,minY:0,maxY:4.2,minZ:7.6,maxZ:8.4},
 {minX:14.5,maxX:23.5,minY:0,maxY:4.2,minZ:9.6,maxZ:10.4},
 // central cover / islands
 {minX:-5.5,maxX:5.5,minY:0,maxY:2.45,minZ:-3.9,maxZ:-0.1},
 {minX:-12.6,maxX:-5.4,minY:0,maxY:1.95,minZ:7.5,maxZ:12.5},
 {minX:5.4,maxX:12.6,minY:0,maxY:1.95,minZ:8.5,maxZ:13.5},
 {minX:-12.8,maxX:-7.2,minY:0,maxY:1.95,minZ:-4.2,maxZ:0.2},
 {minX:7.2,maxX:12.8,minY:0,maxY:1.95,minZ:-6.2,maxZ:-1.8},
 {minX:-6.7,maxX:6.7,minY:0,maxY:1.7,minZ:16.2,maxZ:19.8},
 {minX:-6.7,maxX:6.7,minY:0,maxY:1.7,minZ:-20.8,maxZ:-17.2},
 // corner structures
 {minX:-26,maxX:-20,minY:0,maxY:3,minZ:-22,maxZ:-16},
 {minX:20,maxX:26,minY:0,maxY:3,minZ:16,maxZ:22},
 {minX:-26,maxX:-20,minY:0,maxY:3,minZ:16,maxZ:22},
 {minX:20,maxX:26,minY:0,maxY:3,minZ:-22,maxZ:-16}
];

const players=new Map();
let round=1,roundStarted=Date.now();

function clean(v){return String(v||"").replace(/[<>&"'\x60]/g,"").slice(0,18)||"Jugador"}
function spawn(i){const s=SPAWNS[i%SPAWNS.length];return{x:s[0],y:s[1],z:s[2],yaw:0,pitch:0}}
function freshAmmo(){return Object.fromEntries(WEAPONS.map(w=>[w.id,w.mag]))}
function pub(p){return{id:p.id,name:p.name,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch,hp:p.hp,kills:p.kills,deaths:p.deaths,score:p.score,alive:p.alive,weaponId:p.weaponId}}
function weapon(id){return WEAPONS.find(w=>w.id===id)}
function send(ws,o){if(ws.readyState===1)ws.send(JSON.stringify(o))}
function broadcast(o){const s=JSON.stringify(o);wss.clients.forEach(c=>{if(c.readyState===1)c.send(s)})}
function snapshot(){return{type:"snapshot",round,roundEndsAt:roundStarted+ROUND_MS,players:[...players.values()].map(pub)}}
function resetRound(){
 round++;roundStarted=Date.now();
 let i=0;
 players.forEach(p=>{Object.assign(p,spawn(i++));p.hp=100;p.alive=true;p.kills=0;p.deaths=0;p.score=0;p.ammo=freshAmmo();p.lastShot={};p.reloadUntil={}});
 broadcast({type:"roundReset",round,roundEndsAt:roundStarted+ROUND_MS});
}
function validDir(d){return d&&[d.x,d.y,d.z].every(Number.isFinite)}
function normalize(d){const l=Math.hypot(d.x,d.y,d.z)||1;return{x:d.x/l,y:d.y/l,z:d.z/l}}
function rayHit(origin,dir,target,maxRange){
 const cx=target.x,cy=target.y-.78,cz=target.z;
 const ox=origin.x-cx,oy=origin.y-cy,oz=origin.z-cz;
 const b=ox*dir.x+oy*dir.y+oz*dir.z;
 const c=ox*ox+oy*oy+oz*oz-.72*.72;
 const disc=b*b-c;
 if(disc<0)return null;
 const t=-b-Math.sqrt(disc);
 return t>=0&&t<=maxRange?t:null;
}
function rayAABB(origin,dir,box,maxRange){
 let tmin=0,tmax=maxRange;
 for(const axis of ["x","y","z"]){
  const o=origin[axis],d=dir[axis],mn=box["min"+axis.toUpperCase()],mx=box["max"+axis.toUpperCase()];
  if(Math.abs(d)<1e-6){
   if(o<mn||o>mx)return null;
   continue;
  }
  let t1=(mn-o)/d,t2=(mx-o)/d;
  if(t1>t2){const q=t1;t1=t2;t2=q}
  tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);
  if(tmin>tmax)return null;
 }
 return tmin>=0&&tmin<=maxRange?tmin:null;
}
function nearestWorldHit(origin,dir,maxRange){
 let best=Infinity;
 for(const box of BLOCKERS){
  const t=rayAABB(origin,dir,box,maxRange);
  if(t!==null&&t<best)best=t;
 }
 return best;
}
function respawn(p){
 setTimeout(()=>{
  if(!players.has(p.id))return;
  Object.assign(p,spawn(Math.floor(Math.random()*SPAWNS.length)));
  p.hp=100;p.alive=true;p.ammo=freshAmmo();
  broadcast({type:"respawn",player:pub(p)});
 },RESPAWN_MS);
}

app.get("/health",(req,res)=>res.json({ok:true,players:players.size,maxPlayers:MAX_PLAYERS,round}));

wss.on("connection",ws=>{
 if(players.size>=MAX_PLAYERS){send(ws,{type:"error",message:"Sala llena"});ws.close();return}
 const id=crypto.randomUUID();let joined=false;

 ws.on("message",raw=>{
  let msg;try{msg=JSON.parse(raw.toString())}catch{return}

  if(msg.type==="join"&&!joined){
   joined=true;
   const p=Object.assign({
    id,name:clean(msg.name),hp:100,kills:0,deaths:0,score:0,alive:true,
    weaponId:WEAPONS[0].id,ammo:freshAmmo(),lastSeen:Date.now(),lastShot:{},reloadUntil:{}
   },spawn(players.size));
   players.set(id,p);
   send(ws,{type:"welcome",id,weapons:WEAPONS,player:pub(p),ammo:p.ammo,snapshot:snapshot()});
   broadcast({type:"playerJoined",player:pub(p)});
   return;
  }

  const p=players.get(id);if(!p)return;
  p.lastSeen=Date.now();

  if(msg.type==="state"&&p.alive){
   const nx=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,Number(msg.x)||0));
   const ny=Math.max(1.15,Math.min(12,Number(msg.y)||1.72));
   const nz=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,Number(msg.z)||0));
   if(Math.hypot(nx-p.x,ny-p.y,nz-p.z)<5.5){p.x=nx;p.y=ny;p.z=nz}
   p.yaw=Number(msg.yaw)||0;p.pitch=Number(msg.pitch)||0;
   const w=weapon(msg.weaponId);if(w)p.weaponId=w.id;
   return;
  }

  if(msg.type==="reload"&&p.alive){
   const w=weapon(msg.weaponId);if(!w)return;
   const now=Date.now();if((p.reloadUntil[w.id]||0)>now)return;
   p.reloadUntil[w.id]=now+w.reload;
   setTimeout(()=>{
    if(!players.has(id))return;
    p.ammo[w.id]=w.mag;
    send(ws,{type:"ammo",weaponId:w.id,ammo:p.ammo[w.id],reloaded:true});
   },w.reload);
   return;
  }

  if(msg.type==="shoot"&&p.alive){
   const w=weapon(msg.weaponId);if(!w||!validDir(msg.dir))return;
   const now=Date.now();
   if((p.reloadUntil[w.id]||0)>now)return;
   if(now-(p.lastShot[w.id]||0)<w.fireRate*.82)return;
   if((p.ammo[w.id]||0)<=0){send(ws,{type:"empty",weaponId:w.id});return}
   p.lastShot[w.id]=now;p.weaponId=w.id;p.ammo[w.id]--;
   const dir=normalize(msg.dir);
   const origin={x:p.x,y:p.y-.05,z:p.z};
   const worldT=nearestWorldHit(origin,dir,w.range);
   let best=null,bestT=Infinity;
   players.forEach(t=>{
    if(t.id===p.id||!t.alive)return;
    const dist=Math.hypot(t.x-p.x,t.y-p.y,t.z-p.z);if(dist>w.range+2)return;
    const hit=rayHit(origin,dir,t,w.range);
    if(hit!==null&&hit<bestT&&hit<worldT){best=t;bestT=hit}
   });
   broadcast({type:"shot",shooterId:p.id,weaponId:w.id,origin,dir,hitId:best?best.id:null});
   send(ws,{type:"ammo",weaponId:w.id,ammo:p.ammo[w.id]});
   if(best){
    best.hp=Math.max(0,best.hp-w.damage);
    p.score+=w.damage;
    send(ws,{type:"hitConfirm",targetId:best.id,damage:w.damage,killed:best.hp<=0});
    broadcast({type:"damage",targetId:best.id,hp:best.hp,attackerId:p.id,weaponId:w.id});
    if(best.hp<=0&&best.alive){
     best.alive=false;best.deaths++;p.kills++;p.score+=100;
     broadcast({type:"elimination",killerId:p.id,victimId:best.id,weaponId:w.id,killerKills:p.kills,killerScore:p.score,victimDeaths:best.deaths});
     respawn(best);
    }
   }
  }
 });

 ws.on("close",()=>{if(players.delete(id))broadcast({type:"playerLeft",id})});
});

setInterval(()=>{
 const now=Date.now();
 players.forEach((p,id)=>{if(now-p.lastSeen>30000){players.delete(id);broadcast({type:"playerLeft",id})}});
 if(now-roundStarted>=ROUND_MS)resetRound();
 broadcast(snapshot());
},100);

server.listen(PORT,"0.0.0.0",()=>console.log("UHome Arena FPS running on "+PORT));