// Utility functions
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sumArr(arr) {
  return arr.reduce((runningTotal, number) => runningTotal + number, 0);
}

// Classes
class Die {
  constructor(maxRoll) {
    this.maxRoll = maxRoll;
  }

  roll() {
    return randInt(1, this.maxRoll);
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

// HTML elements
const damageInput = document.getElementById("damage-input");
const parsingErrorOutput = document.getElementById("parsing-error-output");
const rollButton = document.getElementById("roll");
const isCriticalCheckbox = document.getElementById("is-critical");
const damageOutput = document.getElementById("damage-output");

// Parsing logic
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

// Event listeners
let inputAttack = new DamageRoll([]);

damageInput.addEventListener("blur", () => {
  parsingErrorOutput.textContent = null;

  try {
    inputAttack = parseDamageString(damageInput.value);
  } catch (e) {
    parsingErrorOutput.textContent = e.message;
  }
});

rollButton.addEventListener("click", () => {
  const isCritical = isCriticalCheckbox.checked;
  const { damage, rolls } = inputAttack.rollDamage(isCritical);
  damageOutput.textContent = `${damage} (${rolls.join(" + ")})`;
})

// Common dice
const d4 = new Die(4);
const d6 = new Die(6);
const d8 = new Die(8);
const d10 = new Die(10);
const d12 = new Die(12);
const d20 = new Die(20);
