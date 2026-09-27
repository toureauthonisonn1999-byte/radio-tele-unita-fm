'use strict';

// All player controls share this audio element and this state machine.
const audio = document.getElementById('audio');
const stateLabels = {
  idle: ['PRÊT À ÉCOUTER', 'Prêt à écouter', 'Un instant pour vous. Appuyez sur lecture et laissez-vous accompagner.'],
  loading: ['CONNEXION…', 'Connexion au direct…', 'Connexion à la station en cours…'],
  playing: ['EN DIRECT', 'Vous écoutez le direct', 'Vous êtes à l’écoute de Radio Télé Unita FM.'],
  paused: ['EN PAUSE', 'Écoute en pause', 'Reprenez le direct quand vous le souhaitez.'],
  error: ['FLUX INDISPONIBLE', 'Connexion interrompue', 'Le direct est momentanément indisponible. Appuyez sur lecture pour réessayer.']
};
const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>';
let playerState = 'idle';
let language = 'fr';
let attempt = 0;
let connectTimer;
const readPreference = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Browsing restrictions must not interrupt listening. */ } };
const translate = text => (I18N[language] || {})[text] || text;
const stateNodes = ['status', 'miniStatus', 'notice'].map(id => document.getElementById(id));

function renderPlayer(next = playerState) {
  playerState = next;
  const active = next === 'playing' || next === 'loading';
  for (const name of ['playing', 'loading', 'error']) document.body.classList.toggle('is-' + name, next === name);
  stateNodes.forEach((node, i) => { node.textContent = translate(stateLabels[next][i]); });
  document.querySelectorAll('[data-toggle]').forEach(button => {
    button.innerHTML = active ? pauseIcon : playIcon;
    button.setAttribute('aria-label', translate(active ? 'Mettre en pause' : 'Écouter la radio'));
    button.setAttribute('aria-pressed', String(active));
  });
  if (next !== 'loading') clearTimeout(connectTimer);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = next === 'playing' ? 'playing' : next === 'paused' ? 'paused' : 'none';
}

function failPlayback() {
  attempt++;
  audio.pause();
  renderPlayer('error');
}
async function startRadio() {
  if (playerState === 'playing' || playerState === 'loading') return;
  const token = ++attempt;
  if (playerState === 'error' || audio.error) audio.load();
  renderPlayer('loading');
  connectTimer = setTimeout(() => { if (attempt === token && playerState === 'loading') failPlayback(); }, 20000);
  try { await audio.play(); }
  catch (error) { if (attempt === token && error.name !== 'AbortError') failPlayback(); }
}
function pauseRadio() { attempt++; audio.pause(); renderPlayer('paused'); }
document.querySelectorAll('[data-start]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); startRadio(); }));
document.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click', () => playerState === 'playing' || playerState === 'loading' ? pauseRadio() : startRadio()));
audio.addEventListener('playing', () => renderPlayer('playing'));
audio.addEventListener('pause', () => { if (playerState !== 'error') renderPlayer('paused'); });
audio.addEventListener('error', failPlayback);
audio.addEventListener('ended', () => renderPlayer('paused'));
audio.addEventListener('waiting', () => {
  if (!audio.paused) { renderPlayer('loading'); clearTimeout(connectTimer); connectTimer = setTimeout(failPlayback, 20000); }
});
const volume = document.getElementById('volume');
const mute = document.getElementById('mute');
audio.volume = Number(volume.value);
function renderVolume() {
  const silent = audio.muted || audio.volume === 0;
  mute.setAttribute('aria-pressed', String(silent));
  mute.setAttribute('aria-label', translate(silent ? 'Rétablir le son' : 'Couper le son'));
  document.getElementById('volumeValue').textContent = Math.round((silent ? 0 : audio.volume) * 100) + '%';
}
volume.addEventListener('input', () => { audio.volume = Number(volume.value); audio.muted = false; renderVolume(); });
mute.addEventListener('click', () => { if (audio.volume === 0) { audio.volume = .85; volume.value = '.85'; audio.muted = false; } else audio.muted = !audio.muted; renderVolume(); });
audio.addEventListener('volumechange', renderVolume);
if ('mediaSession' in navigator) {
  if ('MediaMetadata' in window) navigator.mediaSession.metadata = new MediaMetadata({ title: 'Radio Télé Unita FM', artist: 'Votre voix · notre mission', artwork: [{ src: new URL('assets/logo-radio-tele-unita-fm.png', location.href).href, type: 'image/png' }] });
  for (const [action, handler] of [['play', startRadio], ['pause', pauseRadio], ['stop', pauseRadio]]) {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Optional on older browsers. */ }
  }
}

