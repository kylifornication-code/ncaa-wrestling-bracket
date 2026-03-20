import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerSrc from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const WEIGHT_CLASSES = ["125", "133", "141", "149", "157", "165", "174", "184", "197", "285"];
const ROUND_LABELS = {
  1: "Round of 32",
  2: "Round of 16",
  3: "Quarterfinal",
  4: "Semifinal",
  5: "Final"
};
const FIRST_ROUND_SEED_PAIRS = [
  [1, 32],
  [16, 17],
  [8, 25],
  [9, 24],
  [5, 28],
  [12, 21],
  [4, 29],
  [13, 20],
  [3, 30],
  [14, 19],
  [6, 27],
  [11, 22],
  [7, 26],
  [10, 23],
  [2, 31],
  [15, 18]
];

function buildMatches() {
  const matches = [];
  let nextId = 1;
  const roundIds = {};

  roundIds[1] = [];
  for (let idx = 0; idx < FIRST_ROUND_SEED_PAIRS.length; idx += 1) {
    const [leftSeed, rightSeed] = FIRST_ROUND_SEED_PAIRS[idx];
    const id = nextId++;
    roundIds[1].push(id);
    matches.push({
      id,
      round: 1,
      label: `${ROUND_LABELS[1]} Match ${idx + 1}`,
      left: { type: "entrant", index: leftSeed - 1 },
      right: { type: "entrant", index: rightSeed - 1 }
    });
  }

  for (let round = 2; round <= 5; round += 1) {
    roundIds[round] = [];
    const prior = roundIds[round - 1];
    for (let idx = 0; idx < prior.length; idx += 2) {
      const id = nextId++;
      roundIds[round].push(id);
      matches.push({
        id,
        round,
        label: `${ROUND_LABELS[round]} Match ${idx / 2 + 1}`,
        left: { type: "match", id: prior[idx] },
        right: { type: "match", id: prior[idx + 1] }
      });
    }
  }

  return matches;
}

const MATCHES = buildMatches();
const FINAL_MATCH_ID = MATCHES[MATCHES.length - 1].id;

const state = {
  activeWeight: WEIGHT_CLASSES[0],
  classes: {}
};

const classSelect = document.getElementById("weightClassSelect");
const entrantGrid = document.getElementById("entrantGrid");
const round1 = document.getElementById("round1");
const round2 = document.getElementById("round2");
const round3 = document.getElementById("round3");
const round4 = document.getElementById("round4");
const championOutput = document.getElementById("championOutput");
const resetClassBtn = document.getElementById("resetClassBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportTxtBtn = document.getElementById("exportTxtBtn");
const importJsonInput = document.getElementById("importJsonInput");
const importPdfInput = document.getElementById("importPdfInput");
const round5 = document.getElementById("round5");

function emptyClassState() {
  return {
    entrants: Array.from({ length: 32 }, (_, idx) => `Seed ${idx + 1}`),
    picks: {}
  };
}

function getClassState(weight) {
  if (!state.classes[weight]) state.classes[weight] = emptyClassState();
  return state.classes[weight];
}

function sourceValue(classData, source) {
  if (source.type === "entrant") return classData.entrants[source.index] || "";
  return classData.picks[source.id] || "";
}

function optionsForMatch(classData, match) {
  const left = sourceValue(classData, match.left);
  const right = sourceValue(classData, match.right);
  return [left, right].filter(Boolean);
}

function reconcilePicks(classData) {
  for (const match of MATCHES) {
    const allowed = optionsForMatch(classData, match);
    if (!allowed.includes(classData.picks[match.id])) {
      delete classData.picks[match.id];
    }
  }
}

function renderWeightClassSelect() {
  classSelect.innerHTML = "";
  WEIGHT_CLASSES.forEach((weight) => {
    const option = document.createElement("option");
    option.value = weight;
    option.textContent = `${weight} lbs`;
    option.selected = weight === state.activeWeight;
    classSelect.appendChild(option);
  });
}

function renderEntrants() {
  const classData = getClassState(state.activeWeight);
  entrantGrid.innerHTML = "";
  classData.entrants.forEach((entrant, idx) => {
    const row = document.createElement("label");
    row.className = "entrant-row";
    const seed = document.createElement("span");
    seed.textContent = `${idx + 1}.`;
    row.appendChild(seed);

    const input = document.createElement("input");
    input.type = "text";
    input.value = entrant;
    input.placeholder = `Seed ${idx + 1} wrestler`;
    input.addEventListener("input", (event) => {
      classData.entrants[idx] = event.target.value.trim();
      reconcilePicks(classData);
      renderBracket();
      persist();
    });

    row.appendChild(input);
    entrantGrid.appendChild(row);
  });
}

function renderMatchCard(classData, match) {
  const card = document.createElement("div");
  card.className = "match-card";

  const label = document.createElement("label");
  label.textContent = match.label;

  const select = document.createElement("select");
  const options = optionsForMatch(classData, match);

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = options.length ? "Select winner" : "Waiting for prior picks";
  placeholder.selected = !classData.picks[match.id];
  select.appendChild(placeholder);

  options.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    option.selected = classData.picks[match.id] === name;
    select.appendChild(option);
  });

  select.disabled = options.length === 0;
  select.addEventListener("change", (event) => {
    const value = event.target.value;
    if (value) classData.picks[match.id] = value;
    else delete classData.picks[match.id];
    reconcilePicks(classData);
    renderBracket();
    persist();
  });

  card.appendChild(label);
  card.appendChild(select);
  return card;
}

