// ===== Data =====
const BARK_LINES = [
  "Alert level: SQUIRREL. Recommend immediate chaos deployment.",
  "My water bowl is 73% empty. Emergency resupply requested.",
  "I barked at the mail slot, therefore I saved us all. You’re welcome.",
  "Status: zoomies initiated. Furniture casualties imminent.",
  "Tail wag report: velocity exceeding safe household limits. Brace yourselves!"
];
const STAMPS = ["🐾 Paw Approved","🦴 Bone Certified","🐕 Good Dog Seal","🐶 Woof-100"];

const BARK_SOURCES = [
  "/assets/dog-bark.gif",
  "https://upload.wikimedia.org/wikipedia/commons/1/18/Dog_tail_wagging.gif"
];

// GIF choices: [local, fallback]
const DOG_GIFS_SOURCES = [
  ["/assets/dog-blah-blah-blah.gif","https://upload.wikimedia.org/wikipedia/commons/1/18/Dog_tail_wagging.gif"],
  ["/assets/dog-talk-dog.gif","https://upload.wikimedia.org/wikipedia/commons/5/5f/Doggy_treadmill.gif"],
  ["/assets/talking-ben.gif","https://upload.wikimedia.org/wikipedia/commons/5/5a/Dog_shakes_head.gif"],
  ["/assets/dog-phone.gif","https://upload.wikimedia.org/wikipedia/commons/8/8c/Dog_sleeping.gif"]
];

const QUIPS = [
  "Licensed in Bark-itecture, minor in Zoomology.",
  "Powered by snacks and questionable science.",
  "If found, please return to the nearest couch.",
  "100% organic bark. No fillers.",
  "Now with extra tail wag per paragraph."
];

const CONFETTI_EMOJIS = ["🐶","🦴","🐾","⭐","✨","💥"];

// ===== Helpers =====
const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
const shuffle = (a)=>[...a].sort(()=>Math.random()-0.5);
const prefersReduced = ()=> window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

