// Configuration
const SESSIONS = {
  sydney: {
    name: "Sydney",
    start: 22, // 10 PM UTC (Winter) - simplified for standard forex hours
    end: 7, // 7 AM UTC
    timezone: "Australia/Sydney",
    elementId: "sydney",
  },
  tokyo: {
    name: "Tokyo",
    start: 0, // 12 AM UTC
    end: 9, // 9 AM UTC
    timezone: "Asia/Tokyo",
    elementId: "tokyo",
  },
  london: {
    name: "London",
    start: 8, // 8 AM UTC
    end: 17, // 5 PM UTC
    timezone: "Europe/London",
    elementId: "london",
  },
  newyork: {
    name: "New York",
    start: 13, // 1 PM UTC
    end: 22, // 10 PM UTC
    timezone: "America/New_York",
    elementId: "newyork",
  },
};

// Market Assets Configuration with Trading Hours
const MARKET_ASSETS = {
  sydney: {
    location: "Sydney",
    timezone: "Australia/Sydney",
    openUTC: 23, // 11:00 PM UTC (previous day) - ASX opens 10:00 AM AEST
    closeUTC: 5, // 5:00 AM UTC - ASX closes 4:00 PM AEST
    assets: [
      { symbol: "ASX 200", name: "S&P/ASX 200 Index", type: "index" },
      { symbol: "BHP", name: "BHP Group", type: "stock" },
      { symbol: "CBA", name: "Commonwealth Bank", type: "stock" },
      { symbol: "CSL", name: "CSL Limited", type: "stock" },
    ],
  },
  tokyo: {
    location: "Tokyo",
    timezone: "Asia/Tokyo",
    openUTC: 0, // 12:00 AM UTC - TSE opens 9:00 AM JST
    closeUTC: 6, // 6:00 AM UTC - TSE closes 3:00 PM JST
    assets: [
      { symbol: "NIKKEI", name: "Nikkei 225 Index", type: "index" },
      { symbol: "TOPIX", name: "Tokyo Stock Price Index", type: "index" },
      { symbol: "TSE:7203", name: "Toyota Motor Corp", type: "stock" },
      { symbol: "TSE:6758", name: "Sony Group Corp", type: "stock" },
      { symbol: "TSE:9984", name: "SoftBank Group", type: "stock" },
    ],
  },
  london: {
    location: "London",
    timezone: "Europe/London",
    openUTC: 8, // 8:00 AM UTC - LSE opens 8:00 AM GMT
    closeUTC: 16.5, // 4:30 PM UTC - LSE closes 4:30 PM GMT
    assets: [
      { symbol: "FTSE", name: "FTSE 100 Index", type: "index" },
      { symbol: "DAX", name: "DAX Index (Germany)", type: "index" },
      { symbol: "CAC", name: "CAC 40 (France)", type: "index" },
      { symbol: "HSBA", name: "HSBC Holdings", type: "stock" },
      { symbol: "BP", name: "BP plc", type: "stock" },
      { symbol: "SHEL", name: "Shell plc", type: "stock" },
    ],
  },
  newyork: {
    location: "New York",
    timezone: "America/New_York",
    openUTC: 14.5, // 2:30 PM UTC - NYSE opens 9:30 AM EST
    closeUTC: 21, // 9:00 PM UTC - NYSE closes 4:00 PM EST
    assets: [
      { symbol: "SPX", name: "S&P 500 Index", type: "index" },
      { symbol: "IXIC", name: "NASDAQ Composite", type: "index" },
      { symbol: "DJI", name: "Dow Jones Industrial", type: "index" },
      { symbol: "AAPL", name: "Apple Inc", type: "stock" },
      { symbol: "MSFT", name: "Microsoft Corp", type: "stock" },
      { symbol: "TSLA", name: "Tesla Inc", type: "stock" },
    ],
  },
  india: {
    location: "India",
    timezone: "Asia/Kolkata",
    openUTC: 3.75, // 3:45 AM UTC - NSE opens 9:15 AM IST
    closeUTC: 10, // 10:00 AM UTC - NSE closes 3:30 PM IST
    assets: [
      { symbol: "NIFTY", name: "NIFTY 50 Index", type: "index" },
      { symbol: "SENSEX", name: "BSE SENSEX Index", type: "index" },
      { symbol: "RELIANCE", name: "Reliance Industries", type: "stock" },
      { symbol: "TCS", name: "Tata Consultancy Services", type: "stock" },
      { symbol: "HDFCBANK", name: "HDFC Bank", type: "stock" },
      { symbol: "INFY", name: "Infosys Limited", type: "stock" },
    ],
  },
};

