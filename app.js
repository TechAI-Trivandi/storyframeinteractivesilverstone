'use strict';
(() => {
const $=id=>document.getElementById(id);
const config=window.STORYFRAME_CONFIG;
if(!config)throw Error('Missing experience.config.js');
document.title=config.title;
document.querySelector('meta[name="description"]').content=config.description;
$('location-label').textContent=config.location;
$('world').setAttribute('aria-label',config.scene.label);
if(config.destination){$('open-app').href=config.destination;$('open-app').removeAttribute('aria-disabled');$('open-app').textContent='Enter StoryFrame';}else{$('open-app').removeAttribute('href');$('open-app').setAttribute('aria-disabled','true');$('open-app').textContent='Stories coming soon';}
$('open-app').addEventListener('click',e=>{if(!config.destination){e.preventDefault();notice('The live stories will be connected here when they are ready.');}});
$('fallback-scene').style.backgroundImage=`url("${config.scene.image}")`;
function node(tag,className,text){const n=document.createElement(tag);n.className=className;if(text)n.textContent=text;return n;}
function picture(src,className,alt=''){const n=node('img',className);n.src=src;n.alt=alt;return n;}
const phone=$('phone-screen');phone.setAttribute('aria-label',config.phone.label);if(config.phone.background){phone.style.backgroundImage=`url("${config.phone.background}")`;phone.style.backgroundSize='100% 100%';}
phone.append(picture(config.phone.logo,'live-logo','StoryFrame'));
const greeting=node('p','live-welcome');config.phone.welcome.forEach((line,i)=>{if(i)greeting.append(document.createElement('br'));greeting.append(document.createTextNode(line));});phone.append(greeting);
function phoneCard(item,featured){const n=node('div',featured?'live-featured':'live-category');n.append(picture(item.image,''),node('strong','',item.title));return n;}
phone.append(phoneCard(config.phone.featured,true),node('hr','live-divider'));
const categories=node('div','live-categories');config.phone.categories.slice(0,5).forEach(item=>categories.append(phoneCard(item,false)));phone.append(categories);
if(config.phone.previewOnly){phone.append(node('p','preview-note','The experience is ready. Your live stories will appear here soon.'));}else{const footer=node('div','live-footer',config.phone.previewOnly?'YOUR STORIES ARE COMING SOON':'LOVE OUR STORIES? FIND OUT MORE!');footer.append(node('span','','VISIT STORYFRAME.WORLD'));phone.append(footer);}

const world=$('world'),fx=$('fragments'),ctx=fx.getContext('2d'),wildlife=$('wildlife'),birdCtx=wildlife.getContext('2d'),image=new Image(),gull=new Image();
const artPaths={...(config.phone.background?{background:config.phone.background}:{}),logo:config.phone.logo,welcome:config.phone.featured.image,...Object.fromEntries(config.phone.categories.slice(0,5).map((item,i)=>['category'+i,item.image]))};
const liveArt=Object.fromEntries(Object.entries(artPaths).map(([name,path])=>{const img=new Image();img.src=path;return [name,img];}));
const TRANSITION_SECONDS=config.timing.transitionSeconds;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=matchMedia('(pointer: coarse)').matches;
const state={phase:'waiting',ready:false,time:0,yaw:config.scene.initialYaw||0,pitch:config.scene.initialPitch||0,targetYaw:config.scene.initialYaw||0,targetPitch:config.scene.initialPitch||0,gyro:false,base:null,drag:null,converge:0,shakeHits:[],lastShake:0,gravity:null,permissions:false};
let width=innerWidth,height=innerHeight,dpr=1,gl=null,world2d=null,panorama=null,snapshot=null,glyphs=[],glyphLayer=null,targetGlyphLayer=null,captureWidth=0,captureHeight=0,last=0,elapsed=0,audio=null,audioGain=null,ambienceGain=null,crowdGain=null,soundOn=false,crowdStarted=false,crowdLoading=false,nextBird=3;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),mix=(a,b,t)=>a+(b-a)*t,shortest=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const smooth=(a,b,t)=>{const v=clamp((t-a)/(b-a),0,1);return v*v*(3-2*v);};
const sceneActive=()=>['waiting','explore','ready'].includes(state.phase);
function phase(value){state.phase=value;document.body.dataset.phase=value;}
function notice(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('notice').hidden=true,4500);}
async function setupWorld(){
 try{panorama=await window.StoryFramePanorama.create(world,image,config.scene);gl=panorama.gl;world2d=panorama.context2d;state.ready=true;resize();resetExperience();renderWorld();}
 catch(error){console.warn('Panorama failed:',error);$('load-status').textContent='The world could not load.';$('control-hint').textContent='Please reload to try again.';}
}
function resize(){width=$('experience').clientWidth;height=$('experience').clientHeight;dpr=Math.min(devicePixelRatio||1,2.5);world.width=Math.round(width*dpr);world.height=Math.round(height*dpr);fx.width=Math.round(width*Math.min(dpr,1.5));fx.height=Math.round(height*Math.min(dpr,1.5));wildlife.width=Math.round(width*dpr);wildlife.height=Math.round(height*dpr);ctx.setTransform(Math.min(dpr,1.5),0,0,Math.min(dpr,1.5),0,0);birdCtx.setTransform(dpr,0,0,dpr,0,0);if(gl)gl.viewport(0,0,world.width,world.height);state.base=null;}
function renderWorld(){if(state.ready&&panorama)panorama.render(state.yaw,state.pitch);}
function resetExperience(){if(!state.ready)return;phase('waiting');state.yaw=state.targetYaw=config.scene.initialYaw||0;state.pitch=state.targetPitch=config.scene.initialPitch||0;state.time=0;state.converge=0;state.base=null;state.shakeHits=[];state.gravity=null;state.drag=null;$('reveal').hidden=true;$('reveal').classList.remove('complete');$('explore').hidden=false;$('gather-prompt').hidden=true;$('movement-prompt').hidden=false;$('movement-prompt').style.opacity='1';$('convergence-copy').hidden=true;fx.style.display='none';world.style.opacity=(gl||world2d)?'1':'0';$('fallback-scene').style.opacity='1';world.tabIndex=0;$('experience-status').textContent='LOOK AROUND';$('load-status').textContent=coarse?'Move your phone to look around.':'Drag to look around.';$('control-hint').textContent=coarse?'Or drag the scene with your finger.':'Use your mouse or the arrow keys.';$('enable-motion').hidden=!needsPermission()||state.permissions;if(ambienceGain&&audio)ambienceGain.gain.setTargetAtTime(1,audio.currentTime,.4);}
function userMoved(amount){if(state.phase==='waiting'&&state.ready&&amount>.04){phase('explore');state.time=0;$('movement-prompt').style.opacity='0';$('enable-motion').hidden=true;$('experience-status').textContent='TAKE IT ALL IN';}}
function readyToGather(){if(state.phase!=='explore')return;phase('ready');state.shakeHits=[];$('movement-prompt').hidden=true;$('gather-prompt').hidden=false;$('experience-status').textContent='STORIES WAITING';if(!coarse)$('gather').textContent='Gather the stories';}
function needsPermission(){return typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function';}
function enableMotion(){const jobs=[];for(const type of [window.DeviceOrientationEvent,window.DeviceMotionEvent]){if(type&&typeof type.requestPermission==='function'){try{jobs.push(type.requestPermission());}catch{jobs.push(Promise.resolve('denied'));}}}$('enable-motion').disabled=true;Promise.allSettled(jobs).then(results=>{const denied=results.some(r=>r.status!=='fulfilled'||r.value!=='granted');state.permissions=!denied;$('enable-motion').hidden=true;$('enable-motion').disabled=false;if(denied){$('control-hint').textContent='Drag to explore. You can tap to gather later.';notice('Motion access is off. Drag and tap work just as well.');}else{$('control-hint').textContent='Turn gently. Let the world come to you.';state.base=null;}});}
function quatMultiply(a,b){return [a[0]*b[3]+a[3]*b[0]+a[1]*b[2]-a[2]*b[1],a[1]*b[3]+a[3]*b[1]+a[2]*b[0]-a[0]*b[2],a[2]*b[3]+a[3]*b[2]+a[0]*b[1]-a[1]*b[0],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
function orientation(e){if(!sceneActive()||!state.ready||e.alpha==null||e.beta==null||e.gamma==null||state.drag)return;const r=Math.PI/180,x=e.beta*r/2,y=e.alpha*r/2,z=-e.gamma*r/2,c1=Math.cos(x),c2=Math.cos(y),c3=Math.cos(z),s1=Math.sin(x),s2=Math.sin(y),s3=Math.sin(z);let q=[s1*c2*c3+c1*s2*s3,c1*s2*c3-s1*c2*s3,c1*c2*s3-s1*s2*c3,c1*c2*c3+s1*s2*s3];q=quatMultiply(q,[-Math.SQRT1_2,0,0,Math.SQRT1_2]);const angle=(screen.orientation?.angle??window.orientation??0)*r;q=quatMultiply(q,[0,0,-Math.sin(angle/2),Math.cos(angle/2)]);const [qx,qy,qz,qw]=q,dx=-2*(qx*qz+qw*qy),dy=-2*(qy*qz-qw*qx),dz=-(1-2*(qx*qx+qy*qy)),yaw=Math.atan2(dx,-dz),pitch=Math.asin(clamp(dy,-1,1));if(!state.base)state.base={yaw,pitch,offset:state.targetYaw,pitchOffset:state.targetPitch};const deltaYaw=shortest(yaw-state.base.yaw),deltaPitch=pitch-state.base.pitch;state.targetYaw=state.base.offset+deltaYaw;state.targetPitch=clamp(state.base.pitchOffset+deltaPitch,-1.2,1.2);state.gyro=true;userMoved(Math.hypot(deltaYaw,deltaPitch));}
function deviceMotion(e){if(!state.ready||document.hidden)return;let a=e.acceleration;if(!a||![a.x,a.y,a.z].every(Number.isFinite)){const g=e.accelerationIncludingGravity;if(!g||![g.x,g.y,g.z].every(Number.isFinite))return;if(!state.gravity){state.gravity={x:g.x,y:g.y,z:g.z};return;}a={x:g.x-state.gravity.x,y:g.y-state.gravity.y,z:g.z-state.gravity.z};for(const k of ['x','y','z'])state.gravity[k]=mix(state.gravity[k],g[k],.15);}if(state.phase!=='ready')return;const strength=Math.hypot(a.x,a.y,a.z),now=performance.now();if(strength>12&&now-state.lastShake>100){state.lastShake=now;state.shakeHits=state.shakeHits.filter(t=>now-t<950);state.shakeHits.push(now);if(state.shakeHits.length>=2)converge();}}
function paintBirds(){birdCtx.clearRect(0,0,width,height);if(!config.scene.birds||reduced||!gull.complete||!gull.naturalWidth||!sceneActive())return;for(let i=0;i<7;i++){const az=((elapsed*.035+i*.16+1.05)%(Math.PI*2))-Math.PI/2,el=.39+Math.sin(elapsed*.1+i)*.04+(i%3)*.075;const dx=Math.sin(az)*Math.cos(el),dy=Math.sin(el),dz=-Math.cos(az)*Math.cos(el);const x=dx*Math.cos(state.yaw)+dz*Math.sin(state.yaw),z0=-dx*Math.sin(state.yaw)+dz*Math.cos(state.yaw);const y=dy*Math.cos(state.pitch)+z0*Math.sin(state.pitch),z=-dy*Math.sin(state.pitch)+z0*Math.cos(state.pitch);if(z>-.08)continue;const px=width/2+x/-z*height/(2*(panorama?.viewTan||1)),py=height/2-y/-z*height/(2*(panorama?.viewTan||1)),size=(18+(i%3)*4)/Math.max(.65,-z);if(px<-60||px>width+60||py<-60||py>height+60)continue;birdCtx.save();birdCtx.globalAlpha=.7;birdCtx.translate(px,py);birdCtx.rotate(Math.sin(elapsed*.5+i)*.12);birdCtx.scale(1,.88+Math.sin(elapsed*4.3+i)*.1);birdCtx.drawImage(gull,-size/2,-size/2,size,size);birdCtx.restore();}}
// Sample the exact camera view, retaining a coloured glyph for each cell.
function capture(){
 renderWorld();captureWidth=width;captureHeight=height;snapshot=document.createElement('canvas');snapshot.width=world.width;snapshot.height=world.height;
 const c=snapshot.getContext('2d');
 if(gl||world2d)c.drawImage(world,0,0);else{const cw=Math.min(image.width,image.height*width/height);c.drawImage(image,(image.width-cw)/2,0,cw,image.height,0,0,snapshot.width,snapshot.height);}
 const cell=Math.max(5.5,Math.sqrt(width*height/(coarse?6200:11500)/1.5));
 const cols=Math.ceil(width/cell),rows=Math.ceil(height/(cell*1.48));
 const cw=width/cols,ch=height/rows,sample=document.createElement('canvas');sample.width=cols;sample.height=rows;
 const sc=sample.getContext('2d');sc.drawImage(snapshot,0,0,cols,rows);const pixels=sc.getImageData(0,0,cols,rows).data;
 const density=Math.min(dpr,2);glyphLayer=document.createElement('canvas');glyphLayer.width=Math.ceil(width*density);glyphLayer.height=Math.ceil(height*density);
 const gc=glyphLayer.getContext('2d');gc.scale(density,density);gc.font=`600 ${ch*.94}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;gc.textBaseline='middle';gc.textAlign='center';
 targetGlyphLayer=document.createElement('canvas');targetGlyphLayer.width=glyphLayer.width;targetGlyphLayer.height=glyphLayer.height;const tc=targetGlyphLayer.getContext('2d');tc.scale(density,density);tc.font=gc.font;tc.textBaseline='middle';tc.textAlign='center';
 const story=config.narrative;
 const words=story.split(' '),lines=[];let wordIndex=0;
 for(let row=0;row<rows;row++){let line='';while(line.length+words[wordIndex%words.length].length+(line?1:0)<=cols){line+=(line?' ':'')+words[wordIndex++%words.length];}lines.push(line.padEnd(cols,' '));}
 const letterCount=lines.join('').replace(/ /g,'').length,destinations=phoneFill(letterCount);let letterIndex=0;
 glyphs=[];const target=makePhoneMap(),targetPixels=target.getContext('2d').getImageData(0,0,282,560).data;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const char=lines[row][col];if(char===' ')continue;
  const n=(row*cols+col)*4;
  const seed=((col*73+row*137)%997)/997;
  const colour=`rgb(${Math.min(255,pixels[n]*1.38+12)},${Math.min(255,pixels[n+1]*1.38+12)},${Math.min(255,pixels[n+2]*1.38+12)})`;
  gc.fillStyle=colour;gc.fillText(char,(col+.5)*cw,(row+.5)*ch,cw*1.07);
  const {u,v,du,dv}=destinations[letterIndex++];
  const rim=u<.035||u>.965||v<.025||v>.975;
  const tx=clamp(Math.floor(u*282),0,281),ty=clamp(Math.floor(v*560),0,559),at=(ty*282+tx)*4;
  tc.fillStyle=`rgb(${targetPixels[at]},${targetPixels[at+1]},${targetPixels[at+2]})`;tc.fillText(char,(col+.5)*cw,(row+.5)*ch,cw*1.07);
  glyphs.push({x:(col+.5)*cw,y:(row+.5)*ch,sx:col*cw*density,sy:row*ch*density,sw:cw*density,sh:ch*density,cw,ch,u,v,du,dv,seed,rim,char,colour,targetColour:`rgb(${targetPixels[at]},${targetPixels[at+1]},${targetPixels[at+2]})`,delay:rim?seed*.06:.06+seed*.12});
 }
}
function roundBox(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
// A colour map of the existing phone layout gives every character a destination.
function wrapTitle(text,max){const lines=[''];for(const word of text.split(/\s+/)){const i=lines.length-1;if(lines[i]&&lines[i].length+word.length+1>max)lines.push(word);else lines[i]+=(lines[i]?' ':'')+word;}return lines;}
function makePhoneMap(){
 const map=document.createElement('canvas');map.width=282;map.height=560;const c=map.getContext('2d');
 roundBox(c,1,1,280,558,44);c.fillStyle='#9e93ae';c.fill();roundBox(c,4,4,274,552,41);c.fillStyle='#17121f';c.fill();
 c.save();roundBox(c,10,10,262,540,35);c.clip();c.fillStyle='#14062d';c.fillRect(10,10,262,540);
 const background=c.createRadialGradient(10,496,0,10,496,380);background.addColorStop(0,'#38237c');background.addColorStop(1,'#14062d');c.fillStyle=background;c.fillRect(10,10,262,540);
 if(liveArt.background?.complete&&liveArt.background.naturalWidth)c.drawImage(liveArt.background,10,10,262,540);
 if(liveArt.logo.complete&&liveArt.logo.naturalWidth)c.drawImage(liveArt.logo,24,40,96,22.7);
 c.fillStyle='#d2c3f4';c.font='bold 13px "Space Grotesk", sans-serif';config.phone.welcome.slice(0,2).forEach((line,i)=>c.fillText(line,24,78+i*15));
 function card(key,y,h,featured,lines){
  const grad=c.createLinearGradient(24,y,258,y+h);grad.addColorStop(0,featured?'#38237cf2':'#38237ce6');grad.addColorStop(1,featured?'#5a32b499':'#38237c4d');
  roundBox(c,24,y,234,h,featured?10:9);c.fillStyle=grad;c.fill();
  const im=liveArt[key],size=featured?44:32,pad=featured?5:4;
  if(im.complete&&im.naturalWidth){c.save();roundBox(c,24+pad,y+pad,size,size,6);c.clip();const side=Math.min(im.naturalWidth,im.naturalHeight);c.drawImage(im,(im.naturalWidth-side)/2,(im.naturalHeight-side)/2,side,side,24+pad,y+pad,size,size);c.restore();}
  c.fillStyle='#fff';c.font=`bold ${featured?10:9.5}px "Space Grotesk", sans-serif`;lines.forEach((line,i)=>c.fillText(line,24+pad+size+8,y+h/2+3+(i-(lines.length-1)/2)*12));
 }
 card('welcome',106,54,true,wrapTitle(config.phone.featured.title,25));
 c.fillStyle='#ffffffa8';c.fillRect(46,172,190,1);
 config.phone.categories.slice(0,5).forEach((item,i)=>card('category'+i,185+i*46,40,false,wrapTitle(item.title,28)));
 c.fillStyle='#fff';c.font='6px "Space Grotesk", sans-serif';c.textAlign='center';c.fillText(config.phone.previewOnly?'YOUR STORIES ARE COMING SOON':'LOVE OUR STORIES? FIND OUT MORE!',141,430);
 roundBox(c,61,437,160,21,10);c.fillStyle='#feba00';c.fill();c.fillStyle='#160b31';c.font='bold 6px "Space Grotesk", sans-serif';c.fillText(config.phone.previewOnly?'STORYFRAME':'VISIT STORYFRAME.WORLD',141,450);c.restore();
 roundBox(c,99,17,84,22,11);c.fillStyle='#0a080e';c.fill();return map;
}
function converge(){if(state.phase!=='ready')return;capture();state.converge=0;phase('converge');state.drag=null;world.tabIndex=-1;$('explore').hidden=true;$('reveal').hidden=false;$('phone').style.opacity='0';$('phone').style.transform='none';$('convergence-copy').hidden=true;fx.style.display='block';world.style.opacity='0';$('fallback-scene').style.opacity='0';if(ambienceGain&&audio)ambienceGain.gain.setTargetAtTime(.08,audio.currentTime,.9);if(soundOn)playSwell();}
// Assign one destination per letter, covering the rounded phone without overlapping bands.
function phoneFill(count){
 const cols=Math.ceil(Math.sqrt(count*282*1.48/560));let rows=Math.ceil(count/cols),points=[];
 while(points.length<count){
  points=[];const du=1/cols,dv=1/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const u=(col+.5)/cols,v=(row+.5)/rows;
   const dx=Math.max(Math.abs(u*282-141)-95,0),dy=Math.max(Math.abs(v*560-280)-234,0);
   if(dx*dx+dy*dy<=44*44)points.push({u,v,du,dv});
  }
  rows++;
 }
 // Keep samples evenly distributed if the last grid has spare cells, then shuffle.
 points=Array.from({length:count},(_,i)=>points[Math.floor(i*points.length/count)]);
 let seed=76129;for(let i=points.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[points[i],points[j]]=[points[j],points[i]];}
 return points;
}
function bezier(a,b,c,d,t){const k=1-t;return k*k*k*a+3*k*k*t*b+3*k*t*t*c+t*t*t*d;}
function paintTypography(p){
 ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
 // Letters emerge over the intact photograph before it gradually falls away.
 const resolve=smooth(.025,.25,p),photo=1-smooth(.08,.31,p),fade=1-smooth(.85,1,p);
 if(photo>0){ctx.globalAlpha=photo;ctx.drawImage(snapshot,0,0,width,height);}
 // Hold the complete typographic scene before any characters detach.
 if(p<.38){ctx.globalAlpha=resolve;ctx.drawImage(glyphLayer,0,0,width,height);ctx.globalAlpha=1;return;}
 const frame=$('phone-wrap').getBoundingClientRect(),base=$('experience').getBoundingClientRect(),px=frame.left-base.left,py=frame.top-base.top,pw=frame.width,ph=frame.height;

 for(const g of glyphs){
  const t=smooth(.38+g.delay,.76+g.delay,p),sx=g.x*width/captureWidth,sy=g.y*height/captureHeight;
  const endX=px+g.u*pw,endY=py+g.v*ph,dx=endX-sx,dy=endY-sy;
  const side=(g.seed-.5)*2,arc=Math.sin(Math.PI*t),bow=Math.min(width,height)*.13*side;
  const x=bezier(sx,sx+dx*.20+bow,endX-dx*.12+bow*.3,endX,t);
  const y=bezier(sy,sy+dy*.12-35*g.seed,endY-dy*.20+28*side,endY,t);
  const w=mix(g.cw,pw*g.du*1.12,t)*(1+arc*.32),h=mix(g.ch,ph*g.dv*1.12,t)*(1+arc*.32);
  const recolour=smooth(.42,.84,t);
  if(recolour<1){ctx.globalAlpha=fade*(1-recolour);ctx.drawImage(glyphLayer,g.sx,g.sy,g.sw,g.sh,x-w/2,y-h/2,w,h);}
  if(recolour>0){ctx.globalAlpha=fade*recolour;ctx.drawImage(targetGlyphLayer,g.sx,g.sy,g.sw,g.sh,x-w/2,y-h/2,w,h);}
 }
 ctx.globalAlpha=1;
}
function finishReveal(){phase('reveal');$('reveal').hidden=false;$('convergence-copy').hidden=true;fx.style.display='none';$('phone').style.opacity='1';$('phone').style.transform='rotateY(-8deg) rotateZ(3deg) scale(1)';$('reveal').classList.add('complete');$('open-app').focus({preventScroll:true});if(ambienceGain&&audio)ambienceGain.gain.setTargetAtTime(.28,audio.currentTime,1.2);}
function loop(now){let dt=last?Math.min((now-last)/1000,.05):0;last=now;if(document.hidden)dt=0;elapsed+=dt;
if(state.ready){if(sceneActive()){state.yaw+=shortest(state.targetYaw-state.yaw)*Math.min(1,dt*11);state.pitch=mix(state.pitch,state.targetPitch,Math.min(1,dt*11));renderWorld();paintBirds();if(state.phase==='explore'){state.time+=dt;if(state.time>=config.timing.exploreSeconds)readyToGather();}if(config.audio.birds&&soundOn&&elapsed>nextBird){nextBird=elapsed+3+Math.random()*5;playBird();}}
if(state.phase==='converge'){state.converge+=dt;const p=clamp(state.converge/(reduced?1:TRANSITION_SECONDS),0,1);if(reduced){ctx.clearRect(0,0,width,height);ctx.globalAlpha=1-p;ctx.drawImage(snapshot,0,0,width,height);ctx.globalAlpha=1;$('phone').style.opacity=String(p);$('phone').style.transform='none';}else{paintTypography(p);const appear=smooth(.86,1,p);$('phone').style.opacity=String(appear);$('phone').style.transform=`rotateY(${mix(0,-8,appear)}deg) rotateZ(${mix(0,3,appear)}deg) scale(${1})`;}if(p>=1)finishReveal();}}
requestAnimationFrame(loop);}
world.addEventListener('pointerdown',e=>{if(!sceneActive()||!state.ready)return;state.drag={x:e.clientX,y:e.clientY,yaw:state.targetYaw,pitch:state.targetPitch};world.setPointerCapture(e.pointerId);});
world.addEventListener('pointermove',e=>{if(!state.drag)return;const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;state.targetYaw=state.drag.yaw-dx*.004;state.targetPitch=clamp(state.drag.pitch+dy*.003,-1.2,1.2);userMoved(Math.hypot(dx,dy)*.004);});
function release(){state.drag=null;state.base=null;}world.addEventListener('pointerup',release);world.addEventListener('pointercancel',release);
world.addEventListener('keydown',e=>{if(!sceneActive())return;const map={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]};if(map[e.key]){e.preventDefault();state.targetYaw+=map[e.key][0];state.targetPitch=clamp(state.targetPitch+map[e.key][1],-1.2,1.2);userMoved(.15);}});
function ensureAudio(){if(audio)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');audio=new Audio();audioGain=audio.createGain();audioGain.gain.value=0;audioGain.connect(audio.destination);ambienceGain=audio.createGain();ambienceGain.gain.value=1;ambienceGain.connect(audioGain);const buffer=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.02;data[i]=brown*2.5;}const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const low=audio.createBiquadFilter();low.type='lowpass';low.frequency.value=850;const gain=audio.createGain();gain.gain.value=config.audio.windVolume;noise.connect(low);low.connect(gain);gain.connect(ambienceGain);noise.start();}
async function loadCrowd(){if(crowdStarted||crowdLoading||!audio)return;crowdLoading=true;try{const response=await fetch(config.audio.src);if(!response.ok)throw Error('Atmosphere audio unavailable');const buffer=await audio.decodeAudioData(await response.arrayBuffer());const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;crowdGain=audio.createGain();crowdGain.gain.value=config.audio.volume;source.connect(crowdGain);crowdGain.connect(ambienceGain);source.start();crowdStarted=true;}catch{notice('Atmosphere audio could not load. Tap sound again to retry.');}finally{crowdLoading=false;}}
async function toggleSound(){try{ensureAudio();await audio.resume();soundOn=!soundOn;audioGain.gain.setTargetAtTime(soundOn?.7:0,audio.currentTime,.35);$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');$('sound-label').textContent=soundOn?'Sound on':'Sound off';$('sound-waves').setAttribute('d',soundOn?'M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14':'m16 9 5 6m0-6-5 6');if(soundOn)loadCrowd();}catch{notice('Sound is unavailable in this browser.');}}
function playBird(){if(!audio||!soundOn||audio.state!=='running')return;const now=audio.currentTime;for(let i=0;i<2;i++){const o=audio.createOscillator(),g=audio.createGain(),panner=audio.createStereoPanner?.();o.type='sine';o.frequency.setValueAtTime(2000+i*300,now+i*.18);o.frequency.exponentialRampToValueAtTime(3200+i*250,now+i*.18+.07);o.frequency.exponentialRampToValueAtTime(1700,now+i*.18+.18);g.gain.setValueAtTime(.0001,now+i*.18);g.gain.exponentialRampToValueAtTime(.026,now+i*.18+.025);g.gain.exponentialRampToValueAtTime(.0001,now+i*.18+.23);o.connect(g);if(panner){panner.pan.value=Math.sin(elapsed*.15);g.connect(panner);panner.connect(ambienceGain);}else g.connect(ambienceGain);o.start(now+i*.18);o.stop(now+i*.18+.25);}}
function playSwell(){if(!audio)return;const now=audio.currentTime;for(const [i,f] of [110,165,220,330].entries()){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(f*2,now+4.4);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.055/(1+i*.35),now+4.7);g.gain.exponentialRampToValueAtTime(.0001,now+7.4);o.connect(g);g.connect(audioGain);o.start();o.stop(now+7.5);}const chime=audio.createOscillator(),g=audio.createGain();chime.type='sine';chime.frequency.value=660;g.gain.setValueAtTime(.0001,now);g.gain.setValueAtTime(.0001,now+6.3);g.gain.exponentialRampToValueAtTime(.05,now+6.5);g.gain.exponentialRampToValueAtTime(.0001,now+7.6);chime.connect(g);g.connect(audioGain);chime.start();chime.stop(now+7.7);}
$('enable-motion').addEventListener('click',enableMotion);$('gather').addEventListener('click',converge);$('replay').addEventListener('click',()=>{resetExperience();world.focus({preventScroll:true});});$('sound').addEventListener('click',toggleSound);
window.addEventListener('deviceorientation',orientation);window.addEventListener('devicemotion',deviceMotion);window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{last=performance.now();state.base=null;state.shakeHits=[];if(audio){if(document.hidden)audio.suspend().catch(()=>{});else if(soundOn)audio.resume().catch(()=>{});}});
world.addEventListener('webglcontextlost',e=>{e.preventDefault();gl=null;world.style.opacity='0';if(sceneActive())notice('Drag to keep exploring.');});
image.onload=()=>{const fontReady=document.fonts?document.fonts.load('500 16px "Space Grotesk"'):Promise.resolve();Promise.allSettled([fontReady,...Object.values(liveArt).map(im=>im.decode())]).then(setupWorld);};image.onerror=()=>{$('load-status').textContent='The world could not load.';$('control-hint').textContent='Check your connection, then reload.';$('enable-motion').hidden=false;$('enable-motion').textContent='Reload';$('enable-motion').addEventListener('click',()=>location.reload(),{once:true});};image.src=config.scene.image;if(config.scene.birds)gull.src='./assets/gull.png';
requestAnimationFrame(loop);
})();
