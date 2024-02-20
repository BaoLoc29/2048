function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}import React, { useState, useEffect, Fragment } from 'https://cdn.skypack.dev/react@17.0.1';
import ReactDom from 'https://cdn.skypack.dev/react-dom@17.0.1';
import { useSwipeable } from "https://cdn.skypack.dev/react-swipeable@7.0.0";

// START Helpers
const invalidMove = (direction, grid, size) => {
  return (
    direction(deepCopy(grid), size).
    flat().
    filter(n => n.value === 0).length === 0);

};

const checkForGameOver = (grid, size) => {
  if (
  invalidMove(moveLeft, grid, size) &&
  invalidMove(moveRight, grid, size) &&
  invalidMove(moveUp, grid, size) &&
  invalidMove(moveDown, grid, size))
  {
    return true;
  }
  return false;
};

const createBgcVar = (gridSize, cellSize, gap) => {
  const cellW = cellSize + gap;
  const cellsNo = gridSize * gridSize;
  let cssVar = '';
  for (let i = 0; i < cellsNo; i++) {
    cssVar += `${cellW * (i % gridSize)}px ${
    cellW * Math.floor(i / gridSize)
    }px 0px #ccc0b3 ${i === cellsNo - 1 ? '' : ','}`;
  }
  return cssVar;
};

const createGrid = size => {
  const rows = [];
  for (let i = 0; i < size; i++) {
    rows.push([]);
    for (let j = 0; j < size; j++) {
      rows[i][j] = {
        index: i * size + j,
        lastIndex: i * size + j,
        value: 0,
        ghost: -1,
        pop: false,
        merged: false };

    }
  }
  return rows;
};

const deepCopy = obj => {
  if (typeof obj == 'object') {
    if (Array.isArray(obj)) {
      const r = new Array(obj.length);
      for (let i = 0; i < obj.length; i++) {
        r[i] = deepCopy(obj[i]);
      }
      return r;
    } else {
      const r = {};
      for (let k in obj) {
        r[k] = deepCopy(obj[k]);
      }
      return r;
    }
  }
  return obj;
};

const gridIsFilled = grid => {
  return grid.flat().filter(cell => cell.value === 0).length <= 0;
};

const gridUpdated = (oldGrid, newGrid) => {
  const oldFlat = oldGrid.flat();
  const newFlat = newGrid.flat();
  let gridChanged = false;

  for (let i = 0; i < oldFlat.length; i++) {
    if (oldFlat[i].value !== newFlat[i].value) {
      gridChanged = true;
      break;
    }
  }

  return gridChanged;
};

const mirror = arr => [...arr].reverse();

const moveLeft = (grid, size) => {
  const newGrid = [];
  grid.forEach((r, rIndex) => {
    newGrid.push(
    mirror(restoreZeros(removeZeroesAndAddNumbers(mirror(r)), size, rIndex)));

  });
  return newGrid;
};

const moveRight = (grid, size) => {
  const newGrid = [];
  grid.forEach((r, rIndex) => {
    newGrid.push(restoreZeros(removeZeroesAndAddNumbers(r), size, rIndex));
  });
  return newGrid;
};

const moveDown = (grid, size) => {
  return transpose(moveRight(transpose(grid), size));
};

const moveUp = (grid, size) => {
  return transpose(moveLeft(transpose(grid), size));
};

const pickRandomCell = (grid, numberOfCells) => {
  if (gridIsFilled(grid)) return;
  const pickRandom = () => {
    let randomCell = grid.flat()[Math.floor(Math.random() * numberOfCells)];
    if (randomCell.value === 0) {
      return randomCell;
    } else {
      return pickRandom();
    }
  };
  return pickRandom();
};

const populateCell = (grid, numberOfCells, size) => {
  const newGrid = [...grid];
  const randomCell = pickRandomCell(newGrid, numberOfCells);
  if (gridIsFilled(grid)) return newGrid;

  newGrid.filter((r, rKey) =>
  r.filter((c, cKey) => {
    if (c.index === randomCell.index) {
      c.index = rKey * size + cKey;
      c.lastIndex = rKey * size + cKey;
      c.value = twoOrFour();
      c.pop = true;
      c.ghost = -1;
    }
  }));

  return newGrid;
};

const populateInitialCells = (grid, size, numberOfCells) => {
  let newGrid;
  for (let i = 0; i < size - 1; i++) {
    newGrid = populateCell(grid, numberOfCells, size);
  }
  return newGrid;
};

const removeZeroesAndAddNumbers = arr => {
  const newArr = [...arr].filter(n => n.value !== 0);
  for (let index = newArr.length - 1; index >= 0; index--) {
    const prevIndex = index - 1;
    newArr[index].ghost = -1;
    newArr[index].merged = false;
    if (prevIndex >= 0 && newArr[index].value === newArr[prevIndex].value) {
      newArr[index].value = newArr[index].value * 2;
      newArr[prevIndex].value = 0;
      newArr[index].ghost = +arr.
      map(c => {
        if (c.index === newArr[prevIndex].index) {
          return c.index;
        }
      }).
      filter(n => n !== undefined).
      toString();
      newArr[index].merged = true;
    }
  }
  return [...newArr].filter(n => n.value !== 0);
};

const resetAnimation = () => {
  document.querySelectorAll('.cell').forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = null;

    const inner = el.querySelector('.cell__inner');
    inner.style.animation = 'none';
    inner.offsetHeight; // reflow
    inner.style.animation = null;
  });
};

const restoreIndexes = (arr, size) => {
  const newArr = [...arr];
  newArr.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      cell.lastIndex = cell.index;
      cell.index = rowIndex * size + cellIndex;
      cell.pop = false;
    });
  });
  return newArr;
};

const restoreZeros = (arr, size, row) => {
  const newArr = [];
  for (let i = 0; i < size - arr.length; i++) {
    newArr.push({ index: row * size + i, value: 0 });
  }
  return newArr.concat(arr);
};

const scoreIncrement = grid => {
  let scoreInc = 0;
  const gridCopy = deepCopy(grid).
  flat().
  filter(n => n.merged);
  gridCopy.forEach(cell => {
    scoreInc += cell.value;
  });
  return scoreInc;
};

const transpose = grid => {
  return grid[0].map((_, i) => grid.map(row => row[i]));
};

const twoOrFour = () => {
  return Math.floor(Math.random() * 2) === 0 ? 2 : 4;
};

const gridCombinations = [
['Tiny', 3, 0.58],
['Classic', 4, 0.44],
['Big', 5, 0.35],
['Bigger', 6, 0.29]
// ['Huge', 8, 0.293],
];

const colors = {
  0: '#ccc0b3',
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc850',
  2048: '#edc850' };


const gridPreview = (size, cellSize, gap, downgradeMultiplier = 0.3) => {
  return /*#__PURE__*/(
    React.createElement("div", {
      className: "grid",
      style: {
        '--gridDim': size,
        '--cellSize': `${cellSize * downgradeMultiplier}px`,
        '--gap': `${gap * downgradeMultiplier}px`,
        '--bgcPattern': createBgcVar(
        size,
        cellSize * downgradeMultiplier,
        gap * downgradeMultiplier) } }));




};

const maxWidth = (size, cellSize, gap, downgradeMultiplier = 0.3) => {
  return (size * (cellSize + gap) + gap) * downgradeMultiplier;
};
// END Helpers

ReactDom.render( /*#__PURE__*/React.createElement(App, null), document.getElementById("root"));

function App() {
  const [newGame, setNewGame] = useState(false);
  const cellSize = 70;
  const gap = 10;
  const [currentGrid, setCurrentGrid] = useState(1);

  const pickGrid = index => {
    if (
    currentGrid + index < 0 ||
    currentGrid + index > gridCombinations.length - 1)

    return;
    setCurrentGrid(prev => prev + index);
  };

  return /*#__PURE__*/(
    React.createElement(React.Fragment, null,
    !newGame && /*#__PURE__*/
    React.createElement("div", { className: "homescreen" }, /*#__PURE__*/
    React.createElement("h1", null, "2048"), /*#__PURE__*/
    React.createElement("div", {
      className: "selection-wrap",
      style: {
        '--current': currentGrid,
        '--width': maxWidth(
        gridCombinations[gridCombinations.length - 1][1],
        cellSize,
        gap),

        '--numberOfItems': gridCombinations.length } }, /*#__PURE__*/


    React.createElement("div", { className: "selection-wrap__inner" },
    gridCombinations.map((grid, key) => {
      return /*#__PURE__*/(
        React.createElement("div", { key: key, className: "selection" },
        gridPreview(grid[1], cellSize, gap, grid[2]), /*#__PURE__*/
        React.createElement("span", null,
        grid[0], "(", grid[1], "x", grid[1], ")")));



    }))), /*#__PURE__*/



    React.createElement("div", { className: "buttons-wrap" }, /*#__PURE__*/
    React.createElement("button", {
      className: `prev ${currentGrid === 0 ? 'disabled' : ''}`,
      onClick: () => pickGrid(-1) }, "<"), /*#__PURE__*/



    React.createElement("button", { onClick: () => setNewGame(true) }, "start game"), /*#__PURE__*/
    React.createElement("button", {
      className: `next ${
      currentGrid === gridCombinations.length - 1 ? 'disabled' : ''
      }`,
      onClick: () => pickGrid(1) }, ">"))),







    newGame && /*#__PURE__*/
    React.createElement(Grid, {
      size: gridCombinations[currentGrid][1],
      cellSize: cellSize * gridCombinations[currentGrid][2] * 2,
      gap: gap * gridCombinations[currentGrid][2] * 2,
      setNewGame: setNewGame })));




}

