// script.js - Sorting Visualizer: Bubble, Selection, Insertion, Merge, Quick
// Clear comments and structure for easy reading

// --- DOM references ---
const container = document.getElementById('bars-container');
const generateBtn = document.getElementById('generate');
const sortBtn     = document.getElementById('sort');
const stopBtn     = document.getElementById('stop');
const algoSelect  = document.getElementById('algorithm');
const sizeSlider  = document.getElementById('size');
const speedSlider = document.getElementById('speed');
const sizeVal     = document.getElementById('sizeVal');
const delayVal    = document.getElementById('delayVal');
const timeEl      = document.getElementById('time');
const compsEl     = document.getElementById('comparisons');
const swapsEl     = document.getElementById('swaps');

// --- State variables ---
let array = [];
let isSorting = false;
let stopRequested = false;
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let currentDelay = Number(speedSlider.value);

// show current control values
sizeVal.textContent = sizeSlider.value;
delayVal.textContent = speedSlider.value;

// --- Utility helpers ---
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setDelayFromSpeed(speed) {
  // Map speed slider (1..200) to delay ms (fast to slow)
  // larger speed -> smaller delay; tweak to taste
  const maxSpeed = 200;
  const minDelay = 2;
  const maxDelay = 200;
  const delay = Math.round(maxDelay - (speed / maxSpeed) * (maxDelay - minDelay));
  return Math.max(minDelay, delay);
}

function resetStats() {
  comparisons = 0;
  swaps = 0;
  compsEl.textContent = comparisons;
  swapsEl.textContent = swaps;
  timeEl.textContent = "0 ms";
}

function updateStats() {
  compsEl.textContent = comparisons;
  swapsEl.textContent = swaps;
  const elapsed = Math.max(0, Math.round(performance.now() - startTime));
  timeEl.textContent = `${elapsed} ms`;
}

function disableControls(flag) {
  // disable/enable appropriate controls while sorting
  generateBtn.disabled = flag;
  algoSelect.disabled = flag;
  sizeSlider.disabled = flag;
  speedSlider.disabled = flag;
  sortBtn.disabled = flag;
  stopBtn.disabled = !flag; // stop only when sorting
}

// --- Bar rendering ---
function createBarsFromArray(arr) {
  container.innerHTML = '';
  const n = arr.length;
  const barWidth = Math.max(3, Math.floor((container.clientWidth - 20) / n) - 2);

  for (let i = 0; i < n; i++) {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.height = `${arr[i]}px`;
    bar.style.width = `${barWidth}px`;
    bar.dataset.index = i;
    container.appendChild(bar);
  }
}

// generate a new random array
function generateArray(size = 40) {
  const arr = [];
  for (let i = 0; i < size; i++) {
    // heights from 20 to 380 (fits container height)
    arr.push(Math.floor(Math.random() * 360) + 20);
  }
  array = arr;
  createBarsFromArray(array);
  resetStats();
}

// swap heights in DOM bars and array
function swapHeights(i, j) {
  const bars = container.children;
  const h1 = bars[i].style.height;
  bars[i].style.height = bars[j].style.height;
  bars[j].style.height = h1;

  // swap in array to keep consistent
  const tmp = array[i];
  array[i] = array[j];
  array[j] = tmp;
}

// color helpers
function colorCompare(i, j) {
  const bars = container.children;
  bars[i].classList.add('compare');
  bars[j].classList.add('compare');
}
function colorSwap(i, j) {
  const bars = container.children;
  bars[i].classList.add('swap');
  bars[j].classList.add('swap');
}
function resetColor(i, j) {
  const bars = container.children;
  if (bars[i]) bars[i].classList.remove('compare', 'swap');
  if (bars[j]) bars[j].classList.remove('compare', 'swap');
}
function markSorted(index) {
  const bars = container.children;
  if (bars[index]) {
    bars[index].classList.add('sorted');
  }
}

// --- Sorting algorithms (with animations) ---
// All sorting functions are async and honor stopRequested flag

