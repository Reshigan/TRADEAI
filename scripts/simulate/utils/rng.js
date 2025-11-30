/**
 * Deterministic Random Number Generator
 * Uses seedrandom for reproducible simulations
 */

const seedrandom = require('seedrandom');

class DeterministicRNG {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.rng = seedrandom(this.seed.toString());
  }

  random() {
    return this.rng();
  }

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  randomFloat(min, max) {
    return this.random() * (max - min) + min;
  }

  randomChoice(array) {
    return array[this.randomInt(0, array.length - 1)];
  }

  randomChoices(array, count) {
    const shuffled = [...array].sort(() => this.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  randomDate(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return new Date(start + this.random() * (end - start));
  }

  getSeed() {
    return this.seed;
  }
}

module.exports = DeterministicRNG;
