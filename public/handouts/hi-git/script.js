document.documentElement.classList.remove("no-js");

/* Storage is a convenience only: the page works the same when it throws. */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem("hi-git:" + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("hi-git:" + key, JSON.stringify(value));
    } catch {
      /* private window or blocked storage */
    }
  },
};

/* ---------- Hero graph replay ---------- */
const graph = document.querySelector(".graph");
document.getElementById("replay-graph").addEventListener("click", () => {
  graph.classList.add("replay");
  void graph.offsetWidth; // restart the CSS animations
  graph.classList.remove("replay");
});

/* ---------- The 27 files in #122 ---------- */
// kind: "pr" belongs in the PR, "team" moves to team/, "out" is left out entirely.
const PR_FILES = [
  [".gitignore", "out"],
  ["__tests__/components/GalleryControls.test.tsx", "pr"],
  ["__tests__/components/ReturnForm.test.tsx", "pr"],
  ["__tests__/components/galleryModuleNumber.test.tsx", "pr"],
  ["__tests__/gallerySort.test.ts", "pr"],
  ["__tests__/gallerySorting.test.tsx", "pr"],
  ["__tests__/serverActions/getGallery.test.ts", "pr"],
  ["__tests__/serverActions/mongoose-connector.test.ts", "pr"],
  ["app/components/gallery/AppliedGalleryLayout.tsx", "pr"],
  ["app/components/gallery/Gallery.tsx", "pr"],
  ["app/components/gallery/GalleryDevTools.tsx", "pr"],
  ["app/components/gallery/GalleryItem.tsx", "pr"],
  ["app/components/gallery/GalleryMultiFilter.tsx", "pr"],
  ["app/components/gallery/ResetIntroduction.tsx", "pr"],
  ["app/components/gallery/moduleNumber.ts", "pr"],
  ["app/components/gallery/sortGalleryItems.ts", "pr"],
  ["app/components/gallery/styles.tsx", "pr"],
  ["app/guides/…/returnForm/ReturnForm.tsx", "pr"],
  ["app/halloffame/page.tsx", "pr"],
  ["app/halloffame/styles.tsx", "pr"],
  ["app/serverActions/authenticate.ts", "pr"],
  ["app/serverActions/getGallery.ts", "pr"],
  ["app/serverActions/mongoose-connector.ts", "pr"],
  ["docker-compose.yml", "team"],
  ["docs/raheel-gallery-sort.md", "team"],
  ["scripts/seed-test-data.ts", "team"],
  ["yarn.lock", "out"],
];

/* ---------- PR simulator ---------- */
const simChips = document.getElementById("sim-chips");
const simCount = document.getElementById("sim-count");
const simBad = document.getElementById("sim-bad");
const simWarn = document.getElementById("sim-warn");
const simTabs = document.querySelectorAll("[data-mode]");
let simMode = "dev";
let countTimer;

function animateNumber(el, to) {
  clearInterval(countTimer);
  let from = Number(el.textContent);
  const step = from > to ? -1 : 1;
  if (from === to) return;
  countTimer = setInterval(() => {
    from += step;
    el.textContent = from;
    if (from === to) clearInterval(countTimer);
  }, 45);
}

function renderSim(mode, animateOut) {
  const files = mode === "dev" ? PR_FILES : PR_FILES.filter(([, kind]) => kind === "pr");
  const bad = files.filter(([, kind]) => kind !== "pr").length;

  const draw = () => {
    simChips.innerHTML = "";
    files.forEach(([path, kind], i) => {
      const li = document.createElement("li");
      li.className = "chip" + (kind === "team" ? " chip--team" : kind === "out" ? " chip--out" : "");
      li.style.setProperty("--i", i);
      li.textContent = path;
      li.title = kind === "team" ? "Team-only: belongs in team/" : kind === "out" ? "Shouldn't change at all" : path;
      simChips.appendChild(li);
    });
  };

  // Going clean, only the files that don't belong fly out; the rest stay put.
  const leaving = simChips.querySelectorAll(".chip--team, .chip--out");
  if (animateOut && mode === "clean" && leaving.length) {
    leaving.forEach((li) => {
      li.classList.add("leaving");
      li.addEventListener("animationend", () => li.remove(), { once: true });
    });
  } else {
    draw();
  }

  animateNumber(simCount, files.length);
  simBad.textContent = bad;
  simWarn.classList.toggle("is-zero", bad === 0);
  simWarn.lastChild.textContent = bad === 0 ? " that don't belong ✓" : " don't belong";
}

simTabs.forEach((btn) =>
  btn.addEventListener("click", () => {
    if (btn.dataset.mode === simMode) return;
    simMode = btn.dataset.mode;
    simTabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    renderSim(simMode, true);
  })
);
renderSim("dev", false);