function typeWriter(el,text,speed=40){
  if (!el) return Promise.resolve();
  if (prefersReduced()) { el.textContent = text; return Promise.resolve(); }
  el.textContent="";
  return new Promise(async (resolve)=>{
    for(let i=0;i<text.length;i++){
      el.textContent += text[i];
      await new Promise(r=>setTimeout(r,speed));
    }
    resolve();
  });
}
function decorate(line){ return `${line} <div class="stamp">${pick(STAMPS)}</div>`; }
function zoomLabelText(v){
  const n=Number(v);
  const bucket=n<=2?"Couch potato":n<=6?"Wigglebutt":"Tornado";
  return `${n} · ${bucket}`;
}
function showToast(el,msg){
  if(!el) return;
  el.textContent=msg;
  el.classList.add('on');
  setTimeout(()=>el.classList.remove('on'),1500);
}
function popConfetti(count=24){
  if (prefersReduced()) return;
  const layer=document.createElement('div');
  layer.className='confetti'; document.body.appendChild(layer);
  const W=window.innerWidth;
  for(let i=0;i<count;i++){
    const s=document.createElement('span');
    s.className='piece';
    s.textContent=pick(CONFETTI_EMOJIS);
    s.style.left=(Math.random()*W)+'px';
    s.style.fontSize=(16+Math.random()*14)+'px';
    s.style.animationDelay=(Math.random()*300|0)+'ms';
    layer.appendChild(s);
  }
  setTimeout(()=>layer.remove(),1600);
}
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

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const replyEl = document.getElementById('reply');
  const translateBtn = document.getElementById('translateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const toastEl = document.getElementById('toast');
  const barkGifEl = document.getElementById('barkGif');
  const barkGifImg = document.getElementById('barkGifImg');
  const zoomiesEl = document.getElementById('zoomies');
  const zoomLabelEl = document.getElementById('zoomLabel');
  const gifRail = document.getElementById('gifRail');
  const gifToggle = document.getElementById('gifToggle');
  const quipEl = document.getElementById('quip');
  const bgBubble = document.getElementById('bgBubble');
  const heroBubble = document.getElementById('heroBubble');

  const segGroups = {
    count: document.getElementById('countSeg'),
    pitch: document.getElementById('pitchSeg'),
    urgency: document.getElementById('urgencySeg'),
    mood: document.getElementById('moodSeg'),
    squirrel: document.getElementById('squirrelSeg'),
  };

  let lastPlainLine = "";

  // Initial images w/ fallbacks
  const BG_DOG_SOURCES = [
    "/assets/bg-dog-cartoon.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Dog_cartoon.svg/512px-Dog_cartoon.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Cartoon_Dog.svg/512px-Cartoon_Dog.svg.png"
  ];
  const HERO_SOURCES = [
    "/assets/dog-bubble.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Husky_Walking.jpg/320px-Husky_Walking.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Golden_Retriever_medium-to-light-coat.jpg/320px-Golden_Retriever_medium-to-light-coat.jpg"
  ];

  loadWithFallback(document.getElementById('bgDog'), BG_DOG_SOURCES, () => {
    const bg = document.querySelector('.bg-hero');
    if (bg) bg.style.display = 'none';
  });
  loadWithFallback(document.getElementById('heroDog'), HERO_SOURCES, () => {
    const heroImg = document.getElementById('heroDog');
    if (heroImg) heroImg.style.display = 'none';
  });

  // Segmented groups (single select)
  Object.values(segGroups).forEach(seg=>{
    if (!seg) return;
    seg.addEventListener('click', e=>{
      if (e.target.tagName!=='BUTTON') return;
      seg.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
      e.target.classList.add('on');
    });
  });

  // Randomize
  const rndBtn = document.getElementById('randomizeWoof');
  if (rndBtn) {
    rndBtn.onclick = ()=>{
      Object.values(segGroups).forEach(seg=>{
        if (!seg) return;
        const btns=Array.from(seg.querySelectorAll('button'));
        if (!btns.length) return;
        const r=btns[Math.floor(Math.random()*btns.length)];
        btns.forEach(b=>b.classList.remove('on'));
        r.classList.add('on');
      });
      const z=Math.floor(Math.random()*11);
      if (zoomiesEl) {
        zoomiesEl.value=z;
        zoomLabelEl.textContent = zoomLabelText(z);
      }
    };
  }

  // Zoom label
  zoomiesEl?.addEventListener('input',e=>{
    zoomLabelEl.textContent = zoomLabelText(e.target.value);
  });
  if (zoomiesEl) zoomLabelEl.textContent = zoomLabelText(zoomiesEl.value);

  // Copy
  copyBtn?.addEventListener('click', async()=>{
    if(!lastPlainLine){ showToast(toastEl,"Nothing to copy"); return; }
    try{ await navigator.clipboard.writeText(lastPlainLine); showToast(toastEl,"Copied!"); }
    catch{ showToast(toastEl,"Copy failed"); }
  });

  // GIF rail (sticky, compact, show 2)
  function renderGifs(){
    if(!gifRail) return;
    if(gifToggle && !gifToggle.checked){ gifRail.innerHTML=""; return; }
    const picks = shuffle(DOG_GIFS_SOURCES).slice(0, 2);
    const CAPS = ["Explaining advanced Barkonomics.","Zoomies research in progress."];

    gifRail.innerHTML = picks.map((arr,i)=>(
      `<figure class="gif-card">
         <img referrerpolicy="no-referrer" alt="Dog gif" />
         <figcaption class="caption">${CAPS[i%CAPS.length]}</figcaption>
       </figure>`
    )).join("");

    Array.from(gifRail.querySelectorAll('.gif-card')).forEach((card,i)=>{
      const img=card.querySelector('img');
      loadWithFallback(img, picks[i], ()=>{ card.classList.add('failed'); img.remove(); });
    });
  }
  gifToggle?.addEventListener('change', renderGifs);

  // Rotate small hero bubble
  setInterval(()=>{
    if (!heroBubble) return;
    heroBubble.textContent = pick([
      "Translator online. Begin borks.",
      "Fluent in Treatish.",
      "Certified Good Dog™ interpreter.",
      "Now decoding tail-wags…",
      "Woof to text engaged."
    ]);
  }, 3500);

  // Background bubble rotation
  const BUBBLE_LINES = [
    "Woof means hello!",
    "Arf arf = snacks now.",
    "Bork bork → intruder alert!",
    "Zoomies are my cardio.",
    "Translation: I run this house.",
    "Tail wag = 100% approval.",
    "Sniff sniff... data collected."
  ];
  let bubbleIndex=0, bubbleTimer=null, resumeTimer=null;

  function fadeSwap(el, text, dur=300){
    if (!el) return;
    el.style.transition='opacity '+dur+'ms ease';
    el.style.opacity='0';
    setTimeout(()=>{ el.textContent=text; el.style.opacity='1'; }, dur);
  }
  function startBubbleRotation(){
    stopBubbleRotation();
    bubbleTimer=setInterval(()=>{
      bubbleIndex=(bubbleIndex+1)%BUBBLE_LINES.length;
      fadeSwap(bgBubble, BUBBLE_LINES[bubbleIndex]);
    }, 4000);
  }
  function stopBubbleRotation(){ if(bubbleTimer){ clearInterval(bubbleTimer); bubbleTimer=null; } }
  function setBgBubble(text, holdMs=8000){
    stopBubbleRotation();
    fadeSwap(bgBubble, text);
    if(resumeTimer) clearTimeout(resumeTimer);
    resumeTimer=setTimeout(()=>startBubbleRotation(), holdMs);
  }
  startBubbleRotation();

  // Translate (no API)
  const readSegVal = (segId, fallback)=> document.querySelector(`#${segId} .on`)?.dataset.val ?? fallback;
  const squirrelEasterEgg = ()=> "SQUIRREL ALERT. All systems redirect to window patrol. If lost, follow the chaos trail.";
  const tornadoEasterEgg = ()=> "Zoomies at DEFCON 1. Sofa, it’s not you—it’s me. BRB in a blur.";

  async function doTranslate(){
    const squirrel = Number(readSegVal('squirrelSeg','50'));
    const zoomies = Number(zoomiesEl?.value ?? 5);

    let line;
    if (squirrel === 100) line = squirrelEasterEgg();
    else if (zoomies >= 10) line = tornadoEasterEgg();
    else line = pick(BARK_LINES);

    lastPlainLine = line;

    loadWithFallback(barkGifImg, BARK_SOURCES, ()=> barkGifEl && (barkGifEl.style.display='none'));
    barkGifEl?.classList.add('on');

    replyEl?.classList.remove('new'); void replyEl?.offsetWidth; replyEl?.classList.add('new');
    if (replyEl) {
      await typeWriter(replyEl, line, 40);
      replyEl.innerHTML = decorate(replyEl.textContent);
    }

    setBgBubble(lastPlainLine);

    if (Math.random() < 0.35) popConfetti(28);
    if (quipEl) quipEl.textContent = pick(QUIPS);
  }

  translateBtn?.addEventListener('click', doTranslate);

  // Initial render
  renderGifs();
  if (quipEl) quipEl.textContent = pick(QUIPS);
});
