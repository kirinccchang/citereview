const measurementId = 'G-CVLG6YLBMY';

function hasRealMeasurementId(id) {
  return typeof id === 'string' && /^G-[A-Z0-9]+$/i.test(id) && id !== 'G-XXXXXXXXXX';
}

function loadGoogleAnalytics(id) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.trackAnalyticsEvent = function trackAnalyticsEvent(name, params = {}) {
    const eventName = String(name || '').trim();
    if (!eventName) return;
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    window.gtag('event', eventName, cleanParams);
  };

  window.gtag('js', new Date());
  window.gtag('config', id, {
    anonymize_ip: true,
    transport_type: 'beacon',
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

if (hasRealMeasurementId(measurementId)) {
  loadGoogleAnalytics(measurementId);
} else {
  window.trackAnalyticsEvent = function trackAnalyticsEvent() {};
  console.info('Google Analytics is disabled until analytics.js has a real GA4 measurement ID.');
}