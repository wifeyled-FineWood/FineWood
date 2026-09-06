/**
 * Finewood Academy & FLM Sanctuary
 * Interactive Landing Page Scripts
 * Includes: 18+ Age Gate, Procedural Ambient Soundscape (Web Audio API),
 * Audio Player Controls, Character Filtering, and Centralized Patreon URL Configuration.
 */

// ==========================================
// 1. CONFIGURATION
// ==========================================
const CONFIG = {
  // Updated to your actual Patreon campaign link:
  PATREON_URL: "https://www.patreon.com/c/WifeyLed",
  
  // Storage key for 18+ verification persistence
  AGE_STORAGE_KEY: "finewood_age_verified_v1"
};

// ==========================================
// 2. DOM INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initPatreonLinks();
  initAgeGate();
  initAudioPlayer();
  initCharacterFilter();
  initFaqAccordion();
});

// Update all Patreon CTA buttons across the page
function initPatreonLinks() {
  const patreonButtons = document.querySelectorAll(".patreon-cta-btn");
  patreonButtons.forEach(btn => {
    btn.setAttribute("href", CONFIG.PATREON_URL);
  });
}

// ==========================================
// 3. 18+ AGE GATE VERIFICATION (<dialog>)
// ==========================================
function initAgeGate() {
  const dialog = document.getElementById("ageGateDialog");
  const confirmBtn = document.getElementById("btnConfirmAge");
  const rememberCheckbox = document.getElementById("chkRememberAge");

  if (!dialog || !confirmBtn) return;

  const isVerified = localStorage.getItem(CONFIG.AGE_STORAGE_KEY) === "true";

  if (!isVerified) {
    // Show modal dialog if not previously verified
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  confirmBtn.addEventListener("click", () => {
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem(CONFIG.AGE_STORAGE_KEY, "true");
    }
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  });
}

// ==========================================
// 4. AUDIO PLAYER & PROCEDURAL AMBIENCE
// ==========================================
const TRACKS = [
  {
    title: "Demerit Log & Cane Correction",
    speaker: "Narrated by: Misha & Elaine • Disciplinary Office",
    atmosphere: "Atmosphere: Ledger pen strokes, ticking clock, firm cane tap",
    duration: 225 // 3:45 in seconds
  },
  {
    title: "The Sissymaid Morning Inspection",
    speaker: "Narrated by: Eleanor • Sissymaid Wing & Nordlandia",
    atmosphere: "Atmosphere: Uniform inspection, starch rustle, stern guidance",
    duration: 252 // 4:12 in seconds
  },
  {
    title: "Level III Final Assessment",
    speaker: "Narrated by: Celeste • Counseling Department",
    atmosphere: "Atmosphere: Quiet office footfalls, ticking pocketwatch, absolute calm",
    duration: 210 // 3:30 in seconds
  },
  {
    title: "Southern Etiquette & Quiet Surrender",
    speaker: "Narrated by: Aunt Caroline & Beau • The Southern Manor",
    atmosphere: "Atmosphere: Veranda breeze, porcelain cups, unyielding velvet guidance",
    duration: 305 // 5:05 in seconds
  }
];

let currentTrackIndex = 0;
let isPlaying = false;
let currentTime = 0;
let playbackTimer = null;
let audioCtx = null;
let tickTimer = null;
let droneGain = null;
let masterGain = null;
let synthEnabled = true;

function initAudioPlayer() {
  const btnPlayPause = document.getElementById("btnPlayPause");
  const btnPrev = document.getElementById("btnPrevTrack");
  const btnNext = document.getElementById("btnNextTrack");
  const timelineBar = document.getElementById("timelineBar");
  const volumeSlider = document.getElementById("volumeSlider");
  const ambientToggle = document.getElementById("ambientToggle");
  const trackItems = document.querySelectorAll(".track-item");

  loadTrack(0);

  // Play/Pause
  btnPlayPause.addEventListener("click", () => {
    togglePlayPause();
  });

  // Track buttons
  btnPrev.addEventListener("click", () => {
    switchTrack((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length);
  });

  btnNext.addEventListener("click", () => {
    switchTrack((currentTrackIndex + 1) % TRACKS.length);
  });

  // Track list click
  trackItems.forEach((item) => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.getAttribute("data-track"), 10);
      switchTrack(idx);
    });
  });

  // Timeline scrubber click
  if (timelineBar) {
    timelineBar.addEventListener("click", (e) => {
      const rect = timelineBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      currentTime = Math.floor(ratio * TRACKS[currentTrackIndex].duration);
      updateTimelineUI();
    });
  }

  // Volume slider
  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(val, audioCtx.currentTime);
      }
    });
  }

  // Ambience toggle
  if (ambientToggle) {
    ambientToggle.addEventListener("change", (e) => {
      synthEnabled = e.target.checked;
      if (!synthEnabled && droneGain && audioCtx) {
        droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
      } else if (synthEnabled && isPlaying && droneGain && audioCtx) {
        droneGain.gain.setTargetAtTime(0.04, audioCtx.currentTime, 0.1);
      }
    });
  }
}

