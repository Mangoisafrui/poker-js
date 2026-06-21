(function () {
  // ---------------------------
  // STATE (kept inside IIFE)
  // ---------------------------
  var deckId = null;
  var hand = [];      // current 5-card hand
  var remaining = null;

  // ---------------------------
  // DOM ELEMENTS
  // ---------------------------
  var statusEl = document.getElementById("status");
  var deckIdEl = document.getElementById("deckId");
  var remainingEl = document.getElementById("remaining");
  var cardsEl = document.getElementById("cards");
  var resultEl = document.getElementById("result");
  var debugEl = document.getElementById("debug");

  var newDeckBtn = document.getElementById("newDeckBtn");
  var drawBtn = document.getElementById("drawBtn");
  var drawAgainBtn = document.getElementById("drawAgainBtn");
  var sortValueBtn = document.getElementById("sortValueBtn");
  var sortSuitBtn = document.getElementById("sortSuitBtn");
  var evalBtn = document.getElementById("evalBtn");

  var themeToggle = document.getElementById("themeToggle");

  // ---------------------------
  // UI HELPERS
  // ---------------------------
  function setStatus(text) {
    statusEl.textContent = "Status: " + text;
  }

  function clearUI() {
    cardsEl.innerHTML = "";
    resultEl.textContent = "None";
    debugEl.textContent = "";
  }

  function setRemaining(n) {
    remaining = n;
    remainingEl.textContent = (n === null || n === undefined) ? "?" : String(n);

    // Feature 8: disable draw buttons if not enough cards left
    var canDraw5 = deckId && typeof n === "number" && n >= 5;
    drawBtn.disabled = !canDraw5;
    drawAgainBtn.disabled = !canDraw5;

    if (deckId && typeof n === "number" && n < 5) {
      setStatus("Not enough cards remaining to draw 5. Reset deck.");
    }
  }

  // Feature 1: simple fade out/in around redraw
  function fadeOutCards() {
    cardsEl.classList.remove("fadeIn");
    cardsEl.classList.add("fadeOut");
  }
  function fadeInCards() {
    cardsEl.classList.remove("fadeOut");
    cardsEl.classList.add("fadeIn");
  }

  function showHandImages(cards) {
    cardsEl.innerHTML = "";

    for (var i = 0; i < cards.length; i++) {
      var img = document.createElement("img");
      img.className = "cardImg";
      img.src = cards[i].image;
      img.alt = cards[i].value + " of " + cards[i].suit;
      cardsEl.appendChild(img);
    }
  }

  function showDebug(cards) {
    var lines = [];
    for (var i = 0; i < cards.length; i++) {
      lines.push(cards[i].code + " = " + cards[i].value + " of " + cards[i].suit);
    }
    debugEl.textContent = "Hand:\n" + lines.join("\n");
  }

  // ---------------------------
  // VALUE / SORT HELPERS (Feature 2)
  // ---------------------------
  function valueToNumber(v) {
    if (v === "ACE") return 14;
    if (v === "KING") return 13;
    if (v === "QUEEN") return 12;
    if (v === "JACK") return 11;
    return parseInt(v, 10);
  }

  function suitToNumber(suit) {
    // simple suit ordering: CLUBS, DIAMONDS, HEARTS, SPADES
    if (suit === "CLUBS") return 1;
    if (suit === "DIAMONDS") return 2;
    if (suit === "HEARTS") return 3;
    if (suit === "SPADES") return 4;
    return 99;
  }

  function copyArray(arr) {
    var out = [];
    for (var i = 0; i < arr.length; i++) out.push(arr[i]);
    return out;
  }

  function sortHandByValue() {
    if (!hand || hand.length !== 5) {
      setStatus("Draw a hand first.");
      return;
    }

    var sorted = copyArray(hand);

    // basic bubble sort for beginners
    for (var i = 0; i < sorted.length; i++) {
      for (var j = 0; j < sorted.length - 1; j++) {
        if (valueToNumber(sorted[j].value) > valueToNumber(sorted[j + 1].value)) {
          var temp = sorted[j];
          sorted[j] = sorted[j + 1];
          sorted[j + 1] = temp;
        }
      }
    }

    showHandImages(sorted);
    showDebug(sorted);
    setStatus("Sorted by value.");
  }

  function sortHandBySuit() {
    if (!hand || hand.length !== 5) {
      setStatus("Draw a hand first.");
      return;
    }

    var sorted = copyArray(hand);

    // bubble sort by suit, then by value
    for (var i = 0; i < sorted.length; i++) {
      for (var j = 0; j < sorted.length - 1; j++) {
        var aSuit = suitToNumber(sorted[j].suit);
        var bSuit = suitToNumber(sorted[j + 1].suit);

        var swap = false;
        if (aSuit > bSuit) swap = true;
        if (aSuit === bSuit) {
          if (valueToNumber(sorted[j].value) > valueToNumber(sorted[j + 1].value)) swap = true;
        }

        if (swap) {
          var temp = sorted[j];
          sorted[j] = sorted[j + 1];
          sorted[j + 1] = temp;
        }
      }
    }

    showHandImages(sorted);
    showDebug(sorted);
    setStatus("Sorted by suit.");
  }

  // ---------------------------
  // POKER HAND EVALUATION (same as before, kept basic)
  // ---------------------------
  function sortNumbersAsc(arr) {
    for (var i = 0; i < arr.length; i++) {
      for (var j = 0; j < arr.length - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          var temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
        }
      }
    }
    return arr;
  }

  function evaluatePokerHand(cards) {
    var ranks = [];
    var suits = [];

    for (var i = 0; i < cards.length; i++) {
      ranks.push(valueToNumber(cards[i].value));
      suits.push(cards[i].suit);
    }
    sortNumbersAsc(ranks);

    var isFlush = true;
    for (var s = 1; s < suits.length; s++) {
      if (suits[s] !== suits[0]) { isFlush = false; break; }
    }

    var counts = {};
    for (var r = 0; r < ranks.length; r++) {
      var key = String(ranks[r]);
      if (counts[key] === undefined) counts[key] = 0;
      counts[key] = counts[key] + 1;
    }

    var countValues = [];
    for (var k in counts) countValues.push(counts[k]);
    sortNumbersAsc(countValues);

    var isStraight = false;
    var consecutive = true;
    for (var x = 0; x < ranks.length - 1; x++) {
      if (ranks[x + 1] !== ranks[x] + 1) { consecutive = false; break; }
    }
    if (consecutive) isStraight = true;

    // A-low straight: 2,3,4,5,14
    if (!isStraight) {
      if (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
        isStraight = true;
      }
    }

    if (isStraight && isFlush) {
      if (ranks[0] === 10 && ranks[1] === 11 && ranks[2] === 12 && ranks[3] === 13 && ranks[4] === 14) {
        return "Royal Flush";
      }
      return "Straight Flush";
    }

    if (countValues.length === 2 && countValues[1] === 4) return "Four of a Kind";
    if (countValues.length === 2 && countValues[0] === 2 && countValues[1] === 3) return "Full House";
    if (isFlush) return "Flush";
    if (isStraight) return "Straight";
    if (countValues.length === 3 && countValues[2] === 3) return "Three of a Kind";
    if (countValues.length === 3 && countValues[0] === 1 && countValues[1] === 2 && countValues[2] === 2) return "Two Pair";
    if (countValues.length === 4 && countValues[3] === 2) return "One Pair";
    return "High Card";
  }

  function evaluateCurrentHand() {
    if (!hand || hand.length !== 5) {
      setStatus("No 5-card hand to evaluate. Draw first.");
      return;
    }
    var best = evaluatePokerHand(hand);
    resultEl.textContent = best;
    setStatus("Evaluation complete.");
  }

  // ---------------------------
  // Q1: GET / PERSIST DECK
  // ---------------------------
  function getNewDeck() {
    setStatus("Requesting a new shuffled deck...");
    clearUI();
    hand = [];

    fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        deckId = data.deck_id;
        localStorage.setItem("deck_id", deckId);

        deckIdEl.textContent = deckId;
        setRemaining(data.remaining);

        setStatus("Deck ready! Draw 5 cards.");
      })
      .catch(function (err) {
        setStatus("Error getting deck (check console).");
        console.log(err);
      });
  }

  function loadSavedDeck() {
    var saved = localStorage.getItem("deck_id");
    if (saved) {
      deckId = saved;
      deckIdEl.textContent = deckId;
      // remaining unknown until we draw; enable draw and let API tell us remaining
      setRemaining(null);
      drawBtn.disabled = false;
      drawAgainBtn.disabled = true; // until a hand exists
      setStatus("Saved deck loaded. You can draw cards.");
    } else {
      drawBtn.disabled = true;
      drawAgainBtn.disabled = true;
    }
  }

  // ---------------------------
  // Q2+Q3: DRAW FIVE + DISPLAY
  // (Feature 1: fade out then fade in)
  // ---------------------------
  function drawFiveCards() {
    if (!deckId) {
      setStatus("No deck yet. Click 'Get / Reset Deck' first.");
      return;
    }

    setStatus("Drawing 5 cards...");
    resultEl.textContent = "None";
    hand = [];

    fadeOutCards();

    // small delay so fade-out is visible
    setTimeout(function () {
      cardsEl.innerHTML = "";

      var url = "https://deckofcardsapi.com/api/deck/" + deckId + "/draw/?count=5";

      fetch(url)
        .then(function (response) { return response.json(); })
        .then(function (data) {
          setRemaining(data.remaining);
          hand = data.cards;

          showHandImages(hand);
          showDebug(hand);

          fadeInCards();
          drawAgainBtn.disabled = false;

          setStatus("5 cards drawn. You can sort or evaluate.");
        })
        .catch(function (err) {
          fadeInCards();
          setStatus("Error drawing cards (check console).");
          console.log(err);
        });
    }, 220);
  }

  // Feature 1: "Draw Again" just draws a new hand and clears old output
  function drawAgain() {
    if (drawAgainBtn.disabled) return;
    clearUI();
    drawFiveCards();
  }

  // ---------------------------
  // Feature 7: Theme switcher
  // ---------------------------
  function applyTheme(isDark) {
    if (isDark) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
    themeToggle.checked = !!isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  function loadTheme() {
    var savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") applyTheme(true);
    else applyTheme(false);
  }

  // ---------------------------
  // EVENTS
  // ---------------------------
  newDeckBtn.addEventListener("click", getNewDeck);
  drawBtn.addEventListener("click", drawFiveCards);
  drawAgainBtn.addEventListener("click", drawAgain);
  sortValueBtn.addEventListener("click", sortHandByValue);
  sortSuitBtn.addEventListener("click", sortHandBySuit);
  evalBtn.addEventListener("click", evaluateCurrentHand);

  themeToggle.addEventListener("change", function () {
    applyTheme(themeToggle.checked);
  });

  // Initial load
  loadTheme();
  loadSavedDeck();

  // Helpful demonstration for Q5 (IIFE):
  // In console: window.deckId should be undefined because deckId is inside IIFE.
})();

