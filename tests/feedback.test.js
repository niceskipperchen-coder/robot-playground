import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as feedback from '../dist/feedback.js';
import {Simulation,Runner} from '../dist/engine.js';
import {compile} from '../dist/program.js';
import {challenges,progress} from '../dist/challenges.js';
test('faster playback advances fixed physics steps without changing delivery',()=>{
 assert.equal(typeof feedback.PlaybackClock,'function');
 for(const challenge of challenges)for(const speed of [1,2,5]){
  const sim=new Simulation(challenge), runner=new Runner(sim),clock=new feedback.PlaybackClock();
  runner.load(compile(challenge.solution));runner.run();clock.speed=speed;
  let frames=0;while(runner.status==='running'&&frames++<6000)clock.advance(1/60,dt=>runner.tick(dt));
  assert.equal(runner.status,'finished');assert.ok(progress(challenge,sim.objects,sim.heldId).every(Boolean));
  assert.ok(frames<6000/speed);
 }
});
test('grid clicks distinguish drags and round robot coordinates',()=>{
 assert.equal(typeof feedback.gridSelection,'function');
 assert.deepEqual(feedback.gridSelection({x:10,y:10},{x:12,y:11},{x:180.2,y:-79.8}),{x:180,y:-80,valid:true});
 assert.equal(feedback.gridSelection({x:10,y:10},{x:25,y:10},{x:180,y:80}),null);
 assert.deepEqual(feedback.gridSelection({x:0,y:0},{x:0,y:0},{x:0,y:0}),{x:0,y:0,valid:false});
});
