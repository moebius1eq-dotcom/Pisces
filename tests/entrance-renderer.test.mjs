import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import { createMontageRenderer } from '../entrance-renderer.js';
import { createMontageArtwork } from '../entrance-artwork.js';
import { createEntranceTimeline } from '../entrance-timing.js';
import { CONTENT } from '../entrance-model.js';
import { additionalStudies } from '../entrance-library.js';

const context = new Proxy({ measureText: value => ({ width: value.length * 140 }),
  createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) },
  { get(target,key) { return key in target ? target[key] : () => {}; } });
const canvas = () => ({ width: 512,height:512,getContext:()=>context,setAttribute(){},addEventListener(){},removeEventListener(){},remove(){} });
const images=[];
class LocalImage { constructor(){images.push(this);this.naturalWidth=1024;this.naturalHeight=1024;} decode(){return Promise.resolve();} }
Object.assign(globalThis,{document:{createElement:canvas,fonts:{ready:Promise.resolve()}},
 innerWidth:1440,innerHeight:900,devicePixelRatio:1,Image:LocalImage});

// Construct actual Three.js buffers/materials, replacing only the unavailable GPU.
// This verifies scene lifecycle and state, not rendered pixels or shader compilation.
let scene;
class Renderer {
 constructor(){this.domElement=canvas();this.capabilities={getMaxAnisotropy:()=>4};this.debug={};}
 setClearColor(){} setPixelRatio(){} setSize(){} render(value){scene=value;} dispose(){}
}

test('the library has valid local files, credits and populated fallbacks for every assigned idea',async()=>{
 const artwork=createMontageArtwork();
 assert.equal(artwork.tiles.size,29);
 for(const id of CONTENT)assert(artwork.tiles.has(id),id);
 assert.equal(images.length,20);
 const manifest=JSON.parse(await readFile(new URL('../assets/entrance-sources.json',import.meta.url),'utf8'));
 for(const study of additionalStudies){
   const entry=manifest.assets.find(a=>a.ids.includes(study.id));
   assert(entry.credit&&entry.institution&&entry.license&&entry.sourceAsset);
   const bytes=await readFile(new URL('../'+study.file,import.meta.url));
   assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
 // Mix successful decodes and explicit failures: both must settle real readiness.
 images.forEach((image,i)=>i%3?image.onload():image.onerror());
 const result=await artwork.ready;assert.equal(result.failedAssets.length,7);
 artwork.dispose();
});

test('renderer preserves the same instance buffers, images and physical pieces through convergence',()=>{
 const tiles=new Map([...CONTENT,'key'].map(id=>[id,canvas()]));
 const view=createMontageRenderer({THREE:{...THREE,WebGLRenderer:Renderer},mount:{replaceChildren(){}},
   artwork:{tiles},onLost(){throw Error('unexpected loss');},onInvalidate(){}});
 const timeline=createEntranceTimeline();view.draw(timeline.step(6500),false);
 const batches=scene.children.filter(object=>object.geometry?.isInstancedBufferGeometry);
 const before=batches.map(object=>({object,geometry:object.geometry,count:object.geometry.instanceCount,
   ids:object.userData.pieceIds.join(','),rects:object.geometry.attributes.aRect.array,
   values:[...object.geometry.attributes.aRect.array]}));
 for(const delta of [300,1000,1500,1300,1000]){
   view.draw(timeline.step(delta),false);
   for(const saved of before){
     assert(scene.children.includes(saved.object));assert(saved.object.visible);
     assert.equal(saved.object.geometry,saved.geometry);assert.equal(saved.geometry.instanceCount,saved.count);
     assert.equal(saved.object.userData.pieceIds.join(','),saved.ids);
     assert.equal(saved.geometry.attributes.aRect.array,saved.rects);
     assert.deepEqual([...saved.rects],saved.values);
   }
 }
 assert.equal(before.reduce((n,b)=>n+b.count,0)+24,18727);
 timeline.ready();view.draw(timeline.step(1400),false);
 assert(batches.every(batch=>batch.visible));
 view.dispose();
});
