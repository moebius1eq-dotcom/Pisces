import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createExperienceTimeline } from '../entrance-transition.js';

// Controller integration with a simulated DOM and renderer, not a browser pixel test.
async function boot(hash='', reduced=false, fallback=false) {
  const elements=new Map(), callbacks=new Map(); let nextFrame=0, frames=new Map();
  const element=name=>{
    if(elements.has(name))return elements.get(name);
    const classes=new Set(name==='body'?['is-loading']:[]),attrs=new Map();
    const item={hidden:false,inert:false,style:{},dataset:{},textContent:'',
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
      setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k),
      addEventListener:(k,f)=>callbacks.set(name+':'+k,f),append(){},
      querySelector:selector=>element(selector),focus(){item.focused=true;}};
    elements.set(name,item);return item;
  };
  const events={},background=[element('header'),element('main')];
  const state={shows:0,hides:0,draws:0,disposed:0,reloads:0,restores:0,fallbacks:0};
  const window={cosmosAssetsReady:Promise.resolve({fallback:false,failedAssets:[]}),
    addEventListener:(type,fn)=>(events[type]??=[]).push(fn),
    dispatchEvent:event=>(events[event.type]||[]).forEach(fn=>fn()),restoreJourneyLocation(){state.restores++;}};
  const location={hash,reload(){state.reloads++;}};
  const view=()=>({draw(s){state.draws++;state.snapshot=s;},resize(){},update(){},dispose(){state.disposed++;}});
  const context=vm.createContext({window,location,document:{title:'Journey',hidden:false,body:element('body'),
    querySelector:element,querySelectorAll:()=>background,addEventListener(){}},
    matchMedia:()=>({matches:reduced,addEventListener(){}}),Event:class{constructor(type){this.type=type;}},
    requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    createExperienceTimeline,createMontageArtwork:()=>({ready:Promise.resolve({failedAssets:[]}),dispose(){}}),
    createMontageRenderer:()=>{if(fallback)throw Error('WebGL unavailable');return view();},
    createCanvasMontage:()=>{state.fallbacks++;return view();},
    createHub:()=>({show(){state.shows++;},hide(){state.hides++;}})});
  let source=await readFile(new URL('../entrance.js',import.meta.url),'utf8');
  source=source.replace(/^import .*;\r?\n/gm,'').replace("await import('./vendor/three.module.js')",'{}');
  await vm.runInContext(`(async()=>{${source}})()`,context);
  await new Promise(resolve=>setImmediate(resolve));
  let time=0;
  function advance(ms){for(let t=0;t<ms;t+=25){time+=25;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));}}
  function navigate(hash){location.hash=hash;(events.hashchange||[]).forEach(fn=>fn());}
  return {state,element,advance,navigate,background,frames,clickReplay:()=>callbacks.get('.entrance-replay:click')()};
}
test('fresh entrance reaches hub, idles, opens Journey and supports a direct hub return',async()=>{
  const app=await boot();app.advance(23000);
  assert.equal(app.state.snapshot.state,'arrived');assert.equal(app.state.shows,1);
  assert(app.background.every(e=>e.inert));assert.equal(app.frames.size,0);
  app.navigate('#departure');assert.equal(app.state.disposed,1);
  assert(app.background.every(e=>!e.inert));assert.equal(app.state.restores,1);
  assert(!app.element('body').classList.contains('is-loading'));
  app.navigate('#hub');assert.equal(app.state.reloads,1);
});
test('hub deep link skips the film but Replay runs the approved sequence again',async()=>{
  const app=await boot('#hub');app.advance(50);assert.equal(app.state.snapshot.state,'arrived');
  app.clickReplay();app.advance(250);assert.notEqual(app.state.snapshot.state,'arrived');
  app.advance(23000);assert.equal(app.state.snapshot.state,'arrived');assert.equal(app.state.shows,2);
});
test('reduced motion and WebGL fallback both reach usable hub and direct Journey hashes still work',async()=>{
  const app=await boot('',true,true);app.advance(3000);
  assert.equal(app.state.snapshot.state,'arrived');assert.equal(app.state.fallbacks,1);
  const direct=await boot('#flight=0.420000');assert.equal(direct.state.restores,1);
  assert.equal(direct.element('.pisces-entrance').hidden,true);
});
