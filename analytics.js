// Preserve the site's existing Google Analytics property.
// Local previews and automated checks do not create analytics traffic.
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-R5CTNLJQ6G');
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-R5CTNLJQ6G';
  document.head.append(script);
}
// Contact clicks are intent signals, not confirmed leads. Never include personal data.
window.trackPortfolioEvent = function (name, details = {}) {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  window.gtag?.('event', name, details);
};
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  if (link.href.startsWith('https://wa.me/')) window.trackPortfolioEvent('whatsapp_click', {contact_location: link.classList.contains('whatsapp') ? 'floating' : 'page'});
  if (link.href.startsWith('mailto:')) window.trackPortfolioEvent('email_click');
});
