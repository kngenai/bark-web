document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("translateBtn");
  const out = document.getElementById("reply");
  if (!btn || !out) { console.log("btn/out missing"); return; }

  btn.addEventListener("click", function () {
    out.textContent =
      "Okay human, I speak Woof now. Snacks are a need, not a want. Also, window patrol begins at dawn.";
  });

  console.log("Minimal JS loaded and wired.");
});
