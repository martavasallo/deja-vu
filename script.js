// ── State ──
// These variables store the current state of the game and are accessible by all functions
let selectedDifficulty = "easy"; // Tracks which difficulty the player has selected
let roundWords = []; // The full list of words for the current round, including the repeat at the end
let repeatWord = ""; // The word that appears twice — first somewhere in the list, then always last
let currentIndex = 0; // Tracks which word we are currently showing
let gameInterval = null; // Holds the timer so we can stop it at any point

// How long each word is shown on screen, in milliseconds
const difficultyTime = {
  easy: 2500,
  medium: 1500,
  hard: 2000,
};

// ── Screen switching ──
// Hides all screens and shows only the one we want
// screenId is a string like "home", "countdown", "game", or "results"
function showScreen(screenId) {
  // Add "hidden" to every screen
  document.querySelectorAll('[id^="screen-"]').forEach((screen) => {
    screen.classList.add("hidden");
  });
  // Then remove "hidden" from just the screen we want to show
  document.getElementById("screen-" + screenId).classList.remove("hidden");
}

// ── Difficulty selection ──
// Loops through all difficulty buttons and attaches a click listener to each one
document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // First clear the active state from all buttons
    document.querySelectorAll(".difficulty-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false"); // Accessibility — tells screen readers this button is not selected
    });
    // Then mark the clicked button as active
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true"); // Accessibility — tells screen readers this button is now selected
    // Update selectedDifficulty with the value from the button's data-difficulty attribute
    selectedDifficulty = btn.dataset.difficulty;
  });
});

// ── Play button ──
// When the player clicks Play, switch to the countdown screen and start the countdown
document.getElementById("play-btn").addEventListener("click", () => {
  showScreen("countdown");
  startCountdown();
});

// ── Countdown ──
// Shows 3, 2, 1 on screen with one second between each number, then starts the game
function startCountdown() {
  let count = 3;
  document.getElementById("countdown-number").textContent = count; // Show 3 immediately

  // setInterval runs the function inside every 1000ms (1 second)
  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      // Stop the timer and start the game
      clearInterval(interval);
      showScreen("game");
      startGame();
    } else {
      // Update the number on screen
      document.getElementById("countdown-number").textContent = count;
    }
  }, 1000);
}

// ── Load words ──
// Fetches words.json once when the page loads and stores everything in wordData
// By the time the player clicks Play, wordData is already full and ready to use
let wordData = {};

fetch("words.json")
  .then((response) => response.json()) // Convert the response to a JavaScript object
  .then((data) => {
    wordData = data; // Store the entire JSON file in wordData
    console.log("Words loaded:", wordData);
  });

// ── Game logic ──

// Sets up a new round — picks words, sets the repeat as the last word, and starts showing them
function startGame() {
  // wordData[selectedDifficulty] looks up the correct array in wordData
  // The spread operator [...] makes a copy so we don't modify the original array
  const pool = [...wordData[selectedDifficulty]];

  // Shuffle the pool so the words are in a different order every round
  pool.sort(() => Math.random() - 0.5);

  // Pick a random round length between 5 and 19 base words
  // The repeat will be added at the end, making the total between 6 and 20
  const roundLength = Math.floor(Math.random() * 15) + 5;
  const baseWords = pool.slice(0, roundLength);

  // Pick the repeat word from the first 4 words
  // This guarantees the player has already seen it before it appears again at the end
  repeatWord = baseWords[Math.floor(Math.random() * 4)];

  // Build the full round — base words followed by the repeat at the end
  roundWords = [...baseWords, repeatWord];

  currentIndex = 0;
  console.log("Round words:", roundWords);
  console.log("Repeat word:", repeatWord);
  showNextWord();
}

// Shows the word at currentIndex on screen and sets a timer to move to the next one
function showNextWord() {
  const word = roundWords[currentIndex];
  document.getElementById("word-display").textContent = word;

  // Clear any existing timer to avoid two timers running at once
  // Then start a new timer
  const time = difficultyTime[selectedDifficulty];
  clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    // If the timer runs out on the last word (the repeat), the player missed it
    if (currentIndex === roundWords.length - 1) {
      endRound("missed");
    } else {
      // Otherwise move to the next word
      currentIndex++;
      showNextWord();
    }
  }, time);
}

// ── Spacebar detection ──
// Listens for any keydown event on the page
document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return; // Ignore anything that isn't the spacebar
  if (document.getElementById("screen-game").classList.contains("hidden")) return; // Ignore if we're not on the game screen

  const word = roundWords[currentIndex]; // The word currently on screen

  if (word === repeatWord) {
    endRound("win"); // Player pressed spacebar on the repeat word — correct
  } else {
    endRound("wrong"); // Player pressed spacebar on a word that wasn't the repeat
  }
});

// Stops the game, shows the results screen, and builds the word list
function endRound(outcome) {
  clearInterval(gameInterval); // Stop the word timer
  showScreen("results");

  // Show the outcome message
  const outcomeEl = document.getElementById("result-outcome");
  if (outcome === "win") {
    outcomeEl.textContent = "You got it";
  } else if (outcome === "wrong") {
    outcomeEl.textContent = "Wrong press";
  } else {
    outcomeEl.textContent = "You missed it";
  }

  // Find the positions of the repeat word (1-based so it matches what the player sees)
  const firstPos = roundWords.indexOf(repeatWord) + 1;
  const lastPos = roundWords.lastIndexOf(repeatWord) + 1;

  // Fill in the subtitle — tells the player where the repeat appeared
  document.getElementById("result-subtitle").textContent =
    repeatWord + " — word " + firstPos + ", repeated at word " + lastPos;

// If wrong press, only show words up to and including where the player pressed
  // If win or missed, show the full list
  const wordsToShow = outcome === "wrong"
    ? roundWords.slice(0, currentIndex + 1)
    : roundWords;

  // Build the word list with numbers
  const wordList = document.getElementById("word-list");
  wordList.innerHTML = "";

  wordsToShow.forEach((word, index) => {
    const li = document.createElement("li");
    li.innerHTML = '<span class="word-number">' + (index + 1) + "</span>" + word;
    if (word === repeatWord) {
      li.classList.add("repeat");
    }
    if (outcome === "wrong" && index === currentIndex) {
      li.classList.add("wrong-press"); // Mark the word the player incorrectly pressed on
    }
    wordList.appendChild(li);
  });
}

// ── Play again ──
// When the player clicks Play Again, go back to the home screen
document.getElementById("play-again-btn").addEventListener("click", () => {
  showScreen("home");
});
