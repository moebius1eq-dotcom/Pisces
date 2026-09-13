export const pieceVertex = `
precision highp float;
uniform float uConvergence, uTime, uAcceleration, uBrand, uReveal, uResonance, uPopulation, uFieldReveal;
uniform vec2 uBoardCenter;
uniform vec4 uRect, uPatch;
uniform float uOpacity;
varying vec2 vArtUv, vWordUv, vMaskUv;
varying vec3 vNormal;
varying vec4 vRect;
varying float vDepth, vOpacity, vWave, vFace;
#ifdef POPULATION
attribute vec3 aOrigin, aTarget, aTurn;
attribute vec4 aMeta, aRect, aPatch;
#endif
mat3 rotation(vec3 a) {
  vec3 c=cos(a),s=sin(a);
  return mat3(c.z,-s.z,0.,s.z,c.z,0.,0.,0.,1.)*
    mat3(c.y,0.,s.y,0.,1.,0.,-s.y,0.,c.y)*mat3(1.,0.,0.,0.,c.x,-s.x,0.,s.x,c.x);
}
void main() {
  vec3 p=position;
  vec3 n=normal;
  vec2 imageUv=position.xy/1.6+.5;
  vMaskUv=uv; vFace=abs(normal.z);
  #ifdef IMPOSTOR
  imageUv=(uv-.5)*1.6+.5;
  #endif
  #ifdef POPULATION
  float t=smoothstep(0.,1.,clamp((uConvergence-aMeta.y*.12)/.88,0.,1.));
  vec3 angles=(aTurn+sin(uTime*.23+aMeta.y*20.)*.055)*(1.-t);
  mat3 r=rotation(angles);
  float size=mix(aMeta.x,1.,t);
  vec3 pos=mix(aOrigin,aTarget,t);
  pos+=sin(t*3.141593)*sin(vec3(aMeta.z*2.3)+vec3(0.,1.,2.))*vec3(7.,5.,12.);
  float wave=sin(uResonance*3.141593)*exp(-pow((uResonance*31.-length(aTarget.xy))/3.,2.));
  pos.z-=wave*.045;
  p=r*p*size+pos; n=r*n;
  vWordUv=(aTarget.xy+position.xy+vec2(24.8,13.6))/vec2(49.6,27.2);
  vArtUv=mix(imageUv,aPatch.xy+imageUv*aPatch.zw,uConvergence);
  vRect=aRect; vWave=wave;
  vOpacity=(uPopulation>.5 ? (1.-smoothstep(.46,.97,uConvergence)) : 1.)*uFieldReveal;
  #else
  vWordUv=(uBoardCenter+position.xy+vec2(24.8,13.6))/vec2(49.6,27.2);
  vArtUv=uPatch.xy+imageUv*uPatch.zw;
  vRect=uRect; vOpacity=uOpacity; vWave=0.;
  #endif
  vec4 view=modelViewMatrix*vec4(p,1.);
  vDepth=-view.z;
  vNormal=normalize(normalMatrix*n);
  gl_Position=projectionMatrix*view;
}
`;

export const pieceFragment = `
precision highp float;
uniform sampler2D uAtlas, uIdentity, uMask;
uniform float uBrand, uReveal, uPopulation, uResonance;
varying vec2 vArtUv, vWordUv, vMaskUv;
varying vec3 vNormal;
varying vec4 vRect;
varying float vDepth, vOpacity, vWave, vFace;
void main() {
  float alpha=vOpacity*uReveal;
  #ifdef IMPOSTOR
  float mask=texture2D(uMask,vMaskUv).a;
  if(mask<.42) discard;
  alpha*=mask;
  #endif
  if(alpha<.008) discard;
  vec4 study=texture2D(uAtlas,vRect.xy+clamp(vArtUv,.006,.994)*vRect.zw);
  vec4 word=texture2D(uIdentity,clamp(vWordUv,0.,1.));
  vec3 n=normalize(vNormal);
  float face=vFace;
  float lighting=.86+.27*max(0.,dot(n,normalize(vec3(-.35,.6,1.))));
  vec3 image=study.rgb*lighting;
  // Shallow physical edges catch the key light. Front imagery stays luminous.
  if(face<.25) image=mix(vec3(.10,.14,.17),vec3(.45,.54,.59),max(0.,dot(n,normalize(vec3(-.5,.7,1.)))));
  float exposure=1.+vWave*.32;
  float fog=uPopulation>.5 ? mix(.42,1.,exp(-max(0.,vDepth-45.)*.006)) : 1.;
  vec3 rgb=mix(image*exposure*fog,word.rgb,uBrand);
  alpha*=mix(1.,word.a,uBrand);
  if(uPopulation>.5) alpha*=1.-uBrand;
  if(alpha<.008) discard;
  gl_FragColor=vec4(rgb,alpha);
  #include <colorspace_fragment>
}
`;