// State
let isUTC = false; // Default to IST as per request "switch all time to either IST or UTC"

// DOM Elements
const toggleSwitch = document.getElementById("timezone-toggle");
const marketStatusDot = document.querySelector(".status-dot");
const marketStatusText = document.querySelector(".status-text");
const activeSessionsText = document.getElementById("active-sessions");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Set initial toggle state
  toggleSwitch.checked = isUTC;

  // Event Listener for Toggle
  toggleSwitch.addEventListener("change", (e) => {
    isUTC = e.target.checked;
    updateAll();
  });

  // Handle tab visibility changes to prevent clock jump on refocus
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      // Tab just became visible again
      // Temporarily disable transitions
      disableClockTransitions();

      // Update immediately without transition
      updateAll();

      // Re-enable transitions after a tiny delay to let the instant update paint
      setTimeout(() => {
        enableClockTransitions();
      }, 10);
    }
  });

  // create in-clock date boxes inside analog clocks
  createInClockDates();

  // Create minute and hour markers for each analog clock
  createClockMarkers();

  // Generate market assets cards
  generateAssetsGrid();

  setInterval(updateAll, 1000);
  updateAll(); // Initial call
});

// Disable clock hand transitions
function disableClockTransitions() {
  const allHands = document.querySelectorAll(".hand");
  allHands.forEach((hand) => {
    hand.style.transition = "none";
  });
}

// Enable clock hand transitions
function enableClockTransitions() {
  const hourHands = document.querySelectorAll(".hour-hand");
  const minuteHands = document.querySelectorAll(".minute-hand");
  const secondHands = document.querySelectorAll(".second-hand");

  hourHands.forEach((hand) => {
    hand.style.transition = "transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)";
  });

  minuteHands.forEach((hand) => {
    hand.style.transition = "transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)";
  });

  secondHands.forEach((hand) => {
    hand.style.transition = "transform 1s linear";
  });
}

// Create an `.in-clock-date` element inside each analog clock (runs once)
function createInClockDates() {
  const sessionIds = Object.values(SESSIONS).map((s) => s.elementId);
  const allIds = ["india", ...sessionIds];

  allIds.forEach((id) => {
    const clockEl = document.getElementById(`clock-${id}`);
    if (!clockEl) return;
    // Don't create twice
    if (clockEl.querySelector(".in-clock-date")) return;
    const d = document.createElement("div");
    d.className = "in-clock-date";
    d.id = `inclock-${id}`;
    d.textContent = "--";
    clockEl.appendChild(d);
  });
}

function createClockMarkers() {
  const markerContainers = document.querySelectorAll(".clock-markers");
  markerContainers.forEach((container) => {
    container.innerHTML = ""; // Clear existing

    // Create 6 lines, each containing 2 markers (top and bottom)
    // This covers all 12 hours (0-6, 1-7, 2-8, 3-9, 4-10, 5-11)
    for (let i = 0; i < 6; i++) {
      const line = document.createElement("div");
      line.classList.add("marker-line");
      // 0 is vertical (12 and 6), 3 is horizontal (3 and 9)
      if (i === 0 || i === 3) {
        line.classList.add("cardinal-marker");
      }
      line.style.transform = `rotate(${i * 30}deg)`;
      container.appendChild(line);
    }
  });
}

