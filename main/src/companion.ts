import fs from "fs/promises";
import path from "path";
import { app } from "electron";

let state: unknown = { ready: false };

function historyPath() {
  return path.join(app.getPath("userData"), "apt-data", "history.ndjson");
}

export function setCompanionState(next: unknown) {
  state = next;
}

export function getCompanionState() {
  return state;
}

export async function appendHistory(entry: unknown) {
  try {
    await fs.mkdir(path.dirname(historyPath()), { recursive: true });
    await fs.appendFile(historyPath(), JSON.stringify(entry) + "\n", "utf8");
  } catch {
    /* ignore */
  }
}

export async function readHistory(limit = 2000): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(historyPath(), "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export const COMPANION_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>POE Kitten — Companion</title>
<style>
  :root{--bg:#171122;--card:#241a2e;--border:#3d2c5c;--text:#f2e6ff;--muted:#9a7fc4;
    --accent:#a855f7;--pink:#ff5fb0;--green:#59d97a;--warn:#ffd166;--bad:#ff8f9f;
    --grad:linear-gradient(135deg,#a855f7,#ff5fb0);}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:radial-gradient(900px 500px at 85% -10%,rgba(199,125,255,.15),transparent 60%),
    radial-gradient(800px 500px at -10% 110%,rgba(255,95,176,.12),transparent 60%),var(--bg);
    color:var(--text);font-family:"Segoe UI",system-ui,sans-serif;padding:24px;min-height:100vh}
  h1{font-size:20px;font-weight:800;background:linear-gradient(90deg,#e0a8ff,#ff8fd0,#8fd4ff,#e0a8ff);
    background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
    animation:shift 8s linear infinite;display:inline-block}
  @keyframes shift{to{background-position:300% 50%}}
  .sub{color:var(--muted);font-size:13px;margin:4px 0 16px}
  .tabs{display:flex;gap:8px;margin-bottom:18px}
  .tab{font:inherit;font-size:13px;font-weight:700;color:var(--muted);background:rgba(255,255,255,.05);
    border:2px solid var(--border);border-radius:999px;padding:7px 18px;cursor:pointer}
  .tab.on{color:#fff;background:var(--grad);border-color:transparent}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-bottom:20px}
  .card{background:var(--card);border:2px solid var(--border);border-radius:16px;padding:14px 16px;
    animation:cardIn .35s cubic-bezier(.22,1,.36,1) both}
  @keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .label{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
  .value{font-size:25px;font-weight:800;margin-top:4px}
  .value small{font-size:12px;font-weight:600;color:var(--muted)}
  .good{color:var(--green)}.warn{color:var(--warn)}.bad{color:var(--bad)}
  .row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;
    background:rgba(255,255,255,.04);margin-bottom:6px;animation:cardIn .3s ease both}
  .row b{color:#fff;font-size:13px}
  .row span{color:var(--muted);font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pill{font-size:11px;font-weight:700;color:#fff;padding:3px 10px;border-radius:999px;background:var(--grad);border:0;cursor:pointer}
  h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:20px 0 10px}
  .icon{width:30px;height:30px;object-fit:contain;flex:none}
  .live{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);
    display:inline-block;animation:pulse 1.8s ease-in-out infinite;margin-right:8px}
  @keyframes pulse{50%{opacity:.4;transform:scale(.75)}}
  .bar{height:8px;border-radius:999px;background:var(--grad);min-width:6px;flex:none}
  .fix{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
  .toggle{font:inherit;font-size:11px;font-weight:700;color:var(--muted);background:rgba(255,255,255,.05);
    border:2px solid var(--border);border-radius:999px;padding:4px 12px;cursor:pointer}
  .toggle.on{color:#fff;background:var(--grad);border-color:transparent}
  .muted{color:var(--muted);font-size:12px}
  .panel{background:var(--card);border:2px solid var(--border);border-radius:16px;padding:16px;margin-bottom:16px}
  .hbars{display:flex;flex-direction:column;gap:8px}
  .hbar{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;font-size:12px}
  .hbar .track{grid-column:1/-1;height:8px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
  .hbar .fill{height:100%;border-radius:999px;background:var(--grad);transition:width .4s ease}
  .heat{display:grid;grid-template-columns:auto repeat(24,1fr);gap:3px;font-size:9px;color:var(--muted)}
  .heat .cell{aspect-ratio:1;border-radius:3px;background:rgba(255,255,255,.05)}
  .heat .dayLabel{display:flex;align-items:center;padding-right:6px;white-space:nowrap}
  .hint{color:var(--muted);font-size:11px;margin-top:6px}
</style>
</head>
<body>
<h1>POE Kitten — Companion</h1>
<div class="sub"><span class="live"></span><span id="status">connecting…</span></div>

<div class="tabs">
  <button class="tab on" data-t="live">Live</button>
  <button class="tab" data-t="analytics">Analytics</button>
</div>

<div id="live">
  <div class="grid" id="stats"></div>
  <h2>Death zones</h2><div id="deathzones"></div>
  <h2>Whisper inbox</h2><div id="whispers"></div>
  <h2>Recent checks</h2><div id="checks"></div>
  <h2>Activity — last 12h</h2><div id="activity"></div>
  <h2>History</h2>
  <div class="fix" id="filters">
    <button class="toggle on" data-f="all">All</button>
    <button class="toggle" data-f="price-check">Checks</button>
    <button class="toggle" data-f="whisper">Whispers</button>
  </div>
  <div id="history"></div>
</div>

<div id="analytics" style="display:none">
  <div class="grid" id="totals"></div>

  <div class="panel">
    <h2 style="margin-top:0">Most checked items</h2>
    <div class="hbars" id="topItems"></div>
  </div>

  <div class="panel">
    <h2 style="margin-top:0">Rarity checked</h2>
    <div class="hbars" id="rarity"></div>
  </div>

  <div class="panel">
    <h2 style="margin-top:0">Deaths per day</h2>
    <div id="deathsPerDay"></div>
  </div>

  <div class="panel">
    <h2 style="margin-top:0">Activity heatmap — last 7 days × 24h</h2>
    <div class="heat" id="heat"></div>
    <div class="hint">Checks · whispers · deaths · levels, bucketed by hour.</div>
  </div>

  <div class="panel">
    <h2 style="margin-top:0">Level-ups</h2>
    <div id="levelsLog"></div>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id);
const fmt = (ms) => { const s=Math.max(0,Math.floor((ms||0)/1000)),h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
  return h?h+"h "+m+"m":m?m+"m "+(s%60)+"s":(s%60)+"s"; };
const ago = (t) => { const s=Math.floor((Date.now()-t)/1000); return s<60?s+"s":s<3600?Math.floor(s/60)+"m":s<86400?Math.floor(s/3600)+"h":Math.floor(s/86400)+"d"; };
const esc = (s) => String(s??"").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const escAttr = (s) => String(s??"").replace(/['"&<>]/g, c => ({"'":"&#39;",'"':"&quot;","&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const rarityColor = (r) => r==="Unique"?"#e0a94a":r==="Rare"?"#f4e07d":r==="Magic"?"#9393ff":"#c8c8c8";
const invite = (name) => navigator.clipboard && navigator.clipboard.writeText("/invite "+name);
const stat = (label, value, cls) => '<div class="card"><div class="label">'+label+'</div><div class="value '+(cls||'')+'">'+value+'</div></div>';
const dayStart = (t) => { const d=new Date(t); d.setHours(0,0,0,0); return d.getTime(); };

let history = [];
let filter = "all";

async function tick(){
  try {
    const d = await (await fetch("/companion/data", { cache:"no-store" })).json();
    if (!d || !d.session){ $("status").textContent = "waiting for game…"; return; }
    $("status").textContent = "live · " + new Date().toLocaleTimeString();
    const s = d.session;
    $("stats").innerHTML =
      stat("Session", fmt(s.playtimeMs)) +
      stat("Area", (s.zone||"—")+' <small>'+fmt(s.zoneTimeMs)+'</small>') +
      stat("Zones run", s.zonesRun) +
      stat("Deaths", s.deaths, s.deaths>0?"bad":"") +
      stat("Level", s.level + (s.levelsPerHour!=null ? ' <small>'+s.levelsPerHour.toFixed(1)+'/h</small>' : '')) +
      stat("XP gain", (s.expPenalty!=null ? s.expPenalty+"%" : "—"), (s.expPenalty!=null&&s.expPenalty<100)?"warn":"good");

    const dz = d.deathZones||[]; const maxD = dz.length?dz[0][1]:1;
    $("deathzones").innerHTML = dz.length ? dz.map(([area,n]) =>
      '<div class="row"><i style="color:var(--bad)">☠</i><span>'+esc(area)+'</span>'+
      '<span class="bar" style="width:'+Math.round(80*n/maxD)+'px"></span>'+
      '<span style="flex:none;color:var(--muted)">×'+n+'</span></div>').join("")
      : '<div class="muted">No deaths this session. Nice.</div>';

    $("whispers").innerHTML = (d.whispers||[]).length ? d.whispers.map(w =>
      '<div class="row"><b>'+esc(w.from)+'</b><span>'+esc(w.trade?(w.trade.item+" · "+w.trade.price):w.message)+'</span>'+
      '<span style="flex:none;color:var(--muted)">'+ago(w.at)+'</span>'+
      '<button class="pill" onclick="invite(\\''+escAttr(w.from)+'\\')">Invite</button></div>').join("")
      : '<div class="muted">No whispers yet.</div>';

    $("checks").innerHTML = (d.checks||[]).length ? d.checks.map(c =>
      '<div class="row"><img class="icon" src="'+escAttr(c.icon)+'" /><b style="color:'+rarityColor(c.rarity)+'">'+esc(c.name)+'</b>'+
      '<span>'+esc(c.base)+'</span><span style="flex:none;color:var(--muted)">'+ago(c.at)+'</span></div>').join("")
      : '<div class="muted">No price checks yet.</div>';
  } catch (e) { $("status").textContent = "offline — is the app running?"; }
}

async function loadHistory(){
  try { history = await (await fetch("/companion/history", { cache:"no-store" })).json(); } catch { history = []; }
  renderHistory(); renderActivity(); renderAnalytics();
}

function renderActivity(){
  const nowH = Date.now(); const buckets = new Array(12).fill(0);
  for (const h of history){ const diffH = Math.floor((nowH-h.at)/3600000); if(diffH>=0&&diffH<12) buckets[11-diffH]++; }
  const maxB = Math.max(1, ...buckets);
  $("activity").innerHTML = '<div class="row" style="gap:4px;align-items:flex-end;height:76px;background:transparent;padding:0">' +
    buckets.map((n,i)=>'<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px">'+
      '<div class="bar" style="width:100%;height:'+(Math.round(52*n/maxB)+4)+'px"></div>'+
      '<span style="font-size:9px;color:var(--muted)">'+(11-i)+'h</span></div>').join("") + '</div>';
}

function renderHistory(){
  const list = history.filter(h=>filter==="all"||h.type===filter).slice().reverse().slice(0,120);
  const ck = history.filter(h=>h.type==="price-check").length, wh = history.filter(h=>h.type==="whisper").length;
  if (!history.length){ $("history").innerHTML = '<div class="muted">Nothing logged yet.</div>'; return; }
  $("history").innerHTML = '<div class="muted" style="margin-bottom:8px">'+ck+' checks · '+wh+' whispers logged</div>' +
    list.map(h => h.type==="whisper"
      ? '<div class="row"><i style="color:var(--accent)">💬</i><b>'+esc(h.from)+'</b><span>'+esc(h.item?(h.item+" · "+h.price):h.message)+'</span><span style="flex:none;color:var(--muted)">'+ago(h.at)+'</span></div>'
      : h.type==="death"
      ? '<div class="row"><i style="color:var(--bad)">☠</i><b>Died</b><span>'+esc(h.zone||"unknown")+'</span><span style="flex:none;color:var(--muted)">'+ago(h.at)+'</span></div>'
      : h.type==="level"
      ? '<div class="row"><i style="color:var(--green)">▲</i><b>Level '+esc(h.level)+'</b><span></span><span style="flex:none;color:var(--muted)">'+ago(h.at)+'</span></div>'
      : '<div class="row"><i style="color:var(--warn)">🏷</i><b style="color:'+rarityColor(h.rarity)+'">'+esc(h.name)+'</b><span>'+esc(h.base)+'</span><span style="flex:none;color:var(--muted)">'+ago(h.at)+'</span></div>'
    ).join("");
}

function hbars(el, entries, colorFn){
  const max = Math.max(1, ...entries.map(e=>e[1]));
  el.innerHTML = entries.length ? entries.map(e =>
    '<div class="hbar"><span style="color:'+(colorFn?colorFn(e[0]):"#fff")+'">'+esc(e[0])+'</span>'+
    '<span class="muted">'+e[1]+'</span>'+
    '<span class="track"><span class="fill" style="width:'+Math.round(100*e[1]/max)+'%"></span></span></div>').join("")
    : '<div class="muted">Not enough data yet.</div>';
}

function renderAnalytics(){
  if (!history.length){ $("totals").innerHTML = '<div class="muted">No history yet — play a session.</div>'; return; }
  const byType = (t) => history.filter(h=>h.type===t);
  const checks = byType("price-check"), whispers = byType("whisper"), deaths = byType("death"), levels = byType("level");
  const distinct = new Set(checks.map(c=>c.name)).size;
  $("totals").innerHTML =
    stat("Price checks", checks.length) +
    stat("Whispers", whispers.length) +
    stat("Deaths", deaths.length, deaths.length?"bad":"") +
    stat("Level-ups", levels.length) +
    stat("Distinct items", distinct) +
    stat("Logged events", history.length);

  const nameCount = {}; for (const c of checks) nameCount[c.name]=(nameCount[c.name]||0)+1;
  hbars($("topItems"), Object.entries(nameCount).sort((a,b)=>b[1]-a[1]).slice(0,8));

  const rar = {}; for (const c of checks) rar[c.rarity||"Normal"]=(rar[c.rarity||"Normal"]||0)+1;
  hbars($("rarity"), Object.entries(rar).sort((a,b)=>b[1]-a[1]), rarityColor);

  // deaths per day (last 14)
  const t0 = dayStart(Date.now()); const D = 14; const dayBuckets = new Array(D).fill(0);
  for (const d of deaths){ const idx = Math.floor((t0 - dayStart(d.at))/86400000); if (idx>=0&&idx<D) dayBuckets[D-1-idx]++; }
  const maxDay = Math.max(1, ...dayBuckets);
  $("deathsPerDay").innerHTML = '<div class="row" style="gap:4px;align-items:flex-end;height:70px;background:transparent;padding:0">' +
    dayBuckets.map((n,i)=>'<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px">'+
      '<div class="bar" style="width:100%;height:'+(Math.round(48*n/maxDay)+3)+'px;background:linear-gradient(135deg,#ff5fb0,#a855f7)"></div>'+
      '<span style="font-size:8px;color:var(--muted)">'+(D-1-i)+'</span></div>').join("") + '</div>' +
    '<div class="hint">x-axis: days ago (right = today)</div>';

  // heatmap 7 days x 24h
  const grid = Array.from({length:7},()=>new Array(24).fill(0));
  for (const h of history){ const idx = Math.floor((t0 - dayStart(h.at))/86400000); if (idx<0||idx>=7) continue; const hour = new Date(h.at).getHours(); grid[6-idx][hour]++; }
  const maxCell = Math.max(1, ...grid.flat());
  const dayNames = ["6d","5d","4d","3d","2d","1d","today"];
  let html = '<div class="dayLabel"></div>';
  for (let hh=0; hh<24; hh++) html += '<div style="text-align:center">'+(hh%6===0?hh:"")+'</div>';
  for (let r=0; r<7; r++){
    html += '<div class="dayLabel">'+dayNames[r]+'</div>';
    for (let c=0; c<24; c++){
      const v = grid[r][c]; const a = v? 0.25 + 0.75*v/maxCell : 0;
      html += '<div class="cell" title="'+v+' events" style="background:'+(v?'rgba(168,85,247,'+a.toFixed(2)+')':'rgba(255,255,255,.05)')+'"></div>';
    }
  }
  $("heat").innerHTML = html;

  $("levelsLog").innerHTML = levels.length ? levels.slice(-12).reverse().map(l =>
    '<div class="row"><i style="color:var(--green)">▲</i><b>Level '+esc(l.level)+'</b><span></span>'+
    '<span style="flex:none;color:var(--muted)">'+new Date(l.at).toLocaleString()+'</span></div>').join("")
    : '<div class="muted">No level-ups logged.</div>';
}

document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on", x===t));
  $("live").style.display = t.dataset.t==="live" ? "" : "none";
  $("analytics").style.display = t.dataset.t==="analytics" ? "" : "none";
}));

$("filters").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  filter = b.dataset.f;
  [...$("filters").children].forEach(x=>x.classList.toggle("on", x===b));
  renderHistory();
});

tick(); setInterval(tick, 2000);
loadHistory(); setInterval(loadHistory, 5000);
</script>
</body>
</html>`;