function renderBracket() {
  const classData = getClassState(state.activeWeight);
  reconcilePicks(classData);

  round1.innerHTML = "";
  round2.innerHTML = "";
  round3.innerHTML = "";
  round4.innerHTML = "";
  round5.innerHTML = "";

  MATCHES.forEach((match) => {
    const card = renderMatchCard(classData, match);
    if (match.round === 1) round1.appendChild(card);
    else if (match.round === 2) round2.appendChild(card);
    else if (match.round === 3) round3.appendChild(card);
    else if (match.round === 4) round4.appendChild(card);
    else round5.appendChild(card);
  });

  championOutput.textContent = classData.picks[FINAL_MATCH_ID] || "—";
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    classes: state.classes
  };
  downloadFile("ncaabracket2026-bracket.json", JSON.stringify(payload, null, 2), "application/json");
}

function exportText() {
  const lines = [];
  lines.push("NCAA 2026 Wrestling Bracket Picks");
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push("");

  WEIGHT_CLASSES.forEach((weight) => {
    const classData = getClassState(weight);
    lines.push(`${weight} lbs`);
    lines.push(`Champion: ${classData.picks[FINAL_MATCH_ID] || "Not selected"}`);
    lines.push("Round picks:");
    MATCHES.forEach((match) => {
      lines.push(`- ${match.label}: ${classData.picks[match.id] || "Not selected"}`);
    });
    lines.push("");
  });

  downloadFile("ncaabracket2026-bracket.txt", lines.join("\n"), "text/plain");
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== "object" || !parsed.classes) {
        throw new Error("Invalid bracket export format.");
      }

      WEIGHT_CLASSES.forEach((weight) => {
        const imported = parsed.classes[weight];
        if (!imported) return;
        const next = emptyClassState();
        if (Array.isArray(imported.entrants)) {
          next.entrants = imported.entrants.slice(0, 32).concat(Array(32).fill("")).slice(0, 32);
        }
        if (imported.picks && typeof imported.picks === "object") {
          next.picks = { ...imported.picks };
        }
        reconcilePicks(next);
        state.classes[weight] = next;
      });

      persist();
      renderAll();
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      importJsonInput.value = "";
    }
  };
  reader.readAsText(file);
}

async function pdfToText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const lines = [];
    for (const item of content.items) {
      const text = item.str?.trim();
      if (!text) continue;
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;

      let targetLine = null;
      for (const line of lines) {
        if (Math.abs(line.y - y) < 2) {
          targetLine = line;
          break;
        }
      }

      if (!targetLine) {
        targetLine = { y, parts: [] };
        lines.push(targetLine);
      }
      targetLine.parts.push({ x, text });
    }

    lines
      .sort((a, b) => b.y - a.y)
      .forEach((line) => {
        line.parts.sort((a, b) => a.x - b.x);
        fullText += line.parts.map((part) => part.text).join(" ");
        fullText += "\n";
      });

    fullText += "\n";
  }
  return fullText;
}

