// Configuration
// Configuration
// Base UTC start times (Standard Time / Winter Time)
const SESSION_CONFIG = {
  sydney: {
    name: "Sydney",
    standardStart: 22, // 10 PM UTC (Winter)
    duration: 9,
    timezone: "Australia/Sydney",
    elementId: "sydney",
    dstRegion: "australia", // DST: Oct - Apr
  },
  tokyo: {
    name: "Tokyo",
    standardStart: 0, // 12 AM UTC
    duration: 9,
    timezone: "Asia/Tokyo",
    elementId: "tokyo",
    dstRegion: "none", // No DST
  },
  london: {
    name: "London",
    standardStart: 8, // 8 AM UTC
    duration: 9,
    timezone: "Europe/London",
    elementId: "london",
    dstRegion: "europe", // DST: Mar - Oct
  },
  newyork: {
    name: "New York",
    standardStart: 13, // 1 PM UTC
    duration: 9,
    timezone: "America/New_York",
    elementId: "newyork",
    dstRegion: "usa", // DST: Mar - Nov
  },
};

// Market Assets Configuration with Trading Hours
// Ordered by IST opening time: Tokyo (5:30 AM) → Hong Kong (7:00 AM) → India (9:15 AM) → Euronext (1:30 PM) → London (1:30 PM) → New York (8:00 PM IST)
// Each exchange shows top 4 highest-volume assets
const MARKET_ASSETS_CONFIG = {
  tokyo: {
    location: "TSE (Tokyo)",
    exchangeName: "Tokyo Stock Exchange",
    timezone: "Asia/Tokyo",
    standardOpenUTC: 0, // 12:00 AM UTC = 9:00 AM JST = 5:30 AM IST
    duration: 6, // 9:00 AM - 3:00 PM JST
    dstRegion: "none",
    assets: [
      { symbol: "NIKKEI 225", name: "Nikkei 225 Index", type: "index" },
      { symbol: "TOPIX", name: "Tokyo Stock Price Index", type: "index" },
      { symbol: "7203", name: "Toyota Motor", type: "stock" },
      { symbol: "6758", name: "Sony Group", type: "stock" },
    ],
  },
  hongkong: {
    location: "HKEX (Hong Kong)",
    exchangeName: "Hong Kong Stock Exchange",
    timezone: "Asia/Hong_Kong",
    standardOpenUTC: 1.5, // 1:30 AM UTC = 9:30 AM HKT = 7:00 AM IST
    duration: 6.5, // 9:30 AM - 4:00 PM HKT (simplified, no lunch break)
    dstRegion: "none",
    assets: [
      { symbol: "HSI", name: "Hang Seng Index", type: "index" },
      { symbol: "0700", name: "Tencent Holdings", type: "stock" },
      { symbol: "9988", name: "Alibaba Group", type: "stock" },
      { symbol: "0941", name: "China Mobile", type: "stock" },
    ],
  },
  india: {
    location: "NSE/BSE (India)",
    exchangeName: "National Stock Exchange / Bombay Stock Exchange",
    timezone: "Asia/Kolkata",
    standardOpenUTC: 3.75, // 3:45 AM UTC = 9:15 AM IST
    duration: 6.25, // 9:15 AM - 3:30 PM IST
    dstRegion: "none",
    assets: [
      { symbol: "NIFTY 50", name: "NIFTY 50 Index", type: "index" },
      { symbol: "NIFTY BANK", name: "NIFTY Bank Index", type: "index" },
      { symbol: "RELIANCE", name: "Reliance Industries", type: "stock" },
      { symbol: "HDFCBANK", name: "HDFC Bank", type: "stock" },
    ],
  },
  euronext: {
    location: "Euronext (Paris/Amsterdam)",
    exchangeName: "Euronext Exchange",
    timezone: "Europe/Paris",
    standardOpenUTC: 8, // 8:00 AM UTC = 9:00 AM CET = 1:30 PM IST
    duration: 8.5, // 9:00 AM - 5:30 PM CET
    dstRegion: "europe",
    assets: [
      { symbol: "CAC 40", name: "CAC 40 Index (France)", type: "index" },
      { symbol: "MC.PA", name: "LVMH (Luxury)", type: "stock" },
      { symbol: "ASML", name: "ASML Holding", type: "stock" },
      { symbol: "OR.PA", name: "L'Oréal", type: "stock" },
    ],
  },
  london: {
    location: "LSE (London)",
    exchangeName: "London Stock Exchange",
    timezone: "Europe/London",
    standardOpenUTC: 8, // 8:00 AM UTC = 8:00 AM GMT = 1:30 PM IST
    duration: 8.5, // 8:00 AM - 4:30 PM GMT
    dstRegion: "europe",
    assets: [
      { symbol: "FTSE 100", name: "FTSE 100 Index", type: "index" },
      { symbol: "SHEL", name: "Shell plc", type: "stock" },
      { symbol: "HSBA", name: "HSBC Holdings", type: "stock" },
      { symbol: "BP", name: "BP plc", type: "stock" },
    ],
  },
  newyork: {
    location: "NYSE/NASDAQ (New York)",
    exchangeName: "New York Stock Exchange / NASDAQ",
    timezone: "America/New_York",
    standardOpenUTC: 14.5, // 2:30 PM UTC = 9:30 AM EST = 8:00 PM IST
    duration: 6.5, // 9:30 AM - 4:00 PM EST
    dstRegion: "usa",
    assets: [
      { symbol: "SPY", name: "S&P 500 ETF (Highest Volume)", type: "stock" },
      { symbol: "TSLA", name: "Tesla Inc", type: "stock" },
      { symbol: "AAPL", name: "Apple Inc", type: "stock" },
      { symbol: "NVDA", name: "Nvidia Corp", type: "stock" },
    ],
  },
};

