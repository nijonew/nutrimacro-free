// ============================================================
// Shared app config + API helpers
// Used by every page — keeps connection setup and request
// logic in one place instead of duplicated per screen.
// ============================================================

function saveConfig(url, token) {
  localStorage.setItem("apiUrl", url.trim());
  localStorage.setItem("apiToken", token.trim());
}

function loadConfig() {
  return {
    url: localStorage.getItem("apiUrl") || "",
    token: localStorage.getItem("apiToken") || ""
  };
}

function isConfigured() {
  const config = loadConfig();
  return !!(config.url && config.token);
}

/**
 * GET request for read-only actions.
 * params is an object of extra query params (action/token added automatically).
 */
function apiGet(action, params) {

  const config = loadConfig();
  params = params || {};
  params.action = action;
  params.token = config.token;

  const qs = new URLSearchParams(params).toString();
  const separator = config.url.indexOf("?") === -1 ? "?" : "&";

  return fetch(config.url + separator + qs).then(function(response) {
    return response.json();
  });

}

/**
 * POST request for write actions. Sent as a plain-text JSON body
 * (not application/json) to avoid a CORS preflight request that
 * Apps Script cannot answer.
 */
function apiPost(action, body) {

  const config = loadConfig();
  const payload = Object.assign({ action: action, token: config.token }, body);

  return fetch(config.url, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(function(response) {
    return response.json();
  });

}

/**
 * Registers the service worker, if supported. Call once per page.
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(function(err) {
      console.log("Service worker registration failed:", err);
    });
  }
}
