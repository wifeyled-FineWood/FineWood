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
  AGE_STORAGE_KEY: "finewood_age_verified_v1",

  // Firebase Configuration for Finewood Live Registry (Firestore)
  FIREBASE: {
    apiKey: "AIzaSyDaZDZY0AexfQpZetYtCYgeCrriUWi4A3I",
    authDomain: "finewood-6860e.firebaseapp.com",
    projectId: "finewood-6860e",
    storageBucket: "finewood-6860e.firebasestorage.app",
    messagingSenderId: "822221176646",
    appId: "1:822221176646:web:fad1508e0ee21b0e406f47",
    measurementId: "G-TRLZFH167T"
  }
};

// ==========================================
// 2. DOM INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initPatreonLinks();
  initMobileNav();
  initAgeGate();
  initAudioPlayer();
  initExcerptViewer();
  initCharacterFilter();
  initFaqAccordion();
  initIntakeChat();
  initRegistry();
});

// Update all Patreon CTA buttons across the page
function initPatreonLinks() {
  const patreonButtons = document.querySelectorAll(".patreon-cta-btn");
  patreonButtons.forEach(btn => {
    btn.setAttribute("href", CONFIG.PATREON_URL);
  });
}

// Mobile Hamburger Navigation Drawer
function initMobileNav() {
  const toggleBtn = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  const links = navLinks.querySelectorAll("a");
  links.forEach(link => {
    link.addEventListener("click", () => {
      toggleBtn.classList.remove("open");
      navLinks.classList.remove("open");
    });
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
    speaker: "Narrated by: Ms. Misha & Ms. Elaine • Disciplinary Liaison Office",
    atmosphere: "Atmosphere: Leather ledger pen scratches, ticking mantel clock, firm cane cadence",
    duration: 225 // 3:45 in seconds
  },
  {
    title: "Sissymaid Morning Inspection",
    speaker: "Narrated by: Eleanor • Sissymaid Wing & Nordlandia",
    atmosphere: "Atmosphere: Starched aprons, feather duster rustle, measured domestic commands",
    duration: 252 // 4:12 in seconds
  },
  {
    title: "Level III Final Assessment",
    speaker: "Narrated by: Counselor Celeste • 3-Tier Counseling Wing",
    atmosphere: "Atmosphere: Quiet office footfalls, silver pocketwatch, austere corner sentencing",
    duration: 210 // 3:30 in seconds
  },
  {
    title: "Peach Blossom Principles & 'Ol Hickory",
    speaker: "Narrated by: Aunt Caroline & Ms. Beau • The Southern Manor",
    atmosphere: "Atmosphere: Veranda breeze, porcelain teacups, paddle correction, velvet southern charm",
    duration: 305 // 5:05 in seconds
  },
  {
    title: "Bramley Hall Posture & Metronome",
    speaker: "Narrated by: Matron Hawthorne & Ms. Wu • Music & Decorum Hall",
    atmosphere: "Atmosphere: Relentless mechanical metronome, rattan cane taps, book-balancing drills",
    duration: 260 // 4:20 in seconds
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
// 4B. THE FINEWOOD CHRONICLES (EXCERPTS VIEWER)
// ==========================================
const EXCERPT_ARCHIVES = {
  misha: {
    tag: "FIN-INTAKE-042 • The Office of Demerits",
    fileId: "Audio Drama Episode 14 • Archive Ref #4129",
    quote: "“We believe in fairness above all else. Every cub adheres to the exact same rules, and discipline is tailored to their needs… but always firm. Chastity is strictly enforced; it lessens distractions. Here, no one asks what you feel like doing, what you wish to wear, or how you think your evening should be spent. The burden of deciding who you ought to be is taken completely out of your hands.”",
    speaker: "Ms. Misha",
    title: "Disciplinary Registrar & Intake Dean (4,129 Archive Mentions)"
  },
  beau: {
    tag: "SOU-PEACH-019 • Peach Blossom Principles",
    fileId: "Serialized Audio Episode 28 • Belle Bootcamp",
    quote: "“Well, hello there, sugar. Now don’t you look at me with those wide eyes. Pride down here is just the longest way around learning your manners. When a mother’s gentle reminders are too far away to be heard, Peach Blossom Principles delivers the message in a way that sticks. Put your heels together, shoulders square, and let’s get that attitude simmered down right quick. 'Ol Hickory is right here in my bag.”",
    speaker: "Ms. Abby Beau",
    title: "Etiquette Directress & Belle Bootcamp Commander (2,081 Archive Mentions)"
  },
  elaine: {
    tag: "FIN-LIAISON-108 • Office of Discipline Liaison",
    fileId: "Demerit Log & Cane Correction Series",
    quote: "“Instructors could simply send a cub down to her office with a brief note, a name, an infraction, and the preferred implement. It kept classrooms on task and ensured no misdeed, however minor, slipped through the cracks. A raised voice in study hall, a smirk during chapel—all led swiftly and without fanfare to the olive green door. The door closed behind her with that distinct Finewood finality.”",
    speaker: "Ms. Elaine",
    title: "Discipline Liaison & Formal Cane Enforcer"
  },
  hawthorne: {
    tag: "FIN-BRAMLEY-001 • Bramley Hall Music & Decorum",
    fileId: "Serialized Saga: Part IV • The Metronome Suite",
    quote: "“The polished parquet of Bramley Hall’s waiting room gleamed under the late afternoon sun, catching the shadow of Headmistress Beatrice Hawthorne. Her cane—a sturdy, polished length of rattan—tapped once against the floorboard. A single sound that brought immediate, breathless stillness to every ward in the corridor. You do not explain yourself here; you simply stand straight, bow your head, and listen.”",
    speaker: "Matron Beatrice Hawthorne",
    title: "Directress of Bramley Hall & Music Disciplinarian"
  },
  kathy: {
    tag: "FIN-INSPECT-063 • Curfew & Wardrobe Inspection",
    fileId: "Evening Protocol Audio 09 • Dormitory Mother",
    quote: "“The office was a blend of warmth and authority—soft leather chairs and a large oak desk, but the framed motto on the wall was unmistakable: Discipline Breeds Success. When curfew sounds at nine, the corridors fall silent, the uniforms are folded precisely at the foot of each cot, and autonomy is gently tucked away until morning.”",
    speaker: "Ms. Kathy",
    title: "Residential Dorm Matron & Curfew Inspector (1,374 Archive Mentions)"
  }
};

window.switchExcerptTab = function(tabId) {
  const item = EXCERPT_ARCHIVES[tabId];
  if (!item) return;

  const card = document.getElementById("folioCard");
  const tabBtns = document.querySelectorAll(".excerpt-tab-btn");

  tabBtns.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (card) {
    card.style.opacity = "0";
    card.style.transform = "translateY(8px)";
    card.style.transition = "opacity 0.2s ease, transform 0.2s ease";

    setTimeout(() => {
      const tagEl = document.getElementById("folioArchiveTag");
      const idEl = document.getElementById("folioFileId");
      const quoteEl = document.getElementById("folioQuote");
      const speakerEl = document.getElementById("folioSpeaker");
      const titleEl = document.getElementById("folioSpeakerTitle");

      if (tagEl) tagEl.textContent = item.tag;
      if (idEl) idEl.textContent = item.fileId;
      if (quoteEl) quoteEl.textContent = item.quote;
      if (speakerEl) speakerEl.textContent = item.speaker;
      if (titleEl) titleEl.textContent = item.title;

      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200);
  }
};

function initExcerptViewer() {
  const tabBtns = document.querySelectorAll(".excerpt-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      if (tabId) {
        window.switchExcerptTab(tabId);
      }
    });
  });
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

// ==========================================
// 7. TIER CATEGORY SWITCHER
// ==========================================
window.switchTierCategory = function(category) {
  const studentGrid = document.getElementById("studentTiersGrid");
  const facultyGrid = document.getElementById("facultyTiersGrid");
  const tabStudent = document.getElementById("tabStudentTiers");
  const tabFaculty = document.getElementById("tabFacultyTiers");

  if (!studentGrid || !facultyGrid) return;

  if (category === "student") {
    studentGrid.style.display = "grid";
    facultyGrid.style.display = "none";
    if (tabStudent) tabStudent.classList.add("active");
    if (tabFaculty) tabFaculty.classList.remove("active");
  } else {
    studentGrid.style.display = "none";
    facultyGrid.style.display = "grid";
    if (tabStudent) tabStudent.classList.remove("active");
    if (tabFaculty) tabFaculty.classList.add("active");
  }
};

// ==========================================
// 8. OPTION 3: INTERACTIVE INTAKE CHATBOT (MATRON HAWTHORNE)
// ==========================================
function initIntakeChat() {
  const fab = document.getElementById("intakeFab");
  const modal = document.getElementById("intakeChatModal");
  const closeBtn = document.getElementById("intakeCloseBtn");
  const messagesContainer = document.getElementById("intakeChatMessages");
  const inputArea = document.getElementById("intakeChatInputArea");

  if (!fab || !modal || !messagesContainer || !inputArea) return;

  let intakeState = {
    step: 0,
    wardTitle: "Weary Ward",
    fatigueChoice: "",
    disciplineChoice: ""
  };

  // Open / Close Drawer
  fab.addEventListener("click", () => {
    modal.style.display = "flex";
    fab.style.display = "none";
    if (messagesContainer.children.length === 0) {
      startEvaluation();
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    fab.style.display = "flex";
  });

  function addBotMessage(htmlContent, callback) {
    // Show typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "intake-typing";
    typingIndicator.id = "intakeTyping";
    typingIndicator.innerHTML = `<span>⚜️ Matron Hawthorne is noting your demeanor...</span>`;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
      const el = document.getElementById("intakeTyping");
      if (el) el.remove();

      const msgDiv = document.createElement("div");
      msgDiv.className = "intake-msg intake-msg-bot";
      msgDiv.innerHTML = htmlContent;
      messagesContainer.appendChild(msgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      if (callback) callback();
    }, 600);
  }

  function addUserMessage(text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "intake-msg intake-msg-user";
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function renderOptions(optionsArray, onSelect) {
    inputArea.innerHTML = "";
    optionsArray.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "intake-choice-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        addUserMessage(opt.label);
        inputArea.innerHTML = "";
        onSelect(opt.value);
      });
      inputArea.appendChild(btn);
    });
  }

  function startEvaluation() {
    intakeState = { step: 0, wardTitle: "Weary Ward", fatigueChoice: "", disciplineChoice: "" };
    messagesContainer.innerHTML = "";

    addBotMessage(
      `Step forward into the light, keep your heels together, and chin tilted thirty degrees. I am <strong>Matron Beatrice Hawthorne</strong>, Directress of Bramley Hall and Dean of Demerits.<br><br>I can hear the chaotic noise of modern decision-making buzzing in your head. At Finewood, we replace that noise with the calm cadence of the metronome and total compliance. State your standing before I open the master ledger:`,
      () => {
        renderOptions([
          { label: "Weary Ward (Exhausted by daily choices; ready to surrender control)", value: "Weary Ward" },
          { label: "Prospective Resident (Seeking evening quiet and structured curfews)", value: "Prospective Resident" },
          { label: "Domestic Subordinate (Requesting household accountability under Eleanor)", value: "Domestic Subordinate" },
          { label: "Classroom Cub (Prone to hesitation; needing academic decorum under Leery & Wu)", value: "Classroom Cub" }
        ], (val) => {
          intakeState.wardTitle = val;
          askFatigueQuestion();
        });
      }
    );
  }

  function askFatigueQuestion() {
    addBotMessage(
      `Your shoulders are already softening, <em>${intakeState.wardTitle}</em>. At Finewood, we remove the agony of endless daily choices so you may finally breathe.<br><br>Tell me honestly: In your modern life, where did autonomy fail you most?`,
      () => {
        renderOptions([
          { label: "Paralyzed by mundane choices (meals, clothing, endless schedules).", value: "routine" },
          { label: "My mind races after work; I need someone to dictate my quiet hours and bedtime.", value: "bedtime" },
          { label: "Lack of domestic discipline; I crave Eleanor's chore charts and white apron inspections.", value: "maid" },
          { label: "Exhausted by leadership; I desire matriarchal governance and absolute female authority.", value: "authority" }
        ], (val) => {
          intakeState.fatigueChoice = val;
          askDisciplineQuestion();
        });
      }
    );
  }

  function askDisciplineQuestion() {
    addBotMessage(
      `Order cannot endure without predictable consequence. When your focus wavers or rules are breached, which corrective presence brings your mind true peace?`,
      () => {
        renderOptions([
          { label: "15-minute Corner Time (hands on head) and calming audio instruction.", value: "cub" },
          { label: "Sissymaid uniform conditioning and domestic demerits under Eleanor in Nordlandia.", value: "sissymaid" },
          { label: "Ms. Elaine's Liaison Office: formal demerit ledger and rattan cane correction.", value: "cane" },
          { label: "Level III Behavioral Counseling under Counselor Celeste's uncompromising eye.", value: "counseling" }
        ], (val) => {
          intakeState.disciplineChoice = val;
          renderFinalAssessment();
        });
      }
    );
  }

  function renderFinalAssessment() {
    addBotMessage(`Your intake assessment is complete. The rattan cane rests, and the master ledger has been inked.`, () => {
      let tierName = "Senior Cub ($10/mo)";
      let tierLevel = "Level II Resident Ward";
      let demeritRating = "Demerit Class II • Curfew & Bedtime Routine Order";
      let desc = "You are in urgent need of structured evening curfews, uncut serialized audio dramas, and the comfort of zero decisions.";

      if (intakeState.disciplineChoice === "sissymaid" || intakeState.fatigueChoice === "maid") {
        tierName = "Sissy-Maid ($15/mo)";
        tierLevel = "Level III Domestic Ward";
        demeritRating = "Demerit Class III • Domestic Service & Conditioning Remand";
        desc = "Assigned to Eleanor's conditioning wing. Includes exclusive maid service audio files, uniform guidelines, and Nordlandia demerit ledgers.";
      } else if (intakeState.disciplineChoice === "cane" || intakeState.fatigueChoice === "bedtime") {
        tierName = "Head Cub ($25/mo)";
        tierLevel = "Level IV Senior Student Ward";
        demeritRating = "Demerit Class IV • Total Surrender & Executive Relief Directive";
        desc = "Full surrender granted. Access to exclusive POV executive bedtime relief audios, downloadable demerit dossiers, and quarterly scenario prompts.";
      } else if (intakeState.disciplineChoice === "counseling" || intakeState.fatigueChoice === "authority") {
        tierName = "Counselor ($40/mo)";
        tierLevel = "Faculty Standing";
        demeritRating = "Demerit Class V • High Behavioral Counseling Remand";
        desc = "Admitted to the 3-Tier Counseling Wing under Astra, Melanie, and Celeste. Unlocks character prompt bibles and expanded script lore.";
      } else if (intakeState.wardTitle === "Classroom Cub" || intakeState.fatigueChoice === "routine") {
        tierName = "Cub ($5/mo)";
        tierLevel = "Level I Student";
        demeritRating = "Demerit Class I • Introductory Academic Remediation";
        desc = "Access to all written story chapters, high-res character concept art, and audio preview snippets.";
      }

      const resultCard = document.createElement("div");
      resultCard.className = "intake-result-card";
      resultCard.innerHTML = `
        <div class="intake-result-title">⚜️ Official Finewood Placement Slip</div>
        <div class="text-[10px] uppercase tracking-wider text-amber-300/80 mb-1">${demeritRating}</div>
        <div class="intake-result-tier">${tierName}</div>
        <div class="intake-result-desc">${desc}</div>
        <a href="${CONFIG.PATREON_URL}" class="btn btn-gold btn-block btn-sm" target="_blank" rel="noopener noreferrer">
          Claim Placement on Patreon →
        </a>
      `;
      messagesContainer.appendChild(resultCard);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Reset / Try again option
      inputArea.innerHTML = "";
      const restartBtn = document.createElement("button");
      restartBtn.className = "intake-choice-btn text-center text-xs text-stone-400";
      restartBtn.textContent = "↺ Re-evaluate My Standing & Demerits";
      restartBtn.addEventListener("click", () => {
        startEvaluation();
      });
      inputArea.appendChild(restartBtn);
    });
  }
}

