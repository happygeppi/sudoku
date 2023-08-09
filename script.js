// TODO:
// reset
// better speed management
// UI

let board;

const $ = (id) => document.getElementById(id);

function Init() {
  console.log("Press SPACE to solve the sudoku.");
  console.log("Press any number to randomly fill the board.");
  console.log("Press X to collapse a single cell.")
  console.log("Press W to speed up the sudoku solver.");
  console.log("Press S to slow down the sudoku solver.");
  console.log("Press Q to solve the sudoku instantly.");
  board = new Board();
}

class Board {
  constructor() {
    this.data = [];
    this.decisions = [];
    this.solved = false;

    this.html = {
      container: $("container"),
      rows: [],
      cells: [],
      options: [],
    };

    this.speed = 1;

    this.createData();
    this.createBoard();
  }

  createBoard() {
    for (let j = 0; j < 9; j++) {
      const Row = document.createElement("div");
      Row.classList.add("row");
      this.html.container.append(Row);
      this.html.rows.push(Row);

      for (let i = 0; i < 9; i++) {
        const Cell = document.createElement("div");
        Cell.classList.add("cell");
        Row.append(Cell);
        this.html.cells.push(Cell);
        this.html.options.push([]);

        for (let opt = 1; opt <= 9; opt++) {
          const Opt = document.createElement("div");
          Opt.classList.add("option");
          Opt.innerHTML = opt;
          Cell.append(Opt);
          this.html.options[this.index(i, j)].push(Opt);
        }
      }
    }
  }

  createData() {
    for (let j = 0; j < 9; j++) {
      for (let i = 0; i < 9; i++) {
        const options = Array.from({ length: 9 }, (_, i) => i + 1);
        const info = {
          collapsed: false,
          value: null,
          options,
          // entropy: options.length,
        };
        this.data.push(info);
      }
    }
  }

  randomFill(N) {
    let n = 0;
    while (n < N) {
      const index = Math.floor(Math.random() * 9 * 9);
      if (!this.data[index].collapsed) {
        this.collapse([index, this.data[index].options.random()]);
        n++;
      }
    }
  }

  collapseLeastEntropy() {
    // console.log("--------");

    let color = false;
    // this.uncolorAll();

    let least = []; // Math.floor(Math.random() * 9 * 9)

    for (let j = 0; j < 9; j++) {
      for (let i = 0; i < 9; i++) {
        const index = this.index(i, j);
        const cell = this.data[index];
        if (!cell.collapsed) {
          if (cell.options.length == 0) {
            // console.log("out of options:", index);
            return this.backtrack();
          }

          if (
            least.length == 0 ||
            cell.options.length < this.data[least[0]].options.length
          )
            least = [index];
          else if (cell.options.length == this.data[least[0]].options.length)
            least.push(index);
        }
      }
    }

    if (least.length == 0) return (this.solved = true);

    // console.log("least:");
    // console.log(least);

    let options = this.createOptions(least).shuffle();

    // console.log("options:");
    // console.log(options.copy());

    this.collapse(options[0], color);
    this.decisions.push(options);
  }

  createOptions(cells) {
    let options = [];

    for (const cell of cells)
      for (const value of this.data[cell].options) options.push([cell, value]);

    return options;
  }

  undo(decision) {
    // console.log("undo: ");
    // console.log(decision);

    const index = decision[0]
    const cell = this.data[index];
    cell.collapsed = false;
    cell.value = null;
    const [j, i] = this.ij(index);
    cell.options = this.getOptions(j, i);

    this.html.cells[index].innerHTML = "";
    this.html.cells[index].classList.remove("collapsed");

    for (const Opt of this.html.options[index]) {
      this.html.cells[index].append(Opt);
      Opt.classList.remove("hide");
    }

    this.updateData(j, i);

    this.decisions.last().splice(0, 1);
  }

  backtrack() {
    // const [i, j] = this.ij(this.decisions.last()[0][0]);
    // this.color(j, i);

    this.undo(this.decisions.last()[0]);
    while (
      this.decisions.last().length == 0 ||
      (this.decisions.length > 0 && Math.random() < 0.75)
    ) {
      this.decisions.splice(this.decisions.length - 1);
      this.undo(this.decisions.last()[0]);
    }

    // console.log("⬅️⬅️⬅️⬅️⬅️⬅️");

    this.collapse(this.decisions.last()[0]);
  }

