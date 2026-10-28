import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as manipulation from '../dist/manipulation.js';
import {challenges,validateChallenge,encodeShare,decodeShare,progress} from '../dist/challenges.js';
const cube=(id,x=180,z=12)=>({id,x,y:80,z,size:24,vz:0});
test('rigid cubes form a stable three-block stack and preserve vertical separation',()=>{
 assert.equal(typeof manipulation.BlockWorld,'function');
 const world=new manipulation.BlockWorld([cube('A'),cube('B',180,38),cube('C',180,66)]);
 let objects;for(let i=0;i<600;i++)objects=world.step(null,{},1/60);
 for(let i=0;i<3;i++)assert.ok(Math.abs(objects[i].z-(12+i*24))<1,JSON.stringify(objects));
 assert.ok(objects.every(o=>o.settled));
});
test('off-center rigid cubes rotate and topple rather than floating on a hidden support',()=>{
 assert.equal(typeof manipulation.BlockWorld,'function');
 const world=new manipulation.BlockWorld([cube('A'),cube('B',199,38)]);
 let objects,rotated=false;for(let i=0;i<600;i++){objects=world.step(null,{},1/60);rotated ||= Math.hypot(objects[1].quaternion.x,objects[1].quaternion.y)>.1;}
 assert.ok(rotated);assert.ok(objects[1].z<20);
});
test('stack goals survive share links and require the correct height and a resting body',()=>{
 const c={title:'Stack',blocks:[{id:'A',x:180,y:80},{id:'B',x:100,y:190}],goals:[{id:'A',x:140,y:-120,radius:10},{id:'B',x:140,y:-120,z:36,radius:10}]};
 const value=validateChallenge(c);assert.equal(decodeShare(encodeShare({challenge:c})).challenge.goals[1].z,36);
 const objects=[{...cube('A'),x:140,y:-120,settled:true},{...cube('B',140,36),y:-120,settled:true}];
 assert.deepEqual(progress(value,objects,null),[true,true]);assert.deepEqual(progress(value,objects.map(o=>({...o,z:12})),null),[true,false]);assert.deepEqual(progress(value,objects.map(o=>({...o,settled:false})),null),[false,false]);
});
test('covered blocks cannot be grasped through the block above them',()=>{assert.equal(manipulation.grasp([cube('A'),cube('B',180,36)],{x:180,y:80,z:12}),null);});
test('the expanded mission ladder has guided stacking and a rebuild puzzle',()=>{assert.equal(challenges.length,7);assert.ok(challenges.filter(c=>c.goals.some(g=>g.z>12)).length>=3);});
test('a carried cube wakes and pushes an already sleeping tower',()=>{
 const world=new manipulation.BlockWorld([cube('A'),cube('B',180,36),cube('C',140,36)]);
 let objects;for(let i=0;i<400;i++)objects=world.step('C',{x:140,y:80,z:36},1/60);
 assert.ok(objects.find(o=>o.id==='B').settled);
 for(let x=140;x<=220;x++)objects=world.step('C',{x,y:80,z:36},1/60);
 const top=objects.find(o=>o.id==='B');assert.ok(Math.hypot(top.x-180,top.y-80)>2||Math.abs(top.z-36)>2);
});
