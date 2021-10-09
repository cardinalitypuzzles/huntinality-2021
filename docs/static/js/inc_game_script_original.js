let ui;

window.onload = function () {
  if (localStorage2.getItem('round-3-save')) {
    try {
      game = JSON2.parse(atob2(transformString(localStorage2.getItem('round-3-save'))));
      // This handles changing of save properties, e.g.
      // if we create a new option or something we can add code
      // to applySaveChanges so that old saves get that option.
      applySaveChanges();
    } catch (e) {
      // Clear old saves
      if (!(e instanceof SyntaxError || e instanceof DOMException)) {
        throw e;
      }
      localStorage2.removeItem('round-3-save');
      game = getInitialGame();
    }
  } else {
    game = getInitialGame();
  }
  simulateTime();
  ui = new Vue({
    el: '#ui',
    template: `<div>
    <audio id="background-audio" loop muted="muted">
      <source src="/static/puzzle_resources/wah_street_bets/audio/smash.mp3" type="audio/mp3">
    </audio>
    <div id="notification-area"></div>
    <div style="min-height: 60px;"></div>
    <production-summary/>
    <div style="min-height: 30px;"></div>
    <tab-list/>
    <div style="min-height: 30px;"></div>
    <tab/>
    </div>`
  });
  updateDisplay();
  setInterval(gameTick, 50);
  setInterval(() => saveLocal(true), 10000);
  setTab(game.tab);
  if (!game.muteMusic) {
    // Some browsers (e.g. Firefox) will prevent music from playing until
    // user has interacted with the browser. Keep retrying every 3s until
    // user has interacted with the browser.
    let playAttempt = setInterval(() => {
      playMusic()
        .then(() => {
          clearInterval(playAttempt);
        })
    }, 3000);
  }
};

// The following code helps with obfuscation (it stops the variable names from showing up in the obfuscated version).
// If we used the literal variable names without a redefinition (e.g., just using JSON rather than JSON2), those names
// would show up literally in the obfuscated code and it would be relatively easy to make headway by searching for them.
let w = window;

let JSON2 = w.JSON;

let atob2 = w.atob;

let btoa2 = w.btoa;

let localStorage2 = w.localStorage;

let game;

let currency_name = 'WarioCoins';
let prestige_name = 'Goombas';

function getInitialGame() {
  return {
    tab: 'main',
    currency: 10,
    maxCurrencyThisPrestige: 10,
    producers: [0, 0, 0, 0, 0, 0, 0, 0],
    boosts: 0,
    prestigeCurrency: 0,
    redHerrings: 1,
    antiPuzzles: 0,
    antiPuzzleEffectPurchases: 0,
    hasPrestiged: false,
    autobuyerUnlocks: [false, false, false, false, false, false, false, false, false],
    autobuyerOn: [false, false, false, false, false, false, false, false, false],
    prestigeUpgrades: [false, false, false, false, false, false, false, false, false],
    muteMusic: false,
    tasks: {
      unlocked: false,
      solved: 0,
      grids: getStartingTaskGrids()
    },
    achievements: [
      [false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false]
    ],
    achievementStats: {
      tabsSeen: [],
      producerPurchases: 0,
      timeSincePrestige: 0,
      timeSinceNoProducerStreakStart: 0,
      timeSinceHelpTabStreakStart: 0,
      clickableRealIds: []
    },
    lastTick: Date.now(),
    timeSinceStart: 0,
    // This is a fake property that we use to try to catch cheating.
    timeSinceAchievement: 0,
    metaUnlocked: false,
    clickableId: 0,
    clickableBonusThisMinigame: 0,
    clickablesClickedThisMinigame: 0,
    clickableProgress: 0,
    clickableLevel: 0,
    isPlayingClickableMinigame: false,
    notation: 'Scientific',
    puzzleUnlocks: [true, true, false, false, false, false, false, false, false],
    puzzleSolves: [false, false, false, false, false, false, false, false, false]
  }
}

function transformString(x) {
  // Permutes characters, depending how much effort we think people will put in
  // we can do something more sophisticated.
  let f = function (i) {
    let j = 1;
    while (j < x.length) {
      if ((i | (2 * j - 1)) < x.length) {
        i ^= j;
      }
      j *= 4;
    }
    return i;
  }
  return [...Array(x.length)].map((_, i) => x[f(i)]).join('');
}

function applySaveChanges() {
  if ('canSeeBoost' in game) {
    delete game.canSeeBoost;
    delete game.achievementStats.timeSinceLastManualProducerPurchase;
    delete game.achievementStats.timeSinceManualProducerPurchaseStreakStart;
    game.achievementStats.producerPurchases = 0;
  }
  if ('hasClickableBonus' in game) {
    delete game.hasClickableBonus;
    game.clickableOn = true;
  }
  if ('clickableOn' in game) {
    delete game.clickableOn;
    game.isPlayingClickableMinigame = false;
  }
  if (!('clickableBonusThisMinigame' in game)) {
    game.clickableBonusThisMinigame = 0;
  }
  if (!('clickablesClickedThisMinigame' in game)) {
    game.clickablesClickedThisMinigame = 0;
  }
  if (!('puzzleUnlocks' in game)) {
    game.puzzleUnlocks = [true, true, false, false, false, false, false, false, false];
  }
  if (!('puzzleSolves' in game)) {
    game.puzzleSolves = [false, false, false, false, false, false, false, false, false];
  }
}

function simulateTime() {
  let diff = Date.now() - game.lastTick;
  for (let i = 0; i < 1000; i++) {
    gameTick(diff / 1000, true);
  }
  game.lastTick = Date.now();
}

function toggleMusic() {
  game.muteMusic = !game.muteMusic;
  if (game.muteMusic) {
    pauseMusic()
  } else {
    playMusic()
  }
}

function playMusic() {
  var audio = document.getElementById('background-audio')
  audio.volume = 0.2;
  return audio.play();
}

function pauseMusic() {
  document.getElementById('background-audio').pause();
}

function gameTick(diff, simulated) {
  if (diff === undefined) {
    diff = Date.now() - game.lastTick;
    game.lastTick = Date.now();
  }
  let seconds = diff / 1000;
  produceCurrency(seconds);
  checkForAchievements(seconds);
  if (!simulated && game.hasPrestiged && game.isPlayingClickableMinigame) {
    game.clickableProgress += seconds / clickableInterval();
    if (game.clickableProgress >= 1) {
      spawnClickable();
      game.clickableProgress = 0;
    }
  }
  updateDisplay();
}

function produceCurrency(seconds) {
  game.timeSinceStart += seconds;
  game.redHerrings += seconds * game.antiPuzzles;
  let cps = currencyProductionPerSecond();
  game.currency += seconds * cps;
  game.timeSinceAchievement += seconds * cps;
  game.maxCurrencyThisPrestige = Math.max(game.currency, game.maxCurrencyThisPrestige);
  for (let i = 0; i <= 8; i++) {
    if (isAutobuyerActive(i)) {
      if (i === 0) {
        buyMaxBoost(true);
      } else {
        buyMaxProducer(i, true);
      }
    }
  }
}

function checkForAchievements(seconds) {
  if (producerCost(1) > producerCost(8) && canSeeProducer(8)) {
    giveAchievement(1, 2);
  }
  if (!game.achievementStats.tabsSeen.includes(game.tab)) {
    game.achievementStats.tabsSeen.push(game.tab);
  }
  if (game.achievementStats.tabsSeen.length >= 9) {
    giveAchievement(1, 3);
  }
  if ([0, 1, 2, 3, 4, 5, 6, 7, 8].every(x => isAutobuyerActive(x))) {
    giveAchievement(1, 4);
  }
  if (game.producers.every(x => x >= 1000)) {
    giveAchievement(1, 5);
  }
  if (game.achievementStats.producerPurchases >= 100) {
    giveAchievement(1, 6);
  }
  if (game.timeSinceStart >= 3600) {
    giveAchievement(1, 7);
  }
  game.achievementStats.timeSincePrestige += seconds;
  if (game.currency >= 1e50 && game.achievementStats.timeSincePrestige <= 5) {
    giveAchievement(2, 3);
  }
  if (game.producers.every(x => x === 11)) {
    giveAchievement(2, 4);
  }
  if (checkForAntitablesRipoff()) {
    giveAchievement(2, 5);
  }
  if (game.tasks.solved === 7) {
    giveAchievement(2, 8);
  }
  if (game.prestigeUpgrades.every(x => x)) {
    giveAchievement(3, 1);
  }
  let formattedCurrency = format(game.prestigeCurrency);
  if (formattedCurrency.startsWith('42') || formattedCurrency.startsWith('4.2')) {
    giveAchievement(3, 3);
  }
  if (game.producers.every(i => i === 0)) {
    game.achievementStats.timeSinceNoProducerStreakStart += seconds;
  } else {
    game.achievementStats.timeSinceNoProducerStreakStart = 0;
  }
  if (game.achievementStats.timeSinceNoProducerStreakStart >= 60) {
    giveAchievement(3, 6);
  }
  if (game.tab === 'help') {
    game.achievementStats.timeSinceHelpTabStreakStart += seconds;
  } else {
    game.achievementStats.timeSinceHelpTabStreakStart = 0;
  }
  if (game.achievementStats.timeSinceHelpTabStreakStart >= 60) {
    giveAchievement(3, 7);
  }
}

function checkForAntitablesRipoff() {
  return game.producers.every(x => x > 0) && [0, 1, 2, 3, 4, 5, 6].every(x => game.producers[x] < game.producers[x + 1]);
}

let characters = '... .... .- .-.. .-.. --- .--';

function clickableLifespan() {
  return 1;
}

function getNextCharacter() {
  let r = (game.clickableId >= characters.length) ? ' ' : characters[game.clickableId];
  game.clickableId++;
  if (game.clickableId >= characters.length + clickableLifespan() / clickableInterval()) {
    // We only want to end the minigame when the last clickable disappears.
    finishClickableMinigame();
  }
  return r;
}