// Generate Market Assets Grid
function generateAssetsGrid() {
  const assetsGrid = document.getElementById("assets-grid");
  if (!assetsGrid) return;

  assetsGrid.innerHTML = ""; // Clear existing

  Object.entries(MARKET_ASSETS).forEach(([key, market]) => {
    // Create market container
    const marketContainer = document.createElement("div");
    marketContainer.className = "market-container";
    marketContainer.id = `market-${key}`;

    // Market header
    const marketHeader = document.createElement("div");
    marketHeader.className = "market-header";
    marketHeader.innerHTML = `
      <h3>${market.location}</h3>
      <div class="market-status-badge" id="status-${key}">
        <span class="market-status-dot"></span>
        <span class="market-status-text">Checking...</span>
      </div>
    `;
    marketContainer.appendChild(marketHeader);

    // Market hours display
    const marketHours = document.createElement("div");
    marketHours.className = "market-hours";
    marketHours.id = `hours-${key}`;
    marketHours.textContent = "Loading...";
    marketContainer.appendChild(marketHours);

    // Assets list
    const assetsList = document.createElement("div");
    assetsList.className = "assets-list";

    market.assets.forEach((asset) => {
      const assetItem = document.createElement("div");
      assetItem.className = `asset-item ${asset.type}`;
      assetItem.innerHTML = `
        <div class="asset-symbol">${asset.symbol}</div>
        <div class="asset-name">${asset.name}</div>
      `;
      assetsList.appendChild(assetItem);
    });

    marketContainer.appendChild(assetsList);
    assetsGrid.appendChild(marketContainer);
  });
}

function updateAll() {
  const now = new Date();

  // Update Clocks
  updateClock("india", "Asia/Kolkata", now);
  Object.values(SESSIONS).forEach((session) => {
    updateClock(session.elementId, session.timezone, now);
  });

  // Update Market Status
  checkMarketStatus(now);

  // Update Market Assets Status
  updateMarketAssets(now);
}

// State for continuous clock rotation
const clockState = {};

function updateClock(id, timezone, now) {
  // Get time for specific timezone
  const options = {
    timeZone: timezone,
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  let displayTimezone = timezone;
  if (id === "india") {
    displayTimezone = isUTC ? "UTC" : "Asia/Kolkata";
    const label = document.querySelector(".indian-clock-card h2");
    if (label)
      label.textContent = isUTC ? "Universal Time (UTC)" : "New Delhi (IST)";
  }

  // Parse the formatted string to get parts
  const dateInTz = new Date(
    now.toLocaleString("en-US", { timeZone: displayTimezone })
  );

  // Analog Clock Hands
  const seconds = dateInTz.getSeconds();
  const minutes = dateInTz.getMinutes();
  const hours24 = dateInTz.getHours();

  // Initialize state for this clock if not exists
  if (!clockState[id]) {
    clockState[id] = {
      sOffset: 0,
      mOffset: 0,
      hOffset: 0,
      lastS: seconds,
      lastM: minutes,
      lastH: hours24,
    };
  }

  const state = clockState[id];

  // Calculate Seconds Offset
  // If current seconds is less than last seconds (e.g. 0 < 59), we wrapped around
  if (seconds < state.lastS) {
    state.sOffset += 360;
  }
  state.lastS = seconds;

  // Calculate Minutes Offset
  if (minutes < state.lastM) {
    state.mOffset += 360;
  }
  state.lastM = minutes;

  // Calculate Hours Offset (using 12h cycle detection)
  // We compare raw 24h hours to detect day changes, but for the analog face we care about 12h wrap
  // Actually, just tracking 24h wrap is enough, but the hand is 12h.
  // If 11 -> 0 (12am) or 23 -> 0 (12am next day) or 12 -> 13 (1pm - no wrap in 12h circle)
  // The hour hand goes 0-12.
  // Let's use the computed degree to detect wrap?
  // Simpler: Just track the raw value.
  // If we go from 12 to 1, that's a wrap on the clock face? No, 12 is top. 1 is right.
  // 11 -> 12 (0).
  // Let's stick to the standard formula and just add offset.

  // Wait, simpler logic for hours:
  // The hour hand moves continuously based on minutes.
  // currentHourRotation = ((hours24 % 12) / 12) * 360 + (minutes / 60) * 30
  // We just need to ensure this value doesn't jump backward.
  // If newRotation < oldRotation, add 360.
  // But we need to store the *previous rotation* to compare.

  // Let's refine the offset logic to be purely based on "did value decrease?"
  // For hours, it decreases when 12 -> 1 (if we treat 12 as 0? No 12 is 12).
  // 12-hour clock: 12, 1, 2 ... 11, 12.
  // (hours24 % 12) gives 0..11.
  // So 11 -> 0 is the wrap.
  const currentH12 = hours24 % 12;
  const lastH12 = state.lastH % 12;
  if (currentH12 < lastH12) {
    state.hOffset += 360;
  }
  state.lastH = hours24;

  const secondDegrees = (seconds / 60) * 360 + state.sOffset;
  const minuteDegrees =
    (minutes / 60) * 360 + (seconds / 60) * 6 + state.mOffset;
  const hourDegrees =
    ((hours24 % 12) / 12) * 360 + (minutes / 60) * 30 + state.hOffset;

  const clockEl = document.getElementById(`clock-${id}`);
  if (clockEl) {
    clockEl.querySelector(
      ".second-hand"
    ).style.transform = `translateX(-50%) rotate(${secondDegrees}deg)`;
    clockEl.querySelector(
      ".minute-hand"
    ).style.transform = `translateX(-50%) rotate(${minuteDegrees}deg)`;
    clockEl.querySelector(
      ".hour-hand"
    ).style.transform = `translateX(-50%) rotate(${hourDegrees}deg)`;
  }

  // Digital Display
  const timeEl = document.getElementById(`time-${id}`);
  if (timeEl) {
    // Format in 12-hour with AM/PM
    const hours12 = hours24 % 12 || 12;
    const meridiem = hours24 >= 12 ? "PM" : "AM";
    const hDisplay = hours12.toString();
    const m = minutes.toString().padStart(2, "0");
    const s = seconds.toString().padStart(2, "0");

    if (id === "india") {
      timeEl.textContent = `${hDisplay}:${m}:${s} ${meridiem}`;
      const dateEl = document.getElementById(`date-${id}`);
      if (dateEl) {
        // Format: Mon, Jan 12
        const dateStr = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: displayTimezone,
        }).format(now);
        dateEl.textContent = dateStr;
      }
    } else {
      timeEl.textContent = `${hDisplay}:${m} ${meridiem}`;
    }
  }

  // Update in-clock small date (day + month) displayed inside the analog clock
  const inClockEl = document.getElementById(`inclock-${id}`);
  if (inClockEl) {
    // Use en-GB format to show Day Month (e.g., 23 Nov)
    const shortDate = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: displayTimezone,
    }).format(now);
    inClockEl.textContent = shortDate;
  }
}

