(function () {
  var GOAL = 50;
  var STORAGE_KEY = "intelSummit.attendees";

  var TEAMS = {
    water: {
      name: "Team Water Wise",
      countEl: "waterCount",
      namesEl: "waterNames",
    },
    zero: { name: "Team Net Zero", countEl: "zeroCount", namesEl: "zeroNames" },
    power: {
      name: "Team Renewables",
      countEl: "powerCount",
      namesEl: "powerNames",
    },
  };

  var form = document.getElementById("checkInForm");
  var nameInput = document.getElementById("attendeeName");
  var teamSelect = document.getElementById("teamSelect");
  var greeting = document.getElementById("greeting");
  var celebrationBanner = document.getElementById("celebrationBanner");
  var attendeeCountEl = document.getElementById("attendeeCount");
  var progressBar = document.getElementById("progressBar");
  var attendeeListEl = document.getElementById("attendeeList");
  var emptyListMsg = document.getElementById("emptyListMsg");
  var confettiLayer = document.getElementById("confettiLayer");
  var resetBtn = document.getElementById("resetBtn");

  // ---- Persistence (LevelUp: Save Your Progress) ----
  function loadAttendees() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveAttendees() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attendees));
    } catch (e) {
      // localStorage unavailable (private browsing, quota, etc.) — fail silently.
    }
  }

  var attendees = loadAttendees();
  var celebrationShown = false;

  function countsByTeam() {
    var counts = { water: 0, zero: 0, power: 0 };
    attendees.forEach(function (a) {
      if (counts.hasOwnProperty(a.team)) counts[a.team]++;
    });
    return counts;
  }

  function winningTeams(counts) {
    var max = -1;
    Object.keys(TEAMS).forEach(function (key) {
      if (counts[key] > max) max = counts[key];
    });
    if (max <= 0) return [];
    return Object.keys(TEAMS)
      .filter(function (key) {
        return counts[key] === max;
      })
      .map(function (key) {
        return TEAMS[key].name;
      });
  }

  // ---- Confetti burst (fires once when the goal is reached) ----
  var CONFETTI_COLORS = [
    "#0071c5",
    "#00aeef",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
  ];

  function launchConfetti() {
    if (!confettiLayer) return;
    var pieceCount = 140;

    for (var i = 0; i < pieceCount; i++) {
      var piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.backgroundColor =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.animationDuration = 2.5 + Math.random() * 2 + "s";
      piece.style.animationDelay = Math.random() * 0.6 + "s";
      piece.style.width = 6 + Math.random() * 6 + "px";
      piece.style.height = 10 + Math.random() * 8 + "px";
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      confettiLayer.appendChild(piece);

      (function (el) {
        el.addEventListener("animationend", function () {
          el.remove();
        });
      })(piece);
    }
  }

  function clearConfetti() {
    if (confettiLayer) confettiLayer.innerHTML = "";
  }

  function render() {
    var counts = countsByTeam();
    var total = attendees.length;

    attendeeCountEl.textContent = total;

    Object.keys(TEAMS).forEach(function (key) {
      var countEl = document.getElementById(TEAMS[key].countEl);
      if (countEl) countEl.textContent = counts[key];

      // Names listed beneath each team card
      var namesEl = document.getElementById(TEAMS[key].namesEl);
      if (namesEl) {
        namesEl.innerHTML = "";
        attendees
          .filter(function (a) {
            return a.team === key;
          })
          .forEach(function (a) {
            var li = document.createElement("li");
            li.textContent = a.name;
            namesEl.appendChild(li);
          });
      }
    });

    var pct = Math.min(100, Math.round((total / GOAL) * 100));
    progressBar.style.width = pct + "%";

    // Attendee list (LevelUp: Attendee List)
    attendeeListEl.innerHTML = "";
    if (attendees.length === 0) {
      emptyListMsg.style.display = "block";
    } else {
      emptyListMsg.style.display = "none";
      attendees.forEach(function (a) {
        var li = document.createElement("li");
        li.className = "attendee-item";

        var nameSpan = document.createElement("span");
        nameSpan.className = "attendee-name";
        nameSpan.textContent = a.name;

        var teamSpan = document.createElement("span");
        teamSpan.className = "attendee-team " + a.team;
        teamSpan.textContent = TEAMS[a.team] ? TEAMS[a.team].name : a.team;

        li.appendChild(nameSpan);
        li.appendChild(teamSpan);
        attendeeListEl.appendChild(li);
      });
    }

    // LevelUp: Celebration Feature
    if (total >= GOAL) {
      var winners = winningTeams(counts);
      var winnerText =
        winners.length > 1 ? winners.join(" & ") + " (tied)" : winners[0];
      celebrationBanner.innerHTML =
        "&#127881; Attendance goal reached! Congratulations to <strong>" +
        winnerText +
        "</strong> for the most check-ins!";
      celebrationBanner.style.display = "block";

      if (!celebrationShown) {
        launchConfetti();
      }
      celebrationShown = true;
    } else if (celebrationShown) {
      celebrationBanner.style.display = "none";
      celebrationShown = false;
    }
  }

  function showGreeting(name, teamKey) {
    var teamName = TEAMS[teamKey] ? TEAMS[teamKey].name : teamKey;
    greeting.textContent = "🎉 Welcome, " + name + " from " + teamName + "!";
    greeting.classList.add("success-message");
    greeting.style.display = "block";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = nameInput.value.trim();
    var team = teamSelect.value;

    if (!name || !team) {
      return;
    }

    attendees.push({ name: name, team: team });
    saveAttendees();
    render();
    showGreeting(name, team);

    form.reset();
    nameInput.focus();
  });

  // ---- Reset button ----
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      var confirmed = window.confirm(
        "Reset all check-ins? This clears the attendance count, team totals, and the attendee list.",
      );
      if (!confirmed) return;

      attendees = [];
      saveAttendees();
      celebrationShown = false;
      clearConfetti();
      celebrationBanner.style.display = "none";
      greeting.style.display = "none";
      render();
    });
  }

  // Initial render from whatever was restored from localStorage.
  render();
})();
