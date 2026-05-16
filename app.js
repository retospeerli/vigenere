const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const inputText = document.getElementById("inputText");
const keyInput = document.getElementById("keyInput");
const output = document.getElementById("output");
const explanation = document.getElementById("explanation");
const square = document.getElementById("vigenereSquare");

const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");

const speedRange = document.getElementById("speedRange");
const speedLabel = document.getElementById("speedLabel");

let isRunning = false;
let timeouts = [];

buildVigenereSquare();
updateSpeedLabel();

encryptBtn.addEventListener("click", () => startAnimation("encrypt"));
decryptBtn.addEventListener("click", () => startAnimation("decrypt"));
stopBtn.addEventListener("click", stopAnimation);
clearBtn.addEventListener("click", clearAll);
speedRange.addEventListener("input", updateSpeedLabel);

function buildVigenereSquare() {
  square.innerHTML = "";

  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "×";
  corner.className = "corner";
  headerRow.appendChild(corner);

  for (let col = 0; col < 26; col++) {
    const th = document.createElement("th");
    th.textContent = alphabet[col];
    th.dataset.colHeader = col;
    headerRow.appendChild(th);
  }

  square.appendChild(headerRow);

  for (let row = 0; row < 26; row++) {
    const tr = document.createElement("tr");

    const rowHeader = document.createElement("td");
    rowHeader.textContent = alphabet[row];
    rowHeader.className = "rowHeader";
    rowHeader.dataset.rowHeader = row;
    tr.appendChild(rowHeader);

    for (let col = 0; col < 26; col++) {
      const td = document.createElement("td");
      td.textContent = alphabet[(row + col) % 26];
      td.dataset.row = row;
      td.dataset.col = col;
      tr.appendChild(td);
    }

    square.appendChild(tr);
  }
}

function startAnimation(mode) {
  stopAnimation(false);

  const text = inputText.value.toUpperCase();
  const key = cleanKey(keyInput.value);

  output.textContent = "";
  explanation.textContent = "";

  if (!text.trim()) {
    explanation.textContent = "Bitte gib zuerst einen Text ein.";
    return;
  }

  if (!key) {
    explanation.textContent = "Bitte gib ein Schlüsselwort ein.";
    return;
  }

  const steps = createSteps(text, key, mode);

  isRunning = true;
  runStep(steps, 0, "", mode);
}

function runStep(steps, index, currentResult, mode) {
  if (!isRunning) return;

  if (index >= steps.length) {
    clearHighlights();
    explanation.innerHTML = "Fertig. Das Ergebnis steht oben.";
    isRunning = false;
    return;
  }

  const step = steps[index];

  if (!step.isLetter) {
    const newResult = currentResult + step.resultChar;
    output.textContent = newResult;

    explanation.innerHTML = `
      Dieses Zeichen ist kein Buchstabe und bleibt unverändert:
      <span class="resultChar">${escapeHtml(step.resultChar)}</span>
    `;

    schedule(() => {
      runStep(steps, index + 1, newResult, mode);
    }, getPhaseDelay());

    return;
  }

  animateLetter(step, mode, () => {
    const newResult = currentResult + step.resultChar;
    output.textContent = newResult;
    playBeep();

    schedule(() => {
      runStep(steps, index + 1, newResult, mode);
    }, getPhaseDelay());
  });
}

function animateLetter(step, mode, done) {
  clearHighlights();

  const phaseDelay = getPhaseDelay();

  if (mode === "encrypt") {
    explanation.innerHTML = `
      1. Schlüsselbuchstabe:
      <span class="keyChar">${step.keyChar}</span>
      → diese Zeile wird gesucht.
    `;
    highlightOnlyRow(step.row);

    schedule(() => {
      explanation.innerHTML = `
        2. Klartextbuchstabe:
        <span class="currentChar">${step.inputChar}</span>
        → diese Spalte wird gesucht.
      `;
      highlightRowAndColumn(step.row, step.col);
    }, phaseDelay);

    schedule(() => {
      explanation.innerHTML = `
        3. Im Schnittpunkt steht der Geheimtextbuchstabe:
        <span class="resultChar">${step.resultChar}</span>.
      `;
      highlightFinalCell(step.row, step.col);
    }, phaseDelay * 2);

    schedule(done, phaseDelay * 3);
  }

  if (mode === "decrypt") {
    explanation.innerHTML = `
      1. Schlüsselbuchstabe:
      <span class="keyChar">${step.keyChar}</span>
      → diese Zeile wird gesucht.
    `;
    highlightOnlyRow(step.row);

    schedule(() => {
      explanation.innerHTML = `
        2. Geheimtextbuchstabe:
        <span class="resultChar">${step.inputChar}</span>
        → dieser Buchstabe wird in der Zeile gesucht.
      `;
      highlightCipherInRow(step.row, step.inputChar);
    }, phaseDelay);

    schedule(() => {
      explanation.innerHTML = `
        3. Von dort geht man nach oben zur Spalte.
        Oben steht der Klartextbuchstabe:
        <span class="currentChar">${step.resultChar}</span>.
      `;
      highlightRowAndColumn(step.row, step.col);
      highlightFinalCell(step.row, step.col);
    }, phaseDelay * 2);

    schedule(done, phaseDelay * 3);
  }
}