function checkMarketStatus(now) {
  // Check if weekend (Saturday or Sunday)
  // Forex market closes Friday 5PM EST (approx) and opens Sunday 5PM EST.
  // For simplicity, let's use UTC. Market is generally closed from Fri 22:00 UTC to Sun 22:00 UTC.

  const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getUTCHours();

  let isWeekend = false;

  // Simple Weekend Logic:
  // Saturday (6) is definitely closed.
  // Friday after 22:00 UTC is closed.
  // Sunday before 22:00 UTC is closed.

  if (day === 6) {
    isWeekend = true;
  } else if (day === 5 && hour >= 22) {
    isWeekend = true;
  } else if (day === 0 && hour < 22) {
    isWeekend = true;
  }

  if (isWeekend) {
    marketStatusText.textContent = "Market Closed";
    marketStatusDot.className = "status-dot closed";
    // Compute next market open (next Sunday 22:00 UTC) and display in UTC or IST
    const nowUTC = new Date(now.getTime());
    const utcDay = nowUTC.getUTCDay(); // 0 = Sunday
    const utcHour = nowUTC.getUTCHours();

    let daysUntilSunday;
    if (utcDay === 0) {
      daysUntilSunday = utcHour < 22 ? 0 : 7;
    } else {
      daysUntilSunday = 7 - utcDay;
    }

    const nextOpenUTC = new Date(
      Date.UTC(
        nowUTC.getUTCFullYear(),
        nowUTC.getUTCMonth(),
        nowUTC.getUTCDate() + daysUntilSunday,
        22,
        0,
        0
      )
    );

    let openStr;
    if (isUTC) {
      const fmt = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      });
      openStr = fmt.format(nextOpenUTC) + " UTC";
    } else {
      const fmt = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
      openStr = fmt.format(nextOpenUTC) + " IST";
    }

    activeSessionsText.textContent = `Opens ${openStr}`;

    // Dim all sessions
    document.querySelectorAll(".session-card").forEach((card) => {
      card.classList.remove("active");
    });
    return;
  }

  marketStatusText.textContent = "Market Open";
  marketStatusDot.className = "status-dot active";

  // Check Active Sessions
  const activeSessions = [];

  Object.values(SESSIONS).forEach((session) => {
    const currentHour = now.getUTCHours();
    let isActive = false;

    if (session.start < session.end) {
      // Normal case (e.g., 8 to 17)
      if (currentHour >= session.start && currentHour < session.end) {
        isActive = true;
      }
    } else {
      // Crosses midnight (e.g., 22 to 7)
      if (currentHour >= session.start || currentHour < session.end) {
        isActive = true;
      }
    }

    const card = document.getElementById(`card-${session.elementId}`);
    if (isActive) {
      activeSessions.push(session.name);
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  if (activeSessions.length > 0) {
    activeSessionsText.textContent = `Active: ${activeSessions.join(", ")}`;
  } else {
    activeSessionsText.textContent = "No Major Sessions Active"; // Gap time
  }
}

// Update Market Assets Status
function updateMarketAssets(now) {
  const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const currentTimeUTC = hour + minute / 60; // Hours as decimal (e.g., 14.5 = 2:30 PM)

  // Weekend check - markets are closed
  let isWeekend = false;
  if (day === 6) {
    isWeekend = true;
  } else if (day === 5 && hour >= 22) {
    isWeekend = true;
  } else if (day === 0 && hour < 22) {
    isWeekend = true;
  }

  Object.entries(MARKET_ASSETS).forEach(([key, market]) => {
    const statusBadge = document.getElementById(`status-${key}`);
    const hoursDisplay = document.getElementById(`hours-${key}`);
    const marketContainer = document.getElementById(`market-${key}`);

    if (!statusBadge || !hoursDisplay) return;

    const statusDot = statusBadge.querySelector(".market-status-dot");
    const statusText = statusBadge.querySelector(".market-status-text");

    // Check if market is open
    let isOpen = false;
    if (!isWeekend) {
      if (market.openUTC < market.closeUTC) {
        // Normal case (e.g., 8 to 16.5)
        isOpen =
          currentTimeUTC >= market.openUTC && currentTimeUTC < market.closeUTC;
      } else {
        // Crosses midnight (e.g., 23 to 5)
        isOpen =
          currentTimeUTC >= market.openUTC || currentTimeUTC < market.closeUTC;
      }
    }

    // Update status badge
    if (isWeekend) {
      statusDot.className = "market-status-dot closed";
      statusText.textContent = "Weekend";
      marketContainer.classList.remove("market-open");
      marketContainer.classList.add("market-closed");
    } else if (isOpen) {
      statusDot.className = "market-status-dot open";
      statusText.textContent = "Open";
      marketContainer.classList.add("market-open");
      marketContainer.classList.remove("market-closed");
    } else {
      statusDot.className = "market-status-dot closed";
      statusText.textContent = "Closed";
      marketContainer.classList.remove("market-open");
      marketContainer.classList.add("market-closed");
    }

    // Format and display market hours
    // IST mode: Show all times in IST
    // UTC mode: Show times in market's local timezone
    const displayTimezone = isUTC ? market.timezone : "Asia/Kolkata";
    const tzLabel = isUTC
      ? market.timezone.split("/")[1].replace("_", " ")
      : "IST";

    // Convert UTC hours to display timezone
    const openTime = convertUTCtoTimezone(market.openUTC, displayTimezone);
    const closeTime = convertUTCtoTimezone(market.closeUTC, displayTimezone);

    hoursDisplay.innerHTML = `
      <span class="hours-label">Trading Hours:</span>
      <span class="hours-time">${openTime} - ${closeTime} ${tzLabel}</span>
    `;
  });
}

// Helper function to convert UTC decimal hours to formatted time string in target timezone
function convertUTCtoTimezone(utcHours, timezone) {
  // Create a date object for today at the specified UTC hour
  const now = new Date();
  const utcDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      Math.floor(utcHours),
      (utcHours % 1) * 60
    )
  );

  // Format in target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });

  return formatter.format(utcDate);
}

