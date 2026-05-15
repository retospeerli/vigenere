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

let animationTimer = null;
let isRunning = false;

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
  stopAnimation();

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

  if (steps.length === 0) {
    explanation.textContent = "Im Text wurden keine Buchstaben A–Z gefunden.";
    return;
  }

  let index = 0;
  let result = "";
  isRunning = true;

  showStep(steps[index], mode);
  result += steps[index].resultChar;
  output.textContent = result;
  index++;

  animationTimer = setInterval(() => {
    if (!isRunning) return;

    if (index >= steps.length) {
      stopAnimation(false);
      explanation.innerHTML = "Fertig. Das Ergebnis steht oben.";
      return;
    }

    showStep(steps[index], mode);
    result += steps[index].resultChar;
    output.textContent = result;
    index++;
  }, getDelay());
}

function createSteps(text, key, mode) {
  const steps = [];
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (!alphabet.includes(char)) {
      steps.push({
        isLetter: false,
        resultChar: char
      });
      continue;
    }

    const textPos = alphabet.indexOf(char);
    const keyChar = key[keyIndex % key.length];
    const keyPos = alphabet.indexOf(keyChar);

    let resultPos;
    let row;
    let col;

    if (mode === "encrypt") {
      row = keyPos;
      col = textPos;
      resultPos = (row + col) % 26;
    } else {
      row = keyPos;
      resultPos = textPos;
      col = (resultPos - row + 26) % 26;
    }

    const resultChar = alphabet[resultPos];

    steps.push({
      isLetter: true,
      textChar: char,
      textPos,
      keyChar,
      keyPos,
      row,
      col,
      resultChar,
      resultPos
    });

    keyIndex++;
  }

  return steps;
}

function showStep(step, mode) {
  clearHighlights();

  if (!step.isLetter) {
    explanation.innerHTML = `
      Dieses Zeichen ist kein Buchstabe und bleibt unverändert:
      <span class="resultChar">${escapeHtml(step.resultChar)}</span>
    `;
    return;
  }

  highlightCell(step.row, step.col);

  if (mode === "encrypt") {
    explanation.innerHTML = `
      Schlüsselbuchstabe:
      <span class="keyChar">${step.keyChar}</span>
      → Zeile suchen.
      Klartextbuchstabe:
      <span class="currentChar">${step.textChar}</span>
      → Spalte suchen.
      Schnittpunkt:
      <span class="resultChar">${step.resultChar}</span>.
    `;
  } else {
    explanation.innerHTML = `
      Schlüsselbuchstabe:
      <span class="keyChar">${step.keyChar}</span>
      → Zeile suchen.
      Geheimtextbuchstabe:
      <span class="resultChar">${step.textChar}</span>
      → in dieser Zeile suchen.
      Oben in der Spalte steht der Klartextbuchstabe:
      <span class="currentChar">${step.resultChar}</span>.
    `;
  }
}

function highlightCell(row, col) {
  const rowHeader = document.querySelector(`[data-row-header="${row}"]`);
  const colHeader = document.querySelector(`[data-col-header="${col}"]`);
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

  if (rowHeader) rowHeader.classList.add("rowHighlight");
  if (colHeader) colHeader.classList.add("colHighlight");
  if (cell) cell.classList.add("resultHighlight");

  document.querySelectorAll(`[data-row="${row}"]`).forEach(td => {
    td.classList.add("rowHighlight");
  });

  document.querySelectorAll(`[data-col="${col}"]`).forEach(td => {
    td.classList.add("colHighlight");
  });

  if (cell) cell.classList.add("resultHighlight");
}

function clearHighlights() {
  document.querySelectorAll(
    ".rowHighlight, .colHighlight, .resultHighlight"
  ).forEach(el => {
    el.classList.remove("rowHighlight", "colHighlight", "resultHighlight");
  });
}

function cleanKey(key) {
  return key
    .toUpperCase()
    .replaceAll("Ä", "AE")
    .replaceAll("Ö", "OE")
    .replaceAll("Ü", "UE")
    .split("")
    .filter(char => alphabet.includes(char))
    .join("");
}

function getDelay() {
  const value = Number(speedRange.value);

  const minDelay = 100;   // 10 Zeichen pro Sekunde
  const maxDelay = 2000;  // 2 Sekunden pro Zeichen

  return Math.round(maxDelay - (value / 100) * (maxDelay - minDelay));
}

function updateSpeedLabel() {
  const delay = getDelay();

  if (delay >= 1000) {
    speedLabel.textContent = `${(delay / 1000).toFixed(1)} Sekunden pro Zeichen`;
  } else {
    const charsPerSecond = Math.round(1000 / delay);
    speedLabel.textContent = `${charsPerSecond} Zeichen/Sekunde`;
  }
}

function stopAnimation(clearText = true) {
  isRunning = false;

  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }

  clearHighlights();

  if (clearText) {
    explanation.textContent = "Animation gestoppt.";
  }
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
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