const Grid = props => {
  const [grid, setGrid] = useState();
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gridIsPopulated, setGridIsPopulated] = useState(false);
  const [shouldSpawnCell, setShouldSpawnCell] = useState(false);
  const numberOfCells = props.size * props.size;

  const handlers = useSwipeable({
    onSwiped: eventData => onDirectionChange(eventData.dir),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true });


  useEffect(() => {
    setGrid(() => createGrid(props.size));
    setGridIsPopulated(true);
  }, []);

  useEffect(() => {
    resetAnimation();
    if (grid) {
      setScore(prev => prev + scoreIncrement(grid) * 0.5);
      if (gridIsFilled(grid)) {
        setGameOver(checkForGameOver(grid, props.size));
      }
    }
  }, [grid]);

  useEffect(() => {
    if (!gridIsPopulated) return;
    setGrid(populateInitialCells(grid, props.size, numberOfCells));
    setGridIsPopulated(false);
  }, [gridIsPopulated]);

  useEffect(() => {
    if (shouldSpawnCell) {
      setGrid(populateCell(grid, numberOfCells, props.size));
      setShouldSpawnCell(false);
    }
  }, [shouldSpawnCell]);

  const changeDirection = direction => {
    const oldGrid = deepCopy(grid);
    const newGrid = restoreIndexes(
    direction(deepCopy(grid), props.size),
    props.size);

    setGrid(newGrid);
    if (gridUpdated(oldGrid, newGrid)) {
      setShouldSpawnCell(true);
    }
  };

  const onDirectionChange = direction => {
    switch (direction) {
      case 'Up':
        changeDirection(moveUp);
        break;
      case 'Down':
        changeDirection(moveDown);
        break;
      case 'Left':
        changeDirection(moveLeft);
        break;
      case 'Right':
        changeDirection(moveRight);
        break;
      default:}

  };

  useEffect(() => {
    const setVh = () => {
      document.body.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);

  return (
    grid != null && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", _extends({}, handlers, { className: "grid-wrap" }), /*#__PURE__*/
    React.createElement("h4", { className: "title" }, "2048"), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        props.setNewGame(false);
      },
      className: "restart-btn" }, "Back to menu"), /*#__PURE__*/



    React.createElement("h4", { className: "score" }, "Score: ", score), /*#__PURE__*/

    React.createElement("div", {
      className: "grid",
      style: {
        '--gridDim': props.size,
        '--cellSize': `${props.cellSize}px`,
        '--gap': `${props.gap}px`,
        '--bgcPattern': createBgcVar(
        props.size,
        props.cellSize,
        props.gap) } },



    [...grid].map((row, rowKey) => {
      return [...row].map((cell, cellKey) => {
        return (
          cell.value !== 0 && /*#__PURE__*/
          React.createElement(Fragment, { key: rowKey * props.size + cellKey }, /*#__PURE__*/
          React.createElement(Cell, {
            index: cell.index,
            lastIndex: cell.lastIndex,
            value: cell.value,
            gridSize: props.size,
            pop: cell.pop,
            ghost: false,
            merged: cell.merged }),


          cell.ghost !== -1 && /*#__PURE__*/
          React.createElement(Fragment, null, /*#__PURE__*/
          React.createElement(Cell, {
            index: cell.index,
            lastIndex: cell.ghost,
            value: cell.value * 0.5,
            gridSize: props.size,
            pop: cell.pop,
            ghost: true }), /*#__PURE__*/

          React.createElement(Cell, {
            index: cell.index,
            lastIndex: cell.lastIndex,
            value: cell.value * 0.5,
            gridSize: props.size,
            pop: cell.pop,
            ghost: true }))));






      });
    }))),



    gameOver && /*#__PURE__*/
    React.createElement("div", { className: "gameOver" }, /*#__PURE__*/
    React.createElement("h2", null, "Game Over"), /*#__PURE__*/
    React.createElement("h4", null, "Final score: ", score), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        props.setNewGame(false);
      } }, "New Game"))));








};

const Cell = props => {
  return /*#__PURE__*/(
    React.createElement("div", {
      className: `cell ${props.pop ? 'pop' : ''} ${
      props.ghost ? 'ghost' : ''
      } ${props.merged ? 'merged' : ''}`,
      style: {
        '--backgroudColor':
        props.value <= 2048 ? colors[props.value] : '#1a1608',
        '--color': props.value <= 4 ? 'black' : 'white',
        '--lastXpos': props.lastIndex % props.gridSize,
        '--lastYpos': Math.floor(props.lastIndex / props.gridSize),
        '--xpos': props.index % props.gridSize,
        '--ypos': Math.floor(props.index / props.gridSize) } }, /*#__PURE__*/


    React.createElement("div", { className: "cell__inner" },
    props.value)));



};