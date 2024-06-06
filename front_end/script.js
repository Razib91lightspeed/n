let totalGamesPlayed = 0;
let currentGameNumber = 1;
let highestGame = {
    points: 0,
    apples: 0,
    duration: 0,
    pausedDuration: 0,
    length: 0,
    gameNumber: 0,
    turnCounts: { up: 0, down: 0, left: 0, right: 0 }
};

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const grid = 30; // size of each square
const rows = 20; //grid of 20 × 20 squares
const cols = 20; //grid of 20 × 20 squares
canvas.width = cols * grid; // 600 pixels
canvas.height = rows * grid; // 600 pixels
let points = 0;
let currentLength = 1;
let targetLength = 5;
let isPaused = false;
let startTime;
let endTime;
let pauseStartTime;
let totalPausedDuration = 0;
let totalApplesEaten = 0;
let highestApplesEaten = 0;
let turnCounts = { up: 0, down: 0, left: 0, right: 0 };
let chartInstanceGame = null;
let chartInstanceStatistics = null;
let chartInstanceHighest = null;
let gameInterval = null;
let firstGame = true; // New flag to check if it's the first game
let elapsedTime = 0; // Variable to store elapsed time in seconds

const snake = {
    x: 0,
    y: 0,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 5 // Initial target length
};

const apples = [];
const maxApples = 3;
let obstacles = [];

// Function to fetch obstacles from the backend
async function fetchObstacles() {
    const response = await fetch('http://localhost:3010/api/obstacles');
    const data = await response.json();
    return data;
}

// Function to fetch the current score from the backend
async function fetchCurrentScore() {
    const response = await fetch('http://localhost:3010/api/currentscore');
    const data = await response.json();
    document.getElementById('current-score').innerText = data.currentScore;
}

// Function to fetch the high score from the backend
async function fetchHighScore() {
    const response = await fetch('http://localhost:3010/api/highscore');
    const data = await response.json();
    highScore = data.highScore;
    document.getElementById('high-score').innerText = highScore;
}

// Function to save the high score to the backend
async function saveHighScore(score) {
    await fetch('http://localhost:3010/api/highscore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score })
    });
}

// Function to save the game statistics to the backend
async function saveStatistics() {
    await fetch('http://localhost:3010/api/statistics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ totalGames: totalGamesPlayed, highestGameData: highestGame })
    });
}

// Utility function to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Function to get a random position on the grid
function getRandomGridPosition() {
    let position;
    do {
        position = { x: getRandomInt(0, cols) * grid, y: getRandomInt(0, rows) * grid };
    } while (isOccupied(position));
    return position;
}

// Function to check if a position is occupied by the snake, an apple, or an obstacle
function isOccupied(position) {
    for (let cell of snake.cells) {
        if (cell.x === position.x && cell.y === position.y) {
            return true;
        }
    }
    for (let apple of apples) {
        if (apple.x === position.x && apple.y === position.y) {
            return true;
        }
    }
    for (let obstacle of obstacles) {
        if (position.x >= obstacle.x && position.x < obstacle.x + obstacle.width &&
            position.y >= obstacle.y && position.y < obstacle.y + obstacle.height) {
            return true;
        }
    }
    return false;
}

// Function to fetch obstacles from the backend with the snake's current cells
async function fetchObstacles(snakeCells, apples) {
    console.log('Fetching obstacles for snake cells:', snakeCells, 'and apples:', apples);
    try {
        const response = await fetch('http://localhost:3010/api/obstacles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ snakeCells, apples })
        });

        if (!response.ok) {
            console.error('Failed to fetch obstacles:', response.statusText);
            return [];
        }

        const data = await response.json();
        console.log('Fetched obstacles:', data);
        return data;
    } catch (error) {
        console.error('Error during fetchObstacles:', error);
    }
}

