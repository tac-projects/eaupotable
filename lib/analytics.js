export function track(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  }
  // Mesure d'audience first-party (sans cookie) : même événement.
  // Scalaire -> ev ; objet de params -> payload JSON (ep), pour ne rien perdre.
  if (typeof window.track === 'function') {
    const { value, ...rest } = params || {};
    const v = Number(value);
    if (Number.isFinite(v)) window.track(eventName, v);
    else if (Object.keys(rest).length) window.track(eventName, rest);
    else window.track(eventName);
  }
}
