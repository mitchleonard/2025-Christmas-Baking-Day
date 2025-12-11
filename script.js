// Script for interactivity and Cookie Catcher Frenzy game

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Optional: Add random rotation to snowflakes for more chaos
    const snowflakes = document.querySelectorAll('.snowflake');
    snowflakes.forEach(flake => {
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.animationDuration = `${Math.random() * 3 + 5}s, ${Math.random() * 2 + 1}s`;
        flake.style.fontSize = `${Math.random() * 1 + 0.5}em`;
    });
});

// --- COOKIE CATCHER FRENZY GAME ---
(function () {
  const canvas = document.getElementById('cookie-catcher-canvas');
  if (!canvas) return; // Exit if game section not present

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('cc-score');
  const livesEl = document.getElementById('cc-lives');
  const overlayEl = document.getElementById('cc-overlay');
  const gameOverEl = document.getElementById('cc-gameover');
  const finalScoreEl = document.getElementById('cc-final-score');
  const startBtn = document.getElementById('cc-start-btn');
  const restartBtn = document.getElementById('cc-restart-btn');

  // Game state
  let cookies = [];
  let tray = null;
  let score = 0;
  let lives = 3;
  let lastFrameTime = 0;
  let elapsedTime = 0;         // total time since game start (seconds)
  let spawnTimer = 0;          // timer for next cookie spawn
  let isRunning = false;
  let animationId = null;

  // --- Helpers -------------------------------------------------------

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    // Physical size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

    // Reset tray based on new size (if tray exists, keep its relative position)
    const w = rect.width;
    const h = rect.height;

    if (!tray) {
      tray = {
        width: w * 0.2,
        height: h * 0.05,
        x: (w * 0.5) - (w * 0.2) / 2,
        y: h * 0.85
      };
    } else {
      // Keep tray ratio and bottom position
      const prevW = tray.width;
      tray.width = w * 0.2;
      tray.height = h * 0.05;
      tray.y = h * 0.85;
      
      // Adjust x proportionally
      const ratio = tray.x / (prevW || 1);
      tray.x = Math.min(Math.max(0, ratio * tray.width), w - tray.width);
    }
  }

  function resetGame() {
    cookies = [];
    score = 0;
    lives = 3;
    lastFrameTime = 0;
    elapsedTime = 0;
    spawnTimer = 0;
    isRunning = false;
    scoreEl.textContent = '0';
    livesEl.textContent = '❤️❤️❤️';
  }

  function updateLivesDisplay() {
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
  }

  function randomCookieType() {
    // Weighted probabilities: mostly normal, some golden, fewer burnt
    const r = Math.random();
    if (r < 0.65) return 'normal';
    if (r < 0.85) return 'golden';
    return 'burnt';
  }

  function spawnCookie() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    
    const type = randomCookieType();
    const radius = type === 'golden'
      ? w * 0.05
      : type === 'burnt'
        ? w * 0.04
        : w * 0.045;
        
    const x = radius + Math.random() * (w - radius * 2);
    const y = -radius - 10;

    cookies.push({
      x,
      y,
      radius,
      vy: 80 + Math.random() * 40, // base speed; difficulty multiplier gets applied later
      type
    });
  }

  function getDifficultyMultipliers() {
    // Core difficulty ramp:
    // - Starts slow
    // - Within ~3 seconds, both speed and spawn frequency increase sharply
    //
    // elapsedTime is in seconds
    const t = elapsedTime;

    // Speed multiplier:
    //  t = 0   -> 1.0x
    //  t = 3   -> ~2.2x
    //  capped to 3.0x to avoid absurd speed
    const speedMultiplier = Math.min(3, 1 + t * 0.4);

    // Spawn interval (seconds between spawns):
    //  t = 0   -> 1.2s
    //  t = 3   -> ~0.45s
    //  t >= 5  -> clamps around 0.35s
    const baseInterval = 1.2 - t * 0.25;
    const spawnInterval = Math.max(0.35, baseInterval);

    return { speedMultiplier, spawnInterval };
  }

  function update(delta) {
    elapsedTime += delta;
    const rect = canvas.getBoundingClientRect();
    const h = rect.height;
    
    const { speedMultiplier, spawnInterval } = getDifficultyMultipliers();

    // Spawn cookies
    spawnTimer -= delta;
    if (spawnTimer <= 0) {
      spawnCookie();
      spawnTimer = spawnInterval;
    }

    // Update cookie positions
    for (let i = cookies.length - 1; i >= 0; i--) {
      const c = cookies[i];
      c.y += c.vy * speedMultiplier * delta;

      // Collision with tray
      const trayCenterX = tray.x + tray.width / 2;
      const trayTop = tray.y;
      
      const withinVertical = 
        c.y + c.radius >= trayTop && 
        c.y - c.radius <= trayTop + tray.height;
        
      const withinHorizontal = 
        c.x >= tray.x && 
        c.x <= tray.x + tray.width;

      if (withinVertical && withinHorizontal) {
        // Handle cookie type scoring
        if (c.type === 'normal') {
          score += 10;
        } else if (c.type === 'golden') {
          score += 25; // reward
        } else if (c.type === 'burnt') {
          // penalty
          score = Math.max(0, score - 15);
          lives -= 1;
          updateLivesDisplay();
        }
        
        scoreEl.textContent = score.toString();
        cookies.splice(i, 1);
        continue;
      }

      // Cookie missed (falls off bottom)
      if (c.y - c.radius > h) {
        if (c.type === 'normal' || c.type === 'golden') {
          lives -= 1;
          updateLivesDisplay();
        }
        cookies.splice(i, 1);
      }
    }

    // Check game over
    if (lives <= 0) {
      endGame();
    }
  }

  function drawBackground() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Soft background
    ctx.fillStyle = '#fef5e7';
    ctx.fillRect(0, 0, w, h);

    // Light grid / counter texture
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    
    const step = 24;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function drawTray() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Tray base
    ctx.fillStyle = '#3b3b3b';
    ctx.fillRect(tray.x, tray.y, tray.width, tray.height);
    
    // Edge highlight
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(tray.x + 2, tray.y + 2, tray.width - 4, tray.height - 4);
  }

  function drawCookie(cookie) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cookie.x, cookie.y, cookie.radius, 0, Math.PI * 2);
    
    if (cookie.type === 'normal') {
      ctx.fillStyle = '#c58b4e'; // gingerbread
    } else if (cookie.type === 'golden') {
      ctx.fillStyle = '#f2c14f'; // golden star cookie vibe
    } else {
      ctx.fillStyle = '#4b3b32'; // burnt
    }
    
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4a2f1b';
    ctx.stroke();

    // Sprinkles or marks
    if (cookie.type !== 'burnt') {
      const sprinkleCount = cookie.type === 'golden' ? 6 : 4;
      for (let i = 0; i < sprinkleCount; i++) {
        const angle = (Math.PI * 2 * i) / sprinkleCount;
        const r = cookie.radius * 0.5;
        const sx = cookie.x + Math.cos(angle) * r;
        const sy = cookie.y + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(sx, sy, cookie.radius * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#d7263d' : '#0f7173';
        ctx.fill();
      }
    } else {
      // Cracks on burnt cookies
      ctx.strokeStyle = '#1f130d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cookie.x - cookie.radius * 0.4, cookie.y);
      ctx.lineTo(cookie.x + cookie.radius * 0.4, cookie.y);
      ctx.moveTo(cookie.x, cookie.y - cookie.radius * 0.3);
      ctx.lineTo(cookie.x, cookie.y + cookie.radius * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();
    // Draw cookies
    for (const c of cookies) {
      drawCookie(c);
    }
    // Draw tray
    drawTray();
  }

  function gameLoop(timestamp) {
    if (!isRunning) return;
    if (!lastFrameTime) {
      lastFrameTime = timestamp;
    }
    const delta = (timestamp - lastFrameTime) / 1000; // seconds
    lastFrameTime = timestamp;

    update(delta);
    draw();
    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    resetGame();
    resizeCanvas();
    overlayEl.classList.add('hidden');
    gameOverEl.classList.add('hidden');
    isRunning = true;
    lastFrameTime = 0;
    animationId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    if (!isRunning) return;
    isRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    
    finalScoreEl.textContent = score.toString();
    gameOverEl.classList.remove('hidden');
  }

  // --- Controls (mouse + touch) --------------------------------------
  function pointerToCanvasX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.min(Math.max(0, x), rect.width);
  }

  function moveTrayTo(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = pointerToCanvasX(clientX);
    
    tray.x = x - tray.width / 2;
    tray.x = Math.max(0, Math.min(tray.x, rect.width - tray.width));
  }

  canvas.addEventListener('pointerdown', (e) => {
    moveTrayTo(e.clientX);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons === 1 || e.pointerType === 'touch') {
      moveTrayTo(e.clientX);
    }
  });

  // Prevent scroll jitter during touch move
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  // --- Event Listeners -----------------------------------------------
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isRunning) {
      draw();
    }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  // Initial setup
  resetGame();
  resizeCanvas();
  draw();
})();