// ==========================================
// 8. THE MATRON'S REGISTRY & PATREON BRIDGE
// ==========================================
function initRegistry() {
  const form = document.getElementById("registryForm");
  const nameInput = document.getElementById("regName");
  const deptSelect = document.getElementById("regDepartment");
  const messageInput = document.getElementById("regMessage");
  const charCounter = document.getElementById("regCharCounter");
  const streamContainer = document.getElementById("registryStream");
  const syncStatusText = document.getElementById("syncStatusText");
  const syncLed = document.getElementById("syncLed");

  // Modal elements
  const modal = document.getElementById("registrySuccessModal");
  const modalBackdrop = document.getElementById("regModalBackdrop");
  const closeModalBtn = document.getElementById("btnCloseRegModal");
  const signedSlipBox = document.getElementById("signedSlipBox");
  const btnSharePatreon = document.getElementById("btnSharePatreon");
  const btnBrowseTiers = document.getElementById("btnBrowseTiersFromModal");
  const bridgeCopyStatus = document.getElementById("bridgeCopyStatus");

  if (!form || !streamContainer) return;

  // Character Counter
  if (messageInput && charCounter) {
    messageInput.addEventListener("input", () => {
      charCounter.textContent = `${messageInput.value.length} / 300`;
    });
  }

  // Pre-seeded Canon Signatures (displayed on load / local mode)
  const CANON_ENTRIES = [
    {
      id: "seed-1",
      wardId: "FW-104",
      name: "Cub Julian",
      department: "academy",
      message: "After 10 years of executive decision fatigue, knowing that Miss Misha and Matron Hawthorne dictate my quiet hours, posture, and bedtime is the deepest peace I have felt.",
      timestamp: Date.now() - 1000 * 60 * 75 // 75 mins ago
    },
    {
      id: "seed-2",
      wardId: "FW-028",
      name: "Thomas (Candidate #28)",
      department: "domestic",
      message: "Eleanor's chore routine left no room for hesitation. Cleaned the parquet twice before evening inspection. Relinquishing leadership saved my marriage.",
      timestamp: Date.now() - 1000 * 60 * 60 * 14 // 14 hours ago
    },
    {
      id: "seed-3",
      wardId: "FW-319",
      name: "Gentleman Caller Robert",
      department: "southern",
      message: "Aunt Caroline and Ms. Beau run Belle Bootcamp with velvet manners and iron discipline. One session under 'Ol Hickory cured my defiance forever.",
      timestamp: Date.now() - 1000 * 60 * 60 * 36 // 36 hours ago
    },
    {
      id: "seed-4",
      wardId: "FW-108",
      name: "Resident Ward #108",
      department: "curfew",
      message: "Ms. Kathy's nine o'clock curfew bell is the highlight of my evening. Surrendered will is true freedom.",
      timestamp: Date.now() - 1000 * 60 * 60 * 72 // 3 days ago
    }
  ];

  // Helper to format timestamps relatively
  function formatRelativeTime(timestamp) {
    if (!timestamp) return "Recently";
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Helper to get department label and class
  function getDeptInfo(dept) {
    switch (dept) {
      case "academy":
        return { label: "Bramley Hall Academic Ward", badgeClass: "academy" };
      case "domestic":
        return { label: "Domestic Sanctuary & Sissy-Maid", badgeClass: "domestic" };
      case "southern":
        return { label: "The Southern Manor", badgeClass: "southern" };
      case "curfew":
      default:
        return { label: "Curfew Remediation & Dorms", badgeClass: "curfew" };
    }
  }

  // Render entry list
  function renderEntries(entries) {
    streamContainer.innerHTML = "";
    entries.forEach((entry, idx) => {
      const deptInfo = getDeptInfo(entry.department);
      const initial = (entry.name || "W").trim().charAt(0).toUpperCase();
      const timeStr = formatRelativeTime(entry.timestamp);

      const entryEl = document.createElement("div");
      entryEl.className = "registry-entry";
      if (idx === 0 && entry.isNew) {
        entryEl.classList.add("new-entry");
      }

      entryEl.innerHTML = `
        <div class="entry-header">
          <div class="entry-ward-info">
            <div class="entry-avatar-badge ${deptInfo.badgeClass}">${initial}</div>
            <span class="entry-name">${escapeHtml(entry.name)}</span>
            <span class="char-badge ${deptInfo.badgeClass}">${deptInfo.label}</span>
          </div>
          <div class="entry-meta">
            <span class="entry-time">${timeStr}</span>
          </div>
        </div>
        <div class="entry-body ${deptInfo.badgeClass}">
          "${escapeHtml(entry.message)}"
        </div>
      `;
      streamContainer.appendChild(entryEl);
    });
  }

  // HTML escape helper
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Storage helper
  function getLocalEntries() {
    try {
      const stored = localStorage.getItem("finewood_registry_entries");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalEntry(entry) {
    try {
      const current = getLocalEntries();
      current.unshift(entry);
      localStorage.setItem("finewood_registry_entries", JSON.stringify(current.slice(0, 50)));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }

  // Current working list
  let activeEntries = [...getLocalEntries(), ...CANON_ENTRIES];
  renderEntries(activeEntries);

  // Check if Firebase credentials are provided
  let firestoreDb = null;
  let isCloudActive = false;

  if (typeof firebase !== 'undefined' && CONFIG.FIREBASE.apiKey && !CONFIG.FIREBASE.apiKey.includes("YOUR_FIREBASE_API_KEY")) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(CONFIG.FIREBASE);
        if (typeof firebase.analytics === 'function') {
          try { firebase.analytics(); } catch (e) {}
        }
      }
      firestoreDb = firebase.firestore();
      isCloudActive = true;
      if (syncStatusText && syncLed) {
        syncStatusText.textContent = "Finewood Live Cloud Database Active";
        syncLed.className = "sync-led live";
      }

      // Live Firestore Listener
      firestoreDb.collection("finewood_registry")
        .orderBy("timestamp", "desc")
        .limit(30)
        .onSnapshot(snapshot => {
          if (!snapshot.empty) {
            const cloudEntries = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              cloudEntries.push({
                id: doc.id,
                wardId: data.wardId || "FW-000",
                name: data.name,
                department: data.department,
                message: data.message,
                timestamp: data.timestamp ? (data.timestamp.toMillis ? data.timestamp.toMillis() : Date.now()) : Date.now()
              });
            });
            activeEntries = cloudEntries;
            renderEntries(activeEntries);
          }
        }, err => {
          console.warn("Firestore subscription note:", err.message);
        });

    } catch (err) {
      console.warn("Firebase initialization note:", err);
      isCloudActive = false;
    }
  } else {
    if (syncStatusText && syncLed) {
      syncStatusText.textContent = "Finewood Live Registry (Cloud Sync Ready • Local Cache Active)";
      syncLed.className = "sync-led live";
    }
  }

  // Last submitted entry reference for Patreon copy
  let lastEntry = null;

  // Form Submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const dept = deptSelect.value;
    const message = messageInput.value.trim();

    if (!name || !message) return;

    const wardId = "FW-" + Math.floor(1000 + Math.random() * 9000);
    const newEntry = {
      id: "local-" + Date.now(),
      wardId: wardId,
      name: name,
      department: dept,
      message: message,
      timestamp: Date.now(),
      isNew: true
    };

    lastEntry = newEntry;

    // 1. If Firebase is active, persist to Cloud Firestore
    if (isCloudActive && firestoreDb) {
      try {
        firestoreDb.collection("finewood_registry").add({
          wardId: newEntry.wardId,
          name: newEntry.name,
          department: newEntry.department,
          message: newEntry.message,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => {
          console.warn("Firestore write fallback to local:", err);
        });
      } catch (err) {
        console.warn("Firestore write error:", err);
      }
    }

    // 2. Always persist to localStorage
    saveLocalEntry(newEntry);

    // 3. Prepend to current feed immediately
    activeEntries = [newEntry, ...activeEntries.filter(e => e.id !== newEntry.id)];
    renderEntries(activeEntries);

    // 4. Reset form fields
    nameInput.value = "";
    messageInput.value = "";
    if (charCounter) charCounter.textContent = "0 / 300";

    // 5. Open Post-Signing Patreon Conversion Modal
    openSuccessModal(newEntry);
  });

  // Open Modal with Stamped Placement Slip
  function openSuccessModal(entry) {
    if (!modal || !signedSlipBox) return;

    const deptInfo = getDeptInfo(entry.department);
    const nowFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    signedSlipBox.innerHTML = `
      <div class="slip-line"><strong>INSTITUTION:</strong> FINEWOOD ACADEMY &amp; FLM SANCTUARY</div>
      <div class="slip-line"><strong>REGISTRY ROLL ID:</strong> ${entry.wardId}</div>
      <div class="slip-line"><strong>WARD CALL-SIGN:</strong> ${escapeHtml(entry.name)}</div>
      <div class="slip-line"><strong>DEPARTMENT:</strong> ${deptInfo.label}</div>
      <div class="slip-line"><strong>DATE &amp; TIME:</strong> ${nowFormatted}</div>
      <div class="slip-quote">"${escapeHtml(entry.message)}"</div>
    `;

    if (bridgeCopyStatus) {
      bridgeCopyStatus.style.display = "none";
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // Close Modal
  function closeModal() {
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.style.display === "flex") {
      closeModal();
    }
  });

  if (btnBrowseTiers) {
    btnBrowseTiers.addEventListener("click", () => {
      closeModal();
    });
  }

  // Patreon Share Action: Copy formatted slip & open Patreon community
  if (btnSharePatreon) {
    btnSharePatreon.addEventListener("click", () => {
      if (!lastEntry) return;

      const deptInfo = getDeptInfo(lastEntry.department);
      const clipboardText = `⚜️ Official Finewood Academy Ward Declaration ⚜️\nRoll ID: ${lastEntry.wardId}\nWard: ${lastEntry.name}\nDepartment: ${deptInfo.label}\n\n"${lastEntry.message}"\n\nPreserved in the High Annals of Bramley Hall.\nJoin our sanctuary: ${CONFIG.PATREON_URL}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clipboardText).then(() => {
          showCopySuccess();
        }).catch(() => {
          fallbackCopy(clipboardText);
        });
      } else {
        fallbackCopy(clipboardText);
      }

      // Open Patreon Community in new tab
      setTimeout(() => {
        window.open(`${CONFIG.PATREON_URL}/community`, "_blank", "noopener,noreferrer");
      }, 400);
    });
  }

  function showCopySuccess() {
    if (bridgeCopyStatus) {
      bridgeCopyStatus.style.display = "block";
      bridgeCopyStatus.textContent = "✓ Official Ward Slip copied to clipboard! Opening Patreon Community...";
    }
  }

  function fallbackCopy(text) {
    const tempTextarea = document.createElement("textarea");
    tempTextarea.value = text;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    try {
      document.execCommand("copy");
      showCopySuccess();
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
    document.body.removeChild(tempTextarea);
  }
}