function startClickableMinigame() {
  if (!game.isPlayingClickableMinigame) {
    game.isPlayingClickableMinigame = true;
    game.clickableId = 0;
    game.clickableBonusThisMinigame = 0;
    game.clickablesClickedThisMinigame = 0;
    game.achievementStats.clickableRealIds = [];
  }
}

function finishClickableMinigame() {
  // The player's already gotten their gains from the clickable minigame,
  // so we don't need to do anything else.
  // If we wanted to give an extra bonus at the end we would add it here.
  game.isPlayingClickableMinigame = false;
  if (game.clickablesClickedThisMinigame >= 20) {
    giveAchievement(1, 1);
  }
  // We probably want to do some easier-to-notice version of this.
  makeNotification('The clickable minigame is over! You clicked ' + game.clickablesClickedThisMinigame + ' / 23 clickables and earned ' + format(game.clickableBonusThisMinigame) + ' ' + currency_name + '!', 'notification-area');
}

function clickableLevel() {
  return game.clickableLevel;
}

function clickableInterval() {
  return 0.5;
}

function clickableBonusSeconds() {
  return 10 + 5 * clickableLevel();
}

function clickableBonus() {
  return currencyProductionPerSecond() * clickableBonusSeconds();
}

function increaseClickableLevelCost() {
  return Math.pow(1e5, 1 + clickableLevel());
}

function canIncreaseClickableLevel() {
  return game.prestigeCurrency >= increaseClickableLevelCost();
}

function increaseClickableLevel() {
  if (!canIncreaseClickableLevel()) return;
  game.prestigeCurrency -= increaseClickableLevelCost();
  game.clickableLevel++;
}

function countSpaces(x) {
  return x.split(' ').length - 1;
}

function getRealId(x) {
  let part = characters.slice(0, x % characters.length);
  return Math.floor(x / characters.length) * (characters.length - countSpaces(characters)) +
  part.length - countSpaces(part);
}

function achievementClickUpdate(x) {
  let ids = game.achievementStats.clickableRealIds;
  if (ids.includes(x)) {
    return;
  }
  ids.push(x);
  // This sort is needed because sometimes there can be multiple clickables,
  // which might be clicked in any order.
  ids.sort((a, b) => a - b);
  let last = ids[ids.length - 1];
  // But we can safely throw out sufficiently old ids.
  ids = ids.filter(i => i >= last - 20);
  // Ugh we need this to be able to keep abbreviating the name.
  game.achievementStats.clickableRealIds = ids;
  // Check for 9 differences of 1 in a row (i.e., 10 consecutive clickables).
  let diffs = ids.slice(1).map((x, i) => x - ids[i]);
  if ((',' + diffs.join(',') + ',').includes(',1'.repeat(9) + ',')) {
    giveAchievement(2, 2);
  }
}

function removeClickables(giveUnclickedAchievement) {
  [...document.body.children].forEach(function (x) {
    if (x.className === 'clickable' || x.className === 'bonus-text') {
      document.body.removeChild(x);
      if (giveUnclickedAchievement) {
        giveAchievement(3, 4);
      }
    }
  });
}

function clickableMinigameTimeLeft() {
  return clickableLifespan() + clickableInterval() * (characters.length - game.clickableId - game.clickableProgress)
}

function spawnClickable() {
  let id = getRealId(game.clickableId);
  let char = getNextCharacter();
  if (char === ' ') {
    return;
  }
  let height;
  let width;
  let src;
  if (char === '.') {
    height = 200;
    width = 200;
    src = '/static/puzzle_resources/wah_street_bets/images/wariocoin.png';
  }
  if (char === '-') {
    height = 100;
    width = 300;
    src = '/static/puzzle_resources/wah_street_bets/images/question_blocks.png';
  }
  //let e = document.createElement('div');
  let e = document.createElement('img');
  e.src = src;
  let left = Math.floor(Math.random() * (window.innerWidth - 100 - width)) + 50;
  // The asymmetry here is purposeful and due to the header.
  let top = Math.floor(Math.random() * (window.innerHeight - 200 - height)) + 150;
  e.style = 'z-index: 3; position: fixed; height: ' + height + 'px; width: '+ width + 'px; left: ' + left + 'px; top: '
  + top + 'px; animation: fade ease ' + clickableLifespan() + 's;';
  e.className = 'clickable';
  let creationTime = Date.now();
  let clicked = false;
  e.onmousedown = function () {
    var audio = new Audio('/static/puzzle_resources/wah_street_bets/audio/coin_sound.wav');
    audio.play();
    achievementClickUpdate(id);
    let bonus = clickableBonus();
    game.currency += bonus;
    game.timeSinceAchievement += bonus;
    game.clickableBonusThisMinigame += bonus;
    game.clickablesClickedThisMinigame += 1;
    game.mostRecentClick = Date.now();
    document.body.removeChild(e);
    clicked = true;
  }
  setTimeout(() => {
    if (!clicked) {
      document.body.removeChild(e);
      giveAchievement(3, 4);
    }
  }, 1000 * clickableLifespan());
  document.body.appendChild(e);
}

function currencyProductionPerSecond() {
  return [1, 2, 3, 4, 5, 6, 7, 8].map(productionPerSecond).reduce((a, b) => a + b);
}

function productionPerSecond(i) {
  return game.producers[i - 1] * producerMultiplier(i);
}

function producerMultiplier(i) {
  return getSolvedTasksEffect() * redHerringEffect() *
    getTotalPrestigeUpgradeEffect() * getPrestigeUpgradeOtherEffect() *
    prestigeCurrencyEffect() * achievementEffect() * boostEffect() * Math.pow(5, i - 1);
}

function producerInitialCost(i) {
  return Math.pow(10, i);
}

function producerCostIncrease(i) {
  return 1.1 + 0.01 * i;
}

function producerCost(i) {
  return Math.floor(producerInitialCost(i) * Math.pow(producerCostIncrease(i), game.producers[i - 1]));
}

function canBuyProducer(i) {
  return canSeeProducer(i) && game.currency >= producerCost(i);
}

function buyProducer(i, auto, indirect) {
  if (canBuyProducer(i)) {
    game.currency -= producerCost(i);
    game.producers[i - 1]++;
    if (!auto && !indirect) {
      game.achievementStats.producerPurchases++;
    }
    if (i === 5) {
      giveAchievement(3, 2);
    }
  }
}

function buyMaxProducer(i, auto) {
  if (!auto && canBuyProducer(i)) {
    game.achievementStats.producerPurchases++;
  }
  // Manual producer purchase stuff will be checked in buyProducer.
  while (canBuyProducer(i)) {
    buyProducer(i, auto, true);
  }
}

function boostInitialCost() {
  return 100;
}

function boostCostIncrease() {
  return 10;
}

function boostCost() {
  return boostInitialCost() * Math.pow(boostCostIncrease(), game.boosts);
}

function canBuyBoost() {
  return game.currency >= boostCost();
}

function buyBoost(auto) {
  if (canBuyBoost()) {
    game.currency -= boostCost();
    game.boosts++;
    game.timeSincePurchase = 0;
  }
}

function buyMaxBoost(auto) {
  while (canBuyBoost()) {
    buyBoost(auto);
  }
}

function redHerringExponent() {
  return 0.5 + 0.1 * game.antiPuzzleEffectPurchases;
}

function redHerringEffect() {
  return Math.pow(game.redHerrings, redHerringExponent());
}

function antiPuzzleCost() {
  return Math.floor(10 * Math.pow(1.2, game.antiPuzzles));
}

function canBuyAntiPuzzle() {
  return game.prestigeCurrency >= antiPuzzleCost();
}

function buyAntiPuzzle() {
  if (!canBuyAntiPuzzle()) return;
  game.prestigeCurrency -= antiPuzzleCost();
  game.antiPuzzles++;
}

function buyMaxAntiPuzzle() {
  if (canBuyAntiPuzzle() && game.prestigeCurrency >= 1e20) {
    giveAchievement(2, 1);
  }
  while (canBuyAntiPuzzle()) {
    buyAntiPuzzle();
  }
}

function antiPuzzleEffectCost() {
  let g = game.antiPuzzleEffectPurchases;
  return Math.pow(10, (g + 2) * (g + 3) / 2);
}

function canBuyAntiPuzzleEffect() {
  return game.prestigeCurrency >= antiPuzzleEffectCost();
}

function buyAntiPuzzleEffect() {
  if (!canBuyAntiPuzzleEffect()) return;
  game.prestigeCurrency -= antiPuzzleEffectCost();
  game.antiPuzzleEffectPurchases++;
}

function buyMaxAntiPuzzleEffect() {
  while (canBuyAntiPuzzleEffect()) {
    buyAntiPuzzleEffect();
  }
}

function prestigeCurrencyEffect() {
  return Math.pow(1 + game.prestigeCurrency, 0.5);
}

function boostEffect() {
  return Math.pow(2, game.boosts);
}

function getPrestigeSentence() {
  if (canPrestige()) {
    return 'for +' + formatInt(gainedPrestigeCurrency()) + ' ' + prestige_name;
  } else {
    return '(requires ' + format(prestigeRequirement()) + ' ' + currency_name + ')';
  }
}

function canPrestige() {
  return game.maxCurrencyThisPrestige >= prestigeRequirement();
}

function gainedPrestigeCurrency() {
  return Math.floor(Math.pow(game.maxCurrencyThisPrestige / 1e10, 1 / 3));
}

function prestigeRequirement() {
  return 1e10;
}

function prestige() {
  if (canPrestige()) {
    let gain = gainedPrestigeCurrency();
    checkForPrestigeAchievements(gain);
    game.prestigeCurrency += gain;
    game.hasPrestiged = true;
    game.achievementStats.timeSincePrestige = 0;
    game.currency = 10;
    game.timeSinceAchievement = 10;
    game.maxCurrencyThisPrestige = 10;
    game.redHerrings = 1;
    game.producers = [0, 0, 0, 0, 0, 0, 0, 0];
    game.boosts = 0;
  }
}

