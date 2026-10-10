// Carregadores das ferramentas de marketing. SÓ são chamados depois do "Aceitar" (ver ConsentBanner.astro).
// Escritos sem <script> inline para a CSP continuar sem 'unsafe-inline'.

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const inject = (src: string) => {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

/** Meta Pixel (equivale ao snippet oficial, sem código inline). */
export function loadMetaPixel(pixelId: string): void {
  if (!pixelId || window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;
  inject('https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', pixelId);
  fbq('track', 'PageView');
}

/** Tag do Google Ads (gtag.js). */
export function loadGoogleAds(adsId: string): void {
  if (!adsId || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- o gtag.js exige o objeto `arguments`, não um array
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', adsId);
  inject(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`);
}

/** Contato enviado com sucesso: avisa as ferramentas que estiverem carregadas (nenhuma, se não houve consentimento). */
export function trackLead(): void {
  window.fbq?.('track', 'Lead');
  window.gtag?.('event', 'generate_lead');
}
