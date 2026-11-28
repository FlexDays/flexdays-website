// FlexDays signup tracking (website only, never the portal).
// 1. Keeps the ad source (utm_*, gclid, fbclid) for 30 days and adds it to every signup link,
//    so the portal can save where each company came from.
// 2. Tells Meta (Lead) and Google Ads (conversion) when someone clicks a signup link.
(function () {
  // Fill this in after creating the Google Ads conversion, e.g. 'AW-123456789/AbC-dEfGhIjK'.
  var GOOGLE_ADS_SEND_TO = 'AW-18601177021/ZnJfCJecpsEdEL3f3aVF';

  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  var STORE_KEY = 'fd_src';
  var MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
  var SIGNUP = 'portal.flexdays.app/register';

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved && Date.now() - saved.t < MAX_AGE_MS) return saved.p;
    } catch (e) {}
    return {};
  }

  function save(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ t: Date.now(), p: p })); } catch (e) {}
  }

  // A new ad click replaces the old source (last touch wins).
  var query = new URLSearchParams(location.search);
  var fresh = {};
  var hasFresh = false;
  KEYS.forEach(function (k) {
    var v = query.get(k);
    if (v) { fresh[k] = v.slice(0, 200); hasFresh = true; }
  });
  if (hasFresh) save(fresh);
  var source = hasFresh ? fresh : load();

  function addSource(a) {
    try {
      var u = new URL(a.href);
      Object.keys(source).forEach(function (k) {
        if (!u.searchParams.has(k)) u.searchParams.set(k, source[k]);
      });
      a.href = u.toString();
    } catch (e) {}
  }

  function signupLinks() {
    return document.querySelectorAll('a[href*="' + SIGNUP + '"]');
  }

  Array.prototype.forEach.call(signupLinks(), addSource);

  function reportSignupClick() {
    if (window.fbq) window.fbq('track', 'Lead');
    if (window.gtag && GOOGLE_ADS_SEND_TO) window.gtag('event', 'conversion', { send_to: GOOGLE_ADS_SEND_TO });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="' + SIGNUP + '"]') : null;
    if (!a) return;
    addSource(a);
    reportSignupClick();
    // New tab or modifier key: the page stays open, so the events send normally.
    if (a.target === '_blank' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Same tab: wait a moment so the events leave before the page changes.
    e.preventDefault();
    setTimeout(function () { location.href = a.href; }, 300);
  });
})();
