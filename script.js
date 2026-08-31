const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Audio Context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = document.getElementById('soundToggle').checked;

// Game Objects
const paddleWidth = 12;
const paddleHeight = 100;
const ballSize = 8;
const baseSpeed = 5;

// Sweet spot configuration (center 30% of paddle)
const sweetSpotSize = paddleHeight * 0.3;
const sweetSpotMultiplier = 1.4; // 40% more spin in sweet spot

const difficulties = {
    easy: { speed: 2, reaction: 15, threshold: 120 },
    medium: { speed: 4, reaction: 8, threshold: 70 },
    hard: { speed: 5.5, reaction: 4, threshold: 50 },
    extreme: { speed: 7, reaction: 2, threshold: 35, usePrediction: true }
};

let currentDifficulty = 'medium';

const game = {
    playerScore: 0,
    computerScore: 0,
    gameRunning: false,
    playerStreak: 0,
    computerStreak: 0,
    rallyCount: 0,
    ballHitsFrame: 0
};

const player = {
    x: 15,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 7
};

const computer = {
    x: canvas.width - paddleWidth - 15,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    reactionCounter: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: ballSize,
    dx: baseSpeed,
    dy: baseSpeed,
    speed: baseSpeed,
    trail: []
};

const particles = [];

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    Space: false,
    p: false,
    P: false
};

let mouseY = canvas.height / 2;

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        startGame();
    } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        startGame();
    } else if (e.key in keys) {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resetBtn').addEventListener('click', resetScore);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
document.getElementById('difficultySelect').addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
});

document.getElementById('soundToggle').addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
});

// Sound Effects
function playSound(type) {
    if (!soundEnabled) return;
    
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    switch(type) {
        case 'paddle':
            oscillator.frequency.value = 600;
            oscillator.start(now);
            oscillator.stop(now + 0.05);
            break;
        case 'wall':
            oscillator.frequency.value = 800;
            oscillator.start(now);
            oscillator.stop(now + 0.08);
            break;
        case 'score':
            oscillator.frequency.value = 1200;
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
    }
}

