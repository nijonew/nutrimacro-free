// Basic app-shell caching. This does NOT cache API responses —
// those always need a live network call (Supabase now, not Apps Script).
// It only lets the app's own shell (HTML/CSS/JS) load instantly and
// work even with a flaky connection.

const CACHE_NAME = "nutrition-app-shell-v19";
const SHELL_FILES = [
  "./index.html",
  "./log.html",
  "./today.html",
  "./recipe.html",
  "./settings.html",
  "./add-food.html",
  "./edit-food.html",
  "./bulk-import.html",
  "./workout.html",
  "./workout-history.html",
  "./workout-templates.html",
  "./report.html",
  "./achievements.html",
  "./progress.html",
  "./manifest.json",
  "./style.css",
  "./calc.js",
  "./app.js"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {

  // Never cache calls to Supabase or its Edge Functions — always go live.
  if (event.request.url.indexOf("supabase.co") !== -1) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    })
  );

});