function createSteps(text, key, mode) {
  const steps = [];
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = normalizeChar(text[i]);

    if (!alphabet.includes(char)) {
      steps.push({
        isLetter: false,
        resultChar: text[i]
      });
      continue;
    }

    const inputPos = alphabet.indexOf(char);
    const keyChar = key[keyIndex % key.length];
    const keyPos = alphabet.indexOf(keyChar);

    let row = keyPos;
    let col;
    let resultChar;

    if (mode === "encrypt") {
      col = inputPos;
      resultChar = alphabet[(row + col) % 26];
    } else {
      col = (inputPos - row + 26) % 26;
      resultChar = alphabet[col];
    }

    steps.push({
      isLetter: true,
      inputChar: char,
      keyChar,
      row,
      col,
      resultChar
    });

    keyIndex++;
  }

  return steps;
}

function highlightOnlyRow(row) {
  clearHighlights();

  const rowHeader = document.querySelector(`[data-row-header="${row}"]`);
  if (rowHeader) rowHeader.classList.add("rowHighlight");

  document.querySelectorAll(`[data-row="${row}"]`).forEach(td => {
    td.classList.add("rowHighlight");
  });
}

function highlightRowAndColumn(row, col) {
  clearHighlights();

  const rowHeader = document.querySelector(`[data-row-header="${row}"]`);
  const colHeader = document.querySelector(`[data-col-header="${col}"]`);

  if (rowHeader) rowHeader.classList.add("rowHighlight");
  if (colHeader) colHeader.classList.add("colHighlight");

  document.querySelectorAll(`[data-row="${row}"]`).forEach(td => {
    td.classList.add("rowHighlight");
  });

  document.querySelectorAll(`[data-col="${col}"]`).forEach(td => {
    td.classList.add("colHighlight");
  });
}

function highlightFinalCell(row, col) {
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (cell) cell.classList.add("resultHighlight");
}

function highlightCipherInRow(row, cipherChar) {
  clearHighlights();

  const rowHeader = document.querySelector(`[data-row-header="${row}"]`);
  if (rowHeader) rowHeader.classList.add("rowHighlight");

  document.querySelectorAll(`[data-row="${row}"]`).forEach(td => {
    td.classList.add("rowHighlight");

    if (td.textContent === cipherChar) {
      td.classList.add("resultHighlight");
    }
  });
}

function clearHighlights() {
  document.querySelectorAll(
    ".rowHighlight, .colHighlight, .resultHighlight"
  ).forEach(el => {
    el.classList.remove("rowHighlight", "colHighlight", "resultHighlight");
  });
}

function schedule(fn, delay) {
  const id = setTimeout(fn, delay);
  timeouts.push(id);
}

function stopAnimation(showMessage = true) {
  isRunning = false;

  timeouts.forEach(id => clearTimeout(id));
  timeouts = [];

  clearHighlights();

  if (showMessage) {
    explanation.textContent = "Animation gestoppt.";
  }
}

function getPhaseDelay() {
  const value = Number(speedRange.value);

  const slowestTotalPerLetter = 2000;
  const fastestTotalPerLetter = 100;

  const totalPerLetter =
    slowestTotalPerLetter -
    (value / 100) * (slowestTotalPerLetter - fastestTotalPerLetter);

  return Math.max(80, Math.round(totalPerLetter / 3));
}

function updateSpeedLabel() {
  const value = Number(speedRange.value);

  const slowestTotalPerLetter = 2000;
  const fastestTotalPerLetter = 100;

  const totalPerLetter =
    slowestTotalPerLetter -
    (value / 100) * (slowestTotalPerLetter - fastestTotalPerLetter);

  if (totalPerLetter >= 1000) {
    speedLabel.textContent = `${(totalPerLetter / 1000).toFixed(1)} Sekunden pro Zeichen`;
  } else {
    const charsPerSecond = Math.round(1000 / totalPerLetter);
    speedLabel.textContent = `${charsPerSecond} Zeichen/Sekunde`;
  }
}

function playBeep() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioCtx = new AudioContext();

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 720;

  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.13);
}

function cleanKey(key) {
  return key
    .toUpperCase()
    .replaceAll("Ä", "AE")
    .replaceAll("Ö", "OE")
    .replaceAll("Ü", "UE")
    .split("")
    .map(normalizeChar)
    .filter(char => alphabet.includes(char))
    .join("");
}

function normalizeChar(char) {
  return char
    .replace("Ä", "A")
    .replace("Ö", "O")
    .replace("Ü", "U");
}

function clearAll() {
  stopAnimation(false);
  inputText.value = "";
  keyInput.value = "";
  output.textContent = "";
  explanation.textContent = "Starte die Animation.";
  clearHighlights();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
