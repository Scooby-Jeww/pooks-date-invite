const askView = document.getElementById("askView");
const plannerView = document.getElementById("plannerView");
const countdownView = document.getElementById("countdownView");
const introLoader = document.getElementById("introLoader");
const buttonRow = document.getElementById("buttonRow");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const noHint = document.getElementById("noHint");
const srStatus = document.getElementById("srStatus");
const celebrationLayer = document.getElementById("celebrationLayer");
const finalSurprise = document.getElementById("finalSurprise");
const finalReplayBtn = document.getElementById("finalReplayBtn");

const dateForm = document.getElementById("dateForm");
const dateSelect = document.getElementById("dateSelect");
const timeSelect = document.getElementById("timeSelect");
const formError = document.getElementById("formError");
const backBtn = document.getElementById("backBtn");

const countdownDate = document.getElementById("countdownDate");
const textMePrompt = document.getElementById("textMePrompt");
const countdownMessage = document.getElementById("countdownMessage");
const changeDateBtn = document.getElementById("changeDateBtn");
const resetBtn = document.getElementById("resetBtn");
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

const STORAGE_KEY = "dateInviteStateV1";
const isTouch = window.matchMedia("(hover: none)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let noTries = 0;
let noCanBecomeYes = false;
let accepted = false;
let countdownTarget = null;
let countdownTimer = null;
let noMoveCooldownUntil = 0;
let finalShown = false;
let lastCursorHeartAt = 0;

function spawnCursorHeart(clientX, clientY) {
  const now = Date.now();
  if (now - lastCursorHeartAt < 70) {
    return;
  }
  lastCursorHeartAt = now;

  const heart = document.createElement("span");
  heart.className = "cursor-heart";
  heart.textContent = Math.random() > 0.5 ? "❤" : "♡";
  heart.style.left = `${clientX}px`;
  heart.style.top = `${clientY}px`;
  heart.style.color = Math.random() > 0.5 ? "#ff6f91" : "#ff8d6b";
  document.body.appendChild(heart);

  window.setTimeout(() => {
    heart.remove();
  }, 800);
}

function setDateTimeDropdownDefaults() {
  const now = new Date();
  if (!dateSelect.value) {
    dateSelect.value = toDateValue(now);
  }

  if (!timeSelect.value) {
    const inThirtyMinutes = new Date(now.getTime() + 30 * 60 * 1000);
    const rounded = new Date(inThirtyMinutes);
    rounded.setMinutes(Math.ceil(rounded.getMinutes() / 15) * 15, 0, 0);
    timeSelect.value = `${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`;
  }
}

function populateDateOptions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const optionCount = 120;

  for (let i = 0; i < optionCount; i += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() + i);
    const value = toDateValue(current);
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(current);

    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    dateSelect.appendChild(option);
  }
}

