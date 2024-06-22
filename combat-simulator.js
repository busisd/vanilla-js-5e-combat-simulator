/*** Utility functions ***/
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sumArr(arr) {
  return arr.reduce((runningTotal, number) => runningTotal + number, 0);
}

/*** SVG ***/
const getOpenSvgTag = ({ width = 200 } = {}) => `
<svg viewBox="0 0 ${width} 200" xmlns="http://www.w3.org/2000/svg" style="width: ${width / 2}px; height: 100px;">
`

const getTextSvgTag = (text, { width = 200, color = "black" } = {}) => `
<text
  font-size="60"
  text-anchor="middle"
  dominant-baseline="middle"
  font-family="monospace"
  font-weight="bold"
  x="${width / 2}"
  y="100"
  fill="${color}"
  stroke="${color}"
  stroke-width="1"
>${text}</text>
`

const getPlaintextSvg = (text, { width = 200, color = "black" } = {}) => `
${getOpenSvgTag({ width })}
  ${getTextSvgTag(text, { width, color })}
</svg>
`

const getD20Svg = (text, { color = "black" } = {}) => `
${getOpenSvgTag()}
  <polyline points="32,58 168,58 100,180 32,58" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/>
  <polyline points="32,58 100,5 168,58 182,148 100,180 18,148 32,58" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/>
  <polyline points="18,52 100,5 182,52 182,148 100,195 18,148 18,52" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/>
  <line x1="18" y1="52" x2="32" y2="58" stroke="black" stroke-linecap="round" stroke-width="5"/>
  <line x1="182" y1="52" x2="168" y2="58" stroke="black" stroke-linecap="round" stroke-width="5"/>
  <line x1="100" y1="195" x2="100" y2="180" stroke="black" stroke-linecap="round" stroke-width="5"/>
  ${getTextSvgTag(text, { color })}
</svg>
`

const getSvgElement = (svgText) => {
  const elementWrapper = document.createElement("span");
  const element = document.createElement("div");
  elementWrapper.appendChild(element);
  element.outerHTML = svgText;
  return elementWrapper;
}

/*** Classes ***/
class Die {
  constructor(maxRoll) {
    this.maxRoll = maxRoll;
  }

  roll() {
    return randInt(1, this.maxRoll);
  }
}

// Common dice
const d4 = new Die(4);
const d6 = new Die(6);
const d8 = new Die(8);
const d10 = new Die(10);
const d12 = new Die(12);
const d20 = new Die(20);

class AttackRoll {
  constructor(modifiers = []) {
    this.totalModifier = sumArr(modifiers);
  }

  rollToHit({
    advantage = false,
    advantageDice = 2,
    disadvantage = false,
    disadvantageDice = 2
  }) {
    let finalRoll;
    const rolls = [];

    if (advantage && !disadvantage) {
      for (let i = 0; i < advantageDice; i++) {
        rolls.push(d20.roll());
      }
      finalRoll = Math.max(...rolls);
    } else if (disadvantage && !advantage) {
      for (let i = 0; i < disadvantageDice; i++) {
        rolls.push(d20.roll());
      }
      finalRoll = Math.min(...rolls);
    } else {
      rolls.push(d20.roll());
      finalRoll = rolls[0];
    }

    return {
      result: Math.max(finalRoll + this.totalModifier, 1),
      rolls
    }
  }
}

class DamageRoll {
  constructor(dice, flatBonuses = []) {
    this.dice = dice;
    this.flatBonuses = flatBonuses;
  }

  rollDice() {
    return this.dice.map(die => die.roll());
  }

  rollDamage(isCritical = false) {
    const rollsArray = isCritical ?
      this.rollDice().concat(this.rollDice()) :
      this.rollDice();

    const damageArray = rollsArray.concat(this.flatBonuses);

    return {
      damage: sumArr(damageArray),
      rolls: damageArray
    };
  }
}

/************ Attack rolls section ************/
/*** HTML elements ***/
const attackInput = document.getElementById("attack-input");
const parsingAttackError = document.getElementById("parsing-attack-error");
const rollAttackButton = document.getElementById("roll-attack");
const isAdvantageCheckbox = document.getElementById("is-advantage");
const isDisadvantageCheckbox = document.getElementById("is-disadvantage");
const attackOutput = document.getElementById("attack-output");
const visualAttackOutput = document.getElementById("visual-attack-output");

/*** Parsing logic ***/
const attackBonusRegex = /^[+-]\d+$/;