// ==================== ALARM FEATURE ====================

const SESSION_OPEN_TIMES = {
  sydney: { utc: 22, label: "Sydney Open" },
  tokyo: { utc: 0, label: "Tokyo Open" },
  london: { utc: 8, label: "London Open" },
  newyork: { utc: 14.5, label: "New York Open" },
  india: { utc: 3.75, label: "India Market Open" },
};

let alarms = [];
let alarmCheckInterval;

// Initialize alarm feature
document.addEventListener("DOMContentLoaded", () => {
  initializeAlarmUI();
  loadAlarmsFromStorage();
  startAlarmChecker();
});

function initializeAlarmUI() {
  // Populate hour dropdown (1-12)
  const hourSelect = document.getElementById("alarm-hour");
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    hourSelect.appendChild(option);
  }

  // Populate minute dropdown (00-59)
  const minuteSelect = document.getElementById("alarm-minute");
  for (let i = 0; i < 60; i += 5) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i.toString().padStart(2, "0");
    minuteSelect.appendChild(option);
  }

  // Add event listeners
  document
    .getElementById("set-custom-alarm")
    .addEventListener("click", setCustomAlarm);

  // Session alarm buttons
  document.querySelectorAll(".session-alarm-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const session = this.dataset.session;
      setSessionAlarm(session);
    });
  });

  // Update session button times
  updateSessionButtonTimes();
}