  index = (i, j) => 9 * j + i;

  ij = (index) => [index % 9, Math.floor(index / 9)];

  collapse(decision, color = false) {
    // console.log("decision:");
    // console.log(decision);

    const index = decision[0];
    const value = decision[1];

    const cell = this.data[index];
    cell.value = value;
    cell.collapsed = true;

    this.html.cells[index].innerHTML = cell.value;
    this.html.cells[index].classList.add("collapsed");

    let [i, j] = this.ij(index);
    this.updateData(j, i, color);

    return index;
  }

  updateData(j, i, color) {
    for (let horz = 0; horz < 9; horz++)
      if (horz != i) this.getOptions(j, horz, color);

    for (let vert = 0; vert < 9; vert++)
      if (vert != j) this.getOptions(vert, i, color);

    const bi0 = i - (i % 3);
    const bj0 = j - (j % 3);
    for (let bj = bj0; bj < bj0 + 3; bj++)
      for (let bi = bi0; bi < bi0 + 3; bi++)
        if (bj != j || bi != i) this.getOptions(bj, bi, color);
  }

  getOptions(j, i, color) {
    const cell = this.data[9 * j + i];
    if (cell.collapsed) return "I'm collapsed :)";

    cell.options = Array.from({ length: 9 }, (_, i) => i + 1);

    // check horz
    for (let k = 0; k < 9; k++) {
      if (k != i) {
        const other = this.data[9 * j + k];
        if (other.collapsed && cell.options.includes(other.value))
          cell.options.remove(other.value);
      }
    }

    // check vert
    for (let k = 0; k < 9; k++) {
      if (k != j) {
        const other = this.data[9 * k + i];
        if (other.collapsed && cell.options.includes(other.value))
          cell.options.remove(other.value);
      }
    }
    // check block
    const bi0 = i - (i % 3); // block starting index
    const bj0 = j - (j % 3); // 3 * Math.floor(j / 3);
    for (let bj = bj0; bj < bj0 + 3; bj++) {
      for (let bi = bi0; bi < bi0 + 3; bi++) {
        if (bj != j || bi != i) {
          const other = this.data[9 * bj + bi];
          if (other.collapsed && cell.options.includes(other.value))
            cell.options.remove(other.value);
        }
      }
    }

    if (color) this.color(j, i);
    this.updateOptionsHTML(j, i);

    return cell.options;
  }

  updateOptionsHTML(j, i) {
    const index = this.index(i, j);
    const Opts = this.html.options[index];

    for (const Opt of Opts) {
      if (!this.data[index].options.includes(parseInt(Opt.innerHTML))) {
        Opt.classList.add("hide");
      }
    }
  }

  color(j, i) {
    this.html.cells[this.index(i, j)].classList.add("color");
  }

  uncolor(j, i) {
    this.html.cells[this.index(i, j)].classList.remove("color");
  }

  uncolorAll() {
    for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) this.uncolor(j, i);
  }

  solve() {
    if (!this.solved) {
      for (let t = 0; t < this.speed; t++) this.collapseLeastEntropy();
      requestAnimationFrame(() => this.solve());
    } else console.log("SOLVED!");
  }
}

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};
Array.prototype.remove = function (elem) {
  this.splice(this.indexOf(elem), 1);
};
Array.prototype.last = function () {
  return this[this.length - 1];
};
Array.prototype.copy = function () {
  let c = [];
  for (const elem of this) c.push(elem);
  return c;
};
Array.prototype.shuffle = function () {
  for (let i = this.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    let temp = this[i];
    this[i] = this[j];
    this[j] = temp;
  }
  return this;
};

document.addEventListener("keypress", (e) => {
  if (e.key == "x") board.collapseLeastEntropy();
  if (e.key == " ") board.solve();
  if (e.key == "w") board.speed++;
  if (e.key == "s") if (board.speed > 0) board.speed--;
  if (e.key == "q") {
    board.speed = 1000;
    board.solve();
  }

  if (!isNaN(parseInt(e.key))) board.randomFill(parseInt(e.key));
});

Init();
