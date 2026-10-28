import {createEditor} from './editor.bundle.js';
import {compile} from './program.js';
import {Simulation,Runner} from './engine.js';
import {challenges,validateChallenge,progress,encodeShare,decodeShare,colors} from './challenges.js';
import {createRobotView} from './view3d.js';
import {PlaybackClock,gridSelection} from './feedback.js';
import {RobotAudio} from './audio.js';
const audio=new RobotAudio(),playback=new PlaybackClock();
let selectedPoint=null;
const $=id=>document.getElementById(id);
const fallback='// Write your robot program here.\n// Read the API reference for available commands.\nawait robot.release();\nawait robot.home();';
let hasLoaded=false,lastCustom=null;
let current=challenges[0],sim=new Simulation(current),runner=new Runner(sim),view;
let previousStatus='',lastLine=-1,lastLineType='',logLength=-1,solvedReported=false,parseTimer,toastTimer;
const editor=createEditor($('editor'),onEdit,runProgram);
try{view=createRobotView($('scene'));}catch(error){const p=document.createElement('p');p.className='webgl-error';p.textContent='3D rendering needs WebGL 2. Enable browser hardware acceleration and reload. The editor and API remain available.';$('scene').after(p);console.error(error);}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').hidden=true;},3300);}
function draftKey(c){return 'robot-playground:1:'+JSON.stringify(validateChallenge(c));}
function saveDraft(){if(!hasLoaded)return;try{localStorage.setItem(draftKey(current),editor.getValue());}catch{}}
function readDraft(c){try{return localStorage.getItem(draftKey(c));}catch{return null;}}
function builtin(c){const value=JSON.stringify(validateChallenge(c));return challenges.find(item=>JSON.stringify(validateChallenge(item))===value);}
function addLog(text,kind='info'){runner.logs.push({line:0,text,kind});logLength=-1;}
function onEdit(){if(runner.status==='running'||runner.status==='paused'){runner.stop();addLog('Program edited. The next run starts from a fresh world.');}runner.status='idle';runner.error=null;lastLine=-1;editor.highlight();saveDraft();solvedReported=false;clearTimeout(parseTimer);parseTimer=setTimeout(updateCommandCount,150);}
function updateCommandCount(){try{$('commandCount').textContent=compile(editor.getValue()).length+' commands';}catch{$('commandCount').textContent='Check syntax';}}
function freshRunner(){runner.stop();sim=new Simulation(current);runner=new Runner(sim);previousStatus='';lastLine=-1;logLength=-1;solvedReported=false;editor.highlight();}
function loadChallenge(challenge,source=null,fromLink=false){saveDraft();current=validateChallenge(challenge);freshRunner();const known=builtin(current);editor.setValue(source??readDraft(current)??known?.starter??fallback);$('missionTitle').textContent=current.title;$('missionLevel').textContent=known?.level??'CUSTOM / YOUR CHALLENGE';$('missionDescription').textContent=known?.description??'Deliver each block to its matching zone. Release each block at the target height and wait for it to settle.';$('loadSolution').disabled=!known;$('challengeSelect').value=known?.id??'custom';
 if(!known){lastCustom=current;let custom=$('challengeSelect').querySelector('option[value="custom"]');if(!custom){custom=document.createElement('option');custom.value='custom';$('challengeSelect').append(custom);}custom.textContent='CUSTOM / '+current.title;$('challengeSelect').value='custom';}
 $('goalRows').replaceChildren();for(const g of current.goals){const row=document.createElement('div');row.className='goal-row';row.dataset.block=g.id;const block=document.createElement('span');block.className='block-dot';block.style.setProperty('--block-color','#'+colors[g.id].toString(16).padStart(6,'0'));block.textContent=g.id;const text=document.createElement('span');text.textContent='('+g.x+', '+g.y+') · Z '+(g.z??12)+' ±'+g.radius+' mm XY';const check=document.createElement('span');check.className='goal-check';check.textContent='○';row.append(block,text,check);$('goalRows').append(row);}
 hasLoaded=true;updateCommandCount();addLog(fromLink?'Shared challenge loaded. Press Run when you are ready.':'World ready. Program commands execute in order.');saveDraft();renderUI();}
function prepare(){if(runner.status==='paused'&&runner.commands.length)return true;
 try{const commands=compile(editor.getValue());runner.load(commands);previousStatus='';solvedReported=false;logLength=-1;return true;}catch(error){runner.stop();runner.status='error';runner.error={message:error.message,line:error.line??1};previousStatus='';renderUI();return false;}}
