const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const mode = ['sled', 'cube', 'flight'].includes(params.get('game')) ? params.get('game') : 'sled';
const configs = {
  sled: { title: 'Frostline Run', icon: '❄', instruction: 'Steer between lanes, dodge snowdrifts and logs, and collect glowing trail tokens.', hint: 'Move: ← → or A / D · Start: Space' },
  cube: { title: 'Pulse Cube', icon: '◆', instruction: 'Jump over the bright blocks. Your cube keeps moving, so time each jump.', hint: 'Jump: Space / ↑ · Start or retry: Space' },
  flight: { title: 'Kiwi Skies', icon: '🥝', instruction: 'Tap to flap through the cloud gates. Keep a steady rhythm and see how far you fly.', hint: 'Flap: Space / ↑ / tap · Start or retry: Space' }
};
const config = configs[mode];
document.title = `${config.title} · Appl Study`;
document.getElementById('gameTitle').textContent = config.title;
document.getElementById('startTitle').textContent = config.title;
document.getElementById('startIcon').textContent = config.icon;
document.getElementById('instructions').textContent = config.instruction;
document.getElementById('hint').textContent = config.hint;
const bestKey = `appl-study-${mode}-best`;
document.getElementById('bestScore').textContent = localStorage.getItem(bestKey) || '0';
let width = 900, height = 506, running = false, gameOver = false, lastTime = 0, elapsed = 0, score = 0, objects = [], particles = [];
let lane = 1, playerY = 0, velocityY = 0, birdY = 0, birdVelocity = 0, spawnTimer = 0;
const groundY = () => height * .78;
function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(320, rect.width); height = Math.max(260, rect.height);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
window.addEventListener('resize', resize);
function start() {
  if (running) return;
  if (gameOver) reset();
  running = true; gameOver = false;
  document.getElementById('startScreen').hidden = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}