// Keep the French source text: language changes never reload the stream.
const textEntries = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node = walker.currentNode;
  if (!node.parentElement || node.parentElement.closest('script,style,select,option,[role="status"],#miniStatus,#notice,#volumeValue')) continue;
  if (node.nodeValue.trim()) textEntries.push([node, node.nodeValue]);
}
const attributeEntries = [];
document.querySelectorAll('[aria-label]').forEach(node => attributeEntries.push([node, node.getAttribute('aria-label')]));
function setLanguage(value) {
  language = ['fr', 'ht', 'en'].includes(value) ? value : 'fr';
  textEntries.forEach(([node, original]) => { node.nodeValue = original.replace(original.trim(), translate(original.trim())); });
  attributeEntries.forEach(([node, original]) => node.setAttribute('aria-label', translate(original)));
  document.documentElement.lang = language;
  document.getElementById('lang').value = language;
  savePreference('unitaLang', language);
  renderPlayer(); renderVolume(); renderMenuLabel(); renderMotionLabel();
}
document.getElementById('lang').addEventListener('change', event => setLanguage(event.target.value));
const menu = document.getElementById('menu');
const navigation = document.getElementById('navigation');
function renderMenuLabel() { menu.setAttribute('aria-label', translate(menu.getAttribute('aria-expanded') === 'true' ? 'Fermer le menu' : 'Ouvrir le menu')); }
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); renderMenuLabel(); }
menu.addEventListener('click', () => { const open = navigation.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); renderMenuLabel(); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menu.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
const desktopQuery = matchMedia('(min-width:901px)');
desktopQuery.addEventListener('change', () => { if (desktopQuery.matches) closeMenu(); });

// A lightweight generative globe: no video download or WebGL dependency.
const canvas = document.getElementById('orb');
const context = canvas.getContext('2d');
const visual = document.querySelector('.visual');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reducedQuery.matches || readPreference('unitaMotion', 'full') === 'reduced';
let visible = true;
let frame = 0;
let lastFrame = 0;
let angle = .4;
let width = 0;
let height = 0;
const points = [];
for (let row = 1; row < 38; row++) {
  const latitude = row / 38 * Math.PI;
  const count = Math.max(6, Math.floor(Math.sin(latitude) * 78));
  for (let col = 0; col < count; col++) {
    const longitude = col / count * Math.PI * 2;
    points.push([Math.sin(latitude) * Math.cos(longitude), Math.cos(latitude), Math.sin(latitude) * Math.sin(longitude)]);
  }
}
function drawGlobe() {
  if (!context || !width || !height) return;
  context.clearRect(0, 0, width, height);
  const radius = Math.min(width * .37, height * .37);
  const cx = width / 2, cy = height / 2;
  const glow = context.createRadialGradient(cx, cy, radius * .65, cx, cy, radius * 1.24);
  glow.addColorStop(0, '#1268ba00'); glow.addColorStop(.63, '#2387f023'); glow.addColorStop(.81, '#58b1fc15'); glow.addColorStop(1, '#1a67c000');
  context.fillStyle = glow; context.fillRect(0, 0, width, height);
  const inner = context.createRadialGradient(cx - radius * .2, cy - radius * .3, 0, cx, cy, radius);
  inner.addColorStop(0, '#132c48b0'); inner.addColorStop(.8, '#0a213eb0'); inner.addColorStop(1, '#317bc151');
  context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fillStyle = inner; context.fill();
  const sin = Math.sin(angle), cos = Math.cos(angle);
  for (const [x, y, z] of points) {
    const px = x * cos + z * sin;
    const pz = -x * sin + z * cos;
    const py = y * .95 + pz * .2;
    const depth = (pz + 1) / 2;
    context.beginPath();
    context.arc(cx + px * radius, cy + py * radius, .45 + depth * .85, 0, Math.PI * 2);
    context.fillStyle = `rgba(${70 + Math.round(depth * 50)},${135 + Math.round(depth * 65)},255,${.13 + depth * .7})`;
    context.fill();
  }
  context.beginPath(); context.arc(cx, cy, radius, -.8, 2); context.strokeStyle = '#7fc7ff60'; context.lineWidth = 1; context.stroke();
}
function animate(timestamp) {
  if (reduced || !visible || document.hidden) { frame = 0; return; }
  if (timestamp - lastFrame > 32) { angle += playerState === 'playing' ? .006 : .0025; drawGlobe(); lastFrame = timestamp; }
  frame = requestAnimationFrame(animate);
}
function syncAnimation() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0; drawGlobe();
  if (!reduced && visible && !document.hidden) frame = requestAnimationFrame(animate);
}
new ResizeObserver(() => {
  width = visual.clientWidth; height = visual.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * dpr; canvas.height = height * dpr;
  if (context) context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawGlobe();
}).observe(visual);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncAnimation(); }).observe(visual);
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { if (!reduced) entry.target.classList.add('reveal'); revealObserver.unobserve(entry.target); } });
  }, { threshold: .08 });
  document.querySelectorAll('.top,.program,.spiritualCard,.prayerBox,.director').forEach(node => revealObserver.observe(node));
  const activeObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) navigation.querySelectorAll('a').forEach(a => {
      const active = a.hash === '#' + entry.target.id;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }, { rootMargin: '-10% 0px -55% 0px' });
  document.querySelectorAll('#radio,#programmes,#spiritualite,#direction,#contact').forEach(node => activeObserver.observe(node));
}
document.addEventListener('visibilitychange', syncAnimation);
visual.addEventListener('pointermove', event => {
  if (reduced || event.pointerType !== 'mouse') return;
  const box = visual.getBoundingClientRect();
  visual.style.setProperty('--tiltX', ((event.clientX - box.left) / box.width - .5) * 9 + 'deg');
  visual.style.setProperty('--tiltY', -((event.clientY - box.top) / box.height - .5) * 6 + 'deg');
});
visual.addEventListener('pointerleave', () => { visual.style.setProperty('--tiltX', '0deg'); visual.style.setProperty('--tiltY', '0deg'); });
function renderMotionLabel() {
  const button = document.getElementById('motion');
  button.setAttribute('aria-pressed', String(reduced));
  button.setAttribute('aria-label', translate(reduced ? 'Activer les animations' : 'Réduire les animations'));
  button.textContent = reduced ? '▷' : 'Ⅱ';
  document.body.classList.toggle('reduced-motion', reduced);
  document.documentElement.style.scrollBehavior = reduced ? 'auto' : '';
}
document.getElementById('motion').addEventListener('click', () => { reduced = !reduced; savePreference('unitaMotion', reduced ? 'reduced' : 'full'); renderMotionLabel(); syncAnimation(); });
reducedQuery.addEventListener('change', event => { reduced = event.matches || readPreference('unitaMotion', 'full') === 'reduced'; renderMotionLabel(); syncAnimation(); });
setLanguage(readPreference('unitaLang', 'fr'));
syncAnimation();