async function bubbleSort() {
  const n = array.length;
  const bars = container.children;

  for (let i = 0; i < n && !stopRequested; i++) {
    for (let j = 0; j < n - i - 1 && !stopRequested; j++) {
      colorCompare(j, j + 1);
      comparisons++; updateStats();
      await sleep(currentDelay);

      const h1 = parseInt(bars[j].style.height);
      const h2 = parseInt(bars[j + 1].style.height);

      if (h1 > h2) {
        colorSwap(j, j + 1);
        swaps++; updateStats();
        await sleep(currentDelay);
        swapHeights(j, j + 1);
        await sleep(currentDelay);
      }
      resetColor(j, j + 1);
    }
    // mark last settled element
    markSorted(n - 1 - i);
  }
  // mark remaining as sorted if not stopped
  if (!stopRequested) {
    for (let k = 0; k < n; k++) markSorted(k);
  }
}

async function selectionSort() {
  const n = array.length;
  const bars = container.children;

  for (let i = 0; i < n - 1 && !stopRequested; i++) {
    let minIdx = i;
    bars[minIdx].classList.add('compare');
    for (let j = i + 1; j < n && !stopRequested; j++) {
      colorCompare(minIdx, j);
      comparisons++; updateStats();
      await sleep(currentDelay);

      const hMin = parseInt(bars[minIdx].style.height);
      const hCur = parseInt(bars[j].style.height);
      if (hCur < hMin) {
        bars[minIdx].classList.remove('compare');
        minIdx = j;
        bars[minIdx].classList.add('compare');
      }
      resetColor(minIdx, j);
    }
    // swap i and minIdx
    if (minIdx !== i) {
      swaps++; updateStats();
      colorSwap(i, minIdx);
      await sleep(currentDelay);
      swapHeights(i, minIdx);
      await sleep(currentDelay);
      resetColor(i, minIdx);
    }
    // mark sorted
    markSorted(i);
  }
  if (!stopRequested) {
    markSorted(n - 1);
  }
}

async function insertionSort() {
  const n = array.length;
  const bars = container.children;

  for (let i = 1; i < n && !stopRequested; i++) {
    let j = i;
    while (j > 0 && !stopRequested) {
      colorCompare(j - 1, j);
      comparisons++; updateStats();
      await sleep(currentDelay);

      const hPrev = parseInt(bars[j - 1].style.height);
      const hCur = parseInt(bars[j].style.height);
      if (hPrev > hCur) {
        // swap visually
        colorSwap(j - 1, j);
        swaps++; updateStats();
        await sleep(currentDelay);
        swapHeights(j - 1, j);
        await sleep(currentDelay);
        resetColor(j - 1, j);
        j--;
      } else {
        resetColor(j - 1, j);
        break;
      }
    }
  }
  if (!stopRequested) {
    for (let k = 0; k < n; k++) markSorted(k);
  }
}

// Merge sort requires recursive async calls
async function mergeSortWrapper() {
  await mergeSort(0, array.length - 1);
  if (!stopRequested) for (let k = 0; k < array.length; k++) markSorted(k);
}

async function mergeSort(l, r) {
  if (l >= r || stopRequested) return;
  const mid = Math.floor((l + r) / 2);
  await mergeSort(l, mid);
  await mergeSort(mid + 1, r);
  await merge(l, mid, r);
}

