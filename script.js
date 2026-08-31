const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game Objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 7;
const ballSpeed = 5;

const game = {
    playerScore: 0,
    computerScore: 0,
    gameRunning: false
};

const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 4.5
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: ballSize,
    dx: ballSpeed,
    dy: ballSpeed,
    speed: ballSpeed
};

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    s: false
};

let mouseY = canvas.height / 2;

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
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

// Game Functions
function startGame() {
    game.gameRunning = !game.gameRunning;
    document.getElementById('startBtn').textContent = game.gameRunning ? 'Pause Game' : 'Resume Game';
}

function resetScore() {
    game.playerScore = 0;
    game.computerScore = 0;
    updateScore();
    resetBall();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
}

function updateScore() {
    document.getElementById('playerScore').textContent = game.playerScore;
    document.getElementById('computerScore').textContent = game.computerScore;
}

// Update Functions
function updatePlayerPaddle() {
    // Mouse control
    if (mouseY - paddleHeight / 2 !== player.y) {
        player.y += (mouseY - paddleHeight / 2 - player.y) * 0.15; // Smooth movement
    }
    
    // Arrow keys control
    if (keys['ArrowUp']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['ArrowDown']) {
        player.y = Math.min(canvas.height - paddleHeight, player.y + player.speed);
    }
    
    // Boundary check
    if (player.y < 0) player.y = 0;
    if (player.y + paddleHeight > canvas.height) player.y = canvas.height - paddleHeight;
}

function updateComputerPaddle() {
    const computerCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;
    
    // Simple AI: follow the ball with some delay
    if (computerCenter < ballCenter - 35) {
        computer.y += computer.speed;
    } else if (computerCenter > ballCenter + 35) {
        computer.y -= computer.speed;
    }
    
    // Boundary check
    if (computer.y < 0) computer.y = 0;
    if (computer.y + computer.height > canvas.height) computer.y = canvas.height - computer.height;
}

function updateBall() {
    if (!game.gameRunning) return;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Ball collision with top and bottom walls
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        // Keep ball in bounds
        if (ball.y - ball.size < 0) ball.y = ball.size;
        if (ball.y + ball.size > canvas.height) ball.y = canvas.height - ball.size;
    }
    
    // Ball collision with paddles
    if (checkPaddleCollision(player)) {
        ball.dx = Math.abs(ball.dx); // Ensure ball goes right
        ball.x = player.x + player.width + ball.size;
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy += hitPos * 3;
    }
    
    if (checkPaddleCollision(computer)) {
        ball.dx = -Math.abs(ball.dx); // Ensure ball goes left
        ball.x = computer.x - ball.size;
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        ball.dy += hitPos * 3;
    }
    
    // Ball out of bounds (scoring)
    if (ball.x - ball.size < 0) {
        game.computerScore++;
        updateScore();
        resetBall();
    } else if (ball.x + ball.size > canvas.width) {
        game.playerScore++;
        updateScore();
        resetBall();
    }
    
    // Speed limiter
    const maxSpeed = ballSpeed * 2;
    if (Math.abs(ball.dy) > maxSpeed) {
        ball.dy = (ball.dy > 0 ? 1 : -1) * maxSpeed;
    }
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
    
    // Draw center line
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);
    
    // Draw ball
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw game status
    if (!game.gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff88';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
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

// Start the game loop
gameLoop();
