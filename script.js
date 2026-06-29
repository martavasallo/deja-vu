// ── State ──
let selectedDifficulty = "easy";
let roundWords = [];
let repeatWord = "";
let currentIndex = 0;
let gameInterval = null;

const difficultyTime = {
  easy: 3000,
  medium: 2000,
  hard: 2000,
};

// ── Screen switching ──
// Hide all screens and show the specified one
function showScreen(screenId) {
  document.querySelectorAll('[id^="screen-"]').forEach((screen) => {
    screen.classList.add("hidden");
  });
  document.getElementById("screen-" + screenId).classList.remove("hidden");
}

// ── Difficulty selection ──
// Set up event listeners for difficulty buttons
document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    selectedDifficulty = btn.dataset.difficulty;
  });
});

// ── Play button ──
// When the play button is clicked, show the countdown screen and start the countdown
document.getElementById("play-btn").addEventListener("click", () => {
  showScreen("countdown");
  startCountdown();
});

// ── Countdown ──
// Start a countdown from 3 to 1, then start the game
function startCountdown() {
  let count = 3;
  document.getElementById("countdown-number").textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(interval);
      showScreen("game");
      startGame();
    } else {
      document.getElementById("countdown-number").textContent = count;
    }
  }, 1000);
}

// ── Load words ──
// Load the word list from words.json and store it in a variable
let wordData = {};

fetch("words.json")
  .then((response) => response.json())
  .then((data) => {
    wordData = data;
    console.log("Words loaded:", wordData);
  });

/*
Grab the word list for the selected difficulty and make a copy of it.
Shuffle it so the words are in a random order every time.
Decide how many words this round will have — a random number between 5 and 20.
Take that many words from the shuffled list. These are the words for this round.
Pick one of the first 4 words as the repeat word — we pick from the first 4 to guarantee the player has already seen it before it appears again.
Pick a random position after position 4 to insert the repeat word.
Insert the repeat word at that position.
Start showing words one by one from the beginning.
*/

// ── Game logic ──

// Start the game by selecting a random word from the word list based on the selected difficulty
function startGame() {
  // console.log("Game started on", selectedDifficulty);

  // wordData[selectedDifficulty] is the same as wordData["easy"].
  // The spread operator creates a shallow copy of the array, so we can modify it without affecting the original wordData.
  const pool = [...wordData[selectedDifficulty]];

  pool.sort(() => Math.random() - 0.5); // Shuffle the pool

  // Pick between 6 and 20 total words including the repeat
  const roundLength = Math.floor(Math.random() * 15) + 5;
  const baseWords = pool.slice(0, roundLength);

  // Pick the repeat word from the first 4 words and insert it after position 4
  repeatWord = baseWords[Math.floor(Math.random() * 4)];
  const repeatPosition = Math.floor(Math.random() * (roundLength - 4)) + 4;
  roundWords = [...baseWords];
  roundWords.splice(repeatPosition, 0, repeatWord);

  currentIndex = 0;
  console.log("Round words:", roundWords);
  console.log("Repeat word:", repeatWord);
  showNextWord();
}

function showNextWord() {
  // If we've run out of words, the player missed the repeat
  if (currentIndex >= roundWords.length) {
    endRound("missed");
    return;
  }

  const word = roundWords[currentIndex];
  document.getElementById("word-display").textContent = word;

  const time = difficultyTime[selectedDifficulty];
  clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    currentIndex++;
    showNextWord();
  }, time);
}

// ── Spacebar detection ──
document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;
  if (document.getElementById("screen-game").classList.contains("hidden")) return;

  const word = roundWords[currentIndex];

  if (word === repeatWord) {
    endRound("win");
  } else {
    endRound("wrong");
  }
});


function endRound(outcome) {
  clearInterval(gameInterval);
  showScreen("results");

  // Show the outcome
  const outcomeEl = document.getElementById("result-outcome");
  if (outcome === "win") {
    outcomeEl.textContent = "You got it!";
  } else if (outcome === "wrong") {
    outcomeEl.textContent = "Wrong press.";
  } else {
    outcomeEl.textContent = "You missed it.";
  }

  // Build the word list
  const wordList = document.getElementById("word-list");
  wordList.innerHTML = "";

  roundWords.forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    if (word === repeatWord) {
      li.classList.add("repeat");
    }
    wordList.appendChild(li);
  });
}

// ── Play again ──
document.getElementById("play-again-btn").addEventListener("click", () => {
  showScreen("home");
});
