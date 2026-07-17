// ============================================================
// Shared app config + API helpers
// The backend URL is the same for everyone using this app, so
// it's hardcoded here rather than something each person has to
// type in. Only the personal account token is stored per device.
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycbwzRJ39SK-jzPomKS7OsKG8qIvPYNSd2AZwWCOAkyp_12YJhgr1d0RyRex5SBMiJcp6/exec";

function saveToken(token) {
  localStorage.setItem("apiToken", token.trim());
}

function loadToken() {
  return localStorage.getItem("apiToken") || "";
}

function clearToken() {
  localStorage.removeItem("apiToken");
}

function isConfigured() {
  return !!loadToken();
}

/**
 * GET request for read-only actions.
 * params is an object of extra query params (action/token added automatically).
 */
function apiGet(action, params) {

  params = params || {};
  params.action = action;
  params.token = loadToken();

  const qs = new URLSearchParams(params).toString();
  const separator = API_URL.indexOf("?") === -1 ? "?" : "&";

  return fetch(API_URL + separator + qs).then(function(response) {
    return response.json();
  });

}

/**
 * POST request for write actions. Sent as plain-text JSON (not
 * application/json) to avoid a CORS preflight Apps Script can't answer.
 */
function apiPost(action, body) {

  const payload = Object.assign({ action: action, token: loadToken() }, body);

  return fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(function(response) {
    return response.json();
  });

}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(function(err) {
      console.log("Service worker registration failed:", err);
    });
  }
}

// ============================================================
// Global navigation menu (hamburger)
// Automatically injected into every page that loads app.js —
// no per-page HTML changes needed. Wraps the existing .titles
// element with a menu toggle button so header layout stays intact.
// ============================================================

function injectNavMenu() {

  const header = document.querySelector("header");
  if (!header) return;

  const titlesEl = header.querySelector(".titles");
  if (!titlesEl) return;

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "nav-toggle-btn";
  toggleBtn.innerHTML = "&#9776;";
  toggleBtn.setAttribute("aria-label", "Menu");
  toggleBtn.onclick = function() { toggleNavPanel(); };

  const rightWrap = document.createElement("div");
  rightWrap.className = "header-right-wrap";

  // Move any existing non-.titles header children (gear icon, back link,
  // etc.) into the right-side wrap alongside the new menu button, so
  // everything on the right groups together instead of colliding.
  Array.from(header.children).forEach(function(child) {
    if (child !== titlesEl) {
      rightWrap.appendChild(child);
    }
  });

  rightWrap.appendChild(toggleBtn);
  header.appendChild(rightWrap);

  const overlay = document.createElement("div");
  overlay.className = "nav-overlay";
  overlay.id = "navOverlay";
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) closeNavPanel();
  });

  const panel = document.createElement("div");
  panel.className = "nav-panel";

  const groups = [
    { section: "Nutrition", items: [
      { href: "./index.html", label: "Home / Dashboard" },
      { href: "./log.html", label: "Log Food or Recipe" },
      { href: "./today.html", label: "Today" },
      { href: "./recipe.html", label: "Build a Recipe" },
      { href: "./add-food.html", label: "Add Food Manually" },
      { href: "./edit-food.html", label: "Edit a Food" }
    ]},
    { section: "Workouts", items: [
      { href: "./workout.html", label: "Log Workout" },
      { href: "./workout-history.html", label: "Workout History" },
      { href: "./workout-templates.html", label: "Build a Template" }
    ]},
    { section: "Account", items: [
      { href: "./settings.html", label: "Settings" },
      { href: "./report.html", label: "Reports" }
    ]}
  ];

  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  let html = "<div class='nav-panel-header'><span>Menu</span>" +
    "<button class='nav-close-btn' onclick='closeNavPanel()'>&times;</button></div>";

  groups.forEach(function(group) {
    html += "<div class='nav-section-label'>" + group.section + "</div>";
    group.items.forEach(function(item) {
      const isActive = item.href.replace("./", "") === currentPath;
      html += "<a class='nav-link" + (isActive ? " active" : "") + "' href='" + item.href + "'>" + item.label + "</a>";
    });
  });

  panel.innerHTML = html;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

}

function toggleNavPanel() {
  const overlay = document.getElementById("navOverlay");
  if (overlay) overlay.classList.toggle("open");
}

function closeNavPanel() {
  const overlay = document.getElementById("navOverlay");
  if (overlay) overlay.classList.remove("open");
}

window.addEventListener("DOMContentLoaded", function() {
  injectNavMenu();
});

// ============================================================
// Macro percent-of-calories helper
// Uses standard Atwater factors (protein 4 kcal/g, carbs 4 kcal/g,
// fat 9 kcal/g) against the day's actual logged Calories total.
// ============================================================

function calculateMacroPercents(totals) {

  const calories = Number(totals.calories) || 0;

  if (!calories) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: Math.round(((Number(totals.protein) || 0) * 4 / calories) * 100),
    carbs: Math.round(((Number(totals.carbs) || 0) * 4 / calories) * 100),
    fat: Math.round(((Number(totals.fat) || 0) * 9 / calories) * 100)
  };

}