function updateSessionButtonTimes() {
  Object.keys(SESSION_OPEN_TIMES).forEach((session) => {
    const timeEl = document.getElementById(`${session}-time`);
    const { utc, label } = SESSION_OPEN_TIMES[session];

    // Convert UTC to IST (add 5.5 hours)
    const istHours = utc + 5.5;
    const hour24 = Math.floor(istHours) % 24;
    const minutes = Math.round((istHours % 1) * 60);
    const hour12 = hour24 % 12 || 12;
    const period = hour24 >= 12 ? "PM" : "AM";

    timeEl.textContent = `${hour12}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  });
}

function setSessionAlarm(session) {
  const { utc, label } = SESSION_OPEN_TIMES[session];

  // Calculate next occurrence
  const now = new Date();
  const alarmTime = calculateNextSessionTime(utc);

  const alarm = {
    id: Date.now(),
    time: alarmTime,
    label: label,
    type: "session",
    session: session,
  };

  addAlarm(alarm);
  highlightSessionButton(session);
}

function calculateNextSessionTime(utcHour) {
  const now = new Date();
  const targetTime = new Date(now);

  // Set to target UTC hour
  targetTime.setUTCHours(Math.floor(utcHour));
  targetTime.setUTCMinutes((utcHour % 1) * 60);
  targetTime.setUTCSeconds(0);
  targetTime.setUTCMilliseconds(0);

  // If that time has already passed today, set it for tomorrow
  if (targetTime <= now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  return targetTime;
}

function setCustomAlarm() {
  const hour = document.getElementById("alarm-hour").value;
  const minute = document.getElementById("alarm-minute").value;
  const period = document.getElementById("alarm-period").value;

  if (!hour || !minute) {
    alert("Please select both hour and minute");
    return;
  }

  const now = new Date();
  let hour24 = parseInt(hour);
  if (period === "PM" && hour24 !== 12) hour24 += 12;
  if (period === "AM" && hour24 === 12) hour24 = 0;

  const alarmTime = new Date(now);
  alarmTime.setHours(hour24, parseInt(minute), 0, 0);

  // If time has passed today, set for tomorrow
  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  const alarm = {
    id: Date.now(),
    time: alarmTime,
    label: `Custom Alarm - ${hour}:${minute.padStart(2, "0")} ${period}`,
    type: "custom",
  };

  addAlarm(alarm);

  // Reset form
  document.getElementById("alarm-hour").value = "";
  document.getElementById("alarm-minute").value = "";
}

function addAlarm(alarm) {
  alarms.push(alarm);
  saveAlarmsToStorage();
  renderAlarms();
}

function deleteAlarm(alarmId) {
  // Find the alarm BEFORE removing it
  const deletedAlarm = alarms.find((a) => a.id === alarmId);

  // Remove from array
  alarms = alarms.filter((a) => a.id !== alarmId);

  // Remove session button highlight if needed
  if (deletedAlarm && deletedAlarm.type === "session") {
    unhighlightSessionButton(deletedAlarm.session);
  }

  saveAlarmsToStorage();
  renderAlarms();
}

function renderAlarms() {
  const alarmsList = document.getElementById("alarms-list");

  if (alarms.length === 0) {
    alarmsList.innerHTML = '<p class="no-alarms">No active alarms</p>';
    return;
  }

  alarmsList.innerHTML = alarms
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .map((alarm) => {
      const time = new Date(alarm.time);
      const timeStr = formatAlarmTime(time);
      const icon = alarm.type === "session" ? "🔔" : "⏰";

      return `
        <div class="alarm-item">
          <div class="alarm-info">
            <span class="alarm-icon">${icon}</span>
            <div class="alarm-details">
              <div class="alarm-time">${timeStr}</div>
              <div class="alarm-label">${alarm.label}</div>
            </div>
          </div>
          <div class="alarm-actions">
            <button class="delete-alarm-btn" onclick="deleteAlarm(${alarm.id})">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function formatAlarmTime(date) {
  const hour = date.getHours() % 12 || 12;
  const minute = date.getMinutes().toString().padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  const day = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return `${hour}:${minute} ${period} - ${day}`;
}

function highlightSessionButton(session) {
  const btn = document.querySelector(
    `.session-alarm-btn[data-session="${session}"]`
  );
  if (btn) btn.classList.add("active");
}

function unhighlightSessionButton(session) {
  const btn = document.querySelector(
    `.session-alarm-btn[data-session="${session}"]`
  );
  if (btn) btn.classList.remove("active");
}

function startAlarmChecker() {
  alarmCheckInterval = setInterval(() => {
    const now = new Date();

    alarms.forEach((alarm) => {
      const alarmTime = new Date(alarm.time);

      // Check if alarm time has arrived (within the last second)
      if (alarmTime <= now && alarmTime > new Date(now - 1000)) {
        triggerAlarm(alarm);
        deleteAlarm(alarm.id);
      }
    });
  }, 1000);
}

function triggerAlarm(alarm) {
  // Play repeating alarm sound
  playAlarmSound();

  // Show notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🔔 Forex Session Alarm", {
      body: alarm.label,
      icon: "⏰",
      requireInteraction: true,
    });
  }
}

