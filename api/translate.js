// ------- Data -------
const HERO_GIFS = [
  ["/assets/dog-talk-dog.gif", "https://upload.wikimedia.org/wikipedia/commons/1/18/Dog_tail_wagging.gif"],
  ["/assets/dog-phone.gif",    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Dog_sleeping.gif"],
  ["/assets/talking-ben.gif",  "https://upload.wikimedia.org/wikipedia/commons/5/5a/Dog_shakes_head.gif"]
];

const BARK_GIF_SOURCES = [
  "/assets/dog-bark.gif",
  "https://upload.wikimedia.org/wikipedia/commons/1/18/Dog_tail_wagging.gif"
];

const QUIPS = [
  "Powered by snacks and questionable science.",
  "Licensed in Bark-itecture, minor in Zoomology.",
  "100% organic bark. No fillers.",
  "If found, please return to the nearest couch."
];

const OPENERS = [
  "Okay, human, here’s the situation:",
  "Gather round, pack, breaking news:",
  "Small announcement from the Ministry of Borks:",
  "Official memo from the Department of Zoomies:"
];
const COUNT_LINES = {
  one:  ["a single, dramatic woof", "one very meaningful bark", "a solo statement piece"],
  two:  ["a classy double-woof", "two precision barks", "a tasteful bark-bark"],
  many: ["a full pack chorus", "a community bark meeting", "a symphony of howls"]
};
const PITCH_LINES = {
  high: ["in chipmunk-adjacent pitch", "soprano mode engaged", "whistle-register activated"],
  mid:  ["in confident mid-range", "with podcast-host energy", "like a professional doorbell"],
  low:  ["from the basement of the soul", "subwoofer activated", "earthquake advisory level"]
};
const URGENCY_LINES = {
  chill:      ["no rush, just vibes", "calendar invite: optional", "non-urgent, yet important"],
  want:       ["requesting immediate snack deployment", "TPS report shows treat deficit", "operational need: belly rubs"],
  emergency:  ["full red alert", "DEFCON woof", "mission-critical, paws on deck"]
};

const CONFETTI = ["🐶","🦴","🐾","✨","⭐"];

// ------- Helpers -------
const $ = (id) => document.getElementById(id);
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const shuffle = (a) => [...a].sort(()=>Math.random()-0.5);
const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

function loadWithFallback(imgEl, sources, onFail){
  if (!imgEl) return;
  const list = [...sources];
  const next = () => {
    if (!list.length) { onFail && onFail(); return; }
    const src = list.shift();
    imgEl.referrerPolicy = 'no-referrer';
    imgEl.src = src;
    imgEl.onerror = next;
  };
  next();
}

async function typeWriter(el, text, speed = 18){
  if (!el) return;
  if (prefersReduced()) { el.textContent = text; return; }
  el.textContent = "";
  for (let i=0;i<text.length;i++){
    el.textContent += text[i];
    // tiny random jitter for life
    await new Promise(r=>setTimeout(r, speed + (i%7===0?4:0)));
  }
}

function showToast(msg){
  const t = $('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('on');
  setTimeout(()=>t.classList.remove('on'), 1500);
}

function confettiBurst(){
  if (prefersReduced()) return;
  const layer=document.createElement('div');
  layer.style.position='fixed'; layer.style.left=0; layer.style.top=0;
  layer.style.width='100%'; layer.style.height='0'; layer.style.overflow='visible'; layer.style.zIndex=60;
  document.body.appendChild(layer);
  const W=window.innerWidth;
  for(let i=0;i<24;i++){
    const s=document.createElement('span');
    s.textContent=pick(CONFETTI);
    s.style.position='absolute';
    s.style.left=(Math.random()*W)+'px';
    s.style.top='0';
    s.style.fontSize=(16+Math.random()*14)+'px';
    s.style.animation=`fall .9s ease-in forwards`;
    s.style.opacity='.95';
    layer.appendChild(s);
  }
  setTimeout(()=>layer.remove(), 1000);
}

// Small CSS for confetti animation (injected once)
(function injectConfettiCSS(){
  const css = `
  @keyframes fall {
    from { transform: translateY(-10px) rotate(0); }
    to   { transform: translateY(120px) rotate(360deg); opacity: .2; }
  }`;
  const tag = document.createElement('style');
  tag.textContent = css;
  document.head.appendChild(tag);
})();

// Build a 2–3 sentence funny translation
function buildTranslation({breed, count, pitch, urgency, squirrel, zoomies}){
  const opener = pick(OPENERS);
  const s1 = `Detected ${pick(COUNT_LINES[count])} ${pick(PITCH_LINES[pitch])} — ${pick(URGENCY_LINES[urgency])}.`;
  const s2 = squirrel === 100
    ? "Also: SQUIRREL CONFIRMED. All windows now officially ‘police stations.’"
    : squirrel === 0
      ? "No squirrels in sight, but I will maintain patrol purely for morale."
      : "Squirrel probability medium; recommend cautious tail-wagging with rapid perimeter checks.";
  const z = Number(zoomies || 0);
  const zDesc = z >= 8 ? "Zoomies at tornado strength; sofa should update its will."
            : z >= 5 ? "Zoomies at sustainable thrum; prepare hallway sprints."
            : "Zoomies dormant; naps at maximum fluff.";
  const breedTag = breed ? ` [${breed}]` : "";
  return `${opener} ${s1} ${s2} ${zDesc}${breedTag}`;
}

// ------- App -------
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const bgBubble = $('bgBubble');
  const heroBubble = $('heroBubble');
  const heroGifs = $('heroGifs');

  const translateBtn = $('translateBtn');
  const copyBtn = $('copyBtn');
  const replyEl = $('reply');
  const barkGifImg = $('barkGifImg');
  const quipEl = $('quip');

  const zoomies = $('zoomies');
  const zoomLabel = $('zoomLabel');

  const segs = {
    count: $('countSeg'),
    pitch: $('pitchSeg'),
    urgency: $('urgencySeg'),
    squirrel: $('squirrelSeg')
  };

  let lastText = "";

  // Render hero GIFs (2 nice cards)
  function renderHeroGifs(){
    if (!heroGifs) return;
    const picks = shuffle(HERO_GIFS).slice(0,2);
    heroGifs.innerHTML = picks.map((pair,i)=>`
      <figure class="gif-card">
        <img alt="Dog gif ${i+1}" />
        <figcaption class="caption">${i===0 ? "Explaining Barkonomics" : "Consulting Professor Ben"}</figcaption>
      </figure>
    `).join("");
    Array.from(heroGifs.querySelectorAll('img')).forEach((img,i)=>{
      loadWithFallback(img, picks[i], ()=> img.remove());
    });
  }
  renderHeroGifs();

  // Nice rotating micro-copy
  setInterval(()=>{
    if (!heroBubble) return;
    heroBubble.textContent = pick([
      "Translator online. Begin borks.",
      "Fluent in Treatish.",
      "Certified Good Dog™ interpreter.",
      "Now decoding tail-wags…",
      "Woof-to-text engaged."
    ]);
  }, 3500);

  // Background footer bubble cycles too
  const FOOT_LINES = [
    "Woof means hello!",
    "Arf arf = snacks now.",
    "Zoomies are my cardio.",
    "Translation: I run this house."
  ];
  let footIdx = 0;
  setInterval(()=>{
    if (!bgBubble) return;
    footIdx = (footIdx+1)%FOOT_LINES.length;
    bgBubble.textContent = FOOT_LINES[footIdx];
  }, 4200);

  // Segmented controls (single-select)
  Object.values(segs).forEach(seg=>{
    if (!seg) return;
    seg.addEventListener('click', e=>{
      if (e.target.tagName !== 'BUTTON') return;
      seg.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
      e.target.classList.add('on');
    });
  });

  // Zoomies label
  const zLabel = (v)=>{
    const n=Number(v);
    const bucket = n<=2 ? "Couch potato" : n<=6 ? "Wigglebutt" : "Tornado";
    zoomLabel.textContent = `${n} · ${bucket}`;
  };
  zoomies.addEventListener('input', e=> zLabel(e.target.value));
  zLabel(zoomies.value);

  // Randomize
  $('randomizeWoof').addEventListener('click', ()=>{
    Object.values(segs).forEach(seg=>{
      if (!seg) return;
      const btns = seg.querySelectorAll('button');
      const r = btns[Math.floor(Math.random()*btns.length)];
      btns.forEach(b=>b.classList.remove('on'));
      r.classList.add('on');
    });
    const z = Math.floor(Math.random()*11);
    zoomies.value = z; zLabel(z);
  });

  // Translate
  translateBtn.addEventListener('click', async ()=>{
    const breed = $('breed').value;
    const count = segs.count.querySelector('.on')?.dataset.val || 'two';
    const pitch = segs.pitch.querySelector('.on')?.dataset.val || 'mid';
    const urgency = segs.urgency.querySelector('.on')?.dataset.val || 'chill';
    const squirrel = Number(segs.squirrel.querySelector('.on')?.dataset.val || 50);
    const z = Number(zoomies.value || 5);

    const text = buildTranslation({breed, count, pitch, urgency, squirrel, zoomies: z});
    lastText = text;

    // Barking GIF visible while "typing"
    loadWithFallback(barkGifImg, BARK_GIF_SOURCES);

    // Type, then confetti + quip
    await typeWriter(replyEl, text, 12);
    if (Math.random() < 0.45) confettiBurst();
    if (quipEl) quipEl.textContent = pick(QUIPS);
  });

  // Copy
  copyBtn.addEventListener('click', async ()=>{
    if (!lastText) return showToast("Nothing to copy");
    try { await navigator.clipboard.writeText(lastText); showToast("Copied!"); }
    catch { showToast("Copy failed"); }
  });
});