function runProgram(){if(runner.status==='running')return;if(prepare()){runner.run();renderUI();}}
$('run').onclick=runProgram;
$('playbackSpeed').onchange=e=>{playback.speed=Number(e.target.value);};
$('soundToggle').onclick=async()=>{const enabled=await audio.toggle();$('soundToggle').textContent=enabled?'Sound on':'Sound off';$('soundToggle').setAttribute('aria-pressed',String(enabled));if(enabled)audio.cue('release');else toast('Sound muted or unavailable in this browser.');};
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.motion(false);});
let pointerStart=null;
$('scene').addEventListener('pointerdown',e=>{pointerStart=e.button===0?{x:e.clientX,y:e.clientY,id:e.pointerId}:null;});
$('scene').addEventListener('pointercancel',()=>{pointerStart=null;});
$('scene').addEventListener('pointerup',e=>{
 const start=pointerStart;pointerStart=null;if(!view||start?.id!==e.pointerId)return;
 const hit=view.pick(e.clientX,e.clientY);const point=gridSelection(start,{x:e.clientX,y:e.clientY},hit);if(!point)return;
 selectedPoint=point;$('coordinateReadout').textContent=`X ${point.x} · Y ${point.y}${hit?.objectId?' · Z '+hit.z.toFixed(1):''} mm${point.valid?'':' · outside reach'}`;
 $('insertPoint').disabled=!point.valid;
});
$('insertPoint').onclick=()=>{if(selectedPoint?.valid)editor.insert(`await robot.moveTo(${selectedPoint.x}, ${selectedPoint.y}, 100);`);};
$('pause').onclick=()=>{runner.pause();renderUI();};
$('step').onclick=()=>{if(prepare()){runner.step();renderUI();}};
$('stop').onclick=()=>{runner.stop();addLog('Stopped. Remaining commands cancelled; world preserved.');renderUI();};
$('resetWorld').onclick=()=>{freshRunner();addLog('World reset. Your code is unchanged.');renderUI();};
$('clearConsole').onclick=()=>{runner.logs=[];logLength=-1;renderUI();};
$('challengeSelect').onchange=e=>{const selected=challenges.find(c=>c.id===e.target.value);if(selected)loadChallenge(selected);else if(e.target.value==='custom'&&lastCustom)loadChallenge(lastCustom);};
$('loadStarter').onclick=()=>{const known=builtin(current);loadChallenge(current,known?.starter??fallback);toast('Starter restored.');};
$('loadSolution').onclick=()=>{const known=builtin(current);if(known){loadChallenge(current,known.solution);toast('Solution loaded. Run it, then try changing the program.');}};
for(const [id,name] of [['viewPerspective','home'],['viewTop','top'],['viewSide','side']])$(id).onclick=()=>{view?.setView(name);document.querySelectorAll('.camera-tools button').forEach(b=>b.classList.toggle('selected',b.id===id));};
function renderLogs(){if(logLength===runner.logs.length)return;logLength=runner.logs.length;$('logCount').textContent=logLength;$('console').replaceChildren();for(const entry of runner.logs.slice(-180)){const row=document.createElement('div');row.className='log-row '+(entry.kind??'');const line=document.createElement('span');line.className='log-line';line.textContent=entry.line?'L'+entry.line:'›';const text=document.createElement('span');text.className='log-text';text.textContent=entry.text;row.append(line,text);$('console').append(row);}$('console').scrollTop=$('console').scrollHeight;}
function renderUI(){
 const completed=progress(current,sim.objects,sim.heldId),count=completed.filter(Boolean).length;
 if(runner.status!==previousStatus){if(runner.status==='error')addLog('Line '+runner.error.line+': '+runner.error.message,'error');if(runner.status==='finished')addLog('Program finished · '+count+'/'+completed.length+' targets delivered.');previousStatus=runner.status;}
 const solved=completed.every(Boolean);$('success').hidden=!solved;
 if(solved&&!solvedReported){solvedReported=true;audio.cue('complete');addLog('Challenge complete! Every block is released and settled at its target height.','success');}
 $('successDetail').textContent=runner.index+' commands · '+runner.elapsed.toFixed(1)+'s simulation time';
 $('missionProgress').textContent=count+' / '+completed.length+' delivered';
 document.querySelectorAll('.goal-row').forEach((row,i)=>{row.classList.toggle('done',completed[i]);row.querySelector('.goal-check').textContent=completed[i]?'✓':'○';});
 const p=sim.tool();for(const [id,value] of [['toolX',p.x],['toolY',p.y],['toolZ',p.z]])$(id).innerHTML=value.toFixed(1)+' <small>mm</small>';
 $('gripLabel').textContent=sim.heldId?'Holding '+sim.heldId:sim.closed?'Closed':'Open';
 $('runStatus').textContent=runner.status.toUpperCase();$('runStatus').className='state-pill '+runner.status;
 $('run').disabled=runner.status==='running';$('run').textContent=runner.status==='paused'?'▶ Resume':'▶ Run';$('pause').disabled=runner.status!=='running';$('step').disabled=runner.status==='running';$('stop').disabled=!['running','paused'].includes(runner.status);
 $('editorStatus').textContent=runner.status==='running'?'Executing command '+(runner.index+1)+' / '+runner.commands.length:runner.status==='error'?'Error on line '+runner.error.line:runner.status==='paused'?'Paused · '+runner.index+' commands complete':runner.status==='finished'?'Program finished':runner.status==='stopped'?'Stopped · run to restart':'Ready to run';
 const line=runner.status==='error'?runner.error.line:['running','paused'].includes(runner.status)?(runner.active??runner.commands[runner.index])?.line??0:0,type=runner.status==='error'?'error':'run';
 if(line!==lastLine||type!==lastLineType){editor.highlight(line,type);lastLine=line;lastLineType=type;}
 renderLogs();
}
for(const id of ['apiNav','openApi'])$(id).onclick=()=>$('apiDialog').showModal();
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$(button.dataset.close).close();
for(const button of document.querySelectorAll('[data-command]'))button.onclick=()=>editor.insert(button.dataset.command);
function makeShare(){try{$('shareURL').value=location.origin+location.pathname+encodeShare({challenge:current,code:$('includeProgram').checked?editor.getValue():''});$('copyLink').disabled=false;$('shareNote').textContent='Nothing is uploaded. The data lives in the link.';}catch(error){$('shareURL').value='';$('copyLink').disabled=true;$('shareNote').textContent=error.message;}}
function openShare(){makeShare();$('shareDialog').showModal();}
$('share').onclick=openShare;$('shareWin').onclick=openShare;$('includeProgram').onchange=makeShare;
$('copyLink').onclick=async()=>{try{await navigator.clipboard.writeText($('shareURL').value);$('shareNote').textContent='Link copied. Anyone with it can open this challenge.';toast('Challenge link copied.');}catch{$('shareURL').focus();$('shareURL').select();$('shareNote').textContent='Select and copy the link above (Ctrl/Cmd+C).';}};
function builderRows(){const count=Number($('blockCount').value);const start=[[180,80,90,-160],[100,190,160,-150],[240,-30,235,-120]];$('builderRows').replaceChildren();for(let i=0;i<count;i++){const row=document.createElement('div');row.className='builder-row';const id='ABC'[i],name=document.createElement('span');name.textContent=id;row.append(name);['start X','start Y','goal X','goal Y'].forEach((label,j)=>{const input=document.createElement('input');input.type='number';input.required=true;input.step='1';input.min='-295';input.max='295';input.value=start[i][j];input.name=id+j;input.setAttribute('aria-label','Block '+id+' '+label);row.append(input);});$('builderRows').append(row);}}
$('blockCount').onchange=builderRows;$('buildChallenge').onclick=()=>{$('builderError').textContent='';builderRows();$('builderDialog').showModal();};
$('builderForm').onsubmit=e=>{e.preventDefault();try{const form=new FormData(e.target),count=Number($('blockCount').value),blocks=[],goals=[];for(let i=0;i<count;i++){const id='ABC'[i],n=j=>Number(form.get(id+j));blocks.push({id,x:n(0),y:n(1)});goals.push({id,x:n(2),y:n(3),radius:Number($('goalRadius').value)});}const challenge=validateChallenge({id:'custom',title:$('challengeName').value,blocks,goals});loadChallenge(challenge,fallback);$('builderDialog').close();toast('Challenge created. Use Share to send it to a friend.');}catch(error){$('builderError').textContent=error.message;}};
function importHash(){if(!location.hash.startsWith('#play='))return false;try{const data=decodeShare(location.hash);loadChallenge(data.challenge,data.code||builtin(data.challenge)?.starter||fallback,true);$('notice').hidden=true;return true;}catch(error){$('notice').textContent=error.message+' The default challenge is still available.';$('notice').hidden=false;return false;}}
window.addEventListener('hashchange',importHash);
loadChallenge(current);importHash();
new ResizeObserver(()=>view?.resize()).observe($('scene'));
let previousTime=0,uiClock=0;
function frame(now){const dt=Math.min((now-previousTime)/1000,.1)||0;previousTime=now;uiClock+=dt;playback.advance(dt,step=>{const closed=sim.closed,held=sim.heldId,status=runner.status;runner.tick(step);if(!closed&&sim.closed)audio.cue(sim.heldId?'grip':'miss');if((closed||held)&&!sim.closed)audio.cue('release');if(status==='running'&&runner.status==='error'&&!sim.closed)audio.cue('miss');});
 audio.motion(runner.status==='running'&&(Math.abs(sim.state.shoulder-sim.goal.shoulder)>.01||Math.abs(sim.state.elbow-sim.goal.elbow)>.01||Math.abs(sim.state.height-sim.goal.height)>.01));
 const done=progress(current,sim.objects,sim.heldId);
 view?.update(sim.state,selectedPoint,sim.trail,{trail:true,envelope:true,objects:sim.objects,heldId:sim.heldId,closed:sim.closed,goals:current.goals,progress:done});
 if(uiClock>.08){renderUI();uiClock=0;}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
