const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const inputText = document.getElementById("inputText");
const keyInput = document.getElementById("keyInput");
const output = document.getElementById("output");
const steps = document.getElementById("steps");

document.getElementById("encryptBtn").addEventListener("click", () => runVigenere("encrypt"));
document.getElementById("decryptBtn").addEventListener("click", () => runVigenere("decrypt"));
document.getElementById("clearBtn").addEventListener("click", clearAll);

function runVigenere(mode) {
  const text = inputText.value.toUpperCase();
  const key = cleanKey(keyInput.value);

  output.textContent = "";
  steps.innerHTML = "";

  if (!text.trim()) {
    output.textContent = "Bitte gib einen Text ein.";
    return;
  }

  if (!key) {
    output.textContent = "Bitte gib ein Schlüsselwort ein.";
    return;
  }

  let result = "";
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (!alphabet.includes(char)) {
      result += char;
      continue;
    }

    const textPos = alphabet.indexOf(char);
    const keyChar = key[keyIndex % key.length];
    const keyPos = alphabet.indexOf(keyChar);

    let resultPos;

    if (mode === "encrypt") {
      resultPos = (textPos + keyPos) % 26;
    } else {
      resultPos = (textPos - keyPos + 26) % 26;
    }

    const resultChar = alphabet[resultPos];
    result += resultChar;

    addStep(char, textPos, keyChar, keyPos, resultChar, resultPos, mode);

    keyIndex++;
  }

  output.textContent = result;
}

function cleanKey(key) {
  return key
    .toUpperCase()
    .split("")
    .filter(char => alphabet.includes(char))
    .join("");
}

function addStep(textChar, textPos, keyChar, keyPos, resultChar, resultPos, mode) {
  const div = document.createElement("div");
  div.className = "step";

  const operation = mode === "encrypt" ? "+" : "−";

  div.innerHTML = `
    <span class="clear">${textChar}</span>
    Position ${textPos}
    ${operation}
    <span class="key">${keyChar}</span>
    Position ${keyPos}
    =
    <span class="result">${resultChar}</span>
    Position ${resultPos}
  `;

  steps.appendChild(div);
}

function clearAll() {
  inputText.value = "";
  keyInput.value = "";
  output.textContent = "";
  steps.innerHTML = "";
}
