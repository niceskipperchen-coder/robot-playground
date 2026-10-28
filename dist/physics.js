import {World,Body,Box,Plane,Vec3,Material,ContactMaterial} from './vendor/cannon-es.js';
/** Physics uses metres internally; RobotScript and snapshots use millimetres. */
export class BlockWorld {
 constructor(objects){
  this.objects=objects;this.world=new World({gravity:new Vec3(0,0,-9.81),allowSleep:true});
  this.world.solver.iterations=60;this.world.solver.tolerance=1e-9;
  const material=new Material('blocks');
  this.world.addContactMaterial(new ContactMaterial(material,material,{friction:.65,restitution:.02,contactEquationStiffness:1e6,contactEquationRelaxation:4}));
  const floor=new Body({mass:0,material,shape:new Plane()});this.world.addBody(floor);
  this.bodies=new Map(objects.map(o=>{
   const s=o.size/2000,b=new Body({mass:.02,material,shape:new Box(new Vec3(s,s,s)),position:new Vec3(o.x/1000,o.y/1000,o.z/1000),linearDamping:.08,angularDamping:.15,allowSleep:true,sleepSpeedLimit:.08,sleepTimeLimit:.4});
   if(o.quaternion)b.quaternion.set(o.quaternion.x,o.quaternion.y,o.quaternion.z,o.quaternion.w);
   this.world.addBody(b);return [o.id,b];
  }));
 }
 step(heldId,tool,dt){
  const step=Math.max(0,Math.min(dt,1/30));
  for(const [id,b] of this.bodies){
   if(id===heldId){
    b.type=Body.KINEMATIC;b.allowSleep=false;b.sleepSpeedLimit=0;b.updateMassProperties();b.wakeUp();
    // Integrate a kinematic velocity instead of teleporting: contact-relative
    // velocity must wake sleeping blocks and transfer motion to them.
    const target=new Vec3(tool.x/1000,tool.y/1000,tool.z/1000);
    if(step>0)b.velocity.set((target.x-b.position.x)/step,(target.y-b.position.y)/step,(target.z-b.position.z)/step);
    else b.position.copy(target);
    b.angularVelocity.set(0,0,0);b.quaternion.set(0,0,0,1);b.aabbNeedsUpdate=true;
   }else if(b.type!==Body.DYNAMIC){b.type=Body.DYNAMIC;b.allowSleep=true;b.sleepSpeedLimit=.08;b.updateMassProperties();b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);b.wakeUp();}
  }
  // Eight substeps reduce penetration when lowering a carried cube onto a stack.
  if(step>0)for(let i=0;i<8;i++)this.world.step(step/8);
  return this.objects.map(o=>{
   const b=this.bodies.get(o.id),q=b.quaternion;
   if(o.id===heldId)b.position.set(tool.x/1000,tool.y/1000,tool.z/1000);
   return {...o,x:b.position.x*1000,y:b.position.y*1000,z:b.position.z*1000,vx:b.velocity.x*1000,vy:b.velocity.y*1000,vz:b.velocity.z*1000,angularSpeed:b.angularVelocity.length(),settled:b.sleepState===Body.SLEEPING,quaternion:{x:q.x,y:q.y,z:q.z,w:q.w}};
  });
 }
}