// Function to reset the game state
async function resetGame() {
    snake.x = 0;
    snake.y = 0;
    snake.cells = [];
    snake.maxCells = 5;
    snake.dx = grid;
    snake.dy = 0;
    points = 0;
    currentLength = 1;
    targetLength = 5;
    totalApplesEaten = 0;
    totalPausedDuration = 0;
    turnCounts = { up: 0, down: 0, left: 0, right: 0 };
    elapsedTime = 0; // Reset the elapsed time
    document.getElementById('points').innerText = points;
    document.getElementById('current-length').innerText = currentLength;
    document.getElementById('target-length').innerText = targetLength;
    document.getElementById('total-apples-eaten').innerText = totalApplesEaten;
    document.getElementById('highest-apples-eaten').innerText = highestApplesEaten;
    document.getElementById('total-games-played').innerText = totalGamesPlayed;
    document.getElementById('current-game-number').innerText = currentGameNumber;
    document.getElementById('current-total-points').innerText = points;
    document.getElementById('current-total-apples').innerText = totalApplesEaten;
    document.getElementById('current-game-duration').innerText = 0;
    document.getElementById('current-paused-duration').innerText = totalPausedDuration;
    document.getElementById('current-total-length').innerText = currentLength;
    document.getElementById('current-game-number-stat').innerText = currentGameNumber;
    document.getElementById('timer').innerText = elapsedTime; // Reset the timer display

    for (let i = 0; i < snake.maxCells; i++) {
        snake.cells.push({ x: snake.x - i * grid, y: snake.y });
    }

    apples.length = 0;
    for (let i = 0; i < maxApples; i++) {
        apples.push(getRandomGridPosition());
    }

    obstacles = await fetchObstacles(snake.cells, apples); // Fetch obstacles from the backend
    await fetchHighScore();

    isPaused = true;
    startTime = new Date();

    if (gameInterval) {
        clearInterval(gameInterval); // Clear the existing interval
        gameInterval = null; // Reset the interval variable
    }

    if (firstGame) {
        document.addEventListener('keydown', startGameOnFirstKey);
    } else {
        startGame();
    }

    initializeCharts();
}

// Function to draw the grid
function drawGrid() {
    context.strokeStyle = 'black';
    context.fillStyle = 'lightgrey';
    for (let x = 0; x < canvas.width; x += grid) {
        for (let y = 0; y < canvas.height; y += grid) {
            context.fillRect(x, y, grid, grid);
            context.strokeRect(x, y, grid, grid);
        }
    }
}

// Function to end the game
function endGame() {
    isPaused = true;
    if (gameInterval) {
        clearInterval(gameInterval); // Clear the existing interval added
        gameInterval = null; // Reset the interval variablen added
    }
    endTime = new Date();
    const playTime = Math.floor((endTime - startTime - totalPausedDuration) / 1000);
    alert(`Game Over!\n\nFinal Score: ${points}\nPlay Time: ${elapsedTime} seconds`);
    fetch('http://localhost:3010/api/currentscore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: points })
    });
    if (points > highScore) {
        saveHighScore(points);
    }
    totalGamesPlayed++;
    currentGameNumber++;
    highestApplesEaten = Math.max(highestApplesEaten, totalApplesEaten);

    if (points > highestGame.points) {
        highestGame = {
            points: points,
            apples: totalApplesEaten,
            duration: playTime,
            pausedDuration: Math.floor(totalPausedDuration / 1000), // Convert milliseconds to seconds and round down
            length: snake.cells.length,
            gameNumber: currentGameNumber - 1,
            turnCounts: { ...turnCounts } // Clone the current turn counts
        };
    }
    saveStatistics(); // Save statistics to the backend
    updateHighestGameStats();
    updateHighestChart();
    updateCharts(); // Ensure charts are updated before showing statistics
    showStatistics();
}

// Function to initialize charts
function initializeCharts() {
    // Data for the charts, representing the number of turns in each direction
    const chartData = {
        labels: ['Up', 'Down', 'Left', 'Right'],
        datasets: [{
            label: 'Number of Turns',
            data: [turnCounts.up, turnCounts.down, turnCounts.left, turnCounts.right],
            backgroundColor: ['red', 'blue', 'green', 'yellow']
        }]
    };

    // Check if a game chart instance already exists and destroy it if it does
    if (chartInstanceGame) {
        chartInstanceGame.destroy();
    }
     // Get the context of the 'chart-game' canvas element
    const ctxGame = document.getElementById('chart-game').getContext('2d');
    // Create a new bar chart for the game turns
    chartInstanceGame = new Chart(ctxGame, {
        type: 'bar', // Type of chart
        data: chartData, // Data for the chart
        options: {
            scales: {
                y: {
                    beginAtZero: true // Y-axis starts at zero
                }
            }
        }
    });

     // Check if a statistics chart instance already exists and destroy it if it does
    if (chartInstanceStatistics) {
        chartInstanceStatistics.destroy();
    }

    // Get the context of the 'chart-statistics' canvas element
    const ctxStatistics = document.getElementById('chart-statistics').getContext('2d');
     // Create a new bar chart for the statistics turns
    chartInstanceStatistics = new Chart(ctxStatistics, {
        type: 'bar', // Type of chart
        data: chartData, // Data for the chart
        options: {
            scales: {
                y: {
                    beginAtZero: true // Y-axis starts at zero
                }
            }
        }
    });

    // Check if a highest score chart instance already exists and destroy it if it does
    if (chartInstanceHighest) {
        chartInstanceHighest.destroy();
    }


    // Get the context of the 'chart-highest' canvas element
    const ctxHighest = document.getElementById('chart-highest').getContext('2d');
     // Create a new bar chart for the highest score turns
    chartInstanceHighest = new Chart(ctxHighest, {
        type: 'bar', // Type of chart
        data: {
            labels: ['Up', 'Down', 'Left', 'Right'],
            datasets: [{
                label: 'Number of Turns',
                data: [highestGame.turnCounts.up, highestGame.turnCounts.down, highestGame.turnCounts.left, highestGame.turnCounts.right],
                backgroundColor: ['red', 'blue', 'green', 'yellow']
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true // Y-axis starts at zero
                }
            }
        }
    });
}

