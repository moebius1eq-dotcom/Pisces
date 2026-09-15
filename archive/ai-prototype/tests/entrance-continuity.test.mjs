import test from 'node:test';
import assert from 'node:assert/strict';
import { fragments, createField, fragmentPose, surfaceDepth, CELL } from '../entrance-model.js';
import { createEntranceTimeline } from '../entrance-timing.js';

for (const [mid, far] of [[850,4500],[2200,16000]]) test(`all ${527+mid+far} pieces retain unique connected physical slots`, () => {
  const pieces=[...fragments,...createField(mid),...createField(far,true,mid)];
  assert.equal(new Set(pieces.map(p=>p.id)).size,pieces.length);
  const slots=new Map(pieces.map(p=>[p.slot.join(','),p]));
  assert.equal(slots.size,pieces.length);
  const queue=['0,0'],seen=new Set(queue);
  for(let n=0;n<queue.length;n++){
    const [x,y]=queue[n].split(',').map(Number);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const id=`${x+dx},${y+dy}`;
      if(slots.has(id)&&!seen.has(id)){seen.add(id);queue.push(id);}
    }
  }
  assert.equal(seen.size,pieces.length,'every piece belongs to one edge-connected structure');
  const timeline=createEntranceTimeline();const waiting=timeline.step(20000);
  const before=JSON.stringify(pieces);
  for(const piece of pieces){
    const pose=fragmentPose(piece,waiting);
    assert.equal(pose.opacity,1,'convergence never removes a storm piece');
    if(piece.id!=='key'){
      assert(Math.hypot(...pose.position.map((v,i)=>v-piece.target[i]))<1e-8);
      assert(pose.rotation.every(r=>Math.abs(r)<1e-10));
      assert.equal(pose.scale,1);
    }else assert(pose.position[2]>5,'last physical piece stays near camera');
  }
  assert.equal(JSON.stringify(pieces),before,'rendering does not replace identity/content/slot');
  const edgeCounts=new Map();
  for(const p of pieces)edgeCounts.set(p.slot[1],(edgeCounts.get(p.slot[1])||0)+1);
  assert(new Set(edgeCounts.values()).size>15,'outer silhouette is not a rectangle');
});

test('connected curved edges agree and field trajectories stay continuous',()=>{
  const pieces=createField(2200);const timeline=createEntranceTimeline();timeline.ready();
  timeline.step(6800);let previous=pieces.map(p=>fragmentPose(p,timeline.step(0)));
  for(let frame=0;frame<170;frame++){
    const state=timeline.step(20);
    pieces.forEach((p,i)=>{const pose=fragmentPose(p,state);
      assert(Math.hypot(...pose.position.map((v,j)=>v-previous[i].position[j]))<5,'no convergence cut');
      assert.equal(pose.opacity,1);previous[i]=pose;});
  }
  for(const p of pieces){const [x,y]=p.center;
    assert(Math.abs(surfaceDepth(x+CELL/2,y)-surfaceDepth(x+CELL-CELL/2,y))<1e-10);
  }
});

