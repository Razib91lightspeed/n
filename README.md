# Snake Game

## Step 1. Clone this project using terminal (macOs)

```bash
git clone https://github.com/Razib91lightspeed/snake-game.git
```

## Step 2. Navigate to this directory

```bash
cd snake-game
```
## Step 3. Open this project in VScode

```bash
code .
```

## Step 4. Use same terminal to navigate to back_end directory

```bash
cd back_end
```

## Step 5. Install node_modules

```bash
npm install
```

## Step 6. Run backend

```bash
npm start
```

- or

```bash
node server.js
```

## Step 7. Run the Forntend

After successfully running the backend, navigate to the front_end directory in Visual Studio Code and open index.html directly.

## Step 8. Verifying Backend Functionality

## Step 9. Open browser or use postman

- Use left arrow key ⬅️ to start the game and generate some data.

<img src="/images/empty_view.png" alt="start_game images" height="600" width="620">

- Game page view ( Game is being played)

<img src="/images/homepage.png" alt="homepage images" height="600" width="620">

- Statistics view

<img src="/images/stat_view.png" alt="statistic images" height="600" width="620">

- Info View

<img src="/images/info_view.png" alt="information images" height="600" width="620">

- You can verify the backend endpoints using a browser or Postman.


### Step 9.1 Using a Browser

```bash
http://localhost:3010/api/currentscore
```
 ![currentscore images](/images/currentweb.png)


```bash
http://localhost:3010/api/statistics
```

![statistic images](/images/Statis_web.png)



```bash
http://localhost:3010/api/highscore
```

![highscore images](/images/highweb.png)


### Step 9.2 Using Postman

```bash
http://localhost:3010/api/currentscore
```

![currentscoreweb images](/images/current_postman.png)



```bash
http://localhost:3010/api/statistics
```

![statiseweb images](/images/statis_postman.png)



```bash
http://localhost:3010/api/highscore
```

![highscoreweb images](/images/high_postman.png)



### Step 9.3 To verify the obstacles endpoint, use the "POST" method:

1. Open Postman.
2. Select "POST" and enter the URL

```bash
http://localhost:3010/api/obstacles
```

3. Go to the "Body" tab.
4. Select "raw" and then "JSON".
5. Paste the following JSON data:

```bash
{
    "snakeCells": [{ "x": 0, "y": 0 }, { "x": 30, "y": 0 }]
}
```

6. Click "Send".

![obsti images](/images/obs_postman.png)



### Step 9.4 Using curl

```bash
curl -X POST http://localhost:3010/api/obstacles -H "Content-Type: application/json" -d '{"snakeCells":[{"x":0,"y":0},{"x":30,"y":0}]}'
```

![obsti_live images](/images/obs_ter.png)


### Step 9.5 Live obstacles Update while playing game

- You can see live updates of obstacles and the snake in the terminal.

- Have fun playing this game