const parseAttackString = (attackString) => {
  const trimmedAttackString = attackString.trim();

  if (attackString.length === 0) {
    return new AttackRoll([]);
  }

  let attackToken;
  let positiveOrNegative;
  if (trimmedAttackString.startsWith("+")) {
    positiveOrNegative = 1;
    attackToken = trimmedAttackString.substring(1);
  } else if (trimmedAttackString.startsWith("-")) {
    positiveOrNegative = -1;
    attackToken = trimmedAttackString.substring(1);
  } else {
    positiveOrNegative = 1;
    attackToken = trimmedAttackString;
  }

  const finalModifier = positiveOrNegative * parseInt(attackToken);
  if (isNaN(finalModifier)) {
    throw new Error("Could not parse attack modifier")
  }

  return new AttackRoll([finalModifier]);
}

/*** Event listeners ***/
let inputAttack = new AttackRoll([]);

attackInput.addEventListener("blur", () => {
  parsingAttackError.textContent = null;

  try {
    inputAttack = parseAttackString(attackInput.value);
  } catch (e) {
    parsingAttackError.textContent = e.message;
  }
});

const getRollColor = (roll) => {
  if (roll === 20) {
    return "#27751e";
  } else if (roll === 1) {
    return "#a32431";
  } else {
    return "black"
  }
}

rollAttackButton.addEventListener("click", () => {
  const isAdvantage = isAdvantageCheckbox.checked;
  const isDisadvantage = isDisadvantageCheckbox.checked;
  const { result, rolls } = inputAttack.rollToHit({
    advantage: isAdvantage,
    disadvantage: isDisadvantage
  });
  attackOutput.textContent = `${result} (${rolls.join(", ")})`;

  while (visualAttackOutput.lastChild) {
    visualAttackOutput.lastChild.remove();
  }

  const resultColor = isAdvantage ?
    getRollColor(Math.max(...rolls)) :
    getRollColor(Math.min(...rolls))

  visualAttackOutput.appendChild(getSvgElement(getPlaintextSvg(result, { color: resultColor })));
  visualAttackOutput.appendChild(getSvgElement(getPlaintextSvg("(", { width: 40 })));
  for (const roll of rolls) {
    visualAttackOutput.appendChild(getSvgElement(getD20Svg(roll, { color: getRollColor(roll) })));
  }
  visualAttackOutput.appendChild(getSvgElement(getPlaintextSvg(")", { width: 40 })));
});

/************ Damage rolls section ************/
/*** HTML elements ***/
const damageInput = document.getElementById("damage-input");
const parsingDamageError = document.getElementById("parsing-damage-error");
const rollDamageButton = document.getElementById("roll-damage");
const isCriticalCheckbox = document.getElementById("is-critical");
const damageOutput = document.getElementById("damage-output");

/*** Parsing logic ***/
const diceRegex = /^[1-9]\d*d[1-9]\d*$/;
const flatDamageRegex = /^[1-9]\d*$/

const parseDamageString = (damageStr) => {
  const tokens = damageStr?.length > 0 ?
    damageStr.split("+").map(token => token.trim()) :
    [];

  const dice = [];
  const flatBonuses = [];
  tokens.forEach(token => {
    if (diceRegex.test(token)) {
      dice.push(...parseDiceToken(token));
    } else if (flatDamageRegex.test(token)) {
      flatBonuses.push(parseFlatBonusToken(token));
    } else {
      throw new Error(`Could not parse token: ${token}`);
    }
  });

  return new DamageRoll(dice, flatBonuses);
}

const parseDiceToken = (damageToken) => {
  const [amountString, maxRollString] = damageToken.split("d");
  const amount = parseInt(amountString);
  const maxRoll = parseInt(maxRollString);

  const die = new Die(maxRoll);
  const dice = [];
  for (let i = 0; i < amount; i++) {
    dice.push(die);
  }

  return dice;
}

const parseFlatBonusToken = (damageToken) => {
  return parseInt(damageToken);
}

/*** Event listeners ***/
let inputDamage = new DamageRoll([]);

damageInput.addEventListener("blur", () => {
  parsingDamageError.textContent = null;

  try {
    inputDamage = parseDamageString(damageInput.value);
  } catch (e) {
    parsingDamageError.textContent = e.message;
  }
});

rollDamageButton.addEventListener("click", () => {
  const isCritical = isCriticalCheckbox.checked;
  const { damage, rolls } = inputDamage.rollDamage(isCritical);
  damageOutput.textContent = `${damage} (${rolls.join(" + ")})`;
});
