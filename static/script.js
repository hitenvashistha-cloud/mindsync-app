(() => {
  "use strict";

  // =========================================================
  // ONBOARDING & GREETING LOGIC
  // =========================================================
  const onboardingScreen = document.getElementById("onboarding");
  const dashboardWrapper = document.getElementById("dashboard-wrapper");
  const nameForm = document.getElementById("name-form");
  const nameInput = document.getElementById("user-name-input");
  const greetingName = document.getElementById("greeting-name");

  function checkUser() {
    const savedName = localStorage.getItem("mindsync_user_name");
    if (savedName) {
      onboardingScreen.classList.add("hidden");
      dashboardWrapper.style.display = "flex";
      greetingName.textContent = savedName;
    } else {
      onboardingScreen.classList.remove("hidden");
      dashboardWrapper.style.display = "none";
    }
  }

  nameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (name) {
      localStorage.setItem("mindsync_user_name", name);
      checkUser();
    }
  });

  checkUser();

  // =========================================================
  // CORE APP LOGIC
  // =========================================================
  const API_BASE = window.location.origin; 
  const GAUGE_ARC_LENGTH = Math.PI * 80; 
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (id) => document.getElementById(id);

  const form = $("predict-form");
  const submitBtn = $("submit-btn");
  
  const scoreIdle = $("score-idle");
  const scoreResult = $("score-result");
  const scoreStatus = $("score-status");
  const gaugeFill = $("gauge-fill");
  const scoreNumberEl = $("score-number");
  const scoreBandEl = $("score-band");
  const scoreContextEl = $("score-context");
  
  const announcer = $("status-announcer");
  const statStress = $("stat-stress");
  const statFocus = $("stat-focus");

  // Keep Render Backend Awake
  setInterval(() => {
    fetch(`${API_BASE}/health`).catch(() => {});
  }, 60000); 

  // Segmented control (Stress Level)
  const segGroup = $("stress_level_group");
  const stressHiddenInput = $("stress_level");
  const segButtons = Array.from(segGroup.querySelectorAll(".seg-btn"));

  function selectStress(value) {
    segButtons.forEach((b) => {
      const on = b.dataset.value === value;
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
    stressHiddenInput.value = value;
    clearFieldError(stressHiddenInput);
    if (statStress) statStress.textContent = value;
  }

  segButtons.forEach((btn) => {
    btn.addEventListener("click", () => selectStress(btn.dataset.value));
    btn.addEventListener("keydown", (e) => {
      const i = segButtons.indexOf(btn);
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = segButtons[(i + 1) % segButtons.length];
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   next = segButtons[(i - 1 + segButtons.length) % segButtons.length];
      if (next) {
        e.preventDefault();
        next.focus();
        selectStress(next.dataset.value);
      }
    });
  });

  // =========================================================
  // LIVE TOTAL HOURS COUNTER
  // =========================================================
  const hoursInputs = ["study_hours", "avg_daily_usage_hours", "physical_activity_hours", "sleep_hours_per_night"];
  const totalHoursVal = $("total-hours-val");
  const totalHoursWarning = $("total-hours-warning");

  function updateTotalHours() {
    let total = 0;
    hoursInputs.forEach(id => {
      const val = parseFloat($(id).value) || 0;
      total += val;
    });
    
    totalHoursVal.textContent = total.toFixed(1);
    
    if (total > 24) {
      totalHoursWarning.style.color = "var(--danger)";
    } else {
      totalHoursWarning.style.color = "var(--text-muted)";
    }
  }

  hoursInputs.forEach(id => {
    $(id).addEventListener("input", updateTotalHours);
  });

  // =========================================================
  // ERROR HELPERS
  // =========================================================
  const fieldWrapper = (input) => input && input.closest(".field");

  function setFieldError(input, message) {
    const wrap = fieldWrapper(input);
    if (!wrap) return;
    wrap.classList.add("field-error");
    const msgEl = wrap.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = message;
  }

  function clearFieldError(input) {
    const wrap = fieldWrapper(input);
    if (!wrap) return;
    wrap.classList.remove("field-error");
    const msgEl = wrap.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = "";
  }

  function clearAllErrors() {
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("field-error"));
    form.querySelectorAll(".error-msg").forEach((m) => (m.textContent = ""));
  }

  // =========================================================
  // VALIDATION & COLLECTION
  // =========================================================
  function validate(payload) {
    const errors = [];
    
    // 1. Check realistic limits
    const numericChecks = [
      ["age", 10, 100], 
      ["avg_daily_usage_hours", 0, 18],      
      ["daily_unlocks", 0, Infinity], 
      ["study_hours", 0, 16],                
      ["physical_activity_hours", 0, 8],     
      ["sleep_hours_per_night", 3, 14],      
    ];

    numericChecks.forEach(([key, min, max]) => {
      const input = $(key);
      const val = payload[key];
      if (val === "" || val === null || Number.isNaN(val)) {
        errors.push([input, "Required."]);
      } else if (val < min || val > max) {
        errors.push([input, max === Infinity ? `Must be ${min}+` : `Must be between ${min} and ${max}.`]);
      }
    });

    // 2. Check if total hours exceed 24
    const totalHours = (payload.study_hours || 0) + 
                       (payload.avg_daily_usage_hours || 0) + 
                       (payload.physical_activity_hours || 0) + 
                       (payload.sleep_hours_per_night || 0);

    if (totalHours > 24) {
      errors.push([$("study_hours"), `Total hours cannot exceed 24.`]);
      errors.push([$("sleep_hours_per_night"), `Please adjust your hours.`]);
    }

    // 3. Check text fields
    ["gender", "country", "academic_level", "most_used_platform", "purpose_of_use"].forEach((key) => {
      const input = $(key);
      if (!payload[key] || String(payload[key]).trim() === "") {
        errors.push([input, "Required."]);
      }
    });

    if (!payload.stress_level) {
      errors.push([stressHiddenInput, "Select stress level."]);
    }
    
    return errors;
  }

  function collectPayload() {
    const fd = new FormData(form);
    const num = (k, base = 10) => (fd.get(k) === "" ? NaN : (base === 10 ? parseInt(fd.get(k), 10) : parseFloat(fd.get(k))));
    return {
      age: num("age"),
      gender: fd.get("gender") || "",
      country: (fd.get("country") || "").trim(),
      academic_level: fd.get("academic_level") || "",
      most_used_platform: fd.get("most_used_platform") || "",
      purpose_of_use: fd.get("purpose_of_use") || "",
      avg_daily_usage_hours: num("avg_daily_usage_hours", 10.5),
      daily_unlocks: num("daily_unlocks"),
      study_hours: num("study_hours", 10.5),
      physical_activity_hours: num("physical_activity_hours", 10.5),
      sleep_hours_per_night: num("sleep_hours_per_night", 10.5),
      stress_level: fd.get("stress_level") || "",
    };
  }

  // =========================================================
  // UI RENDERING
  // =========================================================
  function announce(message) {
    announcer.textContent = "";
    window.setTimeout(() => { announcer.textContent = message; }, 60);
  }

  function bandFor(score) {
    if (score < 4) return { label: "Signal: Strained", context: "Elevated strain detected. Small shifts in sleep or screen time can help." };
    if (score < 7) return { label: "Signal: Balanced", context: "Steady rhythm. You have room to recover and reset." };
    return { label: "Signal: Strong", context: "Resilient baseline. Keep up the great habits." };
  }

  function getActionableAdvice(payload) {
    if (payload.sleep_hours_per_night < 6) {
      return "💡 Tip: You're getting less than 6 hours of sleep. Try setting a consistent bedtime tonight.";
    }
    if (payload.avg_daily_usage_hours > 8) {
      return "💡 Tip: High screen time detected. Try turning off non-essential notifications for 1 hour.";
    }
    if (payload.physical_activity_hours < 0.5) {
      return "💡 Tip: Try a 15-minute walk today. Light movement significantly boosts mental health.";
    }
    return ""; 
  }

  function animateNumber(el, target, duration = 900) {
    if (reduceMotion) { el.textContent = target.toFixed(2); return; }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(2);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function renderResult(rawScore, payload) {
    const clamped = Math.max(0, Math.min(10, rawScore));
    const { label, context } = bandFor(clamped);

    if (clamped < 4) {
      gaugeFill.style.stroke = "#FF4757"; // Red 
    } else if (clamped < 7) {
      gaugeFill.style.stroke = "#FFA502"; // Orange 
    } else {
      gaugeFill.style.stroke = "#2ED573"; // Green 
    }

    const advice = getActionableAdvice(payload);
    const finalContext = advice ? advice : context;

    statFocus.innerHTML = `${payload.study_hours} <span class="unit">hrs</span>`;
    scoreBandEl.textContent = label;
    scoreContextEl.textContent = finalContext;
    scoreStatus.textContent = "Generated";
    scoreStatus.style.color = "var(--success)";
    scoreStatus.style.background = "#E8F8F0";

    gaugeFill.style.transition = "none";
    gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH);
    requestAnimationFrame(() => {
      gaugeFill.style.transition = "";
      gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH * (1 - clamped / 10));
    });

    animateNumber(scoreNumberEl, rawScore);
    
    scoreIdle.hidden = true;
    scoreResult.hidden = false;
    
    announce(`Score ${rawScore.toFixed(2)}. ${label}.`);
  }

  // =========================================================
  // SUBMIT HANDLER
  // =========================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();

    const payload = collectPayload();
    const clientErrors = validate(payload);

    if (clientErrors.length > 0) {
      clientErrors.forEach(([input, msg]) => input && setFieldError(input, msg));
      clientErrors[0][0]?.focus?.();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    
    scoreStatus.textContent = "Calculating...";
    scoreStatus.style.color = "var(--primary)";
    scoreStatus.style.background = "var(--primary-light)";

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      if (typeof data.predicted_mental_health_score !== "number") {
        throw new Error("Score missing from response.");
      }

      renderResult(data.predicted_mental_health_score, payload);
      
    } catch (err) {
      console.error(err);
      scoreStatus.textContent = "Error";
      scoreStatus.style.color = "var(--danger)";
      scoreStatus.style.background = "#FFF5F5";
      alert(`Could not connect to the server. If you just deployed, wait 30 seconds for the backend to wake up and try again.`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    }
  });

  // Live-clear errors
  form.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => clearFieldError(el));
    el.addEventListener("change", () => clearFieldError(el));
  });
})();