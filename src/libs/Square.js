// Square.js

class Square {
  constructor(col, row, size, options = {}) {
    this.col = col;
    this.row = row;
    this.size = size;
    this.type = options.type || 'ground';
    this.color = options.color || '#cce7ccff' ;
    this.stroke = options.stroke || '#222';
    this.highlight = false;
    // whether the square can be walked on
    this.walkable = options.walkable !== undefined ? options.walkable : true;
    // color depends on walkable by default
    if (!options.color) this.color = this.walkable ? '#9bd39b' : '#d36b6b';
    this.occupant = options.occupant || null;
  }

  get x() {
    return this.col * this.size;
  }

  get y() {
    return this.row * this.size;
  }


  setOccupant(kind) {
    if (kind === null) {
      this.occupant = null;
      return;
    }
    const allowed = ['person', 'bus', 'flag'];
    if (!allowed.includes(kind)) throw new Error('Occupant non supporté: ' + kind);
    this.occupant = kind;
  }

  toggleWalkable() {
    this.walkable = !this.walkable;
    this.color = this.walkable ? '#9bd39b' : '#d36b6b';
  }

  clearOccupant() {
    this.occupant = null;
  }

  draw(ctx) {
    ctx.save();

    ctx.fillStyle = this.highlight ? '#fff58b' : this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);


    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.size - 1, this.size - 1);

    if (this.occupant) {
      this._drawIcon(ctx);
    }

    ctx.restore();
  }

  _drawIcon(ctx) {
    const padding = Math.max(2, this.size * 0.12);
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;

    const map = {
      person: { emoji: '👤', fa: '\\uf007' },
      bus: { emoji: '🚌', fa: '\\uf207' },
      flag: { emoji: '🚩', fa: '\\uf024' }
    };

    const info = map[this.occupant] || { emoji: '?', fa: null };

    const fontSize = Math.floor(this.size - padding * 2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#222';
    
    ctx.font = `${fontSize}px sans-serif`;
    try {
      ctx.fillText(info.emoji, cx, cy + 1);
    } catch (e) {
      ctx.beginPath();
      ctx.fillStyle = '#222';
      ctx.arc(cx, cy, Math.max(4, this.size * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default Square;
