export function track(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  }
  // Mesure d'audience first-party (sans cookie) : même événement.
  if (typeof window.track === 'function') {
    const v = Number(params.value);
    window.track(eventName, Number.isFinite(v) ? v : undefined);
  }
}