function populateTimeOptions() {
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${pad(hour)}:${pad(minute)}`;
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      const label = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);

      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      timeSelect.appendChild(option);
    }
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function showView(view) {
  askView.classList.add("hidden");
  plannerView.classList.add("hidden");
  countdownView.classList.add("hidden");
  view.classList.remove("hidden");
}

function announce(text) {
  srStatus.textContent = text;
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function moveNoButton() {
  if (noCanBecomeYes) {
    return;
  }

  const now = Date.now();
  if (now < noMoveCooldownUntil) {
    return;
  }
  noMoveCooldownUntil = now + 240;

  const buttonRowRect = buttonRow.getBoundingClientRect();
  const btnWidth = noBtn.offsetWidth;
  const btnHeight = noBtn.offsetHeight;
  const maxX = Math.max(0, buttonRowRect.width - btnWidth - 6);
  const maxY = Math.max(0, buttonRowRect.height - btnHeight - 6);

  const currentX = Number.parseFloat(noBtn.style.left || `${maxX / 2}`);
  const currentY = Number.parseFloat(noBtn.style.top || `${maxY / 2}`);
  const stepX = randomInRange(-70, 70);
  const stepY = randomInRange(-55, 55);

  const yesRect = yesBtn.getBoundingClientRect();
  const yesCenterX = yesRect.left + yesRect.width / 2;
  const yesCenterY = yesRect.top + yesRect.height / 2;
  const minDistanceFromYes = Math.min(180, buttonRowRect.width * 0.38);

  let nextX = Math.min(Math.max(0, currentX + stepX), maxX);
  let nextY = Math.min(Math.max(0, currentY + stepY), maxY);

  // Keep the no button playful but avoid landing too close to the yes button.
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const candidateX = Math.min(Math.max(0, randomInRange(0, maxX)), maxX);
    const candidateY = Math.min(Math.max(0, randomInRange(0, maxY)), maxY);
    const noCenterX = buttonRowRect.left + candidateX + btnWidth / 2;
    const noCenterY = buttonRowRect.top + candidateY + btnHeight / 2;
    const distanceFromYes = Math.hypot(noCenterX - yesCenterX, noCenterY - yesCenterY);

    if (distanceFromYes >= minDistanceFromYes) {
      nextX = candidateX;
      nextY = candidateY;
      break;
    }
  }

  noBtn.classList.add("no-run");
  noBtn.style.left = `${nextX}px`;
  noBtn.style.top = `${nextY}px`;
  noBtn.style.transition = "left 220ms ease, top 220ms ease";

  noTries += 1;

  if (noTries >= 4) {
    noCanBecomeYes = true;
    noBtn.classList.add("no-transform");
    noBtn.textContent = "Yes 💘";
    noHint.textContent = "Hehe, it transformed into Yes.";
    announce("No button transformed into yes.");
  } else {
    const left = 4 - noTries;
    noHint.textContent = `Nice try. ${left} more and it gives up.`;
    announce("The no button moved away.");
  }
}

function maybeEvadeFromPointer(event) {
  if (isTouch || noCanBecomeYes || accepted) {
    return;
  }

  const rect = noBtn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);

  if (distance < 65 && Math.random() < 0.75) {
    moveNoButton();
  }
}

function playCelebration() {
  document.body.classList.add("accepted");

  const phaseOne = ["🎉", "✨", "💫", "🎊"];
  const phaseTwo = ["💖", "💘", "💕", "🌸", "🌷"];
  const phaseThree = ["🩷", "💞", "💓", "🌟", "🎆"];

  function spawnBurst(items, count, useHeartClass = false) {
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("div");
      particle.className = useHeartClass ? "heart" : "confetti";
      particle.textContent = items[i % items.length];
      particle.style.left = `${randomInRange(4, 96)}vw`;
      particle.style.top = `${randomInRange(-15, 8)}vh`;
      particle.style.bottom = `${randomInRange(-10, 8)}vh`;
      particle.style.animationDelay = `${randomInRange(0, 0.2)}s`;
      celebrationLayer.appendChild(particle);
    }
  }

  spawnBurst(phaseOne, 18, false);
  window.setTimeout(() => {
    spawnBurst(phaseTwo, 14, true);
  }, 280);
  window.setTimeout(() => {
    spawnBurst(phaseThree, 20, false);
  }, 620);

  window.setTimeout(() => {
    celebrationLayer.innerHTML = "";
    document.body.classList.remove("accepted");
  }, 3200);
}

function showFinalSurprise() {
  finalSurprise.classList.remove("hidden");

  const burstItems = ["💖", "✨", "🌸", "💘", "🎉", "💫"];
  for (let i = 0; i < 18; i += 1) {
    const burst = document.createElement("div");
    burst.className = "confetti";
    burst.textContent = burstItems[i % burstItems.length];
    burst.style.left = `${randomInRange(12, 88)}vw`;
    burst.style.top = `${randomInRange(-12, 0)}vh`;
    burst.style.animationDelay = `${randomInRange(0, 0.25)}s`;
    celebrationLayer.appendChild(burst);
  }

  window.setTimeout(() => {
    celebrationLayer.innerHTML = "";
  }, 3000);
}

function hideFinalSurprise() {
  finalSurprise.classList.add("hidden");
}

function onYes() {
  if (accepted) {
    return;
  }

  accepted = true;
  yesBtn.disabled = true;
  noBtn.disabled = true;
  announce("Yes selected. Opening date planner.");
  playCelebration();

  window.setTimeout(() => {
    showView(plannerView);
    yesBtn.disabled = false;
    noBtn.disabled = false;
    setDateTimeDropdownDefaults();
    dateSelect.focus();
  }, 1400);
}

function validateDateTime(dateText, timeText) {
  if (!dateText || !timeText) {
    return { ok: false, message: "Please choose both a date and time." };
  }

  const selected = new Date(`${dateText}T${timeText}:00`);

  if (Number.isNaN(selected.getTime())) {
    return { ok: false, message: "Please enter a valid date and time." };
  }

  if (selected.getTime() <= Date.now()) {
    return { ok: false, message: "Pick a future date and time, cutie." };
  }

  return { ok: true, selected };
}

function formatTargetDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function saveState() {
  const state = {
    accepted,
    noTries,
    noCanBecomeYes,
    countdownTarget: countdownTarget ? countdownTarget.toISOString() : null,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const state = JSON.parse(raw);
    accepted = Boolean(state.accepted);
    noTries = Number(state.noTries) || 0;
    noCanBecomeYes = Boolean(state.noCanBecomeYes);

    if (noCanBecomeYes) {
      noBtn.classList.add("no-transform");
      noBtn.textContent = "Yes 💘";
      noHint.textContent = "Hehe, it transformed into Yes.";
    }

    if (state.countdownTarget) {
      const parsed = new Date(state.countdownTarget);
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        countdownTarget = parsed;
        showView(countdownView);
        renderCountdown();
        startCountdown();
      }
    }
  } catch {
    clearState();
  }
}

function renderCountdown() {
  if (!countdownTarget) {
    return;
  }

  const diff = countdownTarget.getTime() - Date.now();

  if (diff <= 0) {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    countdownMessage.textContent = "It is date time! Have the sweetest time ever 🌹";
    countdownView.classList.add("finished");
    countdownView.classList.remove("urgent");
    if (!finalShown) {
      finalShown = true;
      showFinalSurprise();
    }
    announce("Countdown completed.");
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);

  const urgentThresholdMs = 24 * 60 * 60 * 1000;
  if (diff < urgentThresholdMs) {
    countdownView.classList.add("urgent");
    countdownMessage.textContent = "Less than a day. Excitement level: maximum 💓";
  } else {
    countdownView.classList.remove("urgent");
    countdownMessage.textContent = "I cannot wait to see you 💕";
  }
}

function startCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  countdownDate.textContent = formatTargetDate(countdownTarget);
  textMePrompt.textContent = `Text me this date so we can lock it in: ${formatTargetDate(countdownTarget)} 💌`;
  renderCountdown();
  countdownTimer = window.setInterval(renderCountdown, 1000);
}

function onNoClick(event) {
  if (noCanBecomeYes) {
    onYes();
    return;
  }

  event.preventDefault();
  moveNoButton();
}

function wireEvents() {
  yesBtn.addEventListener("click", () => {
    onYes();
    saveState();
  });

  noBtn.addEventListener("mouseenter", moveNoButton);
  noBtn.addEventListener("click", (event) => {
    onNoClick(event);
    saveState();
  });

  document.addEventListener("mousemove", maybeEvadeFromPointer);
  if (!isTouch && !prefersReducedMotion) {
    document.addEventListener("mousemove", (event) => {
      spawnCursorHeart(event.clientX, event.clientY);
    });
  }
  document.addEventListener("touchstart", () => {
    if (!noCanBecomeYes && !accepted) {
      noHint.textContent = "Tap No a few times and watch it flip to Yes.";
    }
  }, { passive: true });

  dateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = validateDateTime(dateSelect.value, timeSelect.value);

    if (!result.ok) {
      formError.textContent = result.message;
      return;
    }

    formError.textContent = "";
    countdownTarget = result.selected;
    finalShown = false;
    hideFinalSurprise();
    countdownView.classList.remove("finished");
    showView(countdownView);
    startCountdown();
    announce("Countdown started.");
    saveState();
  });

  backBtn.addEventListener("click", () => {
    showView(askView);
  });

  changeDateBtn.addEventListener("click", () => {
    showView(plannerView);
    setDateTimeDropdownDefaults();
    dateSelect.focus();
  });

  resetBtn.addEventListener("click", () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    countdownTarget = null;
    accepted = false;
    finalShown = false;
    noTries = 0;
    noCanBecomeYes = false;
    yesBtn.disabled = false;
    noBtn.disabled = false;
    noBtn.textContent = "No";
    noBtn.classList.remove("no-transform", "no-run");
    noBtn.style.left = "";
    noBtn.style.top = "";
    noHint.textContent = "Tiny hint: this question only has one correct answer.";
    countdownView.classList.remove("urgent", "finished");
    textMePrompt.textContent = "";
    hideFinalSurprise();
    formError.textContent = "";
    clearState();
    showView(askView);
    announce("Reset complete.");
  });

  finalReplayBtn.addEventListener("click", () => {
    resetBtn.click();
  });

  window.addEventListener("resize", () => {
    if (!noBtn.classList.contains("no-run")) {
      return;
    }

    const maxX = Math.max(0, buttonRow.clientWidth - noBtn.offsetWidth - 6);
    const maxY = Math.max(0, buttonRow.clientHeight - noBtn.offsetHeight - 6);
    const currentX = Number.parseFloat(noBtn.style.left || "0");
    const currentY = Number.parseFloat(noBtn.style.top || "0");
    const clampedX = Math.min(Math.max(0, currentX), maxX);
    const clampedY = Math.min(Math.max(0, currentY), maxY);
    noBtn.style.left = `${clampedX}px`;
    noBtn.style.top = `${clampedY}px`;
  });
}

function init() {
  showView(askView);
  populateDateOptions();
  populateTimeOptions();
  setDateTimeDropdownDefaults();
  wireEvents();
  loadState();

  noMoveCooldownUntil = Date.now() + 380;

  const introDuration = prefersReducedMotion ? 500 : 1900;
  window.setTimeout(() => {
    introLoader.classList.add("hidden");
    document.body.classList.remove("is-loading");
    window.setTimeout(() => {
      introLoader.style.display = "none";
    }, 380);
  }, introDuration);
}

init();
