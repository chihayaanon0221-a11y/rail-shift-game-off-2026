"use strict";

const levels = [
  { name: "First signal", tracks: ["A..B.", ".C..A"], start: [1, 4] },
  { name: "Three-track junction", tracks: ["A.B..", "..C.A", "B...C"], start: [2, 4, 4] },
  { name: "Crossing traffic", tracks: ["A..C..B", "C....A.", ".B.C..."], start: [3, 1, 3] },
  { name: "Westbound loop", tracks: ["A..B.C.", "..B..A.", ".C..B..", "B.C...A"], start: [3, 0, 1, 3] },
  { name: "Long freight", tracks: ["A.....B.C", ".C...B..A", "..AB....C", "B....C.A."], start: [4, 1, 8, 5] },
  { name: "Night junction", tracks: ["AB...C...", "C..A....B", ".A..BC...", "..B.C...A", "C...B..A."], start: [4, 1, 8, 1, 4] }
];

const mod = (value, width) => ((value % width) + width) % width;

function shift(state, pair, direction, width) {
  const next = [...state];
  next[pair] = mod(next[pair] + direction, width);
  next[pair + 1] = mod(next[pair + 1] - direction, width);
  return next;
}

function solution(state, width) {
  const actions = [];
  let prefix = 0;
  for (let pair = 0; pair < state.length - 1; pair += 1) {
    prefix = mod(prefix + state[pair], width);
    const right = mod(-prefix, width);
    const steps = right * 2 <= width ? right : right - width;
    for (let n = 0; n < Math.abs(steps); n += 1) {
      actions.push({ pair, direction: Math.sign(steps) });
    }
  }
  return actions;
}

function visibleTrack(track, offset) {
  return [...track].map((_, index) => track[mod(index - offset, track.length)]);
}

