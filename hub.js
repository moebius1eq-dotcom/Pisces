// Semantic navigation overlays the destination already created by the entrance.
export function createHub({ entrance, replay, onDirection }) {
  const hub = document.createElement('section');
  hub.className = 'pisces-hub'; hub.hidden = true;
  hub.setAttribute('aria-label', 'PISCES observatory');
  hub.innerHTML = `
    <header class="hub-header"><a class="hub-mark" href="#hub" aria-label="PISCES home">PISCES<span>THE OBSERVATORY</span></a>
      <nav aria-label="PISCES directions"><button data-direction="explore" aria-pressed="true">Explore</button><button data-direction="learn" aria-pressed="false">Learn</button><button data-direction="take-part" aria-pressed="false">Take Part</button></nav>
      <button class="hub-menu-toggle" aria-label="Open PISCES menu" aria-haspopup="dialog">Menu <span aria-hidden="true">☰</span></button>
    </header>
    <div class="hub-layout">
      <div class="hub-introduction"><p class="hub-kicker">01 / EXPLORE THE OBSERVATORY</p><h2 tabindex="-1">A universe.<br>A place to begin.</h2><p class="hub-description">Travel across scale. Get closer to a world.<br>Find the connections that change your perspective.</p><a class="hub-primary" href="#departure">Begin the Journey <span aria-hidden="true">↗</span></a><p class="hub-primary-note">EARTH TO THE OBSERVABLE UNIVERSE</p></div>
      <div class="hub-study" aria-hidden="true">
        <svg viewBox="0 0 500 500"><g fill="none" stroke="currentColor"><ellipse cx="250" cy="250" rx="218" ry="104" transform="rotate(-27 250 250)"/><ellipse cx="250" cy="250" rx="168" ry="210" transform="rotate(32 250 250)"/><circle cx="250" cy="250" r="182" stroke-dasharray="2 12"/><path d="M18 250H482M250 18V482" opacity=".35"/></g><circle cx="425" cy="150" r="5" fill="#e5c58f"/></svg>
        <img src="assets/atlas-earth.png" alt="" width="500" height="500"><span class="hub-study-label">OUR POINT OF DEPARTURE<br><b>EARTH / SOL SYSTEM</b></span>
      </div>
      <section class="hub-panel" aria-label="Explore destinations"><div class="hub-panel-heading"><span>CHOOSE YOUR PERSPECTIVE</span><span>01—03</span></div><div class="hub-panel-content"></div></section>
    </div>
    <footer class="hub-footer"><span>PIECE TOGETHER THE UNIVERSE</span><span class="hub-replay-mount"></span></footer>
    <dialog class="hub-menu" aria-label="PISCES navigation"><div><span>PISCES / NAVIGATION</span><button class="hub-menu-close" autofocus>Close ×</button></div><nav aria-label="All destinations"><a href="#departure">Journey Through Scale ↗</a><a href="planets.html">Worlds ↗</a><a href="deep-space.html">Deep Sky ↗</a><button data-menu-direction="learn">Learn</button><button data-menu-direction="take-part">Take Part</button></nav><p>Explore the universe. Build understanding. Find your place in astronomy.</p></dialog>`;
  entrance.append(hub); hub.querySelector('.hub-replay-mount').append(replay);
  const content = hub.querySelector('.hub-panel-content'), title = hub.querySelector('h2');
  const sections = {
    explore: { kicker:'01 / EXPLORE THE OBSERVATORY', title:'A universe.<br>A place to begin.', description:'Travel across scale. Get closer to a world.<br>Find the connections that change your perspective.', heading:'CHOOSE YOUR PERSPECTIVE', html:`<a class="hub-route" href="#departure"><span>01</span><div><strong>Journey Through Scale</strong><p>A continuous flight from Earth into the cosmic web.</p></div><b aria-hidden="true">↗</b></a><a class="hub-route" href="planets.html"><span>02</span><div><strong>Worlds</strong><p>The Sun, eight planets, the Moon and Pluto. Up close.</p></div><b aria-hidden="true">↗</b></a><a class="hub-route" href="deep-space.html"><span>03</span><div><strong>Deep Sky</strong><p>Galaxies, filaments and the observable universe.</p></div><b aria-hidden="true">↗</b></a><a class="hub-solar-link" href="#inner-solar-system">Start within the Solar System →</a>` },
    learn: { kicker:'02 / BUILD UNDERSTANDING',title:'See the sky.<br>Understand it.',description:'From a point on Earth to a position among the stars.<br>Build the ideas that make observation meaningful.',heading:'LEARNING PATH / IN DEVELOPMENT',html:`<ol class="hub-outline"><li><strong>Orient yourself</strong><p>Celestial sphere · altitude and azimuth</p></li><li><strong>Follow the motion</strong><p>Right ascension and declination · ecliptic · seasons</p></li><li><strong>Connect the ideas</strong><p>Constellations · geometry · trigonometry</p></li></ol><p class="hub-availability">Interactive lessons are being developed. For now, explore sourced object facts in Worlds and Deep Sky.</p><a class="hub-solar-link" href="planets.html#earth">Explore Earth’s facts →</a>` },
    'take-part': {kicker:'03 / FIND YOUR PLACE',title:'Look up.<br>Go further.',description:'Astronomy reaches beyond the screen.<br>Find people, places and ways to take part.',heading:'OPPORTUNITIES / IN DEVELOPMENT',html:`<ol class="hub-outline"><li><strong>Observe together</strong><p>Clubs · astronomy organizations · observing groups</p></li><li><strong>Challenge yourself</strong><p>Competitions · programs · internships</p></li><li><strong>Visit and discover</strong><p>Observatories · institutions · public astronomy</p></li></ol><p class="hub-availability">The curated directory is being developed. Verified locations, eligibility and dates will accompany each listing.</p><a class="hub-solar-link" href="observatory.html">Read our observing and science notes →</a>` }
  };
  function select(direction, focus=false) {
    const key = sections[direction] ? direction : 'explore', data=sections[key];
    hub.dataset.direction=key; title.innerHTML=data.title;
    hub.querySelector('.hub-kicker').textContent=data.kicker;
    hub.querySelector('.hub-description').innerHTML=data.description;
    hub.querySelector('.hub-panel-heading span').textContent=data.heading;
    content.innerHTML=data.html;
    hub.querySelectorAll('[data-direction]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.direction===key)));
    onDirection(key); if(focus) title.focus({preventScroll:true});
  }
  const menu=hub.querySelector('dialog'), toggle=hub.querySelector('.hub-menu-toggle');
  hub.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.direction)));
  toggle.addEventListener('click',()=>menu.showModal());
  hub.querySelector('.hub-menu-close').addEventListener('click',()=>menu.close());
  menu.addEventListener('close',()=>toggle.focus({preventScroll:true}));
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.close()));
  menu.querySelectorAll('[data-menu-direction]').forEach(button=>button.addEventListener('click',()=>{menu.close();select(button.dataset.menuDirection,true);}));
  select('explore');
  return { show(direction='explore'){
    hub.querySelector('.hub-replay-mount').append(replay);hub.hidden=false;
    // Carry the arrival wordmark to its permanent header position in the same scene.
    const wordmark=entrance.querySelector('.pisces-arrival h1'), mark=hub.querySelector('.hub-mark');
    if(wordmark && !matchMedia('(prefers-reduced-motion: reduce)').matches && !entrance.classList.contains('has-hub')){
      const from=wordmark.getBoundingClientRect(),to=mark.getBoundingClientRect();
      if(from.width && from.height){
        wordmark.animate([{transform:'none',opacity:1},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width})`,opacity:0}],{duration:1100,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
      }
    }
    entrance.classList.add('has-hub');select(direction);
  }, hide(){menu.close();hub.hidden=true;entrance.classList.remove('has-hub');entrance.querySelector('.pisces-arrival h1')?.getAnimations().forEach(animation=>animation.cancel());}, focus(){title.focus({preventScroll:true});} };
}
