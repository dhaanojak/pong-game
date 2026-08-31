# Pong Game

A classic Pong game built with HTML5, CSS, and JavaScript featuring player vs computer gameplay.

## Features

- **Player Control**: Control your paddle using your mouse or arrow keys (↑/↓)
- **AI Opponent**: Computer-controlled opponent with intelligent ball tracking
- **Ball Physics**: Realistic ball movement with collision detection
- **Scoreboard**: Real-time score tracking for both player and computer
- **Collision Detection**: 
  - Ball bounces off top and bottom walls
  - Ball bounces off player and computer paddles
  - Paddle collision causes ball spin
- **Score System**: Points awarded when ball passes opponent's paddle
- **Pause/Resume**: Start and pause the game anytime
- **Reset**: Clear scores and restart

## How to Play

1. Open `index.html` in a web browser
2. Click "Start Game" to begin playing
3. Move your paddle (left side) using:
   - **Mouse**: Move your mouse up and down
   - **Arrow Keys**: Press ↑ to move up, ↓ to move down
4. Hit the ball past your opponent's paddle to score
5. First to break the opponent's defense wins the point!

## Game Controls

| Action | Control |
|--------|----------|
| Move Paddle Up | Mouse Up / Arrow Up |
| Move Paddle Down | Mouse Down / Arrow Down |
| Start/Pause | Click "Start Game" button |
| Reset Score | Click "Reset Score" button |

## Game Rules

- The ball bounces off the top and bottom walls
- If the ball passes your paddle (left), the computer scores
- If the ball passes the computer's paddle (right), you score
- The ball gains spin based on where it hits the paddle
- Players can pause and resume the game at any time

## Files

- `index.html` - Game HTML structure
- `style.css` - Game styling and layout
- `script.js` - Game logic and physics

## Technologies Used

- HTML5
- CSS3
- JavaScript (Canvas API)

## Browser Compatibility

Works in all modern browsers that support HTML5 Canvas.
