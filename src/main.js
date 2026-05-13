const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startPanel = document.getElementById("startPanel");
const startButton = document.getElementById("startButton");
const gameOverPanel = document.getElementById("gameOverPanel");
const restartButton = document.getElementById("restartButton");
const upgradePanel = document.getElementById("upgradePanel");
const upgradeChoices = document.getElementById("upgradeChoices");

const keys = new Set();
const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

let lastTime = 0;
let running = false;
let paused = false;
let gameOver = false;
let stars = [];
let bullets = [];
let enemies = [];
let asteroids = [];
let pickups = [];
let particles = [];
let waveTimer = 0;
let nextWaveDelay = 0;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  radius: 15,
  angle: 0,
  health: 100,
  maxHealth: 100,
  energy: 0,
  wave: 1,
  score: 0,
  fireRate: 0.18,
  shotCooldown: 0,
  bulletSpeed: 620,
  damage: 22,
  speed: 290,
  dashCooldown: 0,
  invulnerable: 0
};

const upgrades = [
  { name: "Twin Capacitors", description: "Shoot 20% faster.", apply: () => player.fireRate *= 0.8 },
  { name: "Ion Rounds", description: "Bullets hit 30% harder.", apply: () => player.damage *= 1.3 },
  { name: "Afterburner", description: "Move 16% faster.", apply: () => player.speed *= 1.16 },
  { name: "Hull Patch", description: "Restore 35 health and raise max health.", apply: () => { player.maxHealth += 15; player.health = Math.min(player.maxHealth, player.health + 35); } },
  { name: "Magnet Field", description: "Pull pickups from farther away.", apply: () => player.magnet = (player.magnet || 96) + 60 },
  { name: "Charge Cell", description: "Dash recharges faster.", apply: () => player.dashRate = (player.dashRate || 1) * 1.35 }
];

function resetGame() {
  Object.assign(player, {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    health: 100,
    maxHealth: 100,
    energy: 0,
    wave: 1,
    score: 0,
    fireRate: 0.18,
    shotCooldown: 0,
    bulletSpeed: 620,
    damage: 22,
    speed: 290,
    dashCooldown: 0,
    invulnerable: 0,
    magnet: 96,
    dashRate: 1
  });
  bullets = [];
  enemies = [];
  asteroids = [];
  pickups = [];
  particles = [];
  waveTimer = 0;
  nextWaveDelay = 0;
  gameOver = false;
  paused = false;
  gameOverPanel.classList.add("hidden");
  upgradePanel.classList.add("hidden");
  spawnWave();
}

function buildStars() {
  stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: rand(0.2, 1),
    twinkle: rand(0, Math.PI * 2)
  }));
}

function spawnWave() {
  const count = 4 + player.wave * 2;
  for (let i = 0; i < count; i++) enemies.push(createEnemy());
  for (let i = 0; i < 4 + player.wave; i++) asteroids.push(createAsteroid());
  waveTimer = 0;
}

function edgeSpawn() {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: rand(0, canvas.width), y: -30 };
  if (side === 1) return { x: canvas.width + 30, y: rand(0, canvas.height) };
  if (side === 2) return { x: rand(0, canvas.width), y: canvas.height + 30 };
  return { x: -30, y: rand(0, canvas.height) };
}

function createEnemy() {
  const pos = edgeSpawn();
  return {
    ...pos,
    vx: 0,
    vy: 0,
    radius: rand(13, 19),
    health: 35 + player.wave * 8,
    speed: rand(70, 105) + player.wave * 4,
    turn: rand(-1, 1)
  };
}

function createAsteroid() {
  const pos = edgeSpawn();
  const angle = Math.atan2(canvas.height / 2 - pos.y, canvas.width / 2 - pos.x) + rand(-0.9, 0.9);
  const speed = rand(28, 80);
  return {
    ...pos,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: rand(18, 38),
    spin: rand(-1.6, 1.6),
    angle: rand(0, Math.PI * 2),
    health: 50
  };
}

function shoot() {
  if (player.shotCooldown > 0) return;
  const spread = player.energy >= 60 ? 0.08 : 0;
  const shots = spread ? [-spread, spread] : [0];
  shots.forEach(offset => {
    const angle = player.angle + offset;
    bullets.push({
      x: player.x + Math.cos(angle) * 18,
      y: player.y + Math.sin(angle) * 18,
      vx: Math.cos(angle) * player.bulletSpeed,
      vy: Math.sin(angle) * player.bulletSpeed,
      radius: 4,
      life: 0.85,
      damage: player.damage
    });
  });
  player.shotCooldown = player.fireRate;
}

function dash() {
  if (player.dashCooldown > 0) return;
  const dx = Math.cos(player.angle);
  const dy = Math.sin(player.angle);
  player.vx += dx * 640;
  player.vy += dy * 640;
  player.invulnerable = 0.45;
  player.dashCooldown = 1.25 / (player.dashRate || 1);
  burst(player.x, player.y, "#52d3ff", 18);
}

function update(dt) {
  if (!running || paused || gameOver || !upgradePanel.classList.contains("hidden")) return;

  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.shotCooldown = Math.max(0, player.shotCooldown - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);

  const xInput = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const yInput = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  const mag = Math.hypot(xInput, yInput) || 1;
  player.vx += (xInput / mag) * player.speed * dt * 4;
  player.vy += (yInput / mag) * player.speed * dt * 4;
  player.vx *= 0.9;
  player.vy *= 0.9;
  player.x = clamp(player.x + player.vx * dt, player.radius, canvas.width - player.radius);
  player.y = clamp(player.y + player.vy * dt, player.radius, canvas.height - player.radius);

  if (mouse.down || keys.has("Space")) shoot();

  bullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  });
  bullets = bullets.filter(bullet => bullet.life > 0 && bullet.x > -20 && bullet.x < canvas.width + 20 && bullet.y > -20 && bullet.y < canvas.height + 20);

  enemies.forEach(enemy => {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.sin(waveTimer * 2 + enemy.turn) * 0.2;
    enemy.vx = Math.cos(angle) * enemy.speed;
    enemy.vy = Math.sin(angle) * enemy.speed;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
  });

  asteroids.forEach(asteroid => {
    asteroid.x += asteroid.vx * dt;
    asteroid.y += asteroid.vy * dt;
    asteroid.angle += asteroid.spin * dt;
    if (asteroid.x < -80 || asteroid.x > canvas.width + 80 || asteroid.y < -80 || asteroid.y > canvas.height + 80) {
      Object.assign(asteroid, createAsteroid());
    }
  });

  handleCollisions();
  updatePickups(dt);
  updateParticles(dt);
  waveTimer += dt;

  if (enemies.length === 0 && nextWaveDelay === 0) nextWaveDelay = 1.1;
  if (nextWaveDelay > 0) {
    nextWaveDelay -= dt;
    if (nextWaveDelay <= 0) showUpgrades();
  }
}

function handleCollisions() {
  for (const bullet of bullets) {
    for (const enemy of enemies) {
      if (distance(bullet, enemy) < bullet.radius + enemy.radius) {
        enemy.health -= bullet.damage;
        bullet.life = 0;
        burst(enemy.x, enemy.y, "#ff6b7a", 5);
      }
    }
    for (const asteroid of asteroids) {
      if (distance(bullet, asteroid) < bullet.radius + asteroid.radius) {
        asteroid.health -= bullet.damage;
        bullet.life = 0;
        burst(bullet.x, bullet.y, "#9dafc7", 4);
      }
    }
  }

  enemies = enemies.filter(enemy => {
    if (enemy.health > 0) return true;
    player.score += 100;
    dropEnergy(enemy.x, enemy.y, 3);
    burst(enemy.x, enemy.y, "#ff6b7a", 16);
    return false;
  });

  asteroids = asteroids.filter(asteroid => {
    if (asteroid.health > 0) return true;
    player.score += 35;
    dropEnergy(asteroid.x, asteroid.y, 2);
    burst(asteroid.x, asteroid.y, "#b7c1d1", 14);
    return false;
  });

  if (player.invulnerable <= 0) {
    for (const enemy of enemies) {
      if (distance(player, enemy) < player.radius + enemy.radius) {
        hurtPlayer(14);
        enemy.health -= 35;
      }
    }
    for (const asteroid of asteroids) {
      if (distance(player, asteroid) < player.radius + asteroid.radius) {
        hurtPlayer(18);
        asteroid.vx *= -0.6;
        asteroid.vy *= -0.6;
      }
    }
  }
}

function hurtPlayer(amount) {
  player.health -= amount;
  player.invulnerable = 0.65;
  burst(player.x, player.y, "#ffd166", 18);
  if (player.health <= 0) {
    player.health = 0;
    gameOver = true;
    gameOverPanel.classList.remove("hidden");
  }
}

function dropEnergy(x, y, count) {
  for (let i = 0; i < count; i++) {
    pickups.push({
      x: x + rand(-14, 14),
      y: y + rand(-14, 14),
      vx: rand(-60, 60),
      vy: rand(-60, 60),
      radius: 6,
      value: 4
    });
  }
}

function updatePickups(dt) {
  pickups.forEach(pickup => {
    const d = distance(player, pickup);
    if (d < player.magnet) {
      const angle = Math.atan2(player.y - pickup.y, player.x - pickup.x);
      pickup.vx += Math.cos(angle) * 520 * dt;
      pickup.vy += Math.sin(angle) * 520 * dt;
    }
    pickup.vx *= 0.96;
    pickup.vy *= 0.96;
    pickup.x += pickup.vx * dt;
    pickup.y += pickup.vy * dt;
  });
  pickups = pickups.filter(pickup => {
    if (distance(player, pickup) > player.radius + pickup.radius) return true;
    player.energy += pickup.value;
    player.score += 10;
    return false;
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(35, 220);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.25, 0.75),
      maxLife: 0.75,
      color
    });
  }
}

function updateParticles(dt) {
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
  });
  particles = particles.filter(p => p.life > 0);
}

function showUpgrades() {
  const options = [...upgrades].sort(() => Math.random() - 0.5).slice(0, 3);
  upgradeChoices.innerHTML = "";
  options.forEach(upgrade => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${upgrade.name}</strong><span>${upgrade.description}</span>`;
    button.addEventListener("click", () => {
      upgrade.apply();
      player.wave += 1;
      upgradePanel.classList.add("hidden");
      nextWaveDelay = 0;
      spawnWave();
    });
    upgradeChoices.appendChild(button);
  });
  upgradePanel.classList.remove("hidden");
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpace();
  drawPickups();
  drawAsteroids();
  drawEnemies();
  drawBullets();
  drawPlayer();
  drawParticles();
  drawHud();
  if (paused) drawBanner("Paused", "Press P to resume");
}

function drawSpace() {
  ctx.fillStyle = "#05070b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    const pulse = 0.45 + Math.sin(performance.now() * 0.0015 + star.twinkle) * 0.25;
    ctx.fillStyle = `rgba(220,238,255,${pulse * star.z})`;
    ctx.fillRect(star.x, star.y, 1.5 * star.z, 1.5 * star.z);
  });
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.globalAlpha = player.invulnerable > 0 ? 0.55 + Math.sin(performance.now() * 0.03) * 0.25 : 1;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-13, -12);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-13, 12);
  ctx.closePath();
  ctx.fillStyle = "#e9f8ff";
  ctx.fill();
  ctx.strokeStyle = "#52d3ff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#ff9f43";
  ctx.fillRect(-18, -4, 8 + Math.random() * 6, 8);
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = "#52d3ff";
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(Math.atan2(player.y - enemy.y, player.x - enemy.x));
    ctx.fillStyle = "#ff6b7a";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-11, -11);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-11, 11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffc3ca";
    ctx.stroke();
    ctx.restore();
  });
}

function drawAsteroids() {
  asteroids.forEach(asteroid => {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const angle = (Math.PI * 2 * i) / 9;
      const r = asteroid.radius * (0.75 + (i % 3) * 0.12);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "#5f6876";
    ctx.fill();
    ctx.strokeStyle = "#b7c1d1";
    ctx.stroke();
    ctx.restore();
  });
}

function drawPickups() {
  pickups.forEach(pickup => {
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#52d3ff";
    ctx.fill();
    ctx.strokeStyle = "#dff7ff";
    ctx.stroke();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1;
}

function drawHud() {
  bar(24, 22, 220, 12, player.health / player.maxHealth, "#ff6b7a", "Hull");
  bar(24, 48, 220, 10, Math.min(player.energy / 100, 1), "#52d3ff", "Energy");
  ctx.fillStyle = "#f2f7ff";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText(`Wave ${player.wave}`, 24, 88);
  ctx.fillText(`Score ${player.score}`, 24, 112);
  ctx.fillText(`Dash ${player.dashCooldown <= 0 ? "Ready" : player.dashCooldown.toFixed(1)}`, canvas.width - 132, 32);
}

function bar(x, y, w, h, pct, color, label) {
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(pct, 0, 1), h);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#9dafc7";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(label, x + w + 10, y + h);
}

function drawBanner(title, subtitle) {
  ctx.fillStyle = "rgba(5, 7, 11, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2f7ff";
  ctx.font = "700 56px system-ui, sans-serif";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 14);
  ctx.fillStyle = "#9dafc7";
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 28);
  ctx.textAlign = "left";
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.033);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function pointerToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
}

window.addEventListener("keydown", event => {
  keys.add(event.code);
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") dash();
  if (event.code === "KeyP" && running && !gameOver) paused = !paused;
});

window.addEventListener("keyup", event => keys.delete(event.code));
canvas.addEventListener("mousemove", pointerToCanvas);
canvas.addEventListener("mousedown", event => {
  pointerToCanvas(event);
  mouse.down = true;
});
window.addEventListener("mouseup", () => mouse.down = false);

startButton.addEventListener("click", () => {
  startPanel.classList.add("hidden");
  running = true;
  resetGame();
});

restartButton.addEventListener("click", () => {
  running = true;
  resetGame();
});

buildStars();
requestAnimationFrame(loop);