function checkForPrestigeAchievements(gain) {
  giveAchievement(1, 8);
  if (game.producers.slice(1).every(x => x === 0)) {
    giveAchievement(2, 6);
  }
  if (game.producers[7] === 0) {
    giveAchievement(2, 7);
  }
  if (game.currency >= 1e50) {
    giveAchievement(3, 5);
  }
}

function canSeePrestige() {
  return canPrestige() || game.hasPrestiged;
}

function canSeeProducer(i) {
  return i === 1 || game.producers[i - 2] > 0;
}

let newsList = [
  "Aha! If you write a play that goes until a [crazy act nine], it will become [immemorial]! (7)",
  "Ailment warning! If you explore [unusual dales within these uncovered] ruins, you'll end up [with a body part missing]! (8)",
  "Alchemy really works! If you [get original lead deposits at first], you'll end up with a [precious metal]! (4)",
  "Behold! If you [tarried a minute replacing tea], you'll end up happily [wedded]! (7)",
  "Believe signs! If you search in accordance [with prophecy], you'll find [roughly half of people]! (5)",
  "Beware uncomfortable containers! If you're in an [unloved Japanese box], your back will become [crooked]! (4)",
  "Build up event knowledge! If you have [six unstarted news] articles, you'll be unable to understand other people's [perspectives]! (5)",
  "Cheers! If you host a [small party in the UK], it will become an [anecdote]! (5)",
  "Chic uprising! If you agree with the [revolutionary stuff that some knights say], you'll be [fashionable]! (2)",
  "Cool strategy tip! If you leave [me at least confused], you'll get at least a [draw]! (9)",
];

let notationToGameName = {
  'Scientific': 'Scientific',
  '10💀 1🍆 100👪 100😠 1💀': 'Emoji',
}

let gameNameToNotation = {
  'Scientific': 'Scientific',
  'Emoji': '10💀 1🍆 100👪 100😠 1💀',
}

let emoji = ['😠', '🎂', '🎄', '💀', '🍆', '👪', '🌈', '💯', '🍦', '🎃', '💋', '😂', '🌙', '⛔', '🐙', '🐧', '❓', '☢', '🙈', '👍', '☂', '✌', '⚠', '❌', '😋', '⚡'];

function formatExponent(e) {
  let notation = game.notation;
  if (notation === 'Scientific') {
    return 'e' + e;
  } else if (notation === 'Emoji') {
    let pos = e / 3 - 1;
    return (pos >= 26 ? emoji[Math.floor(pos / 26) - 1] : '') +
    emoji[pos % 26];
  }
}

function formatInt(x) {
  if (x < 1000) {
    return x.toFixed(0);
  }
  return format(x);
}

function formatMaybeInt(x) {
  if (x === Math.floor(x)) {
    return formatInt(x);
  }
  return format(x);
}

function format(x) {
  let notation = game.notation;
  let places = 3;
  let r;
  if (x < 1000) {
    r = x.toFixed(places);
    if (r.startsWith('1000')) {
      // This can't cause an infinite loop, and it is kind of the simplest way to handle the situation.
      return format(1000);
    }
  } else {
    let e = Math.floor(Math.log10(x));
    let m = x / Math.pow(10, e);
    if (notation !== 'Scientific') {
      o = e % 3;
      e -= o;
      m *= Math.pow(10, o);
    }
    r1 = m.toFixed(places);
    if (r1.startsWith(notation === 'Scientific' ? '10.' : '1000.')) {
      // As before, doesn't cause an infinite loop and is simple.
      return format(Math.pow(10, e + (notation === 'Scientific' ? 1 : 3)));
    }
    r = r1 + formatExponent(e);
  }
  return r;
}

function formatTime(x) {
  if (x < 60) {
    return format(x) + ' seconds';
  }
  let parts = [Math.floor(x / 60 % 60).toFixed(0), Math.floor(x % 60).toFixed(0)];
  if (x >= 3600) {
    parts = [Math.floor(x / 3600).toFixed(0)].concat(parts);
  }
  let strParts = parts.map((i, ind) => ((i.length === 1 && ind > 0) ? '0' : '') + i);
  return strParts.join(':');
}

function formatIntTime(x) {
  if (x < 60) {
    let y = x.toFixed(0);
    return y + ' second' + (y === '1' ? '' : 's');
  }
  return formatTime(x);
}

function formatMaybeIntTime(x) {
  if (x === Math.floor(x)) {
    return formatIntTime(x);
  }
  return format(x);
}

let prestigeUpgradeNames = [
  'Load Lock', 'Teach Crackle', 'Roomba Snap',
  'Hoshi Pop', 'Boaser Jerk', 'Lungi Velocity',
  'Wayio Drop', 'Koupa Position', 'Marie Acceleration',
];

let prestigeUpgradeCosts = [1, 10, 100, 1e4, 1e6, 1e8, 1e12, 1e16, 1e20];

function getPrestigeUpgradeOtherEffect() {
  return Math.pow(2, game.prestigeUpgrades.reduce((a, b) => a + b));
}

function getTotalPrestigeUpgradeEffect() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(getPrestigeUpgradeEffect).reduce((a, b) => a * b);
}

function getPrestigeUpgradeEffect(x) {
  if (isPrestigeUpgradeBought(x)) {
    return getPrestigeUpgradeEffectIfBought(x);
  }
  return 1;
}

function getPrestigeUpgradeEffectIfBought(x) {
  if (x === 0) {
    return Math.pow(1.002, game.producers.reduce((a, b) => a + b));
  }
  return Math.pow(1.005, game.producers[x - 1]);
}

function getPrestigeUpgradeCost(x) {
  return prestigeUpgradeCosts[x];
}

function isPrestigeUpgradeBought(x) {
  return game.prestigeUpgrades[x];
}

function canPrestigeUpgradeBeBought(x) {
  return !isPrestigeUpgradeBought(x) && game.prestigeCurrency >= getPrestigeUpgradeCost(x);
}

function canPrestigeUpgradeBuyBeSeen(x) {
  return x === 0 || isPrestigeUpgradeBought(x - 1);
}

function buyPrestigeUpgrade(x) {
  if (!canPrestigeUpgradeBeBought(x)) return;
  game.prestigeCurrency -= getPrestigeUpgradeCost(x);
  game.prestigeUpgrades[x] = true;
}

let autobuyerCosts = [0, 8.6e2, 5.561e5, 6.71e5, 2.35e6, 2.881e8, 1.15e8, 4.73e9, 5.5e9]
let autobuyerCostStrings = ['Free!', '86e1', '5561e2', '671e3', '235e4', '2881e5', '115e6', '473e7', '55e8'];

function getAutobuyerCost(x) {
  return autobuyerCosts[x];
}

function isAutobuyerUnlocked(x) {
  return game.autobuyerUnlocks[x];
}

function isAutobuyerOn(x) {
  return game.autobuyerOn[x];
}

function isAutobuyerActive(x) {
  return isAutobuyerUnlocked(x) && isAutobuyerOn(x);
}

function canAutobuyerBeBought(x) {
  return !isAutobuyerUnlocked(x) && game.currency >= getAutobuyerCost(x);
}

function canAutobuyerUnlockBeSeen(x) {
  return x === 0 || isAutobuyerUnlocked(x - 1);
}

function buyAutobuyer(x) {
  if (!canAutobuyerBeBought(x)) return;
  game.currency -= getAutobuyerCost(x);
  game.autobuyerUnlocks[x] = true;
}

function toggleAutoProducer(x) {
  if (!isAutobuyerUnlocked(x)) return;
  game.autobuyerOn[x] = !game.autobuyerOn[x];
}

/* Start tasks section */

function taskUnlockCost() {
  return 1e10;
}

function canUnlockTasks() {
  return game.prestigeCurrency >= taskUnlockCost();
}

function unlockTasks() {
  if (!canUnlockTasks()) return;
  game.prestigeCurrency -= taskUnlockCost();
  game.tasks.unlocked = true;
}

function getSolvedTasksEffect() {
  return 1 + game.tasks.solved / 2;
}

function getStartingTaskGrids() {
  return [...Array(7)].map(i => [...Array(8)].map(j => [...Array(8)].map(k => 0)));
}

function resetCurrentGrid() {
  game.tasks.grids[game.tasks.solved] = [...Array(8)].map(j => [...Array(8)].map(k => 0));
};

function changeCell(i, j, k, value) {
  if (!(game.tasks.solved === i && 0 <= j && j <= 7 && 0 <= k && k <= 7)) {
    return;
  }
  game.tasks.grids[i][j][k] = (game.tasks.grids[i][j][k] + value) % 3;
  checkForCurrentGridSolve();
}

let taskHorClues = [
  [['', '', '1', '1'], ['', '', '2', '2'], ['1', '1', '1', '1'], ['', '1', '2', '1'], ['', '', '1', '1'], ['', '', '1', '1'], ['', '', '1', '1'], ['', '', '1', '1']],
  [['', '2'], ['1', '1'], ['1', '1'], ['1', '1'], ['', '6'], ['1', '1'], ['2', '2'], ['1', '1']],
  [['', '2', '1'], ['', '3', '1'], ['', '4', '1'], ['1', '3', '1'], ['1', '3', '1'], ['', '1', '4'], ['', '1', '3'], ['', '1', '2']],
  [['', '2'], ['', '3'], ['2', '1'], ['2', '1'], ['', '6'], ['2', '1'], ['2', '1'], ['1', '1']],
  [['', '5'], ['', '2'], ['', '1'], ['1', '3'], ['1', '1'], ['1', '1'], ['2', '2'], ['', '6']],
  [['5'], ['1'], ['1'], ['5'], ['1'], ['1'], ['1'], ['5']],
  [['', '6'], ['1', '2'], ['1', '2'], ['', '6'], ['', '3'], ['1', '2'], ['1', '2'], ['1', '3']],
];