async function merge(l, mid, r) {
  const bars = container.children;
  const n1 = mid - l + 1;
  const n2 = r - mid;
  const left = [];
  const right = [];
  for (let i = 0; i < n1; i++) left.push(parseInt(bars[l + i].style.height));
  for (let j = 0; j < n2; j++) right.push(parseInt(bars[mid + 1 + j].style.height));

  let i = 0, j = 0, k = l;
  while (i < n1 && j < n2 && !stopRequested) {
    colorCompare(k, (mid+1)+j);
    comparisons++; updateStats();
    await sleep(currentDelay);
    if (left[i] <= right[j]) {
      // set height at k to left[i]
      bars[k].style.height = `${left[i]}px`;
      i++; k++;
      swaps++; updateStats();
      await sleep(currentDelay);
    } else {
      bars[k].style.height = `${right[j]}px`;
      j++; k++;
      swaps++; updateStats();
      await sleep(currentDelay);
    }
    resetColor(k-1, (mid+1)+j-1);
  }
  while (i < n1 && !stopRequested) {
    bars[k].style.height = `${left[i]}px`;
    i++; k++;
    swaps++; updateStats();
    await sleep(currentDelay);
  }
  while (j < n2 && !stopRequested) {
    bars[k].style.height = `${right[j]}px`;
    j++; k++;
    swaps++; updateStats();
    await sleep(currentDelay);
  }
}

// Quick sort wrapper
async function quickSortWrapper() {
  await quickSort(0, array.length - 1);
  if (!stopRequested) for (let k = 0; k < array.length; k++) markSorted(k);
}

async function quickSort(low, high) {
  if (low < high && !stopRequested) {
    const pi = await partition(low, high);
    await quickSort(low, pi - 1);
    await quickSort(pi + 1, high);
  }
}

async function partition(low, high) {
  const bars = container.children;
  const pivotHeight = parseInt(bars[high].style.height);
  bars[high].classList.add('compare'); // pivot
  let i = low;

  for (let j = low; j < high && !stopRequested; j++) {
    colorCompare(j, high);
    comparisons++; updateStats();
    await sleep(currentDelay);
    const hj = parseInt(bars[j].style.height);
    if (hj < pivotHeight) {
      colorSwap(i, j);
      swaps++; updateStats();
      await sleep(currentDelay);
      swapHeights(i, j);
      await sleep(currentDelay);
      resetColor(i, j);
      i++;
    }
    resetColor(j, high);
  }
  // finally swap pivot to i
  colorSwap(i, high);
  swaps++; updateStats();
  await sleep(currentDelay);
  swapHeights(i, high);
  await sleep(currentDelay);
  resetColor(i, high);
  bars[high].classList.remove('compare');
  return i;
}

// --- Orchestrator for choosing algorithm ---
async function startSort() {
  if (isSorting) return;
  isSorting = true;
  stopRequested = false;
  disableControls(true);
  resetStats();
  startTime = performance.now();

  // determine algorithm delay
  currentDelay = setDelayFromSpeed(Number(speedSlider.value));
  delayVal.textContent = currentDelay;

  const algo = algoSelect.value;
  try {
    if (algo === 'bubble') {
      await bubbleSort();
    } else if (algo === 'selection') {
      await selectionSort();
    } else if (algo === 'insertion') {
      await insertionSort();
    } else if (algo === 'merge') {
      await mergeSortWrapper();
    } else if (algo === 'quick') {
      await quickSortWrapper();
    }
  } catch (err) {
    console.error('Sort error', err);
  }

  // final stats update & reset
  isSorting = false;
  disableControls(false);
  updateStats();
}

// stop gracefully
function requestStop() {
  stopRequested = true;
}

// --- Event listeners ---
generateBtn.addEventListener('click', () => {
  generateArray(Number(sizeSlider.value));
});

sortBtn.addEventListener('click', async () => {
  if (isSorting) return;
  resetStats();
  startSort();
});

stopBtn.addEventListener('click', () => {
  if (!isSorting) return;
  requestStop();
});

sizeSlider.addEventListener('input', (e) => {
  sizeVal.textContent = e.target.value;
  // instant preview generate small array
  generateArray(Number(e.target.value));
});

speedSlider.addEventListener('input', (e) => {
  // show mapped delay
  const delay = setDelayFromSpeed(Number(e.target.value));
  delayVal.textContent = delay;
});

// keep stats updating while sorting (interval)
setInterval(() => {
  if (isSorting) updateStats();
}, 100);

// --- initial generate ---
generateArray(Number(sizeSlider.value));