/* ---------- Map ---------- */
const MAP_INFO = {
  team: {
    title: "hyperisland-team: your private team repo",
    text: "Notes, handoff docs, the seed script, docker-compose, experiments. Everyone clones it into team/ inside the project folder. You commit and push it from inside team/, completely separate from the project's branches.",
    color: "var(--accent-amber-100)",
  },
  laptop: {
    title: "Your laptop: the project folder",
    text: "The project you already cloned from the fork, with team/ sitting inside it. The project's git ignores team/ because of the line in .git/info/exclude, so team files can never end up on a branch.",
    color: "var(--theme-module3-100)",
  },
  fork: {
    title: "tomonika-hyperisland: your fork (origin)",
    text: "dev-hyperisland stays the branch you share and test on, and feature/… branches still merge into it. New: for each PR you push a pr/… branch that starts from vefskoliv2's main.",
    color: "var(--theme-module3-hover)",
  },
  upstream: {
    title: "io.vefskoliv2: the school's repo (upstream)",
    text: "Only pr/… branches open pull requests here. You fetch from it (git fetch upstream) to start each PR branch and to bring its newest main into dev-hyperisland.",
    color: "var(--accent-green-100)",
  },
};
const mapDetail = document.getElementById("map-detail");
const nodes = document.querySelectorAll(".node");

function showNode(key) {
  const info = MAP_INFO[key];
  nodes.forEach((n) => n.setAttribute("aria-pressed", String(n.dataset.node === key)));
  mapDetail.innerHTML = "";
  const h = document.createElement("h3");
  h.textContent = info.title;
  const p = document.createElement("p");
  p.textContent = info.text;
  mapDetail.append(h, p);
  mapDetail.style.borderLeftColor = info.color;
  mapDetail.classList.remove("swap");
  void mapDetail.offsetWidth;
  mapDetail.classList.add("swap");
}
nodes.forEach((n) => n.addEventListener("click", () => showNode(n.dataset.node)));
showNode("laptop");

/* ---------- Copy buttons ---------- */
document.querySelectorAll("pre.code").forEach((pre) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "copy-btn";
  btn.textContent = "Copy";
  btn.setAttribute("aria-label", "Copy command");
  btn.addEventListener("click", async () => {
    const text = pre.querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(pre.querySelector("code"));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = "Selected";
    }
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("copied");
    }, 1600);
  });
  pre.appendChild(btn);
});

/* ---------- Setup tabs ---------- */
const tabButtons = document.querySelectorAll("[data-tab]");
function selectTab(key) {
  tabButtons.forEach((b) => {
    const on = b.dataset.tab === key;
    b.setAttribute("aria-selected", String(on));
    document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
  });
  store.set("tab", key);
}
tabButtons.forEach((b) => b.addEventListener("click", () => selectTab(b.dataset.tab)));
selectTab(store.get("tab", "one"));

/* ---------- Step progress ---------- */
const steps = document.querySelectorAll(".step[data-step]");
const pill = document.getElementById("progress-pill");
const doneSteps = new Set(store.get("steps", []));

function updatePill() {
  // "One person" and "everyone else" are alternatives, so count the visible
  // setup tab plus all of Part 2.
  const counted = [...steps].filter((s) => !s.closest("[hidden]"));
  const done = counted.filter((s) => doneSteps.has(s.dataset.step)).length;
  pill.textContent = `${done} / ${counted.length} steps done`;
  pill.classList.toggle("complete", done === counted.length);
  pill.classList.remove("bump");
  void pill.offsetWidth;
  pill.classList.add("bump");
}

steps.forEach((step) => {
  const box = step.querySelector(".done input");
  const id = step.dataset.step;
  box.checked = doneSteps.has(id);
  step.classList.toggle("is-done", box.checked);
  box.addEventListener("change", () => {
    if (box.checked) doneSteps.add(id);
    else doneSteps.delete(id);
    step.classList.toggle("is-done", box.checked);
    store.set("steps", [...doneSteps]);
    updatePill();
  });
});
tabButtons.forEach((b) => b.addEventListener("click", updatePill));
updatePill();