function loadTrack(index) {
  currentTrackIndex = index;
  currentTime = 0;
  const track = TRACKS[index];

  document.getElementById("playerTrackTitle").textContent = track.title;
  document.getElementById("playerTrackSpeaker").textContent = track.speaker;
  document.querySelector(".audio-mood-tag").textContent = track.atmosphere;
  document.getElementById("timeTotal").textContent = formatTime(track.duration);
  document.getElementById("timeCurrent").textContent = "0:00";
  document.getElementById("timelineFill").style.width = "0%";

  // Highlight list item
  const trackItems = document.querySelectorAll(".track-item");
  trackItems.forEach((item, idx) => {
    const indicator = item.querySelector(".track-play-indicator");
    if (idx === index) {
      item.classList.add("active");
      if (indicator) indicator.textContent = isPlaying ? "Playing" : "Selected";
    } else {
      item.classList.remove("active");
      if (indicator) indicator.textContent = "Preview";
    }
  });
}

function switchTrack(index) {
  loadTrack(index);
  if (isPlaying) {
    startPlaybackTimer();
  }
}

function togglePlayPause() {
  if (isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  isPlaying = true;
  document.getElementById("playIcon").textContent = "❚❚";
  document.getElementById("vinylDisc").classList.add("spinning");
  document.getElementById("toneArm").classList.add("active");
  document.getElementById("audioSpectrum").classList.add("playing");

  const activeItem = document.querySelector(".track-item.active .track-play-indicator");
  if (activeItem) activeItem.textContent = "Playing";

  initWebAudioSynth();
  startPlaybackTimer();
}

function pausePlayback() {
  isPlaying = false;
  document.getElementById("playIcon").textContent = "▶";
  document.getElementById("vinylDisc").classList.remove("spinning");
  document.getElementById("toneArm").classList.remove("active");
  document.getElementById("audioSpectrum").classList.remove("playing");

  const activeItem = document.querySelector(".track-item.active .track-play-indicator");
  if (activeItem) activeItem.textContent = "Paused";

  clearInterval(playbackTimer);
  stopWebAudioSynth();
}

function startPlaybackTimer() {
  clearInterval(playbackTimer);
  playbackTimer = setInterval(() => {
    currentTime++;
    if (currentTime > TRACKS[currentTrackIndex].duration) {
      // Advance to next track
      switchTrack((currentTrackIndex + 1) % TRACKS.length);
      return;
    }
    updateTimelineUI();
  }, 1000);
}

function updateTimelineUI() {
  const duration = TRACKS[currentTrackIndex].duration;
  const ratio = (currentTime / duration) * 100;
  document.getElementById("timelineFill").style.width = `${ratio}%`;
  document.getElementById("timeCurrent").textContent = formatTime(currentTime);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// ==========================================
// Procedural Web Audio Ambient Sound Generator
// (Ticking Grandfather Clock & Warm Calming Drone)
// ==========================================
function initWebAudioSynth() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }

    // Warm peaceful drone oscillator
    if (synthEnabled && !droneGain) {
      droneGain = audioCtx.createGain();
      droneGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 warm fundamental

      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(masterGain);
      osc.start();
    }

    // Pendulum Clock Tick Generator (every 1000ms)
    clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      if (!isPlaying || !synthEnabled || !audioCtx) return;
      playClockTick();
    }, 1000);

  } catch (err) {
    console.warn("Web Audio API not allowed or supported in this context.", err);
  }
}

function playClockTick() {
  if (!audioCtx || audioCtx.state !== "running") return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // Subtle wooden click
  osc.type = "triangle";
  osc.frequency.setValueAtTime(650, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.05);
}

function stopWebAudioSynth() {
  clearInterval(tickTimer);
  if (droneGain && audioCtx) {
    droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    droneGain = null;
  }
}

// ==========================================
// 5. CHARACTER FILTER TABS
// ==========================================
function initCharacterFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const charCards = document.querySelectorAll(".char-card");

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");

      charCards.forEach(card => {
        const category = card.getAttribute("data-category");
        if (filter === "all" || category === filter) {
          card.style.display = "flex";
          card.style.opacity = "0";
          setTimeout(() => {
            card.style.transition = "opacity 0.4s ease";
            card.style.opacity = "1";
          }, 10);
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// ==========================================
// 6. FAQ ACCORDION
// ==========================================
function initFaqAccordion() {
  const triggers = document.querySelectorAll(".accordion-trigger");

  triggers.forEach(trigger => {
    trigger.addEventListener("click", () => {
      const item = trigger.parentElement;
      const content = item.querySelector(".accordion-content");
      const isActive = item.classList.contains("active");

      // Close all other items
      document.querySelectorAll(".accordion-item").forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
          const otherContent = otherItem.querySelector(".accordion-content");
          if (otherContent) otherContent.style.maxHeight = null;
        }
      });

      // Toggle clicked item
      if (isActive) {
        item.classList.remove("active");
        content.style.maxHeight = null;
      } else {
        item.classList.add("active");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
}