let taskVertClues = [
  [['8'], ['1'], ['1'], ['1'], ['1'], ['1'], ['1'], ['8']],
  [['', '2'], ['', '3'], ['', '4'], ['1', '1'], ['1', '1'], ['', '4'], ['', '3'], ['', '2']],
  [['8'], ['3'], ['3'], ['3'], ['3'], ['3'], ['3'], ['8']],
  [['', '2'], ['', '2'], ['', '2'], ['', '2'], ['', '3'], ['2', '1'], ['2', '1'], ['', '8']],
  [['', '', '6'], ['', '2', '2'], ['', '1', '1'], ['', '1', '1'], ['1', '1', '1'], ['1', '1', '1'], ['', '1', '2'], ['', '', '3']],
  [['', '', '3'], ['', '2', '1'], ['', '3', '1'], ['1', '1', '1'], ['1', '1', '1'], ['', '1', '1'], ['', '', '1'], ['', '', '1']],
  [['', '', '8'], ['', '1', '2'], ['', '1', '3'], ['1', '1', '1'], ['1', '1', '1'], ['1', '1', '2'], ['', '2', '1'], ['', '2', '1']]
];

function isValid(grid, horClues, vertClues) {
  let tGrid = [...Array(8)].map((_, i) => grid.map(j => j[i]));
  return grid.map(
    i => i.join('').split(/[02]/g).map(j => j.length).filter(j => j !== 0).join('')
  ).join(':') === horClues.map(i => i.join('')).join(':') && tGrid.map(
    i => i.join('').split(/[02]/g).map(j => j.length).filter(j => j !== 0).join('')
  ).join(':') === vertClues.map(i => i.join('')).join(':');
}

function checkForCurrentGridSolve() {
  let i = game.tasks.solved;
  if (isValid(game.tasks.grids[i], taskHorClues[i], taskVertClues[i])) {
    for (let j = 0; j < 8; j++) {
      for (let k = 0; k < 8; k++) {
        // This sets x's to empty cells for cleaner visuals.
        if (game.tasks.grids[i][j][k] === 2) {
          game.tasks.grids[i][j][k] = 0;
        }
      }
    }
    game.tasks.solved++;
  }
}

/* End tasks section */

/* Start achievements section */

let achNameTable = [
  ['Master of my fate', 'Clicking sans thinking', 'Great beta testing', 'Let BIOS buy it', 'Big tent approach', 'Clicking\'s as addictive as soma', 'It\'s about time', 'Missing all those miners already?'],
  ['Not so wise', 'Ten leaf clover', 'In the fastest lane', 'Dial it up to eleven', 'srebmun fo wolf ehT', 'dont think its ez', 'Missing something?', 'The best solver'],
  ['No missing upgrades?', 'On the one hand', 'Geek humor', 'It died', 'Filling up the ' + currency_name + ' dump', 'In a funk', 'A lot of help', 'File storage']
];

let achTooltipTable = [
  ['Click on at least 20 clickables in a single minigame.', 'Get Miner 1 cost to be higher than Miner 8 cost.',
  'Go to every game tab.', 'Have all the autobuyers unlocked and on.',
  'Have at least [1000] of all miners.',
  'Manually buy at least one miner, at least 100 times.', 'Play for 1:00:00.', 'Liquidate.'],
  ['Buy max kickstarters with at least [1e20] ' + prestige_name + '.', 'Click on 10 consecutive minigame clickables.',
  'Get [1e50] ' + currency_name + ' within 5 seconds after liquidation.', 'Have exactly 11 of each miner.',
  'Have Miner 1-8 amounts in reverse order,  with at least 1 of each (have the most of Miner 8,  the second-most of Miner 7, etc.).', 'Liquidate without buying any miner other than Miner 1.', 'Liquidate without buying Miner 8.', 'Solve all the tasks.'],
  ['Buy every ' + prestige_name + ' upgrade.', 'Buy Miner 5.', 'Have an amount of ' + prestige_name + ' starting with 42 (or 4.2).',
  'Let a clickable go away without clicking on it.', 'Liquidate with over [1e50] ' + currency_name + '.', 'Spend 1:00 without any miners bought.', 'Spend 1:00 without leaving the help tab.', 'Save manually.']
];

function hasAchievement(row, column) {
  return game.achievements[row - 1][column - 1];
}

function giveAchievement(row, column) {
  if (hasAchievement(row, column)) return;
  game.achievements[row - 1][column - 1] = true;
  notifyAchievement(row, column);
}

function notifyAchievement(row, column) {
  if (!document.getElementById('notification-area')) {
    setTimeout(() => notifyAchievement(row, column), 100);
    return;
  }
  let name = achNameTable[row - 1][column - 1];
  makeNotification('Achievement unlocked: ' + name, 'notification-area');
}

function makeNotification(text, id) {
  let e = document.createElement('div');
  e.className = 'notification';
  e.innerHTML = text;
  document.getElementById(id).appendChild(e);
  let remove = function() {
    if (document.body.contains(e)) {
      document.getElementById(id).removeChild(e);
    }
  };
  setTimeout(remove, 10000);
}

function achievementCount() {
  return game.achievements.map(x => x.reduce((a, b) => a + b)).reduce((a, b) => a + b);
}

function achievementEffect() {
  return Math.pow(1.08, achievementCount());
}

/* End achievements section */

function updateDisplay() {
  nonstatic.forEach(x => x.update());
}

function setTab(x) {
  game.tab = x;
  tab_buttons = document.getElementsByClassName("tabbuttons");
  for (i = 0; i < tab_buttons.length; i++) {
    tab_buttons[i].className = tab_buttons[i].className.replaceAll(" bg-purple", "");
  }
  // Vue might not have done its thing yet so we add a check for the element existing.
  if (document.getElementById(x + "-btn")) {
    document.getElementById(x + "-btn").className += " bg-purple";
  }
}

function getGamestateLabel() {
  let suffix = (game.timeSinceStart >= 60) ?
    '/' + formatTime(game.timeSinceStart) :
    '/' + '0:' + formatInt(Math.floor(game.timeSinceStart));
  if (game.hasPrestiged) {
    return formatInt(game.prestigeCurrency) + prestige_name[0] + '/' + format(game.currency) + currency_name[0] + suffix;
  } else {
    return format(game.currency) + currency_name[0] + suffix;
  }
}

function getLabel(is_autosaved) {
  if (is_autosaved) {
    return 'AUTOSAVED: ' + getGamestateLabel();
  } else {
    return document.getElementById('save-label').value;
  }
}

function saveLocal(isAutosaved) {
  localStorage2.setItem('round-3-save', transformString(btoa2(JSON2.stringify(game)).replace(/=/g, '')));
  if (!isAutosaved) {
    makeNotification('Saved!', 'notification-area');
    giveAchievement(3, 8);
  }
}

// These are all the expert flavortexts (casual flavortexts had more hints for most of the minipuzzles).
let puzzleData = [
  {
    'requirement': 0,
    'requirement_unit': 'CURRENCY',
    'name': 'Assistance',
    'flavortext': 'Clippy still isn\'t very useful, so Wario will have to search high and low.',
    'is_meta': false,
    'answer': 'MACHTWO',
    'display_answer': 'MACH TWO',
  },
  {
    'requirement': 0,
    'requirement_unit': 'CURRENCY',
    'name': 'Headlines',
    'flavortext': 'Citizen Kane has left behind ten enigmatic clues and insists that they should resolve to a three-word phrase...',
    'is_meta': false,
    'answer': 'OLDWIVESTALE',
    'display_answer': 'OLD WIVES TALE',
  },
  {
    'requirement': 1e8,
    'requirement_unit': 'CURRENCY',
    'name': 'Automation',
    'flavortext': 'Optimus Prime needs to factor in that some robots count from A2 to Z101.',
    'is_meta': false,
    'answer': 'CONSCIENCE',
    'display_answer': 'CONSCIENCE',
  },
  {
    'requirement': 1,
    'requirement_unit': 'PRESTIGE',
    'name': '💩',
    'flavortext': '💩 insists that they\'re actually a scoop of 🍫🍨 , chalking the misunderstanding up to a difference in notation.',
    'is_meta': false,
    'answer': 'MOTEL',
    'display_answer': 'MOTEL',
  },
  {
    'requirement': 1e3,
    'requirement_unit': 'PRESTIGE',
    'name': 'Just Click It',
    'flavortext': 'Dasher the reindeer and Dot Warner have become addicted to a certain activity...',
    'is_meta': false,
    'answer': 'SHALLOW',
    'display_answer': 'SHALLOW',
  },
  {
    'requirement': 1e7,
    'requirement_unit': 'PRESTIGE',
    'name': 'Drive and Derive',
    'flavortext': 'In order to match Penelope Pitstop and Speed Racer, Wario\'s going to need to upgrade his game.',
    'is_meta': false,
    'answer': 'UNEARTHLY',
    'display_answer': 'UNEARTHLY',
  },
  {
    'requirement': 1e11,
    'requirement_unit': 'PRESTIGE',
    'name': 'The \'Gram',
    'flavortext': 'Instead of paying attention in school, Nono-chan has been on the \'gram. And she doesn\'t mean the app.',
    'is_meta': false,
    'answer': 'MANAGER',
    'display_answer': 'MANAGER',
  },
  {
    'requirement': 1e60,
    'requirement_unit': 'CURRENCY',
    'name': 'Feat',
    'flavortext': 'Wario asks Lucy how she achieved success and fortune as a psychiatrist. She responds: "Look upon each word with four. With each line, pair ABCs then fill last word."',
    'is_meta': false,
    'answer': 'FOOTBALLGAME',
    'display_answer': 'FOOTBALL GAME',
  },
  {
    'requirement': 1e100,
    'requirement_unit': 'CURRENCY',
    'name': 'META: Superfinale',
    'flavortext': 'Wario\'s solutions are excellent, but they\'re also super.',
    'is_meta': true,
    'answer': '8BITCOIN',
    'display_answer': '8 BITCOIN'
  },
]

