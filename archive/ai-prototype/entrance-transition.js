import { createEntranceTimeline } from './entrance-timing.js';
const clamp = n => Math.max(0, Math.min(1, n));
export const ease = n => { const t=clamp(n); return t*t*t*(t*(6*t-15)+10); };
export const PASSAGE_PHASES = ['threshold','passage','arrival','arrived'];
const durations = { threshold:2600, passage:1800, arrival:1600 };

// The approved film and real readiness gate remain intact. This clock adds only
// the physical passage, carrying surplus frame time across exact boundaries.
export function createExperienceTimeline() {
  const intro=createEntranceTimeline(); let base,phase=null,elapsed=0,compact=false;
  const snapshot=()=>!phase ? base : { ...base,state:phase,entranceState:'locked',
    phaseProgress:phase==='arrived'?1:elapsed/(compact?1200:durations[phase]),
    passage:phase==='threshold'?0:1,compact,
    portal:phase==='arrived'?1:compact?ease(elapsed/1200):phase==='threshold'?ease((elapsed/2600-.10)/.62):1,
    destination:phase==='arrival'?ease(elapsed/(compact?1200:1600)):phase==='arrived'?1:0,
    reducedExit:compact?(phase==='arrived'?1:ease(elapsed/1200)):0 };
  return {
    ready(){intro.ready();},
    reset(){intro.reset();base=undefined;phase=null;elapsed=0;compact=false;},
    step(delta,reduced=false){
      let remaining=Number.isFinite(delta)?Math.max(0,delta):0;
      if(phase==='arrived')return snapshot();
      if(!phase){
        const before=base?.elapsed||0;base=intro.step(remaining,reduced);
        if(base.state!=='locked')return snapshot();
        remaining=reduced?0:Math.max(0,remaining-(base.elapsed-before));
        compact=reduced;phase=compact?'arrival':'threshold';elapsed=0;
      }else if(reduced&&!compact){compact=true;phase='arrival';elapsed=0;remaining=0;}
      while(phase!=='arrived'){
        const duration=compact?1200:durations[phase];
        const used=Math.min(remaining,duration-elapsed);elapsed+=used;remaining-=used;
        if(elapsed<duration)break;
        phase=compact?'arrived':PASSAGE_PHASES[PASSAGE_PHASES.indexOf(phase)+1];elapsed=0;
      }
      return snapshot();
    }
  };
}

export function passageCamera(state, initial, reduced=false) {
  if(!PASSAGE_PHASES.includes(state.state))return initial;
  if(reduced||state.compact)return initial;
  const t=ease(state.phaseProgress), start=initial.position[2];
  if(state.state==='threshold'){
    const approach=ease((state.phaseProgress-.13)/.87);
    return {...initial,position:[.20*Math.sin(approach*Math.PI),0,start+(4-start)*approach],target:[0,0,-120],roll:0};
  }
  if(state.state==='passage')return {...initial,position:[-.35*Math.sin(t*Math.PI),.12*Math.sin(t*Math.PI),4-36*t],target:[0,0,-120],roll:-.018*Math.sin(t*Math.PI)};
  return {...initial,position:[-1.5*t,.7*t,state.state==='arrived'?-90:-32-58*t],target:[0,0,-160],roll:0};
}