function playAlarmSound() {
  // Create repeating alarm beeps using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Pattern: 3 beeps, pause, 3 beeps, pause, 3 beeps
  // Beep: 150ms, Gap: 100ms
  const beepLength = 0.15;
  const gapLength = 0.1;
  const pauseLength = 0.5;

  // Schedule 3 groups of 3 beeps
  let startTime = audioContext.currentTime + 0.1;

  for (let group = 0; group < 3; group++) {
    for (let beep = 0; beep < 3; beep++) {
      playTone(audioContext, startTime, beepLength);
      startTime += beepLength + gapLength;
    }
    startTime += pauseLength;
  }
}

function playTone(ctx, startTime, duration) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  // Main tone - High pitch for alertness
  osc1.type = "square";
  osc1.frequency.value = 880; // A5

  // Harmony tone - Higher octave for "digital" feel
  osc2.type = "square";
  osc2.frequency.value = 1760; // A6

  // Envelope for a sharp "beep"
  // Volume set to 0.1 each (0.2 total) to be loud but not ear-piercing
  const volume = 0.5;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01); // Attack
  gain.gain.setValueAtTime(volume, startTime + duration - 0.01); // Sustain
  gain.gain.linearRampToValueAtTime(0, startTime + duration); // Release

  osc1.start(startTime);
  osc2.start(startTime);

  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
}

function saveAlarmsToStorage() {
  localStorage.setItem("forexAlarms", JSON.stringify(alarms));
}

function loadAlarmsFromStorage() {
  const storedAlarms = localStorage.getItem("forexAlarms");
  if (storedAlarms) {
    alarms = JSON.parse(storedAlarms).map((a) => ({
      ...a,
      time: new Date(a.time),
    }));

    // Remove expired alarms
    const now = new Date();
    alarms = alarms.filter((a) => new Date(a.time) > now);

    // Highlight session buttons
    alarms.forEach((alarm) => {
      if (alarm.type === "session") {
        highlightSessionButton(alarm.session);
      }
    });

    renderAlarms();
  }
}

// Request notification permission on page load
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// Make deleteAlarm globally accessible
window.deleteAlarm = deleteAlarm;