function checkAnswer(guess) {
  let normalizedGuess = guess.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let correctList = puzzleData.filter((x, i) => x.answer === normalizedGuess && game.puzzleUnlocks[i]);
  // Technically we could just do correctList[0] here, but we do this to be explicit.
  let correct = correctList.length >= 1 ? correctList[0] : undefined;
  let responseText = undefined;
  if (normalizedGuess === '') {
    responseText = 'Please enter a valid non-empty guess.';
  }
  if ((normalizedGuess === 'EIGHTBITCOIN' || normalizedGuess === 'EBITCOIN') && game.puzzleUnlocks[8]) {
    responseText = 'Close! Wario prefers not to spell out numbers.';
  }
  if (responseText) {
    makeNotification(responseText, 'answer-notification-area')
  } else {
    makeNotification(guess + ' was ' + (correct ? 'correct' : 'not correct for any of the unlocked puzzles') +
      (correct ? ' for "' + correct.name + '"' : '') + '!', 'answer-notification-area');
  }
  if (correct) {
    // This works because they're literally the same object.
    let index = puzzleData.indexOf(correct);
    game.puzzleSolves[index] = true;
  }
  // We do this at the very end so that if someone goes back to the game
  // they can see the answer to the meta was correct (i.e. the save has already been updated).
  if (correct && correct.is_meta) {
    window.location.href = '../victory';
    return;
  }
}

let loadOptions = [];

function loadSave(x) {
  let saveInfo = loadOptions[x - 1];
  game = JSON2.parse(saveInfo.savestate_str);
  applySaveChanges();
  removeClickables();
  simulateTime();
  updateDisplay();
  makeNotification('Loaded save: ' + saveInfo.label, 'notification-area');
  loadOptions = [];
  setTab(game.tab);
}

// This contains data (i.e., flavortext, cost, etc.) for the current next puzzle to unlock, or {} if all puzzles are unlocked.
let nextPuzzleData;

// This contains flavortexts and names for the puzzles already unlocked.
let unlockedPuzzles = [];

Vue.component('load-modal', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      loadOptions: []
    }
  },
  methods: {
    update() {
      this.loadOptions = loadOptions;
    },
    loadSave() {
      var e = document.getElementById("load-modal-select");
      loadSave(e.value);
    },
    close() {
      loadOptions = [];
      this.$emit('close');
    }
  },
  template: `
    <div class="modal" id="loadModal" tabindex="-1" role="dialog" aria-labeledby="loadModalLabel"
    aria-hidden="true" v-if="loadOptions.length > 0">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Load a save:</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <select id="load-modal-select" class="form-select" aria-label="loadSelectLabel">
              <option v-for="i in loadOptions.length" :value="i">
                {{ loadOptions[i-1].label }}
              </option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="close">Close</button>
            <button @click="loadSave()"type="button" class="btn btn-primary" >Load</button>
          </div>
        </div>
      </div>
    </div>
  `
});

Vue.component('production-summary', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      tab: '',
      currency: 0,
      currencyGain: 0,
      prestigeCurrency: 0,
      prestigeCurrencyEffect: 0,
      hasPrestiged: false,
      isPlayingClickableMinigame: false,
      timeLeft: 0,
      hasRecentBonus: false,
      bonus: null,
      currencyName: currency_name,
      prestigeName: prestige_name,
    }
  },
  methods: {
    update() {
      this.tab = game.tab;
      this.currency = game.currency;
      this.currencyGain = currencyProductionPerSecond();
      this.prestigeCurrency = game.prestigeCurrency;
      this.prestigeCurrencyEffect = prestigeCurrencyEffect();
      this.hasPrestiged = game.hasPrestiged;
      this.isPlayingClickableMinigame = game.isPlayingClickableMinigame;
      this.timeLeft = clickableMinigameTimeLeft();
      this.hasBonus = game.clickableBonusThisMinigame > 0;
      this.bonus = game.clickableBonusThisMinigame;
    },
    format(x) {
      return format(x);
    },
    formatInt(x) {
      return formatInt(x);
    },
    formatTime(x) {
      return formatTime(x);
    },
  },
  template: `
  <div>
  <span class="large-text">{{ currencyName }}: {{ format(currency) }} ({{ format(currencyGain) }} per second)</span>
  <br v-if="hasPrestiged"/>
  <span class="large-text" v-if="hasPrestiged">{{ prestigeName }}: {{ formatInt(prestigeCurrency) }} (production boost: {{format(prestigeCurrencyEffect) }}x)</span>
  <br v-if="isPlayingClickableMinigame"/>
  <span class="large-text" v-if="isPlayingClickableMinigame"><span class="good-text">Playing clickable minigame:</span>
  {{ formatTime(timeLeft) }} left<span v-if="hasBonus">, {{ currencyName }} earned: <span class="good-text">+{{ format(bonus) }}</span></span></span>
  </div>
  `
});

Vue.component('news-ticker', {
  mounted() {
    this.prepareNextMessage();
  },
  data() {
    return {
      nextTimeoutId: null
    }
  },
  methods: {
    prepareNextMessage() {
      if (this.$refs.line === undefined) {
        // This element no longer exists because the player switched tabs.
        return;
      }
      // JavaScript lets us clear a non-existant or null timeout so we don't need to do any checks here.
      clearTimeout(this.nextTimeoutId);
      const line = this.$refs.line;
      line.innerHTML = '';
      let currentNews = newsList[Math.floor(Math.random() * newsList.length)];
      this.scrollMessage(currentNews);
    },
    scrollMessage(currentNews) {
      const line = this.$refs.line;
      line.innerHTML = currentNews.replace(/\[/g, '<b>').replace(/\]/g, '</b>');
      let parentWidth = line.parentElement.clientWidth;
      line.style.transition = '';
      line.style.transform = 'translateX(' + parentWidth + 'px)';
      let dist = this.$refs.news.clientWidth + line.clientWidth;
      let rate = 60;
      let transformDuration = dist / rate;
      line.style.transition = 'transform ' + transformDuration + 's linear';
      let textWidth = line.clientWidth;
      line.style.transform = 'translateX(-' + textWidth + 'px)';
      this.nextTimeoutId = setTimeout(this.prepareNextMessage.bind(this), transformDuration * 1000 + 1000);
    }
  },
  template: `
    <div class="d-flex justify-content-center flex-row">
    <div ref="news" class="news-wrapper">
      <div ref="line" class="news-line"></div>
    </div>
    <button style="width:30px; height:28px;" @click="prepareNextMessage()">
    <span class="material-icons">not_started</span>
    </button>
    </div>
  `
});

Vue.component('tab-list', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      hasPrestiged: false,
      prestigeName: prestige_name,
    }
  },
  methods: {
    update() {
      this.hasPrestiged = game.hasPrestiged;
    },
    setTab(x) {
      setTab(x);
    }
  },
  template: `
  <div>
  <span>
    <button id="main-btn" class="tabbuttons" @click="setTab('main')">Main</button>
    <button id="help-btn" class="tabbuttons" @click="setTab('help')">Help</button>
    <button id="achievements-btn" class="tabbuttons" @click="setTab('achievements')">Achievements</button>
    <button id="options-btn" class="tabbuttons" @click="setTab('options')">Options</button>
  </span>
  <div style="min-height: 10px;"></div>
  <span>
    <span v-if="hasPrestiged">
      <button id="minigame-btn" class="tabbuttons" @click="setTab('minigame')">Minigame</button>
    </span>
    <button id="autobuyers-btn" class="tabbuttons" @click="setTab('autobuyers')">Autobuyers</button>
    <span v-if="hasPrestiged">
      <button id="tasks-btn" class="tabbuttons" @click="setTab('tasks')">Tasks</button>
      <button id="upgrades-btn" class="tabbuttons" @click="setTab('upgrades')">Upgrades</button>
    </span>
    <button id="puzzles-btn" class="tabbuttons" @click="setTab('puzzles')">Puzzles</button>
  </span>
  </div>
  `
});

Vue.component('tab', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      tab: ''
    }
  },
  methods: {
    update() {
      this.tab = game.tab;
    }
  },
  template: `
  <div>
  <news-ticker v-if="tab === 'main'"/>
  <br v-if="tab === 'main'"/>
  <main-tab v-if="tab === 'main'"/>
  <achievements v-if="tab === 'achievements'"/>
  <options v-if="tab === 'options'"/>
  <help v-if="tab === 'help'"/>
  <autobuyers v-if="tab === 'autobuyers'"/>
  <upgrades v-if="tab === 'upgrades'"/>
  <minigame v-if="tab === 'minigame'"/>
  <tasks v-if="tab === 'tasks'"/>
  <puzzles v-if="tab === 'puzzles'"/>
  </div>
  `
});