// Particle Effects
class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 1;
        this.decay = 0.02;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= this.decay;
    }
    
    draw() {
        ctx.fillStyle = this.color.replace(')', `, ${this.life})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = Math.random() * 3 + 2;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color
        ));
    }
}

// Check if hit is in sweet spot
function isHitInSweetSpot(paddle, hitY) {
    const paddleCenter = paddle.y + paddle.height / 2;
    const distanceFromCenter = Math.abs(hitY - paddleCenter);
    return distanceFromCenter < sweetSpotSize / 2;
}

// Predictive AI for Extreme difficulty
function predictBallImpactY() {
    // Only predict if ball is moving towards computer paddle
    if (ball.dx <= 0) return ball.y;
    
    let predictedY = ball.y;
    let predictedDy = ball.dy;
    let tempX = ball.x;
    let tempY = ball.y;
    
    // Simulate ball movement until it reaches computer paddle X position
    while (tempX < computer.x) {
        tempX += ball.dx;
        tempY += predictedDy;
        
        // Account for wall bounces
        if (tempY - ball.size < 0 || tempY + ball.size > canvas.height) {
            predictedDy = -predictedDy;
            if (tempY - ball.size < 0) tempY = ball.size;
            if (tempY + ball.size > canvas.height) tempY = canvas.height - ball.size;
        }
    }
    
    predictedY = tempY;
    
    // Clamp prediction to canvas bounds
    return Math.max(ball.size, Math.min(canvas.height - ball.size, predictedY));
}

// Game Functions
function startGame() {
    game.gameRunning = !game.gameRunning;
    document.getElementById('startBtn').textContent = game.gameRunning ? '⏸ Pause' : '▶ Resume';
}

function toggleFullscreen() {
    canvas.classList.toggle('fullscreen');
    document.querySelector('.container').classList.toggle('fullscreen');
    // Adjust canvas resolution for fullscreen
    if (canvas.classList.contains('fullscreen')) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 900;
        canvas.height = 500;
    }
}

function resetScore() {
    game.playerScore = 0;
    game.computerScore = 0;
    game.playerStreak = 0;
    game.computerStreak = 0;
    game.rallyCount = 0;
    updateScore();
    resetBall();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = (Math.random() - 0.5) * baseSpeed;
    ball.trail = [];
    game.rallyCount = 0;
    game.ballHitsFrame = 0;
}

function updateScore() {
    document.getElementById('playerScore').textContent = game.playerScore;
    document.getElementById('computerScore').textContent = game.computerScore;
    document.getElementById('playerStreak').textContent = game.playerStreak;
    document.getElementById('computerStreak').textContent = game.computerStreak;
    document.getElementById('rallyCounter').textContent = game.rallyCount;
}

// Update Functions
function updatePlayerPaddle() {
    const targetY = mouseY - paddleHeight / 2;
    player.y += (targetY - player.y) * 0.12;
    
    if (keys['ArrowUp']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['ArrowDown']) {
        player.y = Math.min(canvas.height - paddleHeight, player.y + player.speed);
    }
    
    player.y = Math.max(0, Math.min(canvas.height - paddleHeight, player.y));
}

function updateComputerPaddle() {
    const difficulty = difficulties[currentDifficulty];
    const computerCenter = computer.y + computer.height / 2;
    
    computer.reactionCounter++;
    
    // AI reacts after a delay based on difficulty
    if (computer.reactionCounter >= difficulty.reaction) {
        let targetY = ball.y; // Default: track current ball position
        
        // Extreme AI uses predictive algorithm
        if (difficulty.usePrediction && ball.dx > 0) {
            targetY = predictBallImpactY();
        }
        
        const threshold = difficulty.threshold;
        
        // Smooth movement towards target
        if (computerCenter < targetY - threshold / 2) {
            computer.y += difficulty.speed;
        } else if (computerCenter > targetY + threshold / 2) {
            computer.y -= difficulty.speed;
        }
        
        computer.reactionCounter = 0;
    }
    
    computer.y = Math.max(0, Math.min(canvas.height - paddleHeight, computer.y));
}

function updateBall() {
    if (!game.gameRunning) return;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Store trail for visual effect
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();
    
    // Wall collisions
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        playSound('wall');
        createParticles(ball.x, ball.y, 'rgb(0, 255, 136)');
        
        if (ball.y - ball.size < 0) ball.y = ball.size;
        if (ball.y + ball.size > canvas.height) ball.y = canvas.height - ball.size;
    }
    
    // Paddle collisions - Player
    if (checkPaddleCollision(player)) {
        if (ball.dx < 0) {
            ball.dx = Math.abs(ball.dx);
            ball.x = player.x + player.width + ball.size;
            
            // Enhanced angle control with sweet spot
            const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
            const inSweetSpot = isHitInSweetSpot(player, ball.y);
            const spinMultiplier = inSweetSpot ? sweetSpotMultiplier : 1.0;
            
            ball.dy += hitPos * 5 * spinMultiplier;
            
            const newSpeed = Math.min(baseSpeed * 2, Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) + 0.3);
            const angle = Math.atan2(ball.dy, ball.dx);
            ball.dx = Math.cos(angle) * newSpeed;
            ball.dy = Math.sin(angle) * newSpeed;
            
            game.rallyCount++;
            game.playerStreak++;
            game.computerStreak = 0;
            
            playSound('paddle');
            createParticles(player.x + player.width, ball.y, 'rgb(255, 107, 157)', 10);
        }
    }
    
    // Paddle collisions - Computer
    if (checkPaddleCollision(computer)) {
        if (ball.dx > 0) {
            ball.dx = -Math.abs(ball.dx);
            ball.x = computer.x - ball.size;
            
            // Computer also benefits from sweet spot for fairness
            const hitPos = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
            const inSweetSpot = isHitInSweetSpot(computer, ball.y);
            const spinMultiplier = inSweetSpot ? sweetSpotMultiplier : 1.0;
            
            ball.dy += hitPos * 5 * spinMultiplier;
            
            const newSpeed = Math.min(baseSpeed * 2, Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) + 0.3);
            const angle = Math.atan2(ball.dy, ball.dx);
            ball.dx = Math.cos(angle) * newSpeed;
            ball.dy = Math.sin(angle) * newSpeed;
            
            game.rallyCount++;
            game.computerStreak++;
            game.playerStreak = 0;
            
            playSound('paddle');
            createParticles(computer.x, ball.y, 'rgb(255, 107, 157)', 10);
        }
    }
    
    // Scoring
    if (ball.x - ball.size < 0) {
        game.computerScore++;
        game.computerStreak++;
        game.playerStreak = 0;
        playSound('score');
        createParticles(canvas.width / 2, canvas.height / 2, 'rgb(255, 215, 0)', 15);
        updateScore();
        resetBall();
    } else if (ball.x + ball.size > canvas.width) {
        game.playerScore++;
        game.playerStreak++;
        game.computerStreak = 0;
        playSound('score');
        createParticles(canvas.width / 2, canvas.height / 2, 'rgb(255, 215, 0)', 15);
        updateScore();
        resetBall();
    }
    
    // Speed capping
    const maxSpeed = baseSpeed * 2.5;
    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (currentSpeed > maxSpeed) {
        const scale = maxSpeed / currentSpeed;
        ball.dx *= scale;
        ball.dy *= scale;
    }
    
    // Update stats display
    document.getElementById('ballSpeedDisplay').textContent = Math.round(Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) * 10) / 10;
    const angle = Math.atan2(ball.dy, ball.dx) * 180 / Math.PI;
    document.getElementById('ballAngleDisplay').textContent = Math.round(angle);
}

function checkPaddleCollision(paddle) {
    return (
        ball.x - ball.size < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y - ball.size < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y
    );
}

// Draw Functions
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.02)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.01)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line with animation
    ctx.strokeStyle = `rgba(0, 255, 136, ${0.15 + 0.1 * Math.sin(Date.now() / 300)})`;
    ctx.setLineDash([15, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw ball trail
    for (let i = 0; i < ball.trail.length; i++) {
        const opacity = (i + 1) / ball.trail.length * 0.3;
        ctx.fillStyle = `rgba(255, 0, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(ball.trail[i].x, ball.trail[i].y, ball.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw sweet spot indicator on player paddle
    const playerSweetSpotTop = player.y + (player.height - sweetSpotSize) / 2;
    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.fillRect(player.x, playerSweetSpotTop, player.width, sweetSpotSize);
    
    // Draw paddles with glow
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);
    
    ctx.shadowBlur = 0;
    
    // Draw ball with glow
    ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
    ctx.shadowBlur = 20;
    
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Draw game status
    if (!game.gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '20px Arial';
        ctx.fillText('Press SPACE or P to resume', canvas.width / 2, canvas.height / 2 + 30);
        ctx.shadowBlur = 0;
    }
}

// Game Loop
function gameLoop() {
    updatePlayerPaddle();
    updateComputerPaddle();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize
updateScore();
gameLoop();