// Function to update charts
function updateCharts() {
    const chartData = [turnCounts.up, turnCounts.down, turnCounts.left, turnCounts.right];

    if (chartInstanceGame) {
        chartInstanceGame.data.datasets[0].data = chartData;
        chartInstanceGame.update();
    }

    if (chartInstanceStatistics) {
        chartInstanceStatistics.data.datasets[0].data = chartData;
        chartInstanceStatistics.update();
    }
}

// Function to update the highest score chart
function updateHighestChart() {
    const highestChartData = [highestGame.turnCounts.up, highestGame.turnCounts.down, highestGame.turnCounts.left, highestGame.turnCounts.right];

    if (chartInstanceHighest) {
        chartInstanceHighest.data.datasets[0].data = highestChartData;
        chartInstanceHighest.update();
    }
}

// Main game loop
function gameLoop() {
    if (!isPaused) {
        // Clear the canvas for redrawing
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(); // Draw the grid on the canvas

        // Calculate the new head position based on current direction
        const head = { x: snake.x + snake.dx, y: snake.y + snake.dy };
        // Check for collisions with the canvas boundaries (grid edges)
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            endGame();// End the game if the snake hits the boundary
            return;
        }
        // Check for collisions with the snake's own body
        for (let cell of snake.cells) {
            if (head.x === cell.x && head.y === cell.y) {
                endGame();// End the game if the snake hits itself
                return;
            }
        }

        // Check for collisions with obstacles
        for (let obstacle of obstacles) {
            if (head.x >= obstacle.x && head.x < obstacle.x + obstacle.width &&
                head.y >= obstacle.y && head.y < obstacle.y + obstacle.height) {
                endGame();// End the game if the snake hits an obstacle
                return;
            }
        }

        //Updating the head position
        snake.x += snake.dx;
        snake.y += snake.dy;

        //Adding new segments and maintaining length:
        snake.cells.unshift({ x: snake.x, y: snake.y });

        // If the snake has grown beyond its max length, remove the tail segment
        if (snake.cells.length > snake.maxCells) {
            snake.cells.pop();
        }

        // Draw the apples on the grid
        context.fillStyle = 'red';
        apples.forEach(apple => {
            context.fillRect(apple.x, apple.y, grid - 1, grid - 1);
        });

        // Draw the apples on the grid
        context.fillStyle = 'black';
        obstacles.forEach(obstacle => {
            context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        // Draw the apples on the grid
        context.fillStyle = 'green';
        snake.cells.forEach(cell => {
            context.fillRect(cell.x, cell.y, grid - 1, grid - 1);
        });

        // Fetch new obstacles after eating an apple
        apples.forEach((apple, i) => {
            if (snake.x === apple.x && snake.y === apple.y) {
                snake.maxCells += 5; // Increase the snake's max length
                points += 10;// Add points
                targetLength += 5; // Update target length
                totalApplesEaten++; //Increment apple count
                document.getElementById('points').innerText = points;
                document.getElementById('target-length').innerText = targetLength;
                document.getElementById('total-apples-eaten').innerText = totalApplesEaten;
                document.getElementById('current-total-points').innerText = points;
                document.getElementById('current-total-apples').innerText = totalApplesEaten;
                document.getElementById('current-total-length').innerText = snake.cells.length;
                apples[i] = getRandomGridPosition(); // Reposition the eaten apple
                fetchObstacles(snake.cells, apples).then(newObstacles => {
                    obstacles = newObstacles; // Fetch new obstacles
                });

                // Ensure all apples are present
                while (apples.length<maxApples){
                    let newApple = getRandomGridPosition();
                    if (!isOccupied(newApple)){
                        apples.push(newApple);
                    }
                }
            }
        });

        document.getElementById('current-length').innerText = snake.cells.length;
        document.getElementById('current-total-length').innerText = snake.cells.length;
        elapsedTime = Math.floor((new Date() - startTime - totalPausedDuration) / 1000);
        document.getElementById('current-game-duration').innerText = elapsedTime;
        document.getElementById('current-paused-duration').innerText = Math.floor(totalPausedDuration / 1000); // Convert milliseconds to seconds
        document.getElementById('timer').innerText = elapsedTime; // Update the timer display

        updateCharts();
    }
}

// Function to update the highest game statistics
function updateHighestGameStats() {
    document.getElementById('highest-total-points').innerText = highestGame.points;
    document.getElementById('highest-total-apples').innerText = highestGame.apples;
    document.getElementById('highest-game-duration').innerText = highestGame.duration;
    document.getElementById('highest-paused-duration').innerText = highestGame.pausedDuration; // Ensure it's displayed as an integer
    document.getElementById('highest-total-length').innerText = highestGame.length;
    document.getElementById('highest-game-number').innerText = highestGame.gameNumber;
}

// Function to start the game on the first key press
function startGameOnFirstKey(e) {
    if (e.key === 'ArrowLeft') {
        document.removeEventListener('keydown', startGameOnFirstKey);
        startGame();
    }
}

// Function to start the game
function startGame() {
    isPaused = false;
    if (!gameInterval) { // Ensure only one interval is created
        gameInterval = setInterval(gameLoop, 300); // Timer event set to 0.3 seconds (300 milliseconds)
    }
    firstGame = false; // Update the flag after the first game starts
}

// Event listener for key presses
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && snake.dx === 0) {
        snake.dx = -grid;
        snake.dy = 0;
        turnCounts.left++;
        if (firstGame) {
            startGame();
        }
    } else if (e.key === 'ArrowUp' && snake.dy === 0) {
        snake.dy = -grid;
        snake.dx = 0;
        turnCounts.up++;
    } else if (e.key === 'ArrowRight' && snake.dx === 0) {
        snake.dx = grid;
        snake.dy = 0;
        turnCounts.right++;
    } else if (e.key === 'ArrowDown' && snake.dy === 0) {
        snake.dy = grid;
        snake.dx = 0;
        turnCounts.down++;
    }
});