Vue.component('main-tab', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
    $(function () {
      $(".popover-liquidate").popover({
        container: 'body',
        content: "Liquidating resets " + currency_name + " and all miners, but gives " + prestige_name + ". " +
        prestige_name + " give a bonus to production and can be used to buy upgrades.",
        trigger: 'focus',
      });
      $(".popover-accelerant").popover({
        container: 'body',
        content: "Accelerants multiply all " + currency_name + " production. They reset upon liquidation.",
        trigger: 'focus',
      });
      $(".popover-kickstarter").popover({
        container: 'body',
        content: "A kickstarter produces 1 accelerant per second and can be purchased by spending " + prestige_name + ". They do not reset upon liquidation.",
        trigger: 'focus',
      });
      $(".popover-boost").popover({
        container: 'body',
        content: "Each boost multiplies your total " + currency_name + " production by 2x.",
        trigger: 'focus',
      });
    });
  },
  data() {
    return {
      tab: '',
      currency: 0,
      currencyGain: 0,
      canSee: [false, false, false, false, false, false, false, false, false],
      amounts: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      costs: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      canBuy: [false, false, false, false, false, false, false, false, false],
      hasAuto: [false, false, false, false, false, false, false, false, false],
      autoOn: [false, false, false, false, false, false, false, false, false],
      boostEffect: 0,
      production: [0, 0, 0, 0, 0, 0, 0, 0],
      totalProduction: [0, 0, 0, 0, 0, 0, 0, 0],
      canSeePrestige: false,
      canPrestige: false,
      hasPrestiged: false,
      prestigeSentence: '',
      redHerrings: 0,
      redHerringExponent: 0,
      redHerringEffect: 0,
      antiPuzzles: 0,
      canBuyAntiPuzzle: false,
      antiPuzzleCost: 0,
      canBuyAntiPuzzleEffect: false,
      antiPuzzleEffectCost: 0,
      currencyName: currency_name,
      prestigeName: prestige_name,
    }
  },
  methods: {
    update() {
      this.tab = game.tab;
      this.currency = game.currency;
      this.currencyGain = currencyProductionPerSecond();
      this.canSee = [true].concat([1, 2, 3, 4, 5, 6, 7, 8].map(i => canSeeProducer(i)));
      this.amounts = [game.boosts].concat(game.producers);
      this.costs = [boostCost()].concat([1, 2, 3, 4, 5, 6, 7, 8].map(i => producerCost(i)));
      this.canBuy = [canBuyBoost()].concat([1, 2, 3, 4, 5, 6, 7, 8].map(i => canBuyProducer(i)));
      this.hasAuto = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => isAutobuyerUnlocked(i));
      this.autoOn = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => isAutobuyerOn(i));
      this.boostEffect = boostEffect();
      this.production = [1, 2, 3, 4, 5, 6, 7, 8].map(i => producerMultiplier(i));
      this.totalProduction = [1, 2, 3, 4, 5, 6, 7, 8].map(i => productionPerSecond(i));
      this.canSeePrestige = canSeePrestige();
      this.canPrestige = canPrestige();
      this.hasPrestiged = game.hasPrestiged;
      this.redHerrings = game.redHerrings;
      this.redHerringExponent = redHerringExponent();
      this.redHerringEffect = redHerringEffect();
      this.antiPuzzles = game.antiPuzzles;
      this.canBuyAntiPuzzle = canBuyAntiPuzzle();
      this.antiPuzzleCost = antiPuzzleCost();
      this.canBuyAntiPuzzleEffect = canBuyAntiPuzzleEffect();
      this.antiPuzzleEffectCost = antiPuzzleEffectCost();
      this.prestigeSentence = getPrestigeSentence();
    },
    format(x) {
      return format(x);
    },
    formatInt(x) {
      return formatInt(x);
    },
    buyBoost() {
      buyBoost();
    },
    buyMaxBoost() {
      buyMaxBoost();
    },
    buyProducer(x) {
      buyProducer(x);
    },
    buyMaxProducer(x) {
      buyMaxProducer(x);
    },
    toggleAutoProducer(x) {
      toggleAutoProducer(x);
    },
    buyAntiPuzzle() {
      buyAntiPuzzle();
    },
    buyMaxAntiPuzzle() {
      buyMaxAntiPuzzle();
    },
    buyAntiPuzzleEffect() {
      buyAntiPuzzleEffect();
    },
    buyMaxAntiPuzzleEffect() {
      buyMaxAntiPuzzleEffect();
    },
    prestige() {
      prestige();
    }
  },
  template: `
  <div>
  <span>You have {{ formatInt(amounts[0]) }} boost{{ (amounts[0] === 1) ? '' : 's' }}<span class="material-icons btn px-0 popover-boost" tabindex="0" role="button" data-toggle="popover"
data-trigger="focus"> help_outline</span>,
  multiplying all miners by {{ formatInt(boostEffect) }}x.
  <button @click="buyBoost()" style="width: 180px;" :class="canBuy[0] ? '' : 'disabled'">Buy: Cost {{ formatInt(costs[0]) }}</button> <button @click="buyMaxBoost()" :class="canBuy[0] ? '' : 'disabled'">Buy max</button>
  <button v-if="hasAuto[0]" :class="autoOn[0] ? 'bg-purple' : 'bg-gray'" @click="toggleAutoProducer(0)">Auto: {{ autoOn[0] ? 'on' : 'off' }}</button>
  </span>
  <br/>
  <br/>
  <table class="table table-striped" style="margin-left: auto; margin-right: auto;">
    <tbody>
      <tr>
        <th></th>
        <th>Amount</th>
        <th>{{ currencyName }}/sec (each)</th>
        <th>{{ currencyName }}/sec (total)</th>
        <th>Buy <br/>({{ currencyName }})</th>
        <th>Buy max</th>
        <th v-if="hasAuto.slice(1).some(x => x)">Autobuy?</th>
      </tr>
      <tr v-for="i in 8" v-if="canSee[i]">
        <td style="width: 100px;">
          Miner {{ i }}
        </td>
        <td style="width: 80px;">
          {{ formatInt(amounts[i]) }}
        </td>
        <td style="width: 150px;">
          {{ format(production[i - 1]) }}
        </td>
        <td style="width: 150px;">
          {{ format(totalProduction[i - 1]) }}
        </td>
        <td style="width: 150px;">
          <button @click="buyProducer(i)" style="width: 180px;" :class="canBuy[i] ? '' : 'disabled'">{{ formatInt(costs[i]) }}</button>
        </td>
        <td style="width: 120px;">
          <button @click="buyMaxProducer(i)" :class="canBuy[i] ? '' : 'disabled'">Buy max</button>
        </td>
        <td style="width: 100px;" v-if="hasAuto.slice(1).some(x => x)">
          <button v-if="hasAuto[i]" :class="autoOn[i] ? 'bg-purple' : 'bg-gray'" @click="toggleAutoProducer(i)">{{ autoOn[i] ? 'on' : 'off' }}</button>
        </td>
      </tr>
    </tbody>
  </table>
  <br/>
  <div v-if="canSeePrestige">
    <span><button @click="prestige()" style="width: 400px;" :class="canPrestige ? '' : 'disabled'">Liquidate {{ prestigeSentence }}</button></span>
    <span class="material-icons btn px-0 popover-liquidate" tabindex="0" role="button" data-toggle="popover"
data-trigger="focus"> help_outline</span>
    <br/>
    <br/>
    <span v-if="!hasPrestiged">Tip! If you haven't liquidated yet, liquidating for even 1 {{ prestigeName }} is recommended; it will make progress much easier.</span>
    <br v-if="!hasPrestiged"/>
    <span>You have {{ format(redHerrings) }} accelerants, multiplying production by their amount^{{ format(redHerringExponent) }} = {{ format(redHerringEffect) }}x.</span>
    <span class="material-icons btn px-0 popover-accelerant" tabindex="0" role="button" data-toggle="popover"
data-trigger="focus"> help_outline</span>
    <br/>
    <span>You have {{ formatInt(antiPuzzles) }} kickstarter{{ (antiPuzzles === 1) ? '' : 's'}}.</span>
    <span class="material-icons btn px-0 popover-kickstarter" tabindex="0" role="button" data-toggle="popover"
data-trigger="focus"> help_outline</span>
    <br/>
    <br/>
    <table style="margin-left: auto; margin-right: auto;">
      <tbody>
        <tr>
          <td style="text-align: center;"><button @click="buyAntiPuzzle()" style="width: 650px;" :class="canBuyAntiPuzzle ? '' : 'disabled'">Buy a kickstarter: Cost {{ formatInt(antiPuzzleCost) }} {{ prestigeName }}</button></td>
          <td style="text-align: center;"><button @click="buyMaxAntiPuzzle()" :class="canBuyAntiPuzzle ? '' : 'disabled'">Buy max</button></td>
        </tr>
        <tr>
          <td style="text-align: center;"><button @click="buyAntiPuzzleEffect()" style="width: 650px;"
          :class="canBuyAntiPuzzleEffect ? '' : 'disabled'">Add 0.100 to the accelerant effect exponent: Cost {{ formatInt(antiPuzzleEffectCost) }} {{ prestigeName }}</button></td>
          <td style="text-align: center;"><button @click="buyMaxAntiPuzzleEffect()" :class="canBuyAntiPuzzleEffect ? '' : 'disabled'">Buy max</button></td>
        </tr>
      </tbody>
    </table>
    <br/>
    <br/>
  </div>
  </div>
  `
});

Vue.component('achievements', {
  created() {
    nonstatic.push(this);
    this.names = achNameTable;
    this.rawTooltips = achTooltipTable;
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      achievementCount: 0,
      achievementEffect: 0,
      ach: [
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false]
      ],
      names: [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '']
      ],
      rawTooltips: [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '']
      ],
      tooltips: [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '']
      ]
    }
  },
  methods: {
    update() {
      this.achievementCount = achievementCount();
      this.achievementEffect = achievementEffect();
      this.ach = game.achievements;
      this.tooltips = this.rawTooltips.map(x => x.map(y => y.replace(/\[[0-9e]+\]/g, z => format(z.slice(1, -1)))));
    },
    format(x) {
      return format(x);
    },
    formatInt(x) {
      return formatInt(x);
    },
  },
  template: `
  <div>
    <span>You have {{ formatInt(achievementCount) }} achievement{{ (achievementCount === 1) ? '' : 's' }}, multiplying production by 1.080^their amount = {{ format(achievementEffect) }}.</span>
    <table class="achievement-table">
      <tbody>
        <tr v-for="i in 3">
          <td v-for="j in 8" :class="ach[i - 1][j - 1] ? 'achievement-td achievement-td-unlocked' : 'achievement-td achievement-td-locked'">
            <span v-if="ach[i - 1][j - 1]">{{ names[i - 1][j - 1] }}</span><span v-else>???</span>
            <span class="tooltiptext">{{ tooltips[i - 1][j - 1] }}</span>
          </td>
        </tr>
        </td>
      </tbody>
    </table>
  </div>
  `
});

