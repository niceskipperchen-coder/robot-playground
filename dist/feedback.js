import {inverse} from './kinematics.js';
/** Speed changes wall-clock playback, never the simulation's physics timestep. */
export class PlaybackClock {
 constructor(){this.speed=1;this.remainder=0;}
 advance(dt,tick){
  this.remainder+=Math.max(0,Math.min(dt,.1))*([1,2,5].includes(this.speed)?this.speed:1);
  while(this.remainder+1e-10>=1/60){tick(1/60);this.remainder=Math.max(0,this.remainder-1/60);}
 }
}
export function gridSelection(start,end,point){
 if(!start||!point||Math.hypot(start.x-end.x,start.y-end.y)>5)return null;
 const x=Math.round(point.x),y=Math.round(point.y);
 return {x,y,valid:!!inverse(x,y,180,140,-1)};
}
