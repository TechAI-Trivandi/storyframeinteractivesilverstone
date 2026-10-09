'use strict';
// Shared full-sphere renderer. Longitude is periodic; camera rotation has no end stops.
(() => {
const PI=Math.PI, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const vertex=`attribute vec2 a; varying vec2 p; void main(){p=a;gl_Position=vec4(a,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 p;
uniform sampler2D panorama;
uniform float aspect,yaw,pitch,viewTan,panoPower;
void main(){
 vec3 d=normalize(vec3(p.x*aspect*viewTan,p.y*viewTan,-1.));
 float cp=cos(pitch),sp=sin(pitch),cy=cos(yaw),sy=sin(yaw);
 d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);
 d=vec3(d.x*cy-d.z*sy,d.y,d.x*sy+d.z*cy);
 float longitude=atan(d.x,-d.z)/3.14159265359;
 float u=.5+.5*sign(longitude)*pow(abs(longitude),panoPower);
 vec2 uv=vec2(u,acos(clamp(d.y,-1.,1.))/3.14159265359);
 vec3 color=texture2D(panorama,uv).rgb;
 // Symmetric feather makes both sides converge to the same edge colour.
 float seam=(1.-smoothstep(0.,.025,min(u,1.-u)))*.5;
 color=mix(color,texture2D(panorama,vec2(1.-u,uv.y)).rgb,seam);
 gl_FragColor=vec4(color,1.);
}`;
function pixels(image,max=2048){const c=document.createElement('canvas'),s=Math.min(1,max/image.width);c.width=Math.round(image.width*s);c.height=Math.round(image.height*s);const x=c.getContext('2d');x.drawImage(image,0,0,c.width,c.height);return {width:c.width,height:c.height,data:x.getImageData(0,0,c.width,c.height).data};}
function sample(img,u,v,out){const x=clamp(u*img.width-.5,0,img.width-1),y=clamp(v*img.height-.5,0,img.height-1),ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy,a=(iy*img.width+ix)*4,b=(iy*img.width+Math.min(ix+1,img.width-1))*4,c=(Math.min(iy+1,img.height-1)*img.width+ix)*4,e=(Math.min(iy+1,img.height-1)*img.width+Math.min(ix+1,img.width-1))*4;for(let k=0;k<3;k++)out[k]=(img.data[a+k]*(1-tx)+img.data[b+k]*tx)*(1-ty)+(img.data[c+k]*(1-tx)+img.data[e+k]*tx)*ty;}
class Panorama {
 static async create(canvas,image,scene){return new Panorama(canvas,image,scene);}
 constructor(canvas,image,scene){
  this.canvas=canvas;this.image=image;this.viewTan=Math.tan((scene.viewFov||70)*PI/360);this.power=scene.panoramaPower||1;this.gl=null;this.last='';
  try{this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});}catch{}
  if(this.gl){this.setupGL();canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.setupGL();this.last='';});}
  else{this.context2d=canvas.getContext('2d');this.map=pixels(image);this.buffer=document.createElement('canvas');this.bufferContext=this.buffer.getContext('2d');}
 }
 setupGL(){const gl=this.gl,compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(this.program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  this.uniforms={};for(const n of ['panorama','aspect','yaw','pitch','viewTan','panoPower'])this.uniforms[n]=gl.getUniformLocation(this.program,n);
  [this.image].forEach((source,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());for(const [p,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);const max=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE));if(Math.max(source.width,source.height)>max){const c=document.createElement('canvas'),s=max/Math.max(source.width,source.height);c.width=Math.round(source.width*s);c.height=Math.round(source.height*s);c.getContext('2d').drawImage(source,0,0,c.width,c.height);source=c;}gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);});
  gl.uniform1i(this.uniforms.panorama,0);
 }
 render(yaw,pitch){if(this.lost)return;const w=this.canvas.width,h=this.canvas.height,key=[w,h,yaw.toFixed(5),pitch.toFixed(5)].join(':');if(key===this.last)return;this.last=key;
  if(this.gl){const gl=this.gl;gl.viewport(0,0,w,h);gl.useProgram(this.program);for(const [n,v] of Object.entries({aspect:w/h,yaw:Math.atan2(Math.sin(yaw),Math.cos(yaw)),pitch,viewTan:this.viewTan,panoPower:this.power}))gl.uniform1f(this.uniforms[n],v);gl.drawArrays(gl.TRIANGLES,0,6);return;}
  // Low-resolution software path keeps the same 360 projection without WebGL.
  const scale=Math.min(1,480/Math.max(w,h)),bw=Math.max(1,Math.round(w*scale)),bh=Math.max(1,Math.round(h*scale));if(this.buffer.width!==bw||this.buffer.height!==bh){this.buffer.width=bw;this.buffer.height=bh;this.frame=this.bufferContext.createImageData(bw,bh);}
  const data=this.frame.data,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),color=[0,0,0],other=[0,0,0];
  for(let j=0;j<bh;j++)for(let i=0;i<bw;i++){
   const rx=(2*(i+.5)/bw-1)*w/h*this.viewTan,ry=(1-2*(j+.5)/bh)*this.viewTan,n=Math.hypot(rx,ry,1),y0=(ry*cp+sp)/n,z0=(ry*sp-cp)/n,x=rx/n*cy-z0*sy,y=y0,z=rx/n*sy+z0*cy,l=Math.atan2(x,-z)/PI,u=.5+.5*Math.sign(l)*Math.pow(Math.abs(l),this.power),v=Math.acos(clamp(y,-1,1))/PI;
   sample(this.map,u,v,color);const seam=(1-smooth(0,.025,Math.min(u,1-u)))*.5;if(seam){sample(this.map,1-u,v,other);for(let k=0;k<3;k++)color[k]+=(other[k]-color[k])*seam;}
   const o=(j*bw+i)*4;data[o]=color[0];data[o+1]=color[1];data[o+2]=color[2];data[o+3]=255;
  }
  this.bufferContext.putImageData(this.frame,0,0);this.context2d.drawImage(this.buffer,0,0,w,h);
 }
}
window.StoryFramePanorama=Panorama;
})();