function parseEntrantsFromSection(sectionText) {
  const bySeed = {};
  const normalized = sectionText
    .replace(/\s+/g, " ")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .trim();

  const patterns = [
    /\((\d{1,2})\)\s+([A-Za-z][A-Za-z.'\- ]+?)\s+\(([A-Z0-9]{2,6})\)\s+\d{1,2}-\d{1,2}/g,
    /\((\d{1,2})\)\s+([A-Za-z][A-Za-z.'\- ]+?)\s+\(([A-Z0-9]{2,6})\)/g
  ];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      const seed = Number(match[1]);
      if (seed < 1 || seed > 32) continue;
      const wrestlerName = match[2].trim().replace(/\s+/g, " ");
      const school = match[3].trim();
      const formatted = `${wrestlerName} (${school})`;
      const current = bySeed[seed];
      if (!current || formatted.length > current.length) {
        bySeed[seed] = formatted;
      }
    }
  }

  if (Object.keys(bySeed).length < 16) return null;
  const entrants = Array.from({ length: 32 }, (_, idx) => bySeed[idx + 1] || `Seed ${idx + 1}`);
  return entrants;
}

function prefillFromPdfText(pdfText) {
  const normalized = pdfText.replace(/\r/g, "");
  let prefills = 0;

  for (const weight of WEIGHT_CLASSES) {
    const headerRegex = new RegExp(`${weight}\\s+CHAMPIONSHIP`, "i");
    const headerMatch = headerRegex.exec(normalized);
    if (!headerMatch) continue;

    const startIndex = headerMatch.index + headerMatch[0].length;
    const tail = normalized.slice(startIndex);
    const wrestlebacksIndex = tail.search(/WRESTLEBACKS/i);
    const sectionText = wrestlebacksIndex >= 0 ? tail.slice(0, wrestlebacksIndex) : tail;

    const entrants = parseEntrantsFromSection(sectionText);
    if (!entrants) continue;
    const classData = getClassState(weight);
    classData.entrants = entrants;
    classData.picks = {};
    prefills += 1;
  }

  return prefills;
}

async function importPdfFile(file) {
  try {
    const pdfText = await pdfToText(file);
    const classesLoaded = prefillFromPdfText(pdfText);
    if (classesLoaded === 0) {
      alert("Could not detect bracket entries from this PDF.");
      return;
    }
    persist();
    renderAll();
    alert(`Loaded entrants for ${classesLoaded} weight class(es).`);
  } catch (error) {
    alert(`PDF import failed: ${error.message}`);
  } finally {
    importPdfInput.value = "";
  }
}

function persist() {
  localStorage.setItem("ncaa-bracket-2026", JSON.stringify(state));
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem("ncaa-bracket-2026");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    if (WEIGHT_CLASSES.includes(parsed.activeWeight)) {
      state.activeWeight = parsed.activeWeight;
    }
    if (parsed.classes && typeof parsed.classes === "object") {
      state.classes = parsed.classes;
    }
  } catch {
    // Ignore invalid persisted data and start clean.
  }
}

function renderAll() {
  renderWeightClassSelect();
  renderEntrants();
  renderBracket();
}

classSelect.addEventListener("change", (event) => {
  state.activeWeight = event.target.value;
  renderAll();
  persist();
});

resetClassBtn.addEventListener("click", () => {
  state.classes[state.activeWeight] = emptyClassState();
  renderAll();
  persist();
});

resetAllBtn.addEventListener("click", () => {
  const confirmed = confirm("Reset all weight classes and picks?");
  if (!confirmed) return;
  state.classes = {};
  renderAll();
  persist();
});

exportJsonBtn.addEventListener("click", exportJson);
exportTxtBtn.addEventListener("click", exportText);
importJsonInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importJsonFile(file);
});
importPdfInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (file) await importPdfFile(file);
});

loadPersisted();
renderAll();
