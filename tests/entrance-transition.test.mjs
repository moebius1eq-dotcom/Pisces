import test from 'node:test';
import assert from 'node:assert/strict';
import {createExperienceTimeline,passageCamera} from '../entrance-transition.js';
import {cameraPose} from '../entrance-camera.js';
const shot=(state,p=0,reduced=false)=>passageCamera({state,phaseProgress:p},cameraPose({state,phaseProgress:p},16/9,reduced),reduced);

test('the real readiness gate precedes the entire continuous passage',()=>{
 const t=createExperienceTimeline();assert.equal(t.step(60000).state,'awaiting');
 t.ready();let s=t.step(3800);assert.equal(s.state,'threshold');assert.equal(s.portal,0);
 s=t.step(2600);assert.equal(s.state,'passage');assert.equal(s.portal,1);
 s=t.step(1800);assert.equal(s.state,'arrival');
 s=t.step(1600);assert.equal(s.state,'arrived');assert.equal(s.destination,1);
 assert.deepEqual(t.step(5000),s);
 t.reset();assert.equal(t.step(14700).state,'threshold');
});
test('one large frame and ordinary frames retain the same passage position',()=>{
 const a=createExperienceTimeline(),b=createExperienceTimeline();a.ready();b.ready();
 const expected=a.step(17700);let actual;
 for(let i=0;i<354;i++)actual=b.step(50);
 assert.deepEqual(actual,expected);
});
test('camera crosses the actual puzzle plane and settles without positional cuts',()=>{
 for(const [before,after] of [['threshold','passage'],['passage','arrival'],['arrival','arrived']]){
   const a=shot(before,1),b=shot(after,after==='arrived'?1:0);
   a.position.forEach((v,i)=>assert(Math.abs(v-b.position[i])<1e-10));
 }
 assert(shot('threshold',0).position[2]>30);
 assert(shot('passage',0).position[2]>0);
 assert(shot('passage',1).position[2]<-25);
 assert.equal(shot('arrived',1).position[2],-90);
});
test('reduced motion runs a short reveal, without large camera travel',()=>{
 const t=createExperienceTimeline();assert.equal(t.step(0,true).state,'awaiting');t.ready();
 const start=t.step(0,true);assert.equal(start.state,'arrival');assert.equal(start.reducedExit,0);
 const middle=t.step(600,true);assert(middle.reducedExit>0&&middle.reducedExit<1);
 const end=t.step(600,true);assert.equal(end.state,'arrived');assert.equal(end.reducedExit,1);
 assert.deepEqual(shot('arrival',0,true),shot('arrived',1,true));
});