function start() {
  const get = (id) => document.getElementById(id);
  const board = get("board");
  const target = get("target");
  const symbols = { A: ["◆", "diamond", "0"], B: ["●", "circle", "1"], C: ["▲", "triangle", "2"] };
  let index = 0;
  let selected = 0;
  let current = [];
  let trail = [];
  let best = {};
  let message = "";
  try {
    best = JSON.parse(localStorage.getItem("rail-shift-clear") || "{}") || {};
  } catch {
    best = {};
  }

  const cleared = () => current.every((offset) => offset === 0);
  const level = () => levels[index];
  const width = () => level().tracks[0].length;

  function newLevel(number) {
    index = number;
    selected = 0;
    current = [...level().start];
    trail = [];
    message = "Choose an arrow between two tracks.";
    render();
  }

  function shiftPair(pair, direction) {
    if (cleared()) return;
    trail.push(current);
    selected = pair;
    current = shift(current, pair, direction, width());
    message = "";
    if (cleared()) {
      if (!best[index] || trail.length < best[index]) {
        best[index] = trail.length;
        try { localStorage.setItem("rail-shift-clear", JSON.stringify(best)); } catch {}
      }
      message = index === levels.length - 1 ? "All signals aligned. The line is open." : "Signals aligned.";
    }
    render();
  }

  function undo() {
    if (!trail.length) return;
    current = trail.pop();
    message = "Last shift undone.";
    render();
  }

  function hint() {
    const next = solution(current, width())[0];
    if (!next) return;
    selected = next.pair;
    const side = next.direction === 1 ? "right" : "left";
    message = "Shift pair " + (selected + 1) + " " + side + ".";
    render();
  }

  function makeTrack(chars, row, moving, expected) {
    const rail = document.createElement("div");
    rail.className = "rail";
    rail.style.setProperty("--span", chars.length);
    if (moving) rail.dataset.moving = "";
    const pattern = chars.map((char) => char === "." ? "empty" : symbols[char][1]).join(", ");
    rail.setAttribute("role", "img");
    rail.setAttribute("aria-label", "Track " + (row + 1) + " " + pattern);
    for (const [position, char] of chars.entries()) {
      const bay = document.createElement("span");
      bay.className = "bay";
      bay.setAttribute("aria-hidden", "true");
      if (char !== ".") {
        const chip = document.createElement("span");
        chip.className = "signal";
        chip.textContent = symbols[char][0];
        chip.dataset.tone = symbols[char][2];
        bay.append(chip);
      }
      const targetSymbol = expected?.[position];
      if (targetSymbol && targetSymbol !== ".") {
        const hint = document.createElement("span");
        hint.className = "target-mark";
        hint.textContent = symbols[targetSymbol][0];
        bay.append(hint);
      }
      rail.append(bay);
    }
    return rail;
  }

  function makeSwitch(pair, disabled) {
    const junction = document.createElement("div");
    junction.className = "junction";
    const group = document.createElement("div");
    group.className = "switch";
    if (selected === pair) group.dataset.active = "";
    const title = document.createElement("span");
    title.textContent = "Pair " + (pair + 1);
    for (const direction of [-1, 1]) {
      const button = document.createElement("button");
      const side = direction === 1 ? "right" : "left";
      button.type = "button";
      button.disabled = disabled;
      button.textContent = direction === 1 ? "→" : "←";
      button.setAttribute("aria-label", "Shift pair " + (pair + 1) + " " + side);
      button.dataset.move = pair + "/" + direction;
      button.addEventListener("click", () => shiftPair(pair, direction));
      group.append(button);
    }
    group.insertBefore(title, group.lastElementChild);
    junction.append(group);
    return junction;
  }

  function render() {
    const focus = document.activeElement?.dataset.move;
    const finished = cleared();
    get("level-count").textContent = "Puzzle " + (index + 1) + " of " + levels.length;
    get("level-name").textContent = level().name;
    get("moves").textContent = trail.length;
    get("move-label").textContent = trail.length === 1 ? "move" : "moves";
    get("par").textContent = "Best possible " + solution(level().start, width()).length;
    get("notice").textContent = message;
    get("undo").disabled = !trail.length;
    get("hint").disabled = finished;
    get("advance").hidden = !finished || index >= levels.length - 1;
    board.replaceChildren();
    target.replaceChildren();
    level().tracks.forEach((track, row) => {
      board.append(makeTrack(visibleTrack(track, current[row]), row, !finished && (row === selected || row === selected + 1), track));
      target.append(makeTrack([...track], row, false));
      if (row < level().tracks.length - 1) board.append(makeSwitch(row, finished));
    });
    const menu = get("levels");
    menu.replaceChildren();
    for (const [number, layout] of levels.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = number + 1;
      button.setAttribute("aria-label", "Puzzle " + (number + 1) + " " + layout.name + (best[number] ? " cleared" : ""));
      if (number === index) button.setAttribute("aria-current", "true");
      if (best[number]) button.dataset.cleared = "";
      button.addEventListener("click", () => newLevel(number));
      menu.append(button);
    }
    if (focus && !finished) board.querySelector('[data-move="' + focus + '"]')?.focus({ preventScroll: true });
  }

  get("reset").addEventListener("click", () => newLevel(index));
  get("undo").addEventListener("click", undo);
  get("hint").addEventListener("click", hint);
  get("advance").addEventListener("click", () => newLevel(index + 1));
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        selected = mod(selected + (event.key === "ArrowDown" ? 1 : -1), current.length - 1);
        message = "Pair " + (selected + 1) + " selected.";
        render();
        break;
      case "ArrowLeft":
      case "ArrowRight":
        event.preventDefault();
        shiftPair(selected, event.key === "ArrowRight" ? 1 : -1);
        break;
      case "z":
      case "Z":
        event.preventDefault();
        undo();
        break;
      default:
        break;
    }
  });
  newLevel(index);
}

if (typeof document !== "undefined") start();
if (typeof module !== "undefined") module.exports = { levels, shift, solution };
