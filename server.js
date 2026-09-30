const express=require("express");
const http=require("http");
const path=require("path");
const crypto=require("crypto");
const {WebSocketServer}=require("ws");

const PORT=process.env.PORT||3000;
const MAX_PLAYERS=Number(process.env.MAX_PLAYERS||32);
const ROUND_MS=5*60*1000;
const app=express();
app.use(express.static(path.join(__dirname,"public")));
app.get("/health",(req,res)=>res.json({ok:true,players:players.size,maxPlayers:MAX_PLAYERS}));
const server=http.createServer(app);
const wss=new WebSocketServer({server,path:"/ws"});

const materials=[
{id:"lambrin",name:"Lambrín Interior",category:"wall",points:12,color:"#9b6a43"},
{id:"piedra",name:"Piedra Flexible",category:"wall",points:18,color:"#62666b"},
{id:"bamboo",name:"Placa Bamboo",category:"wall",points:16,color:"#786a55"},
{id:"marmol",name:"Placa tipo Mármol",category:"wall",points:16,color:"#ece8df"},
{id:"spc",name:"Piso SPC",category:"floor",points:14,color:"#806247"},
{id:"deck",name:"Piso Deck",category:"floor",points:15,color:"#a77546"},
{id:"viga",name:"Viga WPC",category:"beam",points:15,color:"#875d37"},
{id:"plafon",name:"Plafón Exterior",category:"ceiling",points:13,color:"#d9dde3"}
];
const zones=[
{id:"z1",name:"Muro Lobby",x:-14,y:2.2,z:-13,w:8,h:4.4,d:.5,type:"wall"},
{id:"z2",name:"Muro Sala",x:14,y:2.2,z:-13,w:8,h:4.4,d:.5,type:"wall"},
{id:"z3",name:"Muro Boutique",x:-18,y:2.2,z:3,w:6,h:4.4,d:.5,type:"wall"},
{id:"z4",name:"Piso Showroom",x:-11,y:.08,z:10,w:10,h:.16,d:8,type:"floor"},
{id:"z5",name:"Piso Terraza",x:12,y:.08,z:10,w:10,h:.16,d:8,type:"floor"},
{id:"z6",name:"Viga Galería",x:0,y:3.6,z:0,w:11,h:.45,d:.45,type:"beam"},
{id:"z7",name:"Plafón Central",x:0,y:5.2,z:-11,w:10,h:.18,d:7,type:"ceiling"}
];
const players=new Map(), zoneState=new Map();
zones.forEach(z=>zoneState.set(z.id,{zoneId:z.id,materialId:null,ownerId:null,claimedAt:0}));
let round=1, roundStarted=Date.now();

function spawn(i){const s=[[-20,1.7,18],[20,1.7,18],[-20,1.7,-18],[20,1.7,-18],[0,1.7,20],[0,1.7,-20]];const p=s[i%s.length];return{x:p[0],y:p[1],z:p[2],yaw:0,pitch:0}}
function clean(v){return String(v||"").replace(/[<>&"'\x60]/g,"").slice(0,18)||"Diseñador"}
function pub(p){return{id:p.id,name:p.name,score:p.score,combo:p.combo,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch}}
function material(id){return materials.find(m=>m.id===id)}
function zone(id){return zones.find(z=>z.id===id)}
function broadcast(o){const s=JSON.stringify(o);wss.clients.forEach(c=>{if(c.readyState===1)c.send(s)})}
function snapshot(){return{type:"snapshot",round,roundEndsAt:roundStarted+ROUND_MS,players:[...players.values()].map(pub),zones:[...zoneState.values()]}}
function resetRound(){round++;roundStarted=Date.now();let i=0;players.forEach(p=>{p.score=0;p.combo=0;Object.assign(p,spawn(i++))});zoneState.forEach(z=>{z.materialId=null;z.ownerId=null;z.claimedAt=0});broadcast(snapshot())}

wss.on("connection",ws=>{
 if(players.size>=MAX_PLAYERS){ws.send(JSON.stringify({type:"error",message:"Sala llena"}));ws.close();return}
 const id=crypto.randomUUID();let joined=false;
 ws.on("message",raw=>{
  let msg;try{msg=JSON.parse(raw.toString())}catch{return}
  if(msg.type==="join"&&!joined){
   joined=true;const p=Object.assign({id,name:clean(msg.name),score:0,combo:0,lastSeen:Date.now()},spawn(players.size));
   players.set(id,p);ws.send(JSON.stringify({type:"welcome",id,materials,zones,player:pub(p),snapshot:snapshot()}));broadcast({type:"playerJoined",player:pub(p)});return
  }
  const p=players.get(id);if(!p)return;p.lastSeen=Date.now();
  if(msg.type==="state"){
   const nx=Math.max(-25,Math.min(25,Number(msg.x)||0)),ny=Math.max(1.2,Math.min(10,Number(msg.y)||1.7)),nz=Math.max(-25,Math.min(25,Number(msg.z)||0));
   if(Math.hypot(nx-p.x,ny-p.y,nz-p.z)<5){p.x=nx;p.y=ny;p.z=nz}p.yaw=Number(msg.yaw)||0;p.pitch=Number(msg.pitch)||0
  }
  if(msg.type==="claim"){
   const z=zone(msg.zoneId),m=material(msg.materialId);if(!z||!m||z.type!==m.category)return;if(Math.hypot(p.x-z.x,p.z-z.z)>7)return;
   const zs=zoneState.get(z.id);if(Date.now()-zs.claimedAt<800)return;const same=zs.ownerId===p.id;zs.materialId=m.id;zs.ownerId=p.id;zs.claimedAt=Date.now();
   p.combo=same?Math.min(8,p.combo+1):1;p.score+=m.points+(p.combo-1)*2;broadcast({type:"claimed",zone:zs,player:{id:p.id,score:p.score,combo:p.combo},material:m})
  }
 });
 ws.on("close",()=>{if(players.delete(id))broadcast({type:"playerLeft",id})})
});

setInterval(()=>{const now=Date.now();players.forEach((p,id)=>{if(now-p.lastSeen>25000){players.delete(id);broadcast({type:"playerLeft",id})}});if(now-roundStarted>=ROUND_MS)resetRound();broadcast(snapshot())},100);
server.listen(PORT,"0.0.0.0",()=>console.log("UHome Arena running on "+PORT));