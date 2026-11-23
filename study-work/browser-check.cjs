// Real-browser end-to-end check of the Openers trainer in headless Microsoft Edge, driven over the
// Chrome DevTools Protocol with Node's built-in WebSocket (Node 22+). No npm packages.
// Every action is a real mouse click (Input.dispatchMouseEvent) at the on-screen position of a board
// cell or button; app functions are never called (step h sets up its position at a breakpoint).
// Step g plays a few moves against the computer (Easy) on #play; the live site may not have #play yet.
// Step h checks the human Pass button on a constructed stuck position (set up through the Undo snapshot).
// Steps i and j turn on the expansion pieces, use the pillbug's ability by clicking, and check the freeze rule.
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
const legend = id => (id[0] === "w" ? "White " : "Black ") + (R.names[id[1]] || R.expansionNames[id[1]]).toLowerCase() + " " + id.slice(2);
const byId = id => O.find(x => x.id === id) || (() => { throw new Error("opener " + id + " missing from openers.js") })();

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(p => fs.existsSync(p));
if (!EDGE) { console.error("Microsoft Edge not found"); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [], errors = [], exceptions = [];
let edge, ws, seq = 0, shot = 0, onPaused = null;
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

// Set up a constructed Play position. app.js keeps its state inside a closure, so the setup runs at a
// breakpoint on the Undo handler: a real Undo click pauses there, the last Undo snapshot is replaced
// (data only, no app function is called), and the handler then restores it.
async function undoInto(snapshot) {
  const src = LIVE ? await (await fetch(URL_.replace(/#.*$/, ""))).text() : fs.readFileSync(path.join(__dirname, "..", "Hive-Study.html"), "utf8");
  const lines = src.split("\n"), lineNumber = lines.findIndex(l => l.includes('if(a==="g-undo")'));
  if (lineNumber < 0) throw new Error("Undo handler not found in the page source");
  const columnNumber = lines[lineNumber].indexOf('if(a==="g-undo")');
  await send("Debugger.enable");
  const bp = await send("Debugger.setBreakpointByUrl", { urlRegex: "Hive-Study\\.html", lineNumber, columnNumber });
  const paused = new Promise(res => { onPaused = res; });
  const click = clickEl('[data-action="g-undo"]');
  const frame = await Promise.race([paused, sleep(5000).then(() => null)]);
  if (!frame) throw new Error("Undo click did not reach the breakpoint");
  const set = await send("Debugger.evaluateOnCallFrame", { callFrameId: frame.callFrames[0].callFrameId, returnByValue: true,
    expression: `(g.history[g.history.length - 1] = ${JSON.stringify(snapshot)}, true)` });
  await send("Debugger.removeBreakpoint", { breakpointId: bp.breakpointId });
  await send("Debugger.resume"); await click; await send("Debugger.disable"); onPaused = null;
  if (set.result?.value !== true) throw new Error("could not set up the position: " + JSON.stringify(set.exceptionDetails || set.result));
}
const STEPS = 12;

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
    if (m.method === "Debugger.paused" && onPaused) { onPaused(m.params); return; }
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

  await step("f branching line through two branches", async () => {
    const x = byId("f-attack-branch"), n = 3, seen = [];
    const routeOf = name => x.steps[0].then.branches.find(b => b.name === name);
    for (let run = 1; run <= 2; run++) {
      if (run === 1) await clickEl(`[data-opener="${x.id}"]`); else await clickEl('[data-action="o-replay"]');
      await waitText([x.name, "Move 1 of " + n]);
      await playMove(bookOf(x.steps[0]).moves[0]);
      const t = await waitText(["Black replied:", "Move 2 of " + n]);
      const m = t.match(/Branch (\d+) of (\d+): ([^\n]+?)\. Your next move/);
      if (!m) throw new Error("branch taken is not shown");
      const br = routeOf(m[3]);
      if (!br) throw new Error("unknown branch '" + m[3] + "'");
      if (seen.includes(br.name)) throw new Error("Replay repeated the solved branch '" + br.name + "'");
      seen.push(br.name);
      const [p, to] = br.move;
      const onBoard = await evaluate(`!!document.querySelector('.board-plane [data-cell="${to}"][aria-label="${legend(p)} at ${to}"]')`);
      if (!onBoard) throw new Error("branch reply " + p + " not drawn at " + to);
      if (run === 1) await screenshot("branch-1-reply");
      for (let k = 0; k < br.steps.length; k++) {
        const st = br.steps[k];
        await playMove(bookOf(st).moves[0]);
        if (st.then) await waitText(["Black replied: " + legend(st.then.move[0]) + " to (" + st.then.move[1] + ")", "Move " + (k + 3) + " of " + n]);
      }
      const done = await waitText(["Line summary", "Branch path:", br.name, "Branches solved: " + run + " of 2"]);
      const firstTry = (done.match(/Book move, first try/g) || []).length;
      if (firstTry !== n) throw new Error("summary shows " + firstTry + " of " + n + " steps as 'Book move, first try'");
      const card = await evaluate(`document.querySelector('[data-opener="${x.id}"] .mini-progress').innerText.trim()`);
      const want = run === 1 ? "1 of 2 branches" : "Found unaided · 2 of 2 branches";
      if (card !== want) throw new Error("card says '" + card + "', expected '" + want + "'");
      await waitText([solvedLine(run === 1 ? 3 : 4)]);
      await screenshot("branch-" + run + "-summary");
    }
    return x.id + ": run 1 branch '" + seen[0] + "', Replay -> run 2 branch '" + seen[1] + "'; card '1 of 2 branches' then 'Found unaided · 2 of 2 branches', solved count 4";
  });

  await step("d progress saved across reload", async () => {
    await send("Page.reload", { ignoreCache: true });
    await sleep(500);
    const t = await waitText(["Opening library", solvedLine(4)], 15000);
    const card = id => evaluate(`document.querySelector('[data-opener="${id}"] .mini-progress').innerText.trim()`);
    const got = { [single.id]: await card(single.id), [line.id]: await card(line.id), [help.id]: await card(help.id), "f-attack-branch": await card("f-attack-branch") };
    const want = { [single.id]: "Found unaided", [line.id]: "Found unaided", [help.id]: "Found with guidance", "f-attack-branch": "Found unaided · 2 of 2 branches" };
    for (const k in want) if (got[k] !== want[k]) throw new Error(k + " card says '" + got[k] + "', expected '" + want[k] + "'");
    await evaluate(`document.querySelector(".section-head").scrollIntoView({ block: "start" })`);
    await screenshot("after-reload");
    return "after reload: '" + solvedLine(4) + "'; cards " + JSON.stringify(got);
  });

  await step("g play vs computer (Easy): human moves and computer replies", async () => {
    await send("Page.navigate", { url: URL_.replace(/#openers$/, "#play") });
    await waitText(["Play vs computer", "Your move · White", "You (White) vs computer", "Easy · Turn 1"], 15000);
    await clickEl('[data-action="g-level-easy"]'); await clickEl('[data-action="g-color-w"]');
    const pieces = () => evaluate(`[...document.querySelectorAll(".board-plane .board-piece[data-cell]")].map(g => g.getAttribute("aria-label"))`);
    const firstSpot = () => evaluate(`document.querySelector(".board-plane g.destination[data-cell]")?.dataset.cell || null`);
    const place = async id => {
      await clickEl('[data-action="g-reserve"]'); await clickEl(`dialog [data-reserve="${id}"]`);
      await waitText("Choose a highlighted placement");
      const to = await firstSpot(); if (!to) throw new Error("no legal placement shown for " + id);
      await clickCell(to); return id + " drop " + to;
    };
    const waitReply = async turn => {
      const end = Date.now() + 8000;
      while (Date.now() < end) {
        const t = await pageText();
        if (t.includes("Easy · Turn " + turn) && t.includes("Your move · White") && t.includes("Computer played:")) return pieces();
        await sleep(100);
      }
      throw new Error("computer did not reply (expected 'Easy · Turn " + turn + "' and 'Your move · White')");
    };
    const log = [];
    log.push(await place("wG1"));
    let p = await waitReply(2);
    if (p.length !== 2 || !p.some(l => l.startsWith("Black "))) throw new Error("expected wG1 and one black piece after the computer's reply: " + JSON.stringify(p));
    await screenshot("play-first-reply");
    log.push(await place("wQ1"));
    p = await waitReply(3);
    const atTurn3 = p.length;   // 3 or 4: the computer may move its queen instead of placing
    // Third human move: a board move with the queen if it has one, otherwise another placement.
    const qCell = await evaluate(`[...document.querySelectorAll(".board-plane .board-piece[data-cell]")].find(g => g.getAttribute("aria-label").startsWith("White queen 1 at"))?.dataset.cell || null`);
    await clickCell(qCell);
    const qt = await waitText("White queen 1");
    const to = await firstSpot();
    if (to && /legal destination/.test(qt)) { await clickCell(to); log.push("wQ1 " + qCell + "->" + to); }
    else { await clickCell(qCell); log.push(await place("wA1")); }
    await waitReply(4);
    const reply = (await pageText()).match(/Computer played: ([^\n]+)/)[1];
    await screenshot("play-third-reply");
    await clickEl('[data-action="g-undo"]');
    await waitText(["Easy · Turn 3", "Your move · White"]);
    const afterUndo = (await pieces()).length;
    if (afterUndo !== atTurn3) throw new Error("Undo should restore the " + atTurn3 + " pieces of turn 3, board has " + afterUndo);
    await clickEl('[data-action="g-new"]');
    await waitText(["Your move · White", "Easy · Turn 1"]);
    if ((await pieces()).length !== 0) throw new Error("New game did not clear the board");
    return "human " + log.join(", ") + "; computer replied 3 times (last: " + reply + "); Undo -> " + atTurn3 + " pieces; New game -> empty board";
  });

  await step("h human pass: no legal move -> Pass the turn -> the computer moves on", async () => {
    // Being stuck is rare in real play, so the position is constructed: after one real move, the
    // Undo snapshot is replaced (data only, no app function is called) with a turn-3 position where
    // the white queen is pinned between two black pieces and every empty edge cell touches Black.
    // The real Undo click then restores it, and the rest is real clicks.
    await waitText(["Your move · White", "Easy · Turn 1"]);
    await clickEl('[data-action="g-reserve"]'); await clickEl('dialog [data-reserve="wG1"]');
    await waitText("Choose a highlighted placement");
    await clickCell(await evaluate(`document.querySelector(".board-plane g.destination[data-cell]").dataset.cell`));
    await waitText(["Easy · Turn 2", "Computer played:"], 8000);
    const stuck = { "-1,0": ["bA1"], "0,0": ["wQ1"], "1,0": ["bQ1"] };
    await undoInto({ board: stuck, ply: 4, last: null, lastMove: "", passes: 0, info: "" });
    await waitText(["Easy · Turn 3", "You have no legal move, so you must pass.", "Pass the turn"]);
    if ((await evaluate(`!!document.querySelector('[data-action="g-reserve"]').disabled`)) !== true) throw new Error("Reserve should be disabled when there is no legal move");
    await screenshot("play-must-pass");
    await clickEl('[data-action="g-pass"]');
    const end = Date.now() + 8000; let t = "";
    while (Date.now() < end) { t = await pageText(); if (t.includes("Easy · Turn 4") && !t.includes("thinking")) break; await sleep(100); }
    if (!t.includes("Easy · Turn 4")) throw new Error("game did not move on to turn 4 after the pass");
    if (/Game over|Draw\./.test(t)) throw new Error("the pass ended the game");
    const reply = (t.match(/Computer played: ([^\n]+)/) || [])[1];
    if (!reply) throw new Error("the computer did not play after the pass");
    const n = (await evaluate(`document.querySelectorAll(".board-plane .board-piece[data-cell]").length`));
    if (n !== 3 && n !== 4) throw new Error("expected 3 or 4 pieces after the computer's reply, board has " + n);
    await screenshot("play-after-pass");
    const again = t.includes("Pass the turn") ? "still stuck, Pass offered again" : "White has moves again";
    return "turn 3 stuck position -> 'Pass the turn' shown, Reserve disabled; Pass clicked -> computer played " + reply + "; Turn 4, " + again;
  });

  // Shared by steps i and j: wait until the computer has replied and it is White's turn number `turn`.
  const waitWhite = async turn => {
    const end = Date.now() + 8000; let t = "";
    while (Date.now() < end) { t = await pageText(); if (t.includes("Easy · Turn " + turn) && t.includes("Your move · White")) return t; await sleep(100); }
    throw new Error("expected 'Easy · Turn " + turn + "' and 'Your move · White'");
  };
  const abilitySpots = () => evaluate(`[...document.querySelectorAll(".board-plane g.destination.ability[data-cell]")].map(g => g.dataset.cell)`);
  const pieceAt = cell => evaluate(`document.querySelector('.board-plane .board-piece[data-cell="${cell}"]')?.getAttribute("aria-label") || null`);

  await step("i expansions on: pieces in reserve, place a pillbug, use its ability by clicking", async () => {
    // Turn all three on by clicking the checkboxes; a game is in progress, so they apply on New game.
    for (const k of ["M", "L", "P"]) {
      await clickEl(`input[data-action="g-exp-${k}"]`);
      if (!(await evaluate(`document.querySelector('input[data-action="g-exp-${k}"]').checked`))) throw new Error("checkbox " + k + " not checked after click");
    }
    await waitText("These settings apply when you start a new game.");
    await clickEl('[data-action="g-new"]');
    await waitText(["with the mosquito, ladybug and pillbug against the computer", "Easy · Turn 1", "Your move · White"]);
    await clickEl('[data-action="g-reserve"]');
    const reserve = await evaluate(`[...document.querySelectorAll("dialog [data-reserve]")].map(b => b.dataset.reserve + "|" + (b.title || ""))`);
    for (const id of ["wM1", "wL1", "wP1"]) {
      const r = reserve.find(x => x.startsWith(id + "|"));
      if (!r) throw new Error(id + " missing from the reserve: " + JSON.stringify(reserve));
      if (r.length < id.length + 20) throw new Error(id + " has no rules tooltip in the reserve");
    }
    await screenshot("expansions-reserve");
    // First real move (needed for an Undo snapshot), then set up turn 3: wG1 -1,0, wQ1 0,0, bQ1 1,0.
    await clickEl('dialog [data-reserve="wQ1"]'); await waitText("Choose a highlighted placement");
    await clickCell(await evaluate(`document.querySelector(".board-plane g.destination[data-cell]").dataset.cell`));
    await waitWhite(2);
    await undoInto({ board: { "-1,0": ["wG1"], "0,0": ["wQ1"], "1,0": ["bQ1"] }, ply: 4, last: null, lastM: null, lastMove: "", passes: 0, info: "" });
    await waitWhite(3);
    // Place the pillbug next to both white pieces through the Reserve dialog.
    await clickEl('[data-action="g-reserve"]'); await clickEl('dialog [data-reserve="wP1"]');
    await waitText("Choose a highlighted placement for your reserve pillbug.");
    await clickCell("0,-1");
    await waitWhite(4);
    if (!(await pieceAt("0,-1"))?.startsWith("White pillbug 1")) throw new Error("pillbug not drawn at 0,-1");
    const reply1 = (await pageText()).match(/Computer played: ([^\n]+)/)?.[1];
    // Select the grasshopper next to the pillbug: violet move-with-pillbug targets appear.
    await clickCell("-1,0");
    await waitText("move-with-pillbug target");
    const spots = await abilitySpots();
    if (!spots.length) throw new Error("no move-with-pillbug targets drawn for wG1");
    const style = await evaluate(`document.querySelector('.board-plane g.destination.ability .spot-outline').getAttribute("stroke")`);
    if (style !== "#d2b8ff") throw new Error("ability targets not in the distinct violet style (stroke " + style + ")");
    await screenshot("pillbug-targets");
    await clickCell(spots[0]);
    if (!(await pieceAt(spots[0]))?.startsWith("White grasshopper 1")) throw new Error("wG1 not moved to " + spots[0] + " by the pillbug");
    if (await pieceAt("-1,0")) throw new Error("-1,0 should be empty after the pillbug lifted wG1");
    await waitWhite(5);
    await screenshot("pillbug-used");
    return "M/L/P checkboxes on -> New game; reserve lists wM1, wL1, wP1 with tooltips; wP1 placed at 0,-1 (computer: " + reply1 + "); wG1 selected -> " + spots.length + " violet targets " + spots.join(" ") + "; clicked " + spots[0] + " -> wG1 moved by the pillbug";
  });

  await step("j frozen piece can't be pillbug-moved; Undo restores the freeze", async () => {
    // Black's ant just moved (2,-1 -> 1,-1) next to the white pillbug; the black spider next to it did not.
    const board = { "0,0": ["wQ1"], "0,-1": ["wP1"], "1,0": ["bQ1"], "1,-1": ["bA1"], "-1,-1": ["bS1"] };
    await undoInto({ board, ply: 8, last: "1,-1", lastM: { id: "bA1", from: "2,-1", to: "1,-1" }, lastMove: "Black ant 1 from (2,-1) to (1,-1)", passes: 0, info: "" });
    await waitWhite(5);
    await clickCell("1,-1");
    await waitText("Black ant 1 moved last turn, so a pillbug can't move it this turn.");
    if ((await abilitySpots()).length) throw new Error("frozen bA1 shows move-with-pillbug targets");
    await screenshot("frozen-ant");
    // The spider, not frozen, can be moved by the same pillbug (so the position itself allows the ability).
    await clickCell("-1,-1");
    await waitText("move-with-pillbug target");
    const spots = await abilitySpots();
    if (!spots.length) throw new Error("bS1 (not frozen) shows no move-with-pillbug targets");
    await clickCell(spots[0]);
    if (!(await pieceAt(spots[0]))?.startsWith("Black spider 1")) throw new Error("bS1 not moved to " + spots[0]);
    await waitWhite(6);
    // Undo goes back to before the spider move, with the ant still frozen.
    await clickEl('[data-action="g-undo"]');
    await waitWhite(5);
    if (!(await pieceAt("-1,-1"))?.startsWith("Black spider 1")) throw new Error("Undo did not put bS1 back");
    await clickCell("1,-1");
    await waitText("Black ant 1 moved last turn, so a pillbug can't move it this turn.");
    if ((await abilitySpots()).length) throw new Error("after Undo, frozen bA1 shows move-with-pillbug targets");
    return "bA1 (just moved) clicked -> frozen message, 0 targets; bS1 -> " + spots.length + " targets, moved to " + spots[0] + "; Undo -> bS1 back, bA1 still frozen";
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
  const pass = !fatal && results.length === STEPS && results.every(r => r.pass) && exceptions.length === 0 && (LIVE || errors.length === 0);
  const summary = { target: LIVE ? "live" : "local", url: URL_, pass, fatal, steps: results, consoleErrors: errors, uncaughtExceptions: exceptions, screenshots: OUT };
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(summary, null, 1));
  console.log((pass ? "ALL PASS" : "FAILED") + " (" + summary.target + "): " + results.filter(r => r.pass).length + "/" + results.length + " steps, " + errors.length + " console errors, " + exceptions.length + " uncaught exceptions. Screenshots: " + OUT);
  errors.concat(exceptions).forEach(e => console.log("  " + e));
  process.exit(pass ? 0 : 1);
})();