// Dynamic State
let SESSIONS = {};
let MARKET_ASSETS = {};

// State
let isUTC = false; // Default to IST as per request "switch all time to either IST or UTC"

// DOM Elements
const toggleSwitch = document.getElementById("timezone-toggle");
const forexStatusDot = document.querySelector("#forex-status .status-dot");
const forexStatusText = document.querySelector("#forex-status .status-text");
const activeForexSessionsText = document.getElementById(
  "active-forex-sessions"
);
const exchangeStatusDot = document.querySelector(
  "#exchange-status .status-dot"
);
const exchangeStatusText = document.querySelector(
  "#exchange-status .status-text"
);
const activeExchangesText = document.getElementById("active-exchanges");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Set initial toggle state
  toggleSwitch.checked = isUTC;

  // Event Listener for Toggle
  toggleSwitch.addEventListener("change", (e) => {
    isUTC = e.target.checked;
    updateAll();
  });

  // Request notification permission for alarms
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // Calculate Session Times based on DST
  recalculateSessionTimes();

  // Handle tab visibility changes to prevent clock jump on refocus
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      // Recalculate times in case date changed while hidden
      recalculateSessionTimes();

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

  setInterval(() => {
    // Check if we need to recalculate DST (e.g. new day)
    const now = new Date();
    if (now.getMinutes() === 0 && now.getSeconds() === 0) {
      recalculateSessionTimes();
    }
    updateAll();
  }, 1000);
  updateAll(); // Initial call
});

// ==================== DST LOGIC ====================

function isDST(date, region) {
  const year = date.getUTCFullYear();

  // Helper to find Nth Sunday in Month
  const getNthSunday = (n, month) => {
    const d = new Date(Date.UTC(year, month, 1));
    const day = d.getUTCDay();
    const diff = day === 0 ? 0 : 7 - day;
    const firstSunday = d.getUTCDate() + diff;
    return new Date(Date.UTC(year, month, firstSunday + (n - 1) * 7));
  };

  // Helper to find Last Sunday in Month
  const getLastSunday = (month) => {
    const d = new Date(Date.UTC(year, month + 1, 0));
    const day = d.getUTCDay();
    return new Date(Date.UTC(year, month, d.getUTCDate() - day));
  };

  if (region === "usa") {
    // USA: 2nd Sunday Mar to 1st Sunday Nov
    const start = getNthSunday(2, 2); // Mar (0-indexed = 2)
    const end = getNthSunday(1, 10); // Nov
    return date >= start && date < end;
  } else if (region === "europe") {
    // Europe: Last Sunday Mar to Last Sunday Oct
    const start = getLastSunday(2); // Mar
    const end = getLastSunday(9); // Oct
    return date >= start && date < end;
  } else if (region === "australia") {
    // Australia: 1st Sunday Oct to 1st Sunday Apr
    // Note: Crosses year boundary. DST is ON at start of year.
    const start = getNthSunday(1, 9); // Oct
    const end = getNthSunday(1, 3); // Apr
    // DST is active if we are AFTER start OR BEFORE end
    return date >= start || date < end;
  }

  return false;
}

