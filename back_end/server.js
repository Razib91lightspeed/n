const express = require('express');
const cors = require('cors');
const app = express();
const port = 3010;

// Middleware setup
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable Cross-Origin Resource Sharing

// Initial game state variables
let highScore = 0;
let currentScore = 0;
let totalGamesPlayed = 0;
let statistics = {
    totalPoints: 0,
    totalApplesEaten: 0,
    totalGameDuration: 0,
    totalPausedDuration: 0,
    totalSnakeLength: 0,
    totalGamesPlayed: 0,
    currentGameNumber: 1
};

// Function to generate random obstacles avoiding the snake cells
function generateRandomObstacles(snakeCells, apples) {
    const obstacles = [];
    const numberOfObstacles = 3;
    const grid = 30;
    const rows = 20;
    const cols = 20;
    const initialSafeZoneSize = 8; // Size of the initial safe zone

    // Generate obstacles until the desired number is reached
    while (obstacles.length < numberOfObstacles) {
        const obstacle = {
            x: Math.floor(Math.random() * cols) * grid,
            y: Math.floor(Math.random() * rows) * grid,
            width: (Math.floor(Math.random() * 3) + 1) * grid, // Random width between 1 and 3 squares
            height: (Math.floor(Math.random() * 3) + 1) * grid // Random height between 1 and 3 squares
        };

          // This extra feature will ensure that each game can have smooth start by avoiding to generate obstacles in at the beganning of game.
          // Check if the obstacle is within the initial 8x8 grid (top-left corner).
          if (obstacle.x < initialSafeZoneSize * grid && obstacle.y < initialSafeZoneSize * grid) {
            continue; // Skip this obstacle and generate a new one
        }

        // Ensure the obstacle does not overlap with the snake
        if (!isOccupied(obstacle, snakeCells, apples)) {
            obstacles.push(obstacle);
        }
    }

    return obstacles;
}

// Function to check if a position is occupied by the snake cells or apples
function isOccupied(obstacle, snakeCells, apples) {
    for (let cell of snakeCells) {
        if (
            cell.x >= obstacle.x &&
            cell.x < obstacle.x + obstacle.width &&
            cell.y >= obstacle.y &&
            cell.y < obstacle.y + obstacle.height
        ) {
            return true;
        }
    }

    for (let apple of apples) {
        if (
            apple.x >= obstacle.x &&
            apple.x < obstacle.x + obstacle.width &&
            apple.y >= obstacle.y &&
            apple.y < obstacle.y + obstacle.height
        ) {
            return true;
        }
    }

    return false;
}


// API endpoint to generate and return obstacles
app.post('/api/obstacles', (req, res) => {
    const { snakeCells, apples } = req.body;
    console.log('Received snakeCells:', snakeCells);
    console.log('Received apples:', apples);
    if (!snakeCells || !apples) {
        return res.status(400).json({ error: 'snakeCells and apples are required' });
    }
    const obstacles = generateRandomObstacles(snakeCells, apples);
    console.log('Generated obstacles:', obstacles);
    res.json(obstacles);
});

// API endpoint to get the high score
app.get('/api/highscore', (req, res) => {
    res.json({ highScore });
});

// API endpoint to set a new high score
app.post('/api/highscore', (req, res) => {
    const { score } = req.body;
    currentScore = score;
    if (score > highScore) {
        highScore = score;
    }
    res.json({ highScore });
});

// API endpoint to get game statistics
app.get('/api/statistics', (req, res) => {
    res.json(statistics);
});

// API endpoint to update game statistics
app.post('/api/statistics', (req, res) => {
    statistics = req.body;
    res.json(statistics);
});

// API endpoint to get the current score
app.get('/api/currentscore', (req, res) => {
    res.json({ currentScore });
});

// API endpoint to set the current score
app.post('/api/currentscore', (req, res) => {
    const { score } = req.body;
    currentScore = score;
    res.json({ currentScore });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
