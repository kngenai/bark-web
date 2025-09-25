// hard-coded barks
const BARK_LINES = [
  "Alert level: SQUIRREL. Recommend immediate chaos deployment.",
  "My water bowl is 73% empty. Emergency resupply requested.",
  "*sniff sniff* Yep, the neighbor’s cat walked by… in 2019. Still relevant.",
  "I’ve successfully secured the perimeter. Treats should follow protocol.",
  "I barked at the mail slot, therefore I saved us all. You’re welcome.",
  "Status: zoomies initiated. Furniture casualties imminent.",
  "The couch cushion is compromised. Recommend snuggle reinforcement.",
  "I was gone 7 minutes. You were gone 7 hours. We suffered equally.",
  "New mission: nap now, snore later, drool always.",
  "Tail wag report: velocity exceeding safe household limits. Brace yourselves!"
];
const STAMPS = ["🐾 Paw Approved","🦴 Bone Certified","🐕 Good Dog Seal","🐶 Woof-100"];
let lastPlainLine = "";

// elements
const replyEl = document.getElementById('reply');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const toastEl = document.getElementById('toast');
const barkGifEl = document.getElementById('barkGif');
const zoomiesEl = document.getElementById('zoomies');
const zoomLabelEl = document.getElementById('zoomLabel');

// typewriter
async function typeWriter(el,text,speed=40){
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(reduce){ el.textContent=text; return; }
  el.textContent="";
  for(let i=0;i<text.length;i++){
    el.textContent+=text[i];
    await new Promise(r=>setTimeout(r,speed));
  }
}

// decorate
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function decorate(line){ return `${line} <div class="stamp">${pick(STAMPS)}</div>`; }
function squirrelEasterEgg(){ return "SQUIRREL ALERT. All systems redirect to window patrol."; }
function tornadoEasterEgg(){ return "Zoomies at DEFCON 1. Sofa casualties expected."; }

// translate
async function doTranslate(){
  let line;
  if(Number(document.querySelector('#squirrelSeg .on')?.dataset.val)===100){
    line=squirrelEasterEgg();
  } else if(Number(zoomiesEl.value)>=10){
    line=tornadoEasterEgg();
  } else {
    line=pick(BARK_LINES);
  }
  lastPlainLine=line;

  // show barking gif
  barkGifEl.classList.add('on');

  replyEl.classList.remove('new');
  void replyEl.offsetWidth;
  replyEl.classList.add('new');

  await typeWriter(replyEl,line,40);
  replyEl.innerHTML=decorate(replyEl.textContent);

  // hide barking gif
  barkGifEl.classList.remove('on');
}
translateBtn.onclick=()=>doTranslate();

// copy
copyBtn.onclick=async()=>{
  if(!lastPlainLine){ showToast("Nothing to copy"); return; }
  await navigator.clipboard.writeText(lastPlainLine);
  showToast("Copied!");
};
function showToast(msg){
  toastEl.textContent=msg;
  toastEl.classList.add('on');
  setTimeout(()=>toastEl.classList.remove('on'),1500);
}

// zoomies label
function zoomLabel(v){
  const n=Number(v);
  const bucket=n<=2?"Couch potato":n<=6?"Wigglebutt":"Tornado";
  zoomLabelEl.textContent=`${n} · ${bucket}`;
}
zoomiesEl.addEventListener('input',e=>zoomLabel(e.target.value));
zoomLabel(zoomiesEl.value);

// reactions, gifs, quips (same as before)