function reset() {
  elapsed = 0; score = 0; objects = []; particles = []; spawnTimer = .7; lane = 1;
  velocityY = 0; playerY = groundY() - 34; birdY = height * .48; birdVelocity = 0;
}
function endGame() {
  running = false; gameOver = true;
  const best = Math.max(score, Number(localStorage.getItem(bestKey) || 0));
  localStorage.setItem(bestKey, String(best));
  document.getElementById('bestScore').textContent = best;
  document.getElementById('startTitle').textContent = `Run ended · ${score}`;
  document.getElementById('instructions').textContent = 'Nice run! Try again and beat your best score.';
  document.getElementById('startButton').textContent = 'Play again';
  document.getElementById('startScreen').hidden = false;
}
function action(direction = 0) {
  if (!running) { start(); return; }
  if (mode === 'sled') lane = Math.max(0, Math.min(2, lane + direction));
  else if (mode === 'cube') { if (Math.abs(playerY - (groundY() - 34)) < 2) velocityY = -height * 1.05; }
  else birdVelocity = -height * .68;
}
function keydown(event) {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'A', 'D'].includes(event.key)) event.preventDefault();
  if (event.repeat && event.key === ' ') return;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') action(-1);
  else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') action(1);
  else if (event.key === ' ' || event.key === 'ArrowUp') action(0);
}
window.addEventListener('keydown', keydown);
document.getElementById('startButton').addEventListener('click', start);
document.getElementById('leftButton').addEventListener('click', () => action(-1));
document.getElementById('rightButton').addEventListener('click', () => action(1));
document.getElementById('actionButton').addEventListener('click', () => action(0));
canvas.addEventListener('pointerdown', () => { if (mode !== 'sled') action(0); });
function loop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, .04); lastTime = now;
  update(dt); draw(); requestAnimationFrame(loop);
}
function update(dt) {
  elapsed += dt; spawnTimer -= dt;
  const speed = 250 + Math.min(elapsed * 9, 270);
  const interval = Math.max(.5, 1.15 - elapsed * .008);
  if (spawnTimer <= 0) { spawn(); spawnTimer = interval * (.75 + Math.random() * .5); }
  if (mode === 'sled') updateSled(dt, speed);
  else if (mode === 'cube') updateCube(dt, speed);
  else updateFlight(dt, speed);
  objects = objects.filter(o => !o.gone && o.x > -100 && o.y < height + 100);
  score = Math.floor(elapsed * 10 + (mode === 'sled' ? 0 : 0));
}
function spawn() {
  if (mode === 'sled') {
    const l = Math.floor(Math.random() * 3);
    objects.push({ type: Math.random() < .72 ? 'tree' : 'token', lane: l, x: width + 40, y: -50, size: Math.max(24, width * .045), gone: false });
    if (Math.random() < .23) objects.push({ type: 'tree', lane: Math.floor(Math.random() * 3), x: width + 180, y: -150, size: Math.max(24, width * .04), gone: false });
  } else if (mode === 'cube') {
    objects.push({ type: 'block', x: width + 35, y: groundY() - 43, w: 38 + Math.random() * 18, h: 42, gone: false });
  } else {
    const gapY = height * (.38 + Math.random() * .27);
    const gap = Math.max(140, height * .34);
    objects.push({ type: 'gate', x: width + 25, gapY, gap, w: 54, gone: false, counted: false });
  }
}
function updateSled(dt, speed) {
  const playerX = width * .5;
  for (const o of objects) {
    o.y += speed * dt; o.x -= speed * .22 * dt;
    if (o.type === 'token' && !o.gone && o.y > groundY() - 62 && o.y < groundY() + 16 && Math.abs(o.lane - lane) < .15) { o.gone = true; score += 5; burst(playerX, groundY() - 30, '#ffcb72'); }
    if (o.type === 'tree' && o.y > groundY() - 75 && o.y < groundY() - 10 && o.lane === lane) endGame();
  }
}
function updateCube(dt, speed) {
  playerY += velocityY * dt; velocityY += height * 2.8 * dt;
  const floor = groundY() - 30;
  if (playerY > floor) { playerY = floor; velocityY = 0; }
  const px = width * .22;
  for (const o of objects) {
    o.x -= speed * dt;
    if (px + 27 > o.x && px - 25 < o.x + o.w && playerY + 25 > o.y) endGame();
  }
}
function updateFlight(dt, speed) {
  birdVelocity += height * 1.55 * dt; birdY += birdVelocity * dt;
  const birdX = width * .25;
  if (birdY < 20 || birdY > groundY() - 15) endGame();
  for (const o of objects) {
    o.x -= speed * .72 * dt;
    if (birdX + 19 > o.x && birdX - 18 < o.x + o.w && (birdY < o.gapY - o.gap / 2 || birdY > o.gapY + o.gap / 2)) endGame();
    if (!o.counted && o.x + o.w < birdX) { o.counted = true; score += 5; }
  }
}
function burst(x, y, color) { for (let i = 0; i < 10; i++) particles.push({ x, y, vx: (Math.random() - .5) * 150, vy: (Math.random() - .6) * 140, life: .55, color }); }
function draw() {
  ctx.clearRect(0, 0, width, height);
  if (mode === 'sled') drawSled(); else if (mode === 'cube') drawCube(); else drawFlight();
  drawParticles();
  document.getElementById('score').textContent = score;
}
function background(top, bottom) { const g = ctx.createLinearGradient(0, 0, 0, height); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); }
function drawSled() {
  background('#d9f0f3', '#f7fbff');
  ctx.fillStyle = '#c9e6ed';
  for (let i = 0; i < 7; i++) { const x = ((i * 170 - elapsed * 25) % (width + 160)) - 40; ctx.beginPath(); ctx.moveTo(x, groundY()); ctx.lineTo(x + 75, height * .25); ctx.lineTo(x + 165, groundY()); ctx.fill(); }
  ctx.fillStyle = '#f9fcff'; ctx.fillRect(0, groundY(), width, height - groundY());
  for (let l = 0; l < 3; l++) { const x = width * (.27 + l * .23); ctx.strokeStyle = '#c2dfe5'; ctx.setLineDash([12, 14]); ctx.beginPath(); ctx.moveTo(x, groundY()); ctx.lineTo(x, height); ctx.stroke(); }
  ctx.setLineDash([]);
  for (const o of objects) { const x = width * (.27 + o.lane * .23); if (o.type === 'tree') { ctx.fillStyle = '#4f9b85'; ctx.beginPath(); ctx.moveTo(x, o.y - o.size); ctx.lineTo(x - o.size * .55, o.y + o.size * .4); ctx.lineTo(x + o.size * .55, o.y + o.size * .4); ctx.fill(); ctx.fillStyle = '#936e58'; ctx.fillRect(x - 4, o.y + o.size * .35, 8, 12); } else { ctx.fillStyle = '#ffbd65'; ctx.beginPath(); ctx.arc(x, o.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff2bd'; ctx.beginPath(); ctx.arc(x, o.y, 4, 0, Math.PI * 2); ctx.fill(); } }
  const px = width * (.27 + lane * .23); const py = groundY() - 23;
  ctx.fillStyle = '#6e82c8'; ctx.beginPath(); ctx.moveTo(px, py - 23); ctx.lineTo(px - 22, py + 18); ctx.lineTo(px + 22, py + 18); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py - 12, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#a06f5d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px - 22, py + 20); ctx.quadraticCurveTo(px, py + 29, px + 22, py + 20); ctx.stroke();
}
function drawCube() {
  background('#e5e9ff', '#f6f3ff');
  for (let i = 0; i < 10; i++) { const x = ((i * 130 - elapsed * 36) % (width + 100)) - 40; ctx.fillStyle = i % 2 ? '#d9def8' : '#e1e4fa'; ctx.beginPath(); ctx.arc(x, height * .24 + (i % 3) * 25, 30 + (i % 2) * 12, 0, Math.PI * 2); ctx.fill(); }
  const floor = groundY(); ctx.fillStyle = '#d7d9f1'; ctx.fillRect(0, floor, width, height - floor); ctx.fillStyle = '#b5bee7'; ctx.fillRect(0, floor, width, 5);
  for (let x = -50; x < width + 60; x += 50) { const offset = (elapsed * 220) % 50; ctx.fillStyle = '#c4caec'; ctx.fillRect(x - offset, floor + 18, 24, 4); }
  for (const o of objects) { ctx.fillStyle = '#f181a3'; ctx.shadowColor = '#f181a366'; ctx.shadowBlur = 12; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.shadowBlur = 0; ctx.fillStyle = '#fff4f8'; ctx.fillRect(o.x + 7, o.y + 7, o.w - 14, 5); }
  const px = width * .22; ctx.save(); ctx.translate(px, playerY); ctx.rotate(Math.max(-.4, Math.min(.4, -velocityY / 1800))); ctx.fillStyle = '#786fd0'; ctx.shadowColor = '#8176d555'; ctx.shadowBlur = 14; ctx.fillRect(-21, -21, 42, 42); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillRect(-10, -7, 6, 6); ctx.fillRect(5, -7, 6, 6); ctx.restore();
}
function drawFlight() {
  background('#bde6f3', '#f1f8fb');
  for (let i = 0; i < 7; i++) { const x = ((i * 180 - elapsed * 20) % (width + 180)) - 60; const y = height * (.2 + (i % 3) * .12); ctx.fillStyle = '#ffffffa8'; ctx.beginPath(); ctx.ellipse(x, y, 42, 13, 0, 0, Math.PI * 2); ctx.ellipse(x + 25, y - 7, 28, 17, 0, 0, Math.PI * 2); ctx.ellipse(x + 49, y, 37, 12, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#b8d7c3'; ctx.fillRect(0, groundY(), width, height - groundY());
  for (const o of objects) { const topH = o.gapY - o.gap / 2; const bottomY = o.gapY + o.gap / 2; ctx.fillStyle = '#72b99d'; ctx.fillRect(o.x, 0, o.w, topH); ctx.fillRect(o.x, bottomY, o.w, groundY() - bottomY); ctx.fillStyle = '#91ceb3'; ctx.fillRect(o.x - 5, topH - 12, o.w + 10, 12); ctx.fillRect(o.x - 5, bottomY, o.w + 10, 12); }
  const x = width * .25; ctx.save(); ctx.translate(x, birdY); ctx.rotate(Math.max(-.5, Math.min(.55, birdVelocity / 900))); ctx.fillStyle = '#e4a95c'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f7d493'; ctx.beginPath(); ctx.ellipse(-5, 5, 12, 8, -.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(9, -5, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#36435a'; ctx.beginPath(); ctx.arc(11, -5, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e7846d'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(31, 4); ctx.lineTo(20, 7); ctx.fill(); ctx.restore();
}
function drawParticles() { for (const p of particles) { p.x += p.vx * .016; p.y += p.vy * .016; p.life -= .016; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0); }
reset(); resize();
