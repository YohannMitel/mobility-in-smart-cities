import Square from './Square.js';
import { Person, Bus, Destination } from './Point.js';

class Map {
  constructor(cols = 10, rows = 10, squareSize = 32) {
    this.cols = cols;
    this.rows = rows;
    this.squareSize = squareSize;

    this.grid = [];
    this.canvas = null;
    this.ctx = null;
    // arrays holding references to squares that contain occupants of each type
    this.person = [];
    this.bus = [];
    this.destination = [];
    this._initGrid();

    this.mode = null;
  }

  _initGrid() {
    this.grid = new Array(this.rows);
    // clear occupant lists when rebuilding the grid
    this.person = [];
    this.bus = [];
    this.destination = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = new Array(this.cols);
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = new Square(c, r, this.squareSize, { walkable: true });
      }
    }
  }

  getSquare(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  attachTo(canvasOrId) {
    if (typeof canvasOrId === 'string') {
      this.canvas = document.getElementById(canvasOrId);
    } else {
      this.canvas = canvasOrId;
    }

    if (!this.canvas) throw new Error('Canvas non trouvé');

    this.canvas.width = this.cols * this.squareSize;
    this.canvas.height = this.rows * this.squareSize;
    this.ctx = this.canvas.getContext('2d');


    this._onClick = this._onClick.bind(this);
    this._onMove = this._onMove.bind(this);
    this.canvas.addEventListener('click', this._onClick);
    this.canvas.addEventListener('mousemove', this._onMove);

    this.render();
  }

  detach() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('mousemove', this._onMove);
    this.canvas = null;
    this.ctx = null;
  }

  coordsToIndex(x, y) {
    const col = Math.floor(x / this.squareSize);
    const row = Math.floor(y / this.squareSize);
    return { col, row };
  }

  _clearHighlights() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].highlight = false;
      }
    }
  }

  _onMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { col, row } = this.coordsToIndex(x, y);

    this._clearHighlights();
    const sq = this.getSquare(col, row);
    if (sq) sq.highlight = true;
    this.render();
  }

  _onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { col, row } = this.coordsToIndex(x, y);

    const sq = this.getSquare(col, row);
    if (sq) {

      if (this.mode) {
        // if same occupant type, remove it
        if (sq.occupant === this.mode) {
          sq.clearOccupant();
          this._removeOccupantArray(this.mode, sq);
        } else {
          // if there is a different occupant, remove it from its array
          if (sq.occupant) {
            this._removeOccupantArray(sq.occupant, sq);
          }

          // set occupant on the square and create a Point instance for it
          sq.setOccupant(this.mode);
          console.log(this.mode);
          let occupant = null;
          if (this.mode === 'person') occupant = new Person('', sq);
          else if (this.mode === 'bus') occupant = new Bus('', sq);
          else if (this.mode === 'flag') occupant = new Destination('', sq);

          this._addOccupantArray(this.mode, occupant);

          if(this.mode === 'person') {
            console.log("Persons : ", this.person)
          }else if(this.mode === 'bus'){
            console.log("Buses : ", this.bus)
          }
          else if(this.mode === 'flag'){
            console.log("Destinations : ", this.destination)
          }
        }
      } else {

          //sq.toggleWalkable();

      }
      this.render();
    }
  }


  setMode(kind) {
    const allowed = [null, 'person', 'bus', 'flag'];
    if (!allowed.includes(kind)) throw new Error('mode non supportée: ' + kind);
    this.mode = kind;
  }

  placeOccupant(col, row, kind) {
    const sq = this.getSquare(col, row);
    if (!sq) return false;
    // remove previous occupant if different
    if (sq.occupant && sq.occupant !== kind) {
      this._removeOccupantArray(sq.occupant, sq);
    }
  sq.setOccupant(kind);
  let occupant = null;
  if (kind === 'person') occupant = new Person('', sq);
  else if (kind === 'bus') occupant = new Bus('', sq);
  else if (kind === 'flag') occupant = new Destination('', sq);

  this._addOccupantArray(kind, occupant);
    this.render();
    return true;
  }

  clearOccupant(col, row) {
    const sq = this.getSquare(col, row);
    if (!sq) return false;
    if (sq.occupant) {
      this._removeOccupantArray(sq.occupant, sq);
      sq.clearOccupant();
    }
    this.render();
    return true;
  }

  getOccupant(col, row) {
    const sq = this.getSquare(col, row);
    return sq ? sq.occupant : null;
  }

  getPerson() {
    return [...this.person];
  }

  getBus() {
    return [...this.bus];
  }

  getDestination() {
    return [...this.destination];
  }

  // internal helpers to keep the arrays in sync
  _addOccupantArray(kind, obj) {
    const arr = kind === 'person' ? this.person : kind === 'bus' ? this.bus : kind === 'flag' ? this.destination : null;
    console.log("addOccupantArray", kind, obj)
    if (!arr) return;

    // only add if we don't already have an occupant at the same position
    const exists = arr.some(p => p.position === obj.position);
    if (!exists) arr.push(obj);
  }

  _removeOccupantArray(kind, obj) {
    const arr = kind === 'person' ? this.person : kind === 'bus' ? this.bus : kind === 'flag' ? this.destination : null;
    if (!arr) return;

    // obj can be either a Point instance or a Square. If it's a Square, remove the Point whose
    // .position === obj. If it's a Point, remove by reference.
    if (obj && obj.position === undefined) {
      // likely a Square
      const idx = arr.findIndex(p => p.position === obj);
      if (idx !== -1) arr.splice(idx, 1);
      return;
    }
    const idx = arr.indexOf(obj);
    if (idx !== -1) arr.splice(idx, 1);
  }

  render() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].draw(this.ctx);
      }
    }
  }


  randomize(prob = 0.2) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const isWalk = Math.random() > prob;
        const sq = this.grid[r][c];
        sq.walkable = isWalk;
        sq.color = isWalk ? '#9bd39b' : '#e26302ff';
      }
    }
    this.render();
  }
}

export default Map;
