// Real-browser end-to-end check of the Openers trainer in headless Microsoft Edge, driven over the
// Chrome DevTools Protocol with Node's built-in WebSocket (Node 22+). No npm packages.
// Every action is a real mouse click (Input.dispatchMouseEvent) at the on-screen position of a board
// cell or button; app functions are never called. Move cells come from hive-study/dist/openers.js.
//   node study-work/browser-check.cjs          -> local Hive-Study.html (file:///)
//   node study-work/browser-check.cjs --live   -> https://sam-jennings.github.io/hive-trainer/Hive-Study.html
// Screenshots and the JSON result go to $KIROCREW_SCRATCH/browser-check/<local|live>/.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), os = require("node:os");
const { spawn, execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const LIVE = process.argv.includes("--live");
const ROOT = path.join(__dirname, "..");
const URL_ = (LIVE ? "https://sam-jennings.github.io/hive-trainer/Hive-Study.html" : pathToFileURL(path.join(ROOT, "Hive-Study.html")).href) + "#openers";
const SCRATCH = process.env.KIROCREW_SCRATCH || os.tmpdir();
const OUT = path.join(SCRATCH, "browser-check", LIVE ? "live" : "local");
const PROFILE = path.join(SCRATCH, "browser-check", "profile-" + (LIVE ? "live" : "local") + "-" + Date.now());
fs.mkdirSync(OUT, { recursive: true });

// Opener data and piece names, read from the trainer's own source files (data only).
const data = vm.createContext({});
vm.runInContext(["rules.js", "openers.js"].map(f => fs.readFileSync(path.join(ROOT, "hive-study", "dist", f), "utf8")).join("\n") + ";this.R=HiveRules;this.O=Openers;", data);
const { R, O } = data;
const legend = id => (id[0] === "w" ? "White " : "Black ") + R.names[id[1]].toLowerCase() + " " + id.slice(2);
const byId = id => O.find(x => x.id === id) || (() => { throw new Error("opener " + id + " missing from openers.js") })();

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(p => fs.existsSync(p));
if (!EDGE) { console.error("Microsoft Edge not found"); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [], errors = [], exceptions = [];
let edge, ws, seq = 0, shot = 0;
const pending = new Map();

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej, method }));
}
async function evaluate(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function screenshot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  const file = path.join(OUT, String(++shot).padStart(2, "0") + "-" + name + ".png");
  fs.writeFileSync(file, Buffer.from(r.data, "base64"));
  return file;
}
const pageText = () => evaluate("document.body.innerText");
async function waitText(texts, ms = 5000) {
  const want = [].concat(texts), end = Date.now() + ms;
  let t = "";
  while (Date.now() < end) {
    t = await pageText();
    if (want.every(w => t.includes(w))) return t;
    await sleep(100);
  }
  throw new Error("expected text not shown: " + want.filter(w => !t.includes(w)).map(w => JSON.stringify(w)).join(", "));
}
async function mouseClick(x, y) {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(120);
}
// Click an element the way a person would: scroll it into view, click its centre, and check
// that the topmost element at that point really is the one we meant (no overlay in the way).
async function clickEl(selector) {
  const p = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { missing: true };
    el.scrollIntoView({ block: "center" }); const b = el.getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2, hit = document.elementFromPoint(x, y);
    return { x, y, ok: !!hit && (hit === el || el.contains(hit)), disabled: !!el.disabled }; })()`);
  if (p.missing) throw new Error("not on screen: " + selector);
  if (p.disabled) throw new Error("disabled: " + selector);
  if (!p.ok) throw new Error("something covers " + selector);
  await mouseClick(p.x, p.y);
}
// A board cell's screen position: the cell's axial coordinates go through the same hex layout the
// SVG uses (board.js: r=36, x=sqrt(3)*r*(q+s/2), y=1.5*r*s, inside the SVG's user space), then through
// the SVG's own screen transform (getScreenCTM). The topmost element there must carry that data-cell.
async function clickCell(key) {
  const p = await evaluate(`(() => { const svg = document.querySelector(".board-plane svg");
    if (!svg) return { missing: true };
    svg.scrollIntoView({ block: "center" });
    const [q, s] = ${JSON.stringify(key)}.split(",").map(Number), r = 36;
    const pt = svg.createSVGPoint(); pt.x = Math.sqrt(3) * r * (q + s / 2); pt.y = r * 1.5 * s;
    const sp = pt.matrixTransform(svg.getScreenCTM());
    const hit = document.elementFromPoint(sp.x, sp.y)?.closest("[data-cell]");
    return { x: sp.x, y: sp.y, hit: hit ? hit.dataset.cell : null }; })()`);
  if (p.missing) throw new Error("board not on screen");
  if (p.hit !== key) throw new Error("cell " + key + " maps to screen (" + p.x.toFixed(0) + "," + p.y.toFixed(0) + ") but the clickable element there is " + p.hit);
  await mouseClick(p.x, p.y);
}
// Play one move [piece, to] as a person would: a piece already on the board is clicked, then its
// destination; a new piece is taken from the Reserve dialog, then placed.
async function playMove([piece, to]) {
  const from = await evaluate(`[...document.querySelectorAll(".board-plane .board-piece[data-cell]")].find(g => g.getAttribute("aria-label").startsWith(${JSON.stringify(legend(piece) + " at ")}))?.dataset.cell || null`);
  if (from) { await clickCell(from); await waitText("legal destination"); }
  else {
    await clickEl('[data-action="o-reserve"]');
    await clickEl(`dialog [data-reserve="${piece}"]`);
    await waitText("Choose a highlighted placement");
  }
  await clickCell(to);
}
const solvedLine = n => n + " of " + O.length + " openers solved";

async function step(name, fn) {
  const t0 = Date.now();
  try { const notes = await fn(); results.push({ step: name, pass: true, ms: Date.now() - t0, notes: notes || "" }); console.log("PASS " + name); }
  catch (e) {
    let file = ""; try { file = await screenshot("FAIL-" + name.replace(/\W+/g, "-")); } catch {}
    results.push({ step: name, pass: false, ms: Date.now() - t0, error: e.message, screenshot: file });
    console.log("FAIL " + name + ": " + e.message + (file ? " (" + file + ")" : ""));
  }
}

async function run() {
  edge = spawn(EDGE, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + PROFILE, "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--disable-sync", "--window-size=1366,900", "about:blank"], { stdio: "ignore", windowsHide: true });
  const portFile = path.join(PROFILE, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  const port = fs.readFileSync(portFile, "utf8").split("\n")[0].trim();
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const pageTarget = targets.find(t => t.type === "page");
  ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("CDP websocket failed")); });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ": " + m.error.message)) : p.res(m.result); return; }
    if (m.method === "Runtime.exceptionThrown") exceptions.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && ["error", "assert"].includes(m.params.type)) errors.push("console." + m.params.type + ": " + m.params.args.map(a => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push("log(" + m.params.entry.source + "): " + m.params.entry.text + (m.params.entry.url ? " " + m.params.entry.url : ""));
  };
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

  const single = byId("elbow-queen"), line = byId("z-attack-line"), help = byId("white-last");
  const bookOf = st => st.replies.find(r => r.verdict === "best");
  const weakOf = st => st.replies.find(r => r.verdict === "weak");

  await step("load", async () => {
    await send("Page.navigate", { url: URL_ });
    await waitText(["Openers trainer", "Opening library", solvedLine(0)], 15000);
    const cards = await evaluate(`document.querySelectorAll("[data-opener]").length`);
    if (cards !== O.length) throw new Error("library shows " + cards + " openers, openers.js has " + O.length);
    await screenshot("loaded");
    return cards + " openers in the library, 0 solved";
  });

  await step("a1 single-move: book reply", async () => {
    await clickEl(`[data-opener="${single.id}"]`);
    await waitText([single.name, single.goal, "Black to move"]);
    const r = bookOf(single); await playMove(r.moves[0]);
    await waitText([r.name + " · Book move", "Try another reply", "Next opener", solvedLine(1)]);
    await screenshot("single-book");
    return single.id + ": " + r.moves[0].join(" ") + " -> \"" + r.name + " · Book move\", solved count 1";
  });

  await step("a2 single-move: reset, weak reply, retry", async () => {
    await clickEl('[data-action="o-retry"]');
    await waitText(["Get a hint", "Black to move"]);
    const r = weakOf(single); await playMove(r.moves[0]);
    await waitText([r.name + " · Weak", r.why.slice(0, 40), "Try another move"]);
    await screenshot("single-weak");
    await clickEl('[data-action="o-retry"]');
    await waitText(["Get a hint", "Show book move", "Black to move"]);
    const empty = await evaluate(`!document.querySelector('.board-plane [data-cell="${r.moves[0][1]}"]')`);
    if (!empty) throw new Error("weak move still on the board after retry");
    return r.moves[0].join(" ") + " -> \"" + r.name + " · Weak\", Try another move restores the position";
  });

  await step("b multi-move line start to finish", async () => {
    await clickEl(`[data-opener="${line.id}"]`);
    const n = line.steps.length, seen = [];
    await waitText([line.name, "Move 1 of " + n]);
    for (let k = 0; k < n; k++) {
      const st = line.steps[k], mv = bookOf(st).moves[0];
      await playMove(mv);
      if (st.then) {
        const [p, to] = st.then.move;
        await waitText(["Move " + (k + 1) + ": " + bookOf(st).name + " · Book move", (line.h.length % 2 ? "White" : "Black") + " replied: " + legend(p) + " to (" + to + ")", "Move " + (k + 2) + " of " + n]);
        const onBoard = await evaluate(`!!document.querySelector('.board-plane [data-cell="${to}"][aria-label="${legend(p)} at ${to}"]')`);
        if (!onBoard) throw new Error("automatic reply " + p + " not drawn at " + to);
        seen.push("move " + (k + 1) + " " + mv.join(" ") + ", reply " + p + " " + to);
        if (k === 0) await screenshot("line-auto-reply");
      } else seen.push("move " + (k + 1) + " " + mv.join(" "));
    }
    const t = await waitText(["Line summary", "Replay line", solvedLine(2)]);
    const firstTry = (t.match(/Book move, first try/g) || []).length;
    if (firstTry !== n) throw new Error("summary shows " + firstTry + " of " + n + " steps as 'Book move, first try'");
    await screenshot("line-summary");
    return line.id + ": " + seen.join("; ") + "; summary " + n + "x 'Book move, first try', solved count 2";
  });

  await step("c Get a hint and Show book move", async () => {
    await clickEl(`[data-opener="${help.id}"]`);
    await waitText([help.name, "White to move", "Get a hint"]);
    await clickEl('[data-action="o-hint"]');
    await waitText(["Hint", help.hint, "Show book move"]);
    await screenshot("hint");
    await clickEl('[data-action="o-reveal"]');
    const [p, to] = bookOf(help).moves[0];
    await waitText(["Place the reserve " + legend(p).toLowerCase() + " on the gold space.", "Play the gold destination"]);
    const gold = await evaluate(`(() => { const g = document.querySelector('.board-plane g.destination[data-cell="${to}"] .spot-outline'); return g ? g.getAttribute("stroke") : null })()`);
    if (gold !== "#ffcd52") throw new Error("book destination " + to + " not shown in gold (stroke " + gold + ")");
    await screenshot("show-book-move");
    await clickCell(to);
    await waitText([bookOf(help).name + " · Book move", solvedLine(3)]);
    return help.id + ": hint text shown, book move " + p + " " + to + " highlighted gold, played -> Book move, solved count 3";
  });

  await step("e card click brings the board into view", async () => {
    const pick = O.find(x => ![single.id, line.id, help.id].includes(x.id)) || single;
    await evaluate(`document.querySelector(".section-head").scrollIntoView({ block: "start" })`);
    await sleep(200);
    // Real click at the card's on-screen centre, without scrolling it again (clickEl would recentre).
    const p = await evaluate(`(() => { const el = document.querySelector('[data-opener="${pick.id}"]'); if (!el) return { missing: true };
      const b = el.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2, hit = document.elementFromPoint(x, y);
      return { x, y, ok: !!hit && (hit === el || el.contains(hit)), scrollY: window.scrollY }; })()`);
    if (p.missing) throw new Error("card " + pick.id + " missing");
    if (!p.ok) throw new Error("card " + pick.id + " not clickable at its centre after scrolling to the library");
    if (p.scrollY < 50) throw new Error("page did not scroll to the library (scrollY " + p.scrollY + "), so the step proves nothing");
    await mouseClick(p.x, p.y);
    await waitText([pick.name]);
    await sleep(300);
    const r = await evaluate(`(() => { const b = document.querySelector(".board-plane svg").getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, vh: innerHeight, vw: innerWidth, scrollY: window.scrollY }; })()`);
    await screenshot("card-click-board");
    if (r.top < 0 || r.left < 0 || r.bottom > r.vh || r.right > r.vw) throw new Error("board not fully in view after card click: rect " + JSON.stringify(r));
    return pick.id + ": clicked at scrollY " + Math.round(p.scrollY) + ", board rect top " + Math.round(r.top) + " bottom " + Math.round(r.bottom) + " of viewport " + r.vh + ", scrollY now " + Math.round(r.scrollY);
  });

  await step("d progress saved across reload", async () => {
    await send("Page.reload", { ignoreCache: true });
    await sleep(500);
    const t = await waitText(["Opening library", solvedLine(3)], 15000);
    const card = id => evaluate(`document.querySelector('[data-opener="${id}"] .mini-progress').innerText.trim()`);
    const got = { [single.id]: await card(single.id), [line.id]: await card(line.id), [help.id]: await card(help.id) };
    const want = { [single.id]: "Found unaided", [line.id]: "Found unaided", [help.id]: "Found with guidance" };
    for (const k in want) if (got[k] !== want[k]) throw new Error(k + " card says '" + got[k] + "', expected '" + want[k] + "'");
    await evaluate(`document.querySelector(".section-head").scrollIntoView({ block: "start" })`);
    await screenshot("after-reload");
    return "after reload: '" + solvedLine(3) + "'; cards " + JSON.stringify(got);
  });
}

(async () => {
  let fatal = null;
  try { await run(); } catch (e) { fatal = e.message; console.log("FATAL " + e.message); }
  finally {
    try { if (ws && ws.readyState === 1) { ws.send(JSON.stringify({ id: ++seq, method: "Browser.close" })); await sleep(500); ws.close(); } } catch {}
    if (edge && edge.pid) { try { execFileSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} }
    await sleep(500);
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
  const pass = !fatal && results.length === 7 && results.every(r => r.pass) && exceptions.length === 0;
  const summary = { target: LIVE ? "live" : "local", url: URL_, pass, fatal, steps: results, consoleErrors: errors, uncaughtExceptions: exceptions, screenshots: OUT };
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(summary, null, 1));
  console.log((pass ? "ALL PASS" : "FAILED") + " (" + summary.target + "): " + results.filter(r => r.pass).length + "/" + results.length + " steps, " + errors.length + " console errors, " + exceptions.length + " uncaught exceptions. Screenshots: " + OUT);
  errors.concat(exceptions).forEach(e => console.log("  " + e));
  process.exit(pass ? 0 : 1);
})();
