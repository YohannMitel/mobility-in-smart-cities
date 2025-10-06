// FactoryMethod.js



class Point {
  constructor(name = '', position = null, availableAt = 0) {
    this.name = name;
    // position is expected to be a Square instance
    this.position = position;
    this.availableAt = availableAt;
    this.type = null;
  }
}

class Person extends Point {
  constructor(name = '', position = null, availableAt = 0) {
    super(name, position, availableAt);
    this.type = 'person';
  }
}

class Bus extends Point {
  constructor(name = '', position = null, availableAt = 0) {
    super(name, position, availableAt);
    this.type = 'bus';
  }
}

class Destination extends Point {
  constructor(name = '', position = null, availableAt = 0) {
    super(name, position, availableAt);
    // Map uses the kind string 'flag' for destinations
    this.type = 'flag';
  }
}

export { Person, Bus, Destination };