function recalculateSessionTimes() {
  const now = new Date();

  // 1. Update SESSIONS
  SESSIONS = {};
  Object.entries(SESSION_CONFIG).forEach(([key, config]) => {
    let start = config.standardStart;
    const isDstActive = isDST(now, config.dstRegion);

    // Adjust for DST
    // USA/Europe: Clocks go forward in Summer (UTC offset decreases, so UTC start time decreases)
    // Example: NY Standard (UTC-5) 9am = 14:00 UTC. NY DST (UTC-4) 9am = 13:00 UTC.
    // So if DST, subtract 1 hour from UTC start.
    if (config.dstRegion === "usa" || config.dstRegion === "europe") {
      if (isDstActive) start -= 1;
    }

    // Australia: Clocks go forward in Summer (UTC offset increases, so UTC start time decreases)
    // Example: Sydney Standard (UTC+10) 7am = 21:00 UTC (prev day).
    // Sydney DST (UTC+11) 7am = 20:00 UTC (prev day).
    // Wait, let's check the offset direction.
    // Sydney Standard = UTC+10. 10pm UTC = 8am Sydney.
    // Sydney DST = UTC+11. 9pm UTC = 8am Sydney.
    // So yes, subtract 1 hour from UTC start.
    if (config.dstRegion === "australia") {
      if (isDstActive) start -= 1;
    }

    // Normalize start (handle negative or > 24)
    if (start < 0) start += 24;
    if (start >= 24) start -= 24;

    let end = start + config.duration;
    // We don't normalize end here because the logic handles start < end vs start > end

    SESSIONS[key] = {
      ...config,
      start: start,
      end: end,
    };
  });

  // 2. Update MARKET_ASSETS
  MARKET_ASSETS = {};
  Object.entries(MARKET_ASSETS_CONFIG).forEach(([key, config]) => {
    let open = config.standardOpenUTC;
    const isDstActive = isDST(now, config.dstRegion);

    if (
      isDstActive &&
      (config.dstRegion === "usa" ||
        config.dstRegion === "europe" ||
        config.dstRegion === "australia")
    ) {
      open -= 1;
    }

    // Normalize open
    if (open < 0) open += 24;
    if (open >= 24) open -= 24;

    let close = open + config.duration;

    MARKET_ASSETS[key] = {
      ...config,
      openUTC: open,
      closeUTC: close,
    };
  });

  // Update Alarms based on new times
  updateSessionButtonTimes();
}

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

    activeForexSessionsText.textContent = `Opens ${openStr}`;

    // Dim all sessions
    document.querySelectorAll(".session-card").forEach((card) => {
      card.classList.remove("active");
    });

    // Stock exchanges are also closed on weekends
    exchangeStatusText.textContent = "Weekend - Closed";
    exchangeStatusDot.className = "status-dot closed";
    activeExchangesText.textContent = "Exchanges open Monday";
    return;
  }

  // =================FOREX SESSIONS STATUS=================
  forexStatusText.textContent = "Market Open";
  forexStatusDot.className = "status-dot active";

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
    activeForexSessionsText.textContent = `Active: ${activeSessions.join(
      ", "
    )}`;
  } else {
    activeForexSessionsText.textContent = "No Major Sessions Active"; // Gap time
  }

  // =================STOCK EXCHANGES STATUS=================
  checkExchangeStatus(now);
}

