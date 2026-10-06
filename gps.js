// Browser GPS only. No geocoding, network calls, or saved device-location history.
export function getDevicePosition(browser = navigator, secure = globalThis.isSecureContext, timeout = 15000) {
  return new Promise((resolve, reject) => {
    if (!secure) return reject({ code: 'https' });
    if (!browser.geolocation) return reject({ code: 'unsupported' });
    let finished = false;
    const finish = (handler, value) => {
      if (finished) return;
      finished = true; clearTimeout(deadline); handler(value);
    };
    // Guard browsers that never invoke either callback (including stalled prompts).
    const deadline = setTimeout(() => finish(reject, { code: 3 }), timeout + 1000);
    try {
      browser.geolocation.getCurrentPosition(position => {
        const c = position?.coords;
        if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude) || Math.abs(c.latitude) > 90 || Math.abs(c.longitude) > 180 || !Number.isFinite(c.accuracy) || c.accuracy < 0) return finish(reject, { code: 2 });
        finish(resolve, position);
      }, error => finish(reject, error), { enableHighAccuracy: true, maximumAge: 0, timeout });
    } catch { finish(reject, { code: 2 }); }
  });
}
export function gpsErrorMessage(error) {
  if (error?.code === 'https') return 'Konum için uygulamayı HTTPS adresinden açın.';
  if (error?.code === 'unsupported') return 'Bu tarayıcı konum özelliğini desteklemiyor.';
  if (error?.code === 1) return 'Konum izni kapalı. Telefonun Konum Servislerini ve bu site için tarayıcı konum iznini açın, sonra tekrar deneyin.';
  if (error?.code === 3) return 'Konum isteği zaman aşımına uğradı. Konum Servislerini kontrol edip açık alanda tekrar deneyin.';
  return 'Telefon konumu belirleyemedi. Konum Servislerini kontrol edip tekrar deneyin.';
}