Vue.component('options', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      notation: '',
      playTime: 0,
      loadOptions: [],
      currencyName: currency_name,
      prestigeName: prestige_name,
      isLoadModalVisible: false,
      isSaveModalVisible: false,
      muteMusic: false,
    }
  },
  methods: {
    update() {
      this.notation = game.notation;
      this.playTime = game.timeSinceStart;
      this.muteMusic = game.muteMusic;
      this.loadOptions = loadOptions;
    },
    formatTime(x) {
      return formatTime(x);
    },
    setNotation(event) {
      game.notation = notationToGameName[event.target.value];
      this.notation = notationToGameName[event.target.value];
    },
    saveLocal() {
      saveLocal();
    },
    exportLocal() {
      document.getElementById('export-import-input').value = transformString(btoa2(JSON2.stringify(game)));
      document.getElementById('export-import-input').select();
      document.execCommand('copy');
      makeNotification('Exported save', 'notification-area');
    },
    importLocal() {
      try {
        game = JSON2.parse(atob2(transformString(document.getElementById('export-import-input').value)));
        removeClickables();
        simulateTime();
        updateDisplay();
        makeNotification('Loaded save', 'notification-area');
        saveGame();
      } catch (e) {};
    },
    toggleMusic() {
      toggleMusic()
    },
  },
  template: `
  <div>
  <div class="col-md-3 mx-auto">
    <button class="muteMusic ? 'bg-gray' : 'bg-purple'" @click="toggleMusic">Music: {{ muteMusic ? 'off' : 'on' }}</button>
    <br/>
    <br/>
    <div style="text-align: left;">
      <div class="form-check">
        <input class="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" value="Scientific"
        :checked="notation == 'Scientific'"
        @change="setNotation($event)">
        <label class="form-check-label" for="flexRadioDefault1">
          Scientific Notation
        </label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" value="10💀 1🍆 100👪 100😠 1💀"
        :checked="notation == 'Emoji'"
        @change="setNotation($event)">
        <label class="form-check-label" for="flexRadioDefault2">
          10💀 1🍆 100👪 100😠 1💀
        </label>
      </div>
    </div>
  </div>
    <button style="width: 200px;" @click="saveLocal()">Save to browser</button> <button @click="exportLocal()">Export</button> <button @click="importLocal()">Import</button> Exported save/place to put imported save: <input id="export-import-input"></input>
    <br/>
    <span>You have played for {{ formatTime(playTime) }}.</span>
  </div>
  `
});

Vue.component('help', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      hasPrestiged: false,
      hasUnlockedTasks: false,
      currencyName: currency_name,
      prestigeName: prestige_name,
    }
  },
  methods: {
    update() {
      this.hasPrestiged = game.hasPrestiged;
      this.hasUnlockedTasks = game.tasks.unlocked;
    },
    format(x) {
      return format(x);
    },
    formatInt(x) {
      return formatInt(x);
    }
  },
  template: `<div>
  <p>This is an <a href="https://en.wikipedia.org/wiki/Incremental_game" target="_blank">incremental/idle game</a> containing eight minipuzzles to solve, hidden within various parts of the game.</p>
  <div>
    <h4>Instructions</h4>
    <ul style="text-align: left;">
      <li>Note: This game is slightly adjusted from the version that existed during the hunt, mostly in how saving works.
      This should not affect any puzzles.</li>
      <li>The objective of this game is to mine WarioCoins by purchasing WarioCoin miners.</li>
      <li>As you make more progress, you will unlock more upgrades, achievements, resources, and puzzles.</li>
      <li>Each answer is a string of letters A-Z or numbers 0-9. Lowercase letters will be changed into uppercase, and
      any other non-alphanumeric characters will be stripped before checking for correctness.</li>
      <li>You can save your gamestate to your browser, export your gamestate as a string, and import a gamestate as
      a string in the Options tab. The game also auto-saves once per ten seconds.</li>
      <li>There are no bad purchases - all purchases will increase your production - so feel free to explore.</li>
      <li>We recommend Chrome or Firefox when playing this game.</li>
      <li>It is not necessary to look at this page's source code (HTML, CSS, or JS) to solve any puzzles.</li>
      <li>This tab has some apparently empty space at the bottom. I wonder why.</li>
    </ul>
  </div>
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  <p style="color: white;">Here at th bottomfthis/tabb laes cnfussinly pushd noonssensse tu mayby, copare wwitth highost linne in hlp ttab.</p></div>`
});

Vue.component('autobuyers', {
  created() {
    nonstatic.push(this);
    this.costStrings = autobuyerCostStrings;
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      bought: [false, false, false, false, false, false, false, false, false],
      canBuy: [false, false, false, false, false, false, false, false, false],
      canSee: [false, false, false, false, false, false, false, false, false],
      costStrings: ['', '', '', '', '', '', '', '', '']
    }
  },
  methods: {
    update() {
      this.bought = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(isAutobuyerUnlocked);
      this.canBuy = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(canAutobuyerBeBought);
      this.canSee = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(canAutobuyerUnlockBeSeen);
    },
    buyAutobuyer(x) {
      buyAutobuyer(x);
    }
  },
  template: `
  <div>
  <span>You can buy autobuyers in this tab.</span>
  <br/>
  <span>Autobuyers will automatically buy miners and boosts for you.</span>
  <br/>
  <span>You can turn them on or off in the Main tab.</span>
  <br/>
  <table style="margin-left: auto; margin-right: auto;">
    <tbody>
      <tr v-for="i in 3" v-if="canSee[3 * i - 3]">
        <td v-for="j in 3"><button v-if="canSee[3 * i + j - 4]" style="width: 250px; height: 60px;" :class="bought[3 * i
        + j - 4] ? 'bought' : (canBuy[3 * i + j - 4] ? '' : 'disabled')" @click="buyAutobuyer(3 * i + j - 4)">Unlock {{ (3 * i + j - 4 === 0) ? 'boost' : ('Miner ' + (3 * i + j - 4)) }} autobuyer</br>Cost: {{ costStrings[3 * i + j - 4] }}</button></td>
      </tr>
    </tbody>
  </table>
  </div>
  `
});

Vue.component('upgrades', {
  created() {
    nonstatic.push(this);
    this.names = prestigeUpgradeNames;
    this.costs = prestigeUpgradeCosts;
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      prestigeCurrency: 0,
      prestigeCurrencyEffect: 0,
      prestigeUpgradeOtherEffect: 0,
      effects: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      bought: [false, false, false, false, false, false, false, false, false],
      canBuy: [false, false, false, false, false, false, false, false, false],
      canSee: [false, false, false, false, false, false, false, false, false],
      currencyName: currency_name,
      prestigeName: prestige_name,
    }
  },
  methods: {
    update() {
      this.prestigeCurrency = game.prestigeCurrency;
      this.prestigeCurrencyEffect = prestigeCurrencyEffect();
      this.prestigeUpgradeOtherEffect = getPrestigeUpgradeOtherEffect();
      this.effects = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(getPrestigeUpgradeEffectIfBought);
      this.bought = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(isPrestigeUpgradeBought);
      this.canBuy = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(canPrestigeUpgradeBeBought);
      this.canSee = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(canPrestigeUpgradeBuyBeSeen);
    },
    buyPrestigeUpgrade(x) {
      buyPrestigeUpgrade(x);
    },
    format(x) {
      return format(x);
    },
    formatInt(x) {
      return formatInt(x);
    }
  },
  template: `
  <div>
  <span>The below upgrades all cost {{ prestigeName }}.</span>
  <br/>
  <span>Each upgrade bought also multiplies production by 2x (currently {{ formatInt(prestigeUpgradeOtherEffect) }}x).</span>
  <br/>
  <table style="margin-left: auto; margin-right: auto;">
    <tbody>
      <tr v-for="i in 3" v-if="canSee[3 * i - 3]">
        <td v-for="j in 3"><button v-if="canSee[3 * i + j - 4]" :class="bought[3 * i + j - 4] ? 'big-button bought' :
        (canBuy[3 * i + j - 4] ? 'big-button' : 'big-button disabled')" @click="buyPrestigeUpgrade(3 * i + j - 4)">{{
        names[3 * i + j - 4] }}<br/><br/>All production {{ (3 * i + j - 4 === 0) ? '1.002' : '1.005' }}x<br/>per {{ (3 * i + j - 4 === 0) ? 'Miner' : ('Miner ' + (3 * i + j - 4)) }} bought</br>Effect: {{ format(effects[3 * i + j - 4]) }}, Cost: {{ formatInt(costs[3 * i + j - 4]) }}</button></td>
      </tr>
    </tbody>
  </table>
  </div>
  `
});

Vue.component('minigame', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
    $(function () {
      $(".popover-rewards-desc").popover({
        container: 'body',
        content: "Each click gives you 10 seconds worth of " + currency_name + " production. You can also purchase\
        upgrades to increase per-click rewards (+5 seconds worth of production per upgrade).",
        trigger: 'focus',
      })
    });
  },
  data() {
    return {
      clickableBonusSeconds: 0,
      canBuyClickableBonus: false,
      clickableCost: 0,
      isPlayingClickableMinigame: false,
      currencyName: currency_name,
      prestigeName: prestige_name,
    }
  },
  methods: {
    update() {
      this.clickableBonusSeconds = clickableBonusSeconds();
      this.canBuyClickableBonus = canIncreaseClickableLevel();
      this.clickableCost = increaseClickableLevelCost();
      this.isPlayingClickableMinigame = game.isPlayingClickableMinigame;
    },
    increaseClickableLevel() {
      increaseClickableLevel();
    },
    startClickableMinigame() {
      startClickableMinigame();
    },
    format(x) {
      return format(x);
    },
    formatInt(x) {
      return formatInt(x);
    },
    formatTime(x) {
      return formatTime(x);
    },
  },
  template: `
  <div>
  <span>Play a minigame where you can click things to gain rewards!</span>
  <span class="material-icons btn px-0 popover-rewards-desc" tabindex="0" role="button" data-toggle="popover"
data-trigger="focus"> help_outline</span>
  <br/>
  <br/>
  <button @click="startClickableMinigame()" :class="isPlayingClickableMinigame ? 'big-button disabled' : 'big-button'">
    {{ isPlayingClickableMinigame ? "Minigame Ongoing" : "Start Minigame!" }}
  </button>
  <br/>
  <br/>
  <button @click="increaseClickableLevel()" :class="canBuyClickableBonus ? 'big-button' : 'big-button disabled'">Upgrade minigame rewards!<br/>Cost: {{ formatInt(clickableCost) }} {{ prestigeName }}</button>
  <div style="min-height: 10px;"></div>
  </div>
  `
});

Vue.component('tasks', {
  created() {
    nonstatic.push(this);
    this.taskCost = taskUnlockCost();
    this.horClues = taskHorClues;
    this.vertClues = taskVertClues;
    this.horLengths = taskHorClues.map(x => x[0].length);
    this.vertLengths = taskVertClues.map(x => x[0].length);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      tasksUnlocked: false,
      canUnlockTasks: false,
      solvedTasks: 0,
      solvedTasksEffect: 0,
      grids: [],
      currencyName: currency_name,
      prestigeName: prestige_name,
    }
  },
  methods: {
    update() {
      this.tasksUnlocked = game.tasks.unlocked;
      this.canUnlockTasks = canUnlockTasks();
      this.solvedTasks = game.tasks.solved;
      this.solvedTasksEffect = getSolvedTasksEffect();
      // We need this for reactivity.
      this.grids = game.tasks.grids.map(i => i.map(j => j));
    },
    unlockTasks() {
      unlockTasks();
    },
    resetCurrentGrid() {
      resetCurrentGrid();
    },
    changeCell(i, j, k, value) {
      changeCell(i, j, k, value);
    },
    inBounds(i, j, k) {
      return this.vertLengths[i - 1] + 1 <= j && this.horLengths[i - 1] + 1 <= k && k <= this.horLengths[i - 1] + 8;
    },
    atGrid(i, j, k) {
      return this.grids[i - 1][j - this.vertLengths[i - 1] - 1][k - this.horLengths[i - 1] - 1]
    },
    format(x) {
      return format(x);
    },
    formatInt(x) {
      return formatInt(x);
    }
  },
  template: `
  <div>
  <div v-if="!tasksUnlocked">
    <button @click="unlockTasks()" :class="canUnlockTasks ? 'big-button' : 'big-button disabled'">Unlock tasks<br/>Cost: {{ formatInt(taskCost) }} {{ prestigeName }}</button>
  </div>
  <div v-else>
    <span>You have {{ formatInt(solvedTasks) }} solved tasks, multiplying production by {{ format(solvedTasksEffect) }}x (0.500 more per solved task).</span>
    <br/>
    <span>Once you solve a task, you'll unlock another one.</span>
    <br/>
    <span>Click cells to change them between white (unknown), filled, and known unfilled (red x).</span>
    <br/>
    <span>Control-click or right-click to change them in the other direction.</span>
    <br/>
    <br/>
    <div v-for="i in 7" v-if="solvedTasks >= i - 1">
      <div style="min-height: 60px;"></div>
      <span :class="(solvedTasks > i - 1) ? 'good-text' : 'bad-text'">Task {{ i }} {{ solvedTasks > i - 1 ? "(solved)" : "(unsolved)" }}:</span>
      <table style="margin-left: auto; margin-right: auto; border-collapse: collapse;">
        <tbody>
          <tr v-for="j in vertLengths[i - 1] + 8" style="height: 50px;">
            <td v-for="k in horLengths[i - 1] + 9" :style="'height: 50px; padding: 0px 0px;' + ((k === horLengths[i - 1] + 9) ? 'width: ' + (50 * horLengths[i - 1]) + 'px;' : 'width: 50px;') + (inBounds(i, j, k) ? 'border: 1px solid black; background-color: ' + ['white', 'black', 'white'][atGrid(i, j, k)] + '; font-size: 30px; color: #cc1166;' : '') + 'text-align: center;'" @click="changeCell(i - 1, j - vertLengths[i - 1] - 1, k - horLengths[i - 1] - 1, 1)" @contextmenu.prevent="changeCell(i - 1, j - vertLengths[i - 1] - 1, k - horLengths[i - 1] - 1, 2)">
            {{ (j <= vertLengths[i - 1] && horLengths[i - 1] + 1 <= k && k <= horLengths[i - 1] + 8) ? vertClues[i - 1][k - horLengths[i - 1] - 1][j - 1] : ((vertLengths[i - 1] + 1 <= j && k <= horLengths[i - 1]) ? horClues[i - 1][j - vertLengths[i - 1] - 1][k - 1] : ((inBounds(i, j, k) && atGrid(i, j, k) === 2) ? '×' : '')) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="min-height: 20px;"></div>
    <button style="width: 200px;" @click="resetCurrentGrid()" v-if="solvedTasks < 7">Reset current task</button>
    <div style="min-height: 20px;"></div>
  </div>
  </div>
  `
});

Vue.component('puzzles', {
  created() {
    nonstatic.push(this);
  },
  destroyed() {
    nonstatic = nonstatic.filter(i => i !== this);
  },
  mounted() {
    if (game) {
      this.update();
    }
  },
  data() {
    return {
      index: 0,
      nextPuzzleDataIsNonempty: false,
      unlockedPuzzles: [],
      solved: [],
      flavortext: '',
      requirement: 0,
      requirementType: '',
      displayRequirementType: '',
      currencyName: currency_name,
      prestigeName: prestige_name,
      canBuy: false,
    };
  },
  methods: {
    update() {
      let puzzle = puzzleData.filter((x, i) => !game.puzzleUnlocks[i])[0] || {};
      this.index = puzzleData.indexOf(puzzle);
      this.nextPuzzleDataIsNonempty = Object.keys(puzzle).length > 0;
      this.nextPuzzleIsMeta = puzzle.is_meta;
      this.unlockedPuzzles = puzzleData.filter((x, i) => game.puzzleUnlocks[i]);
      this.solved = game.puzzleSolves.filter((x, i) => game.puzzleUnlocks[i]);
      this.flavortext = puzzle.flavortext;
      this.requirement = puzzle.requirement;
      this.requirementType = {'CURRENCY': 'currency', 'PRESTIGE': 'prestigeCurrency'}[puzzle.requirement_unit];
      this.displayRequirementType = {'CURRENCY': currency_name, 'PRESTIGE': prestige_name}[puzzle.requirement_unit];
      this.canBuy = this.canBuyPuzzle();
    },
    canBuyPuzzle() {
      return this.nextPuzzleDataIsNonempty && game[this.requirementType] >= this.requirement;
    },
    buyPuzzle() {
      if (!this.canBuyPuzzle()) {
        return;
      }
      // The bad case of the puzzle having been unlocked isn't possible locally.
      makeNotification('Unlocked puzzle "' + puzzleData[this.index].name + '"!', 'answer-notification-area');
      game.puzzleUnlocks[this.index] = true;
    },
    maybeCheckAnswer(event) {
      // This is the key code for return.
      if (event.keyCode === 13) {
        this.checkAnswer();
      }
    },
    checkAnswer() {
      checkAnswer(document.getElementById('answer').value);
    },
    formatInt(x) {
      return formatInt(x);
    }
  },
  template: `
  <div>
  <span>You can unlock more puzzles as you get more {{ currencyName }} and {{ prestigeName }}.</span>
  <br/>
  <br/>
  <span>Answer checker: <input id="answer" @keydown="maybeCheckAnswer"></input> <button @click="checkAnswer()">Submit</button></span>
  <div id="answer-notification-area"></div>
  <br/>
  <br/>
  <div class="row">
      <div v-for="i in unlockedPuzzles.length" :class="unlockedPuzzles[i-1].is_meta ? 'col-sm-12 my-2 card-meta-container' : 'col-sm-6 my-2 card-container'">
        <div class="card card-flip h-100">
          <div class="card-front bg-gray">
            <div class="card-body">
              <h5 class="card-title">{{ unlockedPuzzles[i-1].name }}</h5>
              <h6 class="round-3-solved-title-answer" v-if="solved[i-1]">
                Answer: {{ unlockedPuzzles[i-1].display_answer }}
              </h6>
            </div>
          </div>
          <div class="card-back">
            <div class="card-body">
              <p class="card-text justify-content-center">
                <span v-if="unlockedPuzzles[i-1].flavortext" v-html="unlockedPuzzles[i - 1].flavortext"></span>
                <img v-if="unlockedPuzzles[i-1].is_meta" class="w-75 pb-5"
                src="/static/puzzle_resources/wah_street_bets/images/aBAUyb0U6y.png">
              </p>
            </div>
          </div>
        </div>
      </div>
    <div v-if="nextPuzzleDataIsNonempty" :class="nextPuzzleIsMeta ? 'col-sm-12 my-2 card-meta-container' : 'col-sm-6 my-2 card-container'">
      <div class="card h-100 justify-content-center">
        <div :class="canBuy? 'card card-unlock h-100 justify-content-center bg-gray' : 'card card-unlock h-100 justify-content-center disabled'" @click="buyPuzzle()"> 
          Click to unlock next puzzle<br/><br/>Requires: {{ formatInt(requirement) }} {{ displayRequirementType }}
        </div>
      </div>
    </div>
  </div>
  <br/>
  <br/>
  <br/>
  </div>
  `
});

let nonstatic = [];

