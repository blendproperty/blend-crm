const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";
const SYMBOLS = "!@#$%&*?";
const ALL = `${UPPER}${LOWER}${NUMBERS}${SYMBOLS}`;

function randomIndex(max: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

export function generateTemporaryPassword(length = 16) {
  const characters = [
    UPPER[randomIndex(UPPER.length)],
    LOWER[randomIndex(LOWER.length)],
    NUMBERS[randomIndex(NUMBERS.length)],
    SYMBOLS[randomIndex(SYMBOLS.length)],
  ];

  while (characters.length < length) {
    characters.push(ALL[randomIndex(ALL.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}