/* ---------- Sorter ---------- */
const SORT_ITEMS = [
  { path: "app/components/gallery/Gallery.tsx", answer: "pr", why: "The feature itself. This is what the PR is for." },
  { path: "docs/raheel-gallery-sort.md", answer: "team", why: "A handoff note for your team, with local paths and Notion links. It belongs with the team, not in the school's repo." },
  { path: "__tests__/gallerySort.test.ts", answer: "pr", why: "Tests go with the feature. They keep it working once it's in vefskoliv2." },
  { path: "yarn.lock", answer: "out", why: "package.json didn't change, so the lockfile shouldn't either. It got rewritten by an install. Reset it: git checkout upstream/main -- yarn.lock" },
  { path: "app/serverActions/getGallery.ts", answer: "pr", why: "The cards need topics, links and dates from the server, so this is part of the feature." },
  { path: "scripts/seed-test-data.ts", answer: "team", why: "Helps you fill a local database. With --reset it wipes users, guides, returns and reviews, so it should never ship in the school's repo." },
  { path: "app/components/gallery/GalleryMultiFilter.tsx", answer: "pr", why: "New component the gallery uses: part of the feature." },
  { path: "docker-compose.yml", answer: "team", why: "Your local MongoDB setup. Useful for the team, not part of the site." },
  { path: ".gitignore", answer: "out", why: "The lines it adds (.env, .env.local) are already covered by .env* in vefskoliv2's .gitignore." },
  { path: "__tests__/components/GalleryControls.test.tsx", answer: "pr", why: "Tests for the controls go with the controls." },
  { path: "app/halloffame/page.tsx", answer: "pr", why: "The Hall of Fame page turns the controls on, so it belongs in the PR." },
  { path: "app/components/gallery/sortGalleryItems.ts", answer: "pr", why: "Sorting logic: part of the feature." },
];
const SORT_LABELS = { pr: "PR", team: "team/", out: "Leave out" };

const sorterList = document.getElementById("sorter-list");
const scoreFill = document.getElementById("score-fill");
const scoreText = document.getElementById("score-text");
let picks = store.get("picks", {});

function renderSorter() {
  sorterList.innerHTML = "";
  SORT_ITEMS.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "sort-row";
    const path = document.createElement("span");
    path.className = "sort-row__path";
    path.textContent = item.path;
    const opts = document.createElement("div");
    opts.className = "sort-row__opts";
    opts.setAttribute("role", "group");
    opts.setAttribute("aria-label", "Where does " + item.path + " go?");

    Object.entries(SORT_LABELS).forEach(([key, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sort-btn";
      b.textContent = label;
      b.addEventListener("click", () => {
        picks[idx] = key;
        store.set("picks", picks);
        paintRow(li, item, idx, true);
        updateScore();
      });
      b.dataset.key = key;
      opts.appendChild(b);
    });

    li.append(path, opts);
    sorterList.appendChild(li);
    if (picks[idx]) paintRow(li, item, idx, false);
  });
  updateScore();
}

function paintRow(li, item, idx, animate) {
  const pick = picks[idx];
  const right = pick === item.answer;
  li.classList.remove("right", "wrong");
  if (animate) void li.offsetWidth;
  li.classList.add(right ? "right" : "wrong");
  li.querySelectorAll(".sort-btn").forEach((b) => {
    b.disabled = true;
    b.classList.toggle("is-picked", b.dataset.key === pick);
    b.classList.toggle("is-right", b.dataset.key === pick && right);
    b.classList.toggle("is-wrong", b.dataset.key === pick && !right);
    b.classList.toggle("is-answer", !right && b.dataset.key === item.answer);
  });
  let why = li.querySelector(".sort-row__why");
  if (!why) {
    why = document.createElement("p");
    why.className = "sort-row__why";
    li.appendChild(why);
  }
  why.textContent = (right ? "Right. " : `It goes in ${SORT_LABELS[item.answer]}. `) + item.why;
}

function updateScore() {
  const answered = Object.keys(picks).length;
  const right = Object.entries(picks).filter(([i, k]) => SORT_ITEMS[i].answer === k).length;
  scoreFill.style.width = (answered / SORT_ITEMS.length) * 100 + "%";
  scoreText.textContent =
    answered === SORT_ITEMS.length
      ? `Done: ${right} of ${SORT_ITEMS.length} right${right === SORT_ITEMS.length ? " 🎉" : ""}`
      : `${answered} of ${SORT_ITEMS.length} sorted · ${right} right`;
  if (answered === SORT_ITEMS.length) document.getElementById("full-cmd").open = true;
}

document.getElementById("sorter-reset").addEventListener("click", () => {
  picks = {};
  store.set("picks", picks);
  renderSorter();
});
renderSorter();

/* ---------- Checklist ---------- */
const checks = document.querySelectorAll("#checks input");
const ringFg = document.getElementById("ring-fg");
const ringLabel = document.getElementById("ring-label");
const ring = document.querySelector(".ring");
const ready = document.getElementById("ready");
const CIRC = 2 * Math.PI * 52;
const savedChecks = store.get("checks", []);

function updateRing() {
  const done = [...checks].filter((c) => c.checked).length;
  ringFg.style.strokeDashoffset = CIRC * (1 - done / checks.length);
  ringLabel.textContent = `${done}/${checks.length}`;
  const complete = done === checks.length;
  ring.classList.toggle("complete", complete);
  ready.textContent = complete ? "Ready. Go open that pull request." : "";
  ready.classList.toggle("show", complete);
  store.set("checks", [...checks].map((c) => c.checked));
}
checks.forEach((c, i) => {
  c.checked = Boolean(savedChecks[i]);
  c.addEventListener("change", updateRing);
});
updateRing();

/* ---------- Scroll reveal ---------- */
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
}
