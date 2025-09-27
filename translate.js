(function () {
  "use strict";

  // Helpers
  const $ = (id) => document.getElementById(id);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const prefersReduced = () =>
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function loadWithFallback(imgEl, sources, onFail) {
    if (!imgEl || !sources || !sources.length) return;
    const list = sources.slice();
    function next() {
      if (!list.length) { if (onFail) onFail(); return; }
      imgEl.referrerPolicy = "no-referrer";
      imgEl.src = list.shift();
      imgEl.onerror = next;
    }
    next();
  }

  function typeWriter(el, text, speed) {
    if (!el) return Promise.resolve();
    if (prefersReduced()) { el.textContent = text; return Promise.resolve(); }
    el.textContent = "";
    let i = 0;
    return new Promise((resolve) => {
      (function tick() {
        if (i >= text.length) return resolve();
        el.textContent += text.charAt(i++);
        setTimeout(tick, speed);
      })();
    });
  }

  function showToast(msg) {
    const t = $("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("on");
    setTimeout(() => t.classList.remove("on"), 1500);
  }

  // Dog GIF rail
function renderGifs() {
  const gifRail = document.getElementById("gifRail");
  const gifToggle = document.getElementById("gifToggle");
  if (!gifRail || !gifToggle || !gifToggle.checked) {
    if (gifRail) gifRail.innerHTML = "";
    return;
  }

  const DOG_GIFS = [
    ["/assets/dog-blah-blah-blah.gif", "https://upload.wikimedia.org/wikipedia/commons/1/18/Dog_tail_wagging.gif"],
    ["/assets/dog-talk-dog.gif", "https://upload.wikimedia.org/wikipedia/commons/5/5f/Doggy_treadmill.gif"],
    ["/assets/talking-ben.gif", "https://upload.wikimedia.org/wikipedia/commons/5/5a/Dog_shakes_head.gif"],
    ["/assets/dog-phone.gif", "https://upload.wikimedia.org/wikipedia/commons/8/8c/Dog_sleeping.gif"]
  ];

  const captions = [
    "Explaining advanced Barkonomics.",
    "Consulting Professor Ben.",
    "Zoomies research in progress.",
    "Bark stream, 24/7."
  ];

  // Pick up to 4 random sets
  const picks = [...DOG_GIFS].sort(() => Math.random() - 0.5).slice(0, 4);

  gifRail.innerHTML = picks.map((sources, i) => `
    <figure class="gif-card">
      <img alt="Dog gif" referrerpolicy="no-referrer" />
      <figcaption class="caption">${captions[i % captions.length]}</figcaption>
    </figure>
  `).join("");

  Array.from(gifRail.querySelectorAll("img")).forEach((img, i) => {
    const sources = picks[i].slice();
    const tryNext = () => {
      if (!sources.length) return;
      img.src = sources.shift();
      img.onerror = tryNext;
    };
    tryNext();
  });
}


  // Copy of funny text bits
  const OPENERS = [
    "Okay, human, here is the situation:",
    "Small announcement from the Ministry of Borks:",
    "Official memo from the Department of Zoomies:"
  ];
  const COUNT_LINES = {
    one:  ["a single, dramatic woof", "one very meaningful bark", "a solo statement piece"],
    two:  ["a classy double-woof", "two precision barks", "a tasteful bark-bark"],
    many: ["a full pack chorus", "a community bark meeting", "a symphony of howls"]
  };
  const PITCH_LINES = {
    high: ["in chipmunk-adjacent pitch", "soprano mode engaged", "whistle register activated"],
    mid:  ["in confident mid range", "with podcast host energy", "like a professional doorbell"],
    low:  ["from the basement of the soul", "subwoofer activated", "earthquake advisory level"]
  };
  const URGENCY_LINES = {
    chill:     ["no rush, just vibes", "calendar invite: optional", "non urgent, yet important"],
    want:      ["requesting immediate snack deployment", "treat deficit detected", "operational need: belly rubs"],
    emergency: ["full red alert", "DEFCON woof", "mission critical, paws on deck"]
  };
  const QUIPS = [
    "Powered by snacks and questionable science.",
    "Licensed in Bark-itecture, minor in Zoomology.",
    "100% organic bark. No fillers.",
    "If found, please return to the nearest couch."
  ];

  function buildTranslation(opts) {
    const breed = opts.breed || "";
    const opener = pick(OPENERS);
    const s1 = "Detected " + pick(COUNT_LINES[opts.count]) + " " + pick(PITCH_LINES[opts.pitch]) +
               " — " + pick(URGENCY_LINES[opts.urgency]) + ".";
    let s2;
    if (opts.squirrel === 100) {
      s2 = "Also: SQUIRREL CONFIRMED. All windows are now police stations.";
    } else if (opts.squirrel === 0) {
      s2 = "No squirrels in sight; patrol continues purely for morale.";
    } else {
      s2 = "Squirrel probability medium; perimeter checks recommended.";
    }
    const z = Number(opts.zoomies || 0);
    const zDesc = (z >= 8) ? "Zoomies at tornado strength; sofa should update its will."
               : (z >= 5) ? "Zoomies at sustainable thrum; prepare hallway sprints."
                          : "Zoomies dormant; naps at maximum fluff.";
    const tag = breed ? " [" + breed + "]" : "";
    return opener + " " + s1 + " " + s2 + " " + zDesc + tag;
  }

  // App
  document.addEventListener("DOMContentLoaded", function () {
    const translateBtn = $("translateBtn");
    const copyBtn = $("copyBtn");
    const replyEl = $("reply");
    const quipEl = $("quip");

    const barkGifImg = $("barkGifImg");
    const heroDog = $("heroDog");
    const bgDog = $("bgDog");
    const heroBubble = $("heroBubble");
    const bgBubble = $("bgBubble");

    const zoomies = $("zoomies");
    const zoomLabel = $("zoomLabel");

    const segs = {
      count:    $("countSeg"),
      pitch:    $("pitchSeg"),
      urgency:  $("urgencySeg"),
      squirrel: $("squirrelSeg")
    };

    let lastText = "";

    // Initial render
renderGifs();

// Re-render when GIF toggle changes
const gifToggle = document.getElementById("gifToggle");
if (gifToggle) {
  gifToggle.addEventListener("change", renderGifs);
}

    // Images
    loadWithFallback(heroDog, [
      "/assets/dog-bubble.png",
      "https://upload.wikimedia.org/wikipedia/commons/9/9a/Golden_Retriever_medium-to-light-coat.jpg"
    ]);
    loadWithFallback(bgDog, [
      "/assets/dog-bubble.png",
      "https://upload.wikimedia.org/wikipedia/commons/4/45/Dog_cartoon.svg"
    ]);

    // Rotate hero bubble
    setInterval(() => {
      if (!heroBubble) return;
      heroBubble.textContent = pick([
        "Translator online. Begin borks.",
        "Fluent in Treatish.",
        "Certified Good Dog interpreter.",
        "Now decoding tail wags..."
      ]);
    }, 3500);

    // Footer bubble
    const FOOT = ["Woof means hello!", "Arf arf = snacks now.", "Zoomies are my cardio.", "I run this house."];
    let fi = 0;
    setInterval(() => {
      if (!bgBubble) return;
      fi = (fi + 1) % FOOT.length;
      bgBubble.textContent = FOOT[fi];
    }, 4200);

    // Segments
    Object.keys(segs).forEach((k) => {
      const seg = segs[k];
      if (!seg) return;
      seg.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") return;
        seg.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
        e.target.classList.add("on");
      });
    });

    // Zoomies label
    function zLabel(v) {
      const n = Number(v);
      const bucket = (n <= 2) ? "Couch potato" : (n <= 6) ? "Wigglebutt" : "Tornado";
      if (zoomLabel) zoomLabel.textContent = n + " · " + bucket;
    }
    if (zoomies) {
      zLabel(zoomies.value);
      zoomies.addEventListener("input", (e) => zLabel(e.target.value));
    }

    // Randomize
    const rnd = $("randomizeWoof");
    if (rnd) {
      rnd.addEventListener("click", () => {
        Object.keys(segs).forEach((k) => {
          const seg = segs[k]; if (!seg) return;
          const btns = seg.querySelectorAll("button");
          if (!btns.length) return;
          const r = btns[Math.floor(Math.random() * btns.length)];
          btns.forEach((b) => b.classList.remove("on"));
          r.classList.add("on");
        });
        if (zoomies) {
          const z = Math.floor(Math.random() * 11);
          zoomies.value = z; zLabel(z);
        }
      });
    }

    // Translate
    if (translateBtn) {
      translateBtn.addEventListener("click", async () => {
        const segVal = (id, fb) => segs[id]?.querySelector(".on")?.dataset.val || fb;
        const breed = $("breed")?.value || "";
        const count = segVal("count", "two");
        const pitch = segVal("pitch", "mid");
        const urgency = segVal("urgency", "chill");
        const squirrel = Number(segVal("squirrel", "50"));
        const z = Number(zoomies ? zoomies.value : 5);

        const text = buildTranslation({ breed, count, pitch, urgency, squirrel, zoomies: z });
        lastText = text;

        loadWithFallback(barkGifImg, [
          "/assets/dog-bark.gif",
          "https://upload.wikimedia.org/wikipedia/commons/1/18/Dog_tail_wagging.gif"
        ]);

        await typeWriter(replyEl, text, 12);
        if (quipEl) quipEl.textContent = pick(QUIPS);
      });
    }

    // Copy
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        if (!lastText) return showToast("Nothing to copy");
        try { await navigator.clipboard.writeText(lastText); showToast("Copied!"); }
        catch { showToast("Copy failed"); }
      });
    }

    console.log("Bark Translator: JS initialized");
  });
})();