// Function to show the game view
function showGame() {
    document.getElementById('game-view').style.display = 'flex';
    document.getElementById('info-view').style.display = 'none';
    document.getElementById('statistics').style.display = 'none';
    setActiveButton('game');
}

// Function to show the info view
function showInfo() {
    document.getElementById('game-view').style.display = 'none';
    document.getElementById('info-view').style.display = 'flex';
    document.getElementById('statistics').style.display = 'none';
    setActiveButton('info');
}

// Function to show the statistics view
function showStatistics() {
    document.getElementById('game-view').style.display = 'none';
    document.getElementById('info-view').style.display = 'none';
    document.getElementById('statistics').style.display = 'flex';
    updateCharts();
    updateHighestChart();
    fetchCurrentScore(); // Fetch and display the current score
    setActiveButton('statistics');
}

// Function to set the active button in the navigation
function setActiveButton(activeView) {
    // Remove active class from all buttons
    document.querySelectorAll('nav button').forEach(button => {
        button.classList.remove('active');
    });

    // Add active class to the clicked button
    switch (activeView) {
        case 'game':
            document.querySelector('button[onclick="showGame()"]').classList.add('active');
            break;
        case 'info':
            document.querySelector('button[onclick="showInfo()"]').classList.add('active');
            break;
        case 'statistics':
            document.querySelector('button[onclick="showStatistics()"]').classList.add('active');
            break;
    }
}

// Function to pause the game
function pauseGame() {
    isPaused = !isPaused;
    if (!isPaused) {
        totalPausedDuration += new Date() - pauseStartTime;
        gameInterval = setInterval(gameLoop, 300);
    } else {
        clearInterval(gameInterval);
        pauseStartTime = new Date();
    }
}

// Function to restart the game
function restartGame() {
    document.getElementById('statistics').style.display = 'none';
    resetGame();
}

resetGame();
