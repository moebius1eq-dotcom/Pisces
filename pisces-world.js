import { random } from './entrance-model.js';

// Created inside the entrance's scene, before the camera crosses the puzzle.
// The destination is a restrained spatial study, not a full homepage.
export function createDestinationWorld({THREE,scene,small=false}) {
  const root=new THREE.Group();scene.add(root);const resources=[];const rng=random(89016);
  const count=small?550:1200,positions=[],colors=[];
  for(let i=0;i<count;i++){
    positions.push((rng()-.5)*390,(rng()-.5)*220,-100-rng()*310);
    const warmth=rng(),light=.26+rng()*.5;
    colors.push(light*(warmth>.8?1:.78),light*.89,light*(warmth>.8?.76:1));
  }
  const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));stars.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const starMaterial=new THREE.PointsMaterial({size:.17,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true});
  root.add(new THREE.Points(stars,starMaterial));resources.push(stars,starMaterial);
  const geometry=new THREE.PlaneGeometry(390,210);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      void main(){vec2 p=vUv-.5;float n=noise(p*14.)*.55+noise(p*37.)*.3+noise(p*93.)*.15;
        float ridge=p.y+.09*sin(p.x*6.)-.065;
        float halo=exp(-ridge*ridge*47.)*exp(-p.x*p.x*4.);
        float dust=exp(-pow((ridge+.015+(n-.5)*.075)*30.,2.));
        float core=exp(-dot((p-vec2(.16,.1))*vec2(5.,10.),(p-vec2(.16,.1))*vec2(5.,10.)));
        vec3 color=mix(vec3(.11,.16,.20),vec3(.30,.25,.19),core);
        float opacity=halo*(.13+n*.30)*(1.-dust*.85);
        gl_FragColor=vec4(color,opacity);
        #include <colorspace_fragment>
      }`});
  const lane=new THREE.Mesh(geometry,material);lane.position.set(6,15,-290);lane.rotation.z=.24;root.add(lane);resources.push(geometry,material);
  const sphere=new THREE.SphereGeometry(37,small?32:56,small?20:32);
  const surface=new THREE.MeshStandardMaterial({color:0x0a121c,roughness:1,metalness:0});
  const horizon=new THREE.Mesh(sphere,surface);horizon.position.set(58,-39,-182);root.add(horizon);resources.push(sphere,surface);
  const rim=new THREE.DirectionalLight(0xb9d6e5,2.8);rim.position.set(-35,55,-160);rim.target=horizon;root.add(rim);
  root.add(new THREE.AmbientLight(0x526a80,.07));
  return {root,dispose(){scene.remove(root);resources.forEach(r=>r.dispose());}};
}

export function createCanvasDestination() {
  const rng=random(89016),stars=Array.from({length:420},()=>({p:[(rng()-.5)*390,(rng()-.5)*220,-100-rng()*310],a:.25+rng()*.5}));
  const dust=document.createElement('canvas');dust.width=768;dust.height=384;const c=dust.getContext('2d');
  for(let i=0;i<90;i++){
    const x=rng()*768,y=165+Math.sin(x/768*6)*26+(rng()-.5)*75,r=20+rng()*55;
    const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(112,119,125,.055)');g.addColorStop(1,'rgba(44,60,76,0)');
    c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  }
  return {
    draw(ctx,project,w,h){
      ctx.save();
      for(const star of stars){const p=project(star.p);if(p&&p.x>=0&&p.y>=0&&p.x<w&&p.y<h){ctx.globalAlpha=star.a;ctx.fillStyle='#bfcfdd';ctx.fillRect(p.x,p.y,1,1);}}
      ctx.globalAlpha=1;const center=project([6,15,-290]),edge=project([201,120,-290]);
      if(center&&edge){ctx.save();ctx.translate(center.x,center.y);ctx.rotate(-.24);const width=Math.abs(edge.x-center.x)*2,height=Math.abs(edge.y-center.y)*2;ctx.drawImage(dust,-width/2,-height/2,width,height);ctx.restore();}
      const planet=project([58,-39,-182]),limb=project([95,-39,-182]);
      if(planet&&limb){const r=Math.abs(limb.x-planet.x);ctx.fillStyle='#04080d';ctx.beginPath();ctx.arc(planet.x,planet.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(111,145,169,.45)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(planet.x,planet.y,r,Math.PI*.95,Math.PI*1.7);ctx.stroke();}
      ctx.restore();
    },
    dispose(){stars.length=0;dust.width=dust.height=1;}
  };
}
