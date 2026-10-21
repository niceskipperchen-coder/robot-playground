import {forward,inverse} from './kinematics.js';
import {stepJoint} from './motion.js';
import {grasp,updateObjects} from './manipulation.js';
import {validateChallenge,colors} from './challenges.js';
export class Simulation {
 constructor(challenge){this.reset(challenge);}
 reset(challenge=this.challenge){this.challenge=validateChallenge(challenge);this.state={shoulder:45,elbow:-70,l1:180,l2:140,height:100};this.goal={shoulder:45,elbow:-70,height:100};this.objects=this.challenge.blocks.map(b=>({...b,z:12,vz:0,size:24,color:colors[b.id]}));this.heldId=null;this.closed=false;this.trail=[];this.wait=0;}
 tool(){return {...forward(this.state.shoulder,this.state.elbow,180,140),z:this.state.height};}
 begin(command){const a=command.args;this.wait=0;
  if(command.method==='moveTo'){if(!a.every(Number.isFinite)||a[2]<12||a[2]>100)throw new Error('Tool height must be 12–100 mm.');const angles=inverse(a[0],a[1],180,140,-1);if(!angles)throw new Error('XY target is outside the 40–320 mm reach envelope.');this.goal={...angles,height:a[2]};}
  else if(['lowerTo','liftTo'].includes(command.method)){if(!Number.isFinite(a[0])||a[0]<12||a[0]>100)throw new Error('Tool height must be 12–100 mm.');this.goal.height=a[0];}
  else if(command.method==='grip'){this.closed=true;if(!this.heldId)this.heldId=grasp(this.objects,this.tool());if(!this.heldId)throw new Error('Grasp missed. Align over a block and lower to its center (12 mm).');}
  else if(command.method==='release'){this.closed=false;this.heldId=null;}
  else if(command.method==='home'){this.goal={shoulder:45,elbow:-70,height:100};}
  else if(command.method==='wait'){if(!Number.isFinite(a[0])||a[0]<0||a[0]>5000)throw new Error('wait accepts 0–5000 milliseconds.');this.wait=a[0]/1000;}
  else if(command.method!=='log')throw new Error('Unsupported command.');
 }
 tick(dt){for(const key of ['shoulder','elbow'])this.state[key]=stepJoint(this.state[key],this.goal[key],90,dt,key==='shoulder');this.state.height=stepJoint(this.state.height,this.goal.height,65,dt);this.wait=Math.max(0,this.wait-dt);this.objects=updateObjects(this.objects,this.heldId,this.tool(),dt);const p=this.tool(),last=this.trail.at(-1);if(!last||Math.hypot(last.x-p.x,last.y-p.y,last.height-p.z)>1){this.trail.push({x:p.x,y:p.y,height:p.z});if(this.trail.length>900)this.trail.shift();}}
 settled(){const d=((this.goal.shoulder-this.state.shoulder+540)%360)-180;return Math.abs(d)<.01&&Math.abs(this.goal.elbow-this.state.elbow)<.01&&Math.abs(this.goal.height-this.state.height)<.01&&this.wait===0;}
 halt(){this.goal={shoulder:this.state.shoulder,elbow:this.state.elbow,height:this.state.height};this.wait=0;}
}
export class Runner {
 constructor(sim){this.sim=sim;this.commands=[];this.status='idle';this.index=0;this.active=null;this.error=null;this.logs=[];this.elapsed=0;this.single=false;}
 load(commands){this.sim.reset();this.commands=commands;this.index=0;this.active=null;this.error=null;this.logs=[];this.elapsed=0;this.status='paused';this.single=false;}
 run(){if(['paused','stopped'].includes(this.status)){this.status='running';this.single=false;}}
 pause(){if(this.status==='running')this.status='paused';}
 step(){if(this.status==='paused'){this.status='running';this.single=true;}}
 stop(){this.sim.halt();this.status='stopped';this.active=null;this.single=false;this.commands=[];}
 tick(dt){if(this.status==='finished'){this.sim.objects=updateObjects(this.sim.objects,this.sim.heldId,this.sim.tool(),dt);return;}if(this.status!=='running')return;this.elapsed+=dt;
  try{
   if(!this.active){if(this.index>=this.commands.length){this.status='finished';return;}this.active=this.commands[this.index];this.commandTime=0;this.sim.begin(this.active);this.logs.push({line:this.active.line,text:this.active.method==='log'?this.active.args[0]:'robot.'+this.active.method+'('+this.active.args.join(', ')+')'});}
   this.commandTime+=dt;if(this.commandTime>15)throw new Error('Command timed out. Reset and check the destination.');
   this.sim.tick(dt);
   if(this.sim.settled()){this.index++;this.active=null;if(this.index>=this.commands.length)this.status='finished';else if(this.single){this.status='paused';this.single=false;}}
  }catch(error){this.error={message:error.message,line:this.active?.line??1};this.sim.halt();this.status='error';}
 }
}
