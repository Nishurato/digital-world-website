const scene = document.querySelector('#scene');
const field = document.querySelector('#field');
const world = document.querySelector('#world');
const panel = document.querySelector('#details');
const nodes = [...document.querySelectorAll('.node')];
document.querySelectorAll('img').forEach(img => { img.draggable = false; });
scene.addEventListener('dragstart', e => e.preventDefault());
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let fit = 1, mobile = false, height = 1080;
let view = { x: 0, y: 0, zoom: 1 }, savedView = null;
let selected = null, panelNode = null, timer = null, revision = 0;
const duration = () => reducedMotion.matches ? 1 : 460;
const data = {
  initialization: { title: 'INITITALIZATION', description: 'Initializing a new digital world' },
  unknown: { title: '?', description: '?', unknown: true },
};
// Profile destinations can be supplied here without changing the layout.
const socialLinks = { youtube: null, tiktok: null, soundcloud: null, bandcamp: null, tumblr: null };
document.querySelectorAll('[data-social]').forEach(a => {
  const url = socialLinks[a.dataset.social];
  if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.title = `${a.getAttribute('aria-label')} — link not provided`; }
});
function renderView(animate = false) {
  world.classList.toggle('animating', animate);
  world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
  const step = 24 * view.zoom, major = step * 4;
  field.style.backgroundSize = `${major}px ${major}px,${major}px ${major}px,${step}px ${step}px,${step}px ${step}px`;
  field.style.backgroundPosition = `${view.x}px ${view.y}px`;
}
function updateConnection() {
  // Measure in world coordinates: pan and zoom then move both nodes and line together.
  const [first, second] = nodes.map(node => {
    const style = getComputedStyle(node);
    return {
      x: parseFloat(style.left),
      y: parseFloat(style.top),
      width: parseFloat(style.width),
      height: parseFloat(style.height),
    };
  });
  // One SVG coordinate system for both endpoints, without rotating/scaling an image.
  // On desktop the connector sits slightly below the nodes' centre line.
  const start = mobile
    ? { x: first.x + first.width / 2, y: first.y + first.height / 2 }
    : { x: first.x + 4, y: first.y + first.height / 2 };
  const end = mobile
    ? { x: start.x, y: second.y + second.height / 2 }
    : { x: second.x + second.width / 2, y: start.y };
  const connection = document.querySelector('.connection');
  connection.setAttribute('viewBox', `0 0 ${mobile ? 720 : 1920} ${height}`);
  const line = connection.querySelector('line');
  for (const [attribute, value] of Object.entries({ x1: start.x, y1: start.y, x2: end.x, y2: end.y })) {
    line.setAttribute(attribute, value);
  }
  const gradient = connection.querySelector('linearGradient');
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
  for (const [attribute, value] of Object.entries({ x1: start.x, y1: start.y, x2: end.x, y2: end.y })) {
    gradient.setAttribute(attribute, value);
  }
}
function resize() {
  const nextMobile = innerWidth <= 760;
  if (nextMobile !== mobile) { view = { x: 0, y: 0, zoom: 1 }; savedView = null; }
  mobile = nextMobile;
  fit = innerWidth / (mobile ? 720 : 1920);
  height = innerHeight / fit;
  scene.style.height = `${height}px`;
  scene.style.setProperty('--height', `${height}px`);
  scene.style.transform = `scale(${fit})`;
  updateConnection();
  renderView();
}
function hidePanel(restore = true) {
  revision++;
  clearTimeout(timer);
  panel.classList.remove('open');
  panel.inert = true;
  panel.setAttribute('aria-hidden', 'true');
  nodes.forEach(n => n.setAttribute('aria-expanded', 'false'));
  if (restore && savedView) { view = { ...savedView }; savedView = null; renderView(true); }
}
function showContent(id) {
  panelNode = id;
  const entry = data[id];
  document.querySelector('#detail-title').textContent = entry.title;
  document.querySelector('#detail-description').textContent = entry.description;
  panel.classList.toggle('unknown-panel', !!entry.unknown);
  panel.inert = false;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('open');
  document.getElementById(id).setAttribute('aria-expanded', 'true');
}
function selectNode(id) {
  const wasOpen = panel.classList.contains('open');
  clearTimeout(timer);
  const version = ++revision;
  selected = id;
  nodes.forEach(n => { n.classList.toggle('selected', n.id === id); n.setAttribute('aria-pressed', String(n.id === id)); });
  if (wasOpen && panelNode === id) return;
  if (!savedView) savedView = { ...view };
  if (!mobile) {
    const x = id === 'initialization' ? 121 : 1633;
    view.x = 768 - x * view.zoom;
    view.y = height * .485185 - height * .441667 * view.zoom;
    renderView(true);
  }
  if (wasOpen) {
    hidePanel(false);
    const pendingRevision = revision;
    timer = setTimeout(() => { if (revision === pendingRevision) showContent(id); }, duration());
  } else {
    timer = setTimeout(() => { if (revision === version) showContent(id); }, 20);
  }
}
nodes.forEach(n => n.addEventListener('click', e => { e.stopPropagation(); if (!suppressClick) selectNode(n.id); }));
document.querySelector('#close').addEventListener('click', () => { const active = selected; hidePanel(); document.getElementById(active)?.focus({ preventScroll: true }); });
// Pointer capture makes dragging continuous even beyond the viewport.
const pointers = new Map();
let gesture = null, suppressClick = false;
function point(e) { return { x: e.clientX / fit, y: e.clientY / fit }; }
function metrics() {
  const p = [...pointers.values()];
  return p.length > 1 ? { x: (p[0].x+p[1].x)/2, y: (p[0].y+p[1].y)/2, distance: Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y) } : { ...p[0], distance: 0 };
}
function beginGesture() { gesture = { ...metrics(), view: { ...view } }; }
field.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  pointers.set(e.pointerId, point(e));
  // Capture on the node for clicks, or the field for background drags.
  // Either way the gesture continues if the pointer leaves its starting element.
  (e.target.closest('.node') || field).setPointerCapture(e.pointerId);
  if (pointers.size === 1) suppressClick = false;
  beginGesture();
});
field.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId) || !gesture) return;
  pointers.set(e.pointerId, point(e));
  const m = metrics(), dx = m.x - gesture.x, dy = m.y - gesture.y;
  if (Math.hypot(dx,dy) * fit > 5 || pointers.size > 1) suppressClick = true;
  if (!suppressClick) return;
  field.classList.add('dragging');
  const z = pointers.size > 1 && gesture.distance > 0 ? Math.max(.35,Math.min(3,gesture.view.zoom * m.distance / gesture.distance)) : gesture.view.zoom;
  const ratio = z / gesture.view.zoom;
  view = { zoom: z, x: m.x-(gesture.x-gesture.view.x)*ratio, y: m.y-(gesture.y-gesture.view.y)*ratio };
  renderView();
});
function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size) beginGesture();
  else { gesture = null; field.classList.remove('dragging'); }
}
field.addEventListener('pointerup',endPointer);
field.addEventListener('pointercancel',e => { suppressClick = true; endPointer(e); });
field.addEventListener('click', e => { if (!suppressClick && !e.target.closest('.node')) hidePanel(); });
function zoomAt(amount,x,y) {
  const zoom = Math.max(.35,Math.min(3,view.zoom * amount)), ratio = zoom / view.zoom;
  view = { zoom, x: x-(x-view.x)*ratio, y: y-(y-view.y)*ratio };
  renderView();
}
field.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015),e.clientX/fit,e.clientY/fit); }, { passive:false });
field.addEventListener('keydown', e => {
  if (e.target.closest('.node')) return;
  const delta = 50 / view.zoom;
  if (e.key === '+' || e.key === '=') zoomAt(1.2,(mobile?720:1920)/2,height/2);
  else if (e.key === '-') zoomAt(1/1.2,(mobile?720:1920)/2,height/2);
  else if (e.key === 'Home' || e.key === '0') { view = { x:0,y:0,zoom:1 }; savedView = null; renderView(true); }
  else if (e.key.startsWith('Arrow')) { if(e.key==='ArrowLeft')view.x+=delta;if(e.key==='ArrowRight')view.x-=delta;if(e.key==='ArrowUp')view.y+=delta;if(e.key==='ArrowDown')view.y-=delta;renderView(); }
  else return;
  e.preventDefault();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePanel(); });
addEventListener('resize',resize);
resize();
// Recalculate when the node layout changes; selection does not move the line's axis.
const connectionObserver = new ResizeObserver(updateConnection);
nodes.forEach(node => connectionObserver.observe(node));
// Progress reflects actual local image and font readiness.
async function load() {
  scene.inert = true;
  const started = performance.now();
  const loader = document.querySelector('#loader'), progress = document.querySelector('#progress');
  const assets = [...new Set([...document.images].map(img=>img.src))];
  const jobs = assets.map(src => new Promise(resolve => { const img = new Image(); img.onload = img.onerror = resolve; img.src = src; }));
  jobs.push(document.fonts.load('48px Nishu'),document.fonts.load('600 32px Euro'),document.fonts.load('32px Euro'),document.fonts.load('600 36px EuroExtended'));
  let completed = 0;
  await Promise.all(jobs.map(async job => { await job; const value = Math.round(++completed/jobs.length*100); progress.style.setProperty('--progress',`${value}%`);progress.setAttribute('aria-valuenow',value);document.querySelectorAll('.percentage').forEach(el=>el.textContent=`${value}%`); }));
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,650-(performance.now()-started))));
  scene.inert = false;
  loader.classList.add('finished');
}
load();