function checkExchangeStatus(now) {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const currentTimeUTC = hour + minute / 60;

  // Check if weekend
  let isWeekend = false;
  if (day === 6 || (day === 5 && hour >= 22) || (day === 0 && hour < 22)) {
    isWeekend = true;
    exchangeStatusText.textContent = "Weekend - Closed";
    exchangeStatusDot.className = "status-dot closed";
    activeExchangesText.textContent = "Exchanges open Monday";
    return;
  }

  const activeExchanges = [];

  Object.entries(MARKET_ASSETS).forEach(([key, market]) => {
    let isOpen = false;
    if (market.openUTC < market.closeUTC) {
      isOpen =
        currentTimeUTC >= market.openUTC && currentTimeUTC < market.closeUTC;
    } else {
      isOpen =
        currentTimeUTC >= market.openUTC || currentTimeUTC < market.closeUTC;
    }

    if (isOpen) {
      activeExchanges.push(market.location.split(" ")[0]); // Get short name
    }
  });

  if (activeExchanges.length > 0) {
    exchangeStatusText.textContent = "Markets Open";
    exchangeStatusDot.className = "status-dot active";
    activeExchangesText.textContent = `Open: ${activeExchanges.join(", ")}`;
  } else {
    exchangeStatusText.textContent = "All Closed";
    exchangeStatusDot.className = "status-dot closed";
    activeExchangesText.textContent = "No exchanges trading now";
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

// ==================== CUSTOM NOTIFICATION SYSTEM ====================

function createNotificationContainer() {
  if (!document.getElementById("notification-container")) {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    document.body.appendChild(container);
  }
}

function showNotification(message, type = "info") {
  const container =
    document.getElementById("notification-container") ||
    createNotificationContainer();

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  const iconMap = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  notification.innerHTML = `
    <span class="notification-icon">${iconMap[type] || iconMap.info}</span>
    <span class="notification-message">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(notification);

  // Add entrance animation
  setTimeout(() => notification.classList.add("show"), 10);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// ==================== ALARM FEATURE ====================

const SESSION_OPEN_TIMES = {
  tokyo: { utc: 0, label: "Tokyo (TSE) Open", region: "none" },
  hongkong: { utc: 1.5, label: "Hong Kong (HKEX) Open", region: "none" },
  india: { utc: 3.75, label: "India (NSE/BSE) Open", region: "none" },
  euronext: { utc: 8, label: "Euronext (Paris) Open", region: "europe" },
  london: { utc: 8, label: "London (LSE) Open", region: "europe" },
  newyork: { utc: 14.5, label: "New York (NYSE) Open", region: "usa" },
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
  const now = new Date();
  Object.keys(SESSION_OPEN_TIMES).forEach((session) => {
    const timeEl = document.getElementById(`${session}-time`);
    const config = SESSION_OPEN_TIMES[session];

    let utc = config.utc;
    const isDstActive = isDST(now, config.region);

    if (isDstActive && config.region !== "none") {
      utc -= 1;
    }

    if (utc < 0) utc += 24;

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
  const config = SESSION_OPEN_TIMES[session];
  const now = new Date();

  let utc = config.utc;
  const isDstActive = isDST(now, config.region);

  if (isDstActive && config.region !== "none") {
    utc -= 1;
  }

  if (utc < 0) utc += 24;

  // Calculate next occurrence
  const alarmTime = calculateNextSessionTime(utc);

  const alarm = {
    id: Date.now(),
    time: alarmTime,
    label: config.label,
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
  // Check for duplicate alarms (same time)
  const isDuplicate = alarms.some((existingAlarm) => {
    const existingTime = new Date(existingAlarm.time).getTime();
    const newTime = new Date(alarm.time).getTime();
    return existingTime === newTime;
  });

  if (isDuplicate) {
    showNotification("An alarm is already set for this time!", "warning");
    return;
  }

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
  const activeAlarmsHeader = document.querySelector(".active-alarms h3");

  // Update header with count
  if (activeAlarmsHeader) {
    activeAlarmsHeader.textContent = `Active Alarms (${alarms.length})`;
  }

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

  // Show browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🔔 Global Market Hours - Alarm!", {
      body: `${alarm.label} - Market is opening now!`,
      icon: "favicon-96x96.png",
      badge: "favicon-96x96.png",
      requireInteraction: true,
      tag: "market-alarm",
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
