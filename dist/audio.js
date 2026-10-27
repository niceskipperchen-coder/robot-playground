/** Quiet, locally synthesized cues. Audio is created only after an explicit opt-in. */
export class RobotAudio {
 constructor(){this.enabled=false;this.context=null;this.motor=null;}
 async toggle(){
  if(this.enabled){this.enabled=false;this.motion(false);return false;}
  const Context=globalThis.AudioContext??globalThis.webkitAudioContext;
  if(!Context)return false;
  try{this.context??=new Context();await this.context.resume();this.enabled=this.context.state==='running';}
  catch{this.enabled=false;}
  return this.enabled;
 }
 tone(frequency,end,duration,delay=0,volume=.045,type='sine'){
  if(!this.enabled||this.context.state!=='running'||document.hidden)return;
  const c=this.context,start=c.currentTime+delay,osc=c.createOscillator(),gain=c.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(end,start+duration);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(c.destination);osc.start(start);osc.stop(start+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
 }
 cue(name){
  if(name==='grip'){this.tone(650,180,.1);this.tone(160,80,.07,.065,.035,'triangle');}
  if(name==='release')this.tone(240,460,.09,0,.025,'triangle');
  if(name==='miss'){this.tone(180,100,.18,0,.035,'triangle');}
  if(name==='complete')for(const [i,hz] of [523.25,659.25,783.99,1046.5].entries())this.tone(hz,hz,.25,i*.11,.045);
 }
 motion(active){
  const c=this.context;
  if(!c)return;
  if(!active||!this.enabled||document.hidden){if(this.motor){const {osc,gain}=this.motor;gain.gain.cancelScheduledValues(c.currentTime);gain.gain.setTargetAtTime(.0001,c.currentTime,.025);osc.stop(c.currentTime+.15);this.motor=null;}return;}
  if(this.motor)return;
  const osc=c.createOscillator(),gain=c.createGain();osc.type='triangle';osc.frequency.value=115;
  gain.gain.setValueAtTime(.0001,c.currentTime);gain.gain.setTargetAtTime(.012,c.currentTime,.06);osc.connect(gain);gain.connect(c.destination);osc.start();this.motor={osc,gain};osc.onended=()=>{osc.disconnect();gain.disconnect();};
 }
}
