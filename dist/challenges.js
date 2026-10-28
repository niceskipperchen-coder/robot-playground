const byteLength=s=>new TextEncoder().encode(s).length;
export const colors={A:0x71b8de,B:0xe8937e,C:0xa1bf7c};
const transfer=(id,x,y,gx,gy)=>`// Move block ${id} to its matching zone.\nawait robot.moveTo(${x}, ${y}, 100);\nawait robot.lowerTo(12);\nawait robot.grip();\nawait robot.liftTo(100);\nawait robot.moveTo(${gx}, ${gy}, 100);\nawait robot.lowerTo(12);\nawait robot.release();\nawait robot.liftTo(100);`;
export const challenges=[
 {id:'first-pick',title:'Your first pick',level:'01 / STARTER',description:'Move the blue block onto its matching zone. Start with the loaded program, then change the route.',blocks:[{id:'A',x:180,y:80}],goals:[{id:'A',x:140,y:-120,radius:26}],starter:transfer('A',180,80,140,-120),solution:transfer('A',180,80,140,-120)},
 {id:'color-sort',title:'Sort the colors',level:'02 / INTERMEDIATE',description:'Deliver each block to the zone with the same letter. All three must be released and resting inside their zones.',blocks:[{id:'A',x:180,y:80},{id:'B',x:100,y:190},{id:'C',x:240,y:-30}],goals:[{id:'A',x:90,y:-160,radius:23},{id:'B',x:160,y:-150,radius:23},{id:'C',x:235,y:-120,radius:23}],starter:'// Three blocks. Three matching zones.\n// Complete the blue delivery, then add B and C.\n'+transfer('A',180,80,90,-160),solution:[transfer('A',180,80,90,-160),transfer('B',100,190,160,-150),transfer('C',240,-30,235,-120)].join('\n\n')},
 {id:'precision',title:'Precision landing',level:'03 / PRECISION',description:'Place two blocks inside smaller zones. Keep the tool raised during transfer and lower before releasing.',blocks:[{id:'A',x:150,y:150},{id:'B',x:250,y:40}],goals:[{id:'A',x:135,y:-145,radius:10},{id:'B',x:215,y:-95,radius:10}],starter:'// The target coordinates are in the mission panel.\n// Write your own two-block solution.\nawait robot.release();\nawait robot.home();',solution:[transfer('A',150,150,135,-145),transfer('B',250,40,215,-95)].join('\n\n')}
];
const place=(id,x,y,gx,gy,z=12,pick=12)=>`// ${id}: pick at Z=${pick}, place at Z=${z}.\nawait robot.moveTo(${x}, ${y}, 100);\nawait robot.lowerTo(${pick});\nawait robot.grip();\nawait robot.liftTo(100);\nawait robot.moveTo(${gx}, ${gy}, 100);\nawait robot.lowerTo(${z});\nawait robot.release();\nawait robot.liftTo(100);\nawait robot.wait(700);`;
const stackBlocks=[{id:'A',x:180,y:80},{id:'B',x:100,y:190},{id:'C',x:240,y:-30}];
const stackGoals=[{id:'A',x:140,y:-120,radius:10},{id:'B',x:140,y:-120,z:36,radius:10},{id:'C',x:140,y:-120,z:60,radius:10}];
challenges.splice(2,0,{id:'soft-landing',title:'A gentle landing',level:'03 / CONTROL',description:'A guided precision delivery. Release at Z=12, then wait for the cube to stop moving. High drops can bounce or tumble.',blocks:[{id:'A',x:180,y:80}],goals:[{id:'A',x:140,y:-120,radius:14}],starter:place('A',180,80,140,-120),solution:place('A',180,80,140,-120)});
challenges[3].level='04 / PRECISION';
challenges.push(
 {id:'first-stack',title:'Your first stack',level:'05 / STACKING',description:'Blue is the foundation. Place coral on top at Z=36. The loaded program builds the base; add the second transfer. Wait for both blocks to settle.',blocks:stackBlocks.slice(0,2),goals:stackGoals.slice(0,2),starter:place('A',180,80,140,-120)+'\n\n// Place B on A: target (140, -120, 36).',solution:place('A',180,80,140,-120)+'\n\n'+place('B',100,190,140,-120,36)},
 {id:'tower',title:'Three-block tower',level:'06 / BALANCE',description:'Build A → B → C from the floor up. Block centers belong at Z=12, 36 and 60. Keep transfers at Z=100 and lower gently; off-center blocks can topple.',blocks:stackBlocks,goals:stackGoals,starter:'// Three layers, one tower. Build the foundation first.\n'+place('A',180,80,140,-120),solution:stackBlocks.map((b,i)=>place(b.id,b.x,b.y,140,-120,12+24*i)).join('\n\n')},
 {id:'rebuild',title:'Unstack & rebuild',level:'07 / FINAL',description:'Move the tower to its new target. Remove C and B to temporary floor positions before moving A. A covered block cannot be picked up. Rebuild in A → B → C order.',blocks:[{id:'A',x:180,y:80},{id:'B',x:180,y:80,z:36},{id:'C',x:180,y:80,z:60}],goals:stackGoals,starter:'// Start at the top. Use (240, -30) and (100, 190) as buffers.\n// The starting centers are A=12, B=36, C=60 mm.\nawait robot.home();',solution:[place('C',180,80,240,-30,12,60),place('B',180,80,100,190,12,36),place('A',180,80,140,-120),place('B',100,190,140,-120,36),place('C',240,-30,140,-120,60)].join('\n\n')}
);
export function validateChallenge(input){
 if(!input||typeof input!=='object'||typeof input.title!=='string'||!input.title.trim()||input.title.length>60)throw new Error('Challenge title must be 1–60 characters.');
 if(!Array.isArray(input.blocks)||input.blocks.length<1||input.blocks.length>3||!Array.isArray(input.goals)||input.goals.length!==input.blocks.length)throw new Error('Use one to three blocks with one goal per block.');
 const point=p=>{if(!p||!['A','B','C'].includes(p.id)||![p.x,p.y].every(Number.isFinite)||Math.hypot(p.x,p.y)<55||Math.hypot(p.x,p.y)>295)throw new Error('Block and goal centers must be 55–295 mm from the base.');if(p.z!==undefined&&![12,36,60].includes(p.z))throw new Error('Block center height must be 12, 36 or 60 mm.');return {id:p.id,x:p.x,y:p.y,...(p.z!==undefined?{z:p.z}:{})};};
 const blocks=input.blocks.map(point),goals=input.goals.map(p=>{const goal=point(p);if(!Number.isFinite(p.radius)||p.radius<8||p.radius>35)throw new Error('Goal radius must be 8–35 mm.');return {...goal,radius:p.radius};});
 const ids=blocks.map(b=>b.id);if(new Set(ids).size!==ids.length||new Set(goals.map(g=>g.id)).size!==goals.length||goals.some(g=>!ids.includes(g.id)))throw new Error('Each block needs a unique matching goal ID.');
 for(const list of [blocks,goals]){
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const separation=list===goals?Math.max(36,list[i].radius+list[j].radius+4):36;
   if(Math.abs((list[i].z??12)-(list[j].z??12))<24&&Math.hypot(list[i].x-list[j].x,list[i].y-list[j].y)<separation)throw new Error('Blocks or goals on the same level overlap.');
  }
  for(const p of list)if((p.z??12)>12&&!list.some(base=>(base.z??12)===(p.z??12)-24&&Math.hypot(base.x-p.x,base.y-p.y)<.01))throw new Error('Each elevated block or goal needs a centered support one level below.');
 }
 return {id:typeof input.id==='string'&&challenges.some(c=>c.id===input.id)?input.id:'custom',title:input.title.trim(),blocks,goals};
}
export function progress(challenge,objects,heldId){return challenge.goals.map(g=>{const o=objects.find(o=>o.id===g.id);return !!o&&heldId!==o.id&&Math.abs(o.z-(g.z??o.size/2))<1&&Math.abs(o.vz)<2&&Math.hypot(o.vx??0,o.vy??0)<2&&(o.angularSpeed??0)<.08&&o.settled!==false&&Math.hypot(o.x-g.x,o.y-g.y)<=g.radius;});}
export function encodeShare({challenge,code=''}){
  if(typeof code!=='string'||byteLength(code)>8000)throw new Error('Program exceeds 8 KB.');
  const payload=JSON.stringify({v:1,challenge:validateChallenge(challenge),code});if(byteLength(payload)>16000)throw new Error('Share payload is too large.');
  const bytes=new TextEncoder().encode(payload);return '#play='+btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decodeShare(hash){
  if(typeof hash!=='string'||!hash.startsWith('#play=')||hash.length>24000)throw new Error('Invalid or oversized challenge link.');
  try{const value=hash.slice(6);if(!/^[A-Za-z0-9_-]+$/.test(value))throw new Error();const bytes=Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));if(bytes.length>16000)throw new Error();const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(payload.v!==1||typeof payload.code!=='string'||byteLength(payload.code)>8000)throw new Error();return {v:1,challenge:validateChallenge(payload.challenge),code:payload.code};}catch(error){throw new Error('This challenge link is invalid or uses an unsupported format.');}
}
