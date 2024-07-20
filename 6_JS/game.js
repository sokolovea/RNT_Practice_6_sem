let cvs = document.getElementById('map');
let ctx = cvs.getContext('2d');
let gameController = new GameController(ctx);


function displayPlayers(players) {
    for (let i = 0; i < players.length; i++) {
        let p = players[i];
        let x = p.location.x * blockSizeX;
        let y = p.location.y * blockSizeY;
        ctx.drawImage(p.icon, x, y, blockSizeX, blockSizeY)
    }
}

function displayMap(map){       
    if (map) {
        blockSizeX = cvs.clientWidth / map.width;
        blockSizeY = cvs.clientHeight / map.height;

        ctx.drawImage(gameController.icons.empty, 0, 0, cvs.clientWidth, cvs.clientHeight);
        
        if (ctx) {
            for (let i = 0; i < map.cells.length; i++) {
                let cell = map.cells[i];
                let x = parseInt(i/map.height);
                let y = i - x * map.height;
                displayCell(x, y, cell);
            }
        }
    }
}

gameController.incrementProgress = () =>{
    gameController.remainingSwitchTime += 100;
    setProgress(Math.floor(gameController.remainingSwitchTime / gameController.game.switchTimeout * 100));
    updateCoinsAndLifes();
}

gameController.log = (message) =>{
    let textarea = document.getElementById('logs');
    textarea.value += message + '\n';
}


//Дополнительные функции и "костыли" из wrapper.js

function updateCoinsAndLifes()
{
    let team1Coins = gameController.game.team1Stats.coinsCollected;
    let team1Lives = gameController.game.team1Stats.currentLives;
    let team2Coins = gameController.game.team2Stats.coinsCollected;
    let team2Lives = gameController.game.team2Stats.currentLives;
    document.getElementById('countFirst').innerText = team1Coins;
    document.getElementById('lifesFirst').innerText = team1Lives;
    document.getElementById('countSecond').innerText = team2Coins;
    document.getElementById('lifesSecond').innerText = team2Lives;
}

gameController.displayMap = (map) =>{
    displayMap(map);
}

gameController.displayPlayers = (players) =>{
    displayPlayers(players);
}

//Установка значений таймера
function setProgress(percentage) {
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    
    let progressBarFill = document.getElementById('progressBarFill');
    progressBarFill.style.width = percentage + '%';
}


function defineCellType(type) {
    switch (type) {
        case GameApi.MapCellType.empty:
        default:
            return gameController.icons.empty || null;
        case GameApi.MapCellType.wall:
            return gameController.icons.wall || null;
        case GameApi.MapCellType.coin:
            return gameController.icons.coin || null;
        case GameApi.MapCellType.life:
            return gameController.icons.life || null;
        case GameApi.MapCellType.swtch:
            return gameController.icons.switch || null;
        case GameApi.MapCellType.thiefRespawn:
            return gameController.icons.empty || null;
        case GameApi.MapCellType.policeRespawn:
            return gameController.icons.empty || null;
        case 7:
            return gameController.icons.police || null;
        case 8:
            return gameController.icons.thief || null;
    }
}

function displayCell (x, y, type) {
    x *= blockSizeX;
    y *= blockSizeY;
    
    let img = defineCellType(type);
    if (img) {
        ctx.drawImage(img, x, y, blockSizeX, blockSizeY);
    }
};

function getCode(keyName) {
    switch(keyName) {
        case "ArrowLeft":
        case "a": // KeyA -> left
            return 37;
        case "ArrowUp":
        case "w": // KeyW -> up
            return 38;
        case "ArrowRight":
        case "d": // KeyD -> right
            return 39;
        case "ArrowDown":
        case "s": // KeyS -> down
            return 40;
        default:
            return -1;
    }
}

// Обработчики событий

document.addEventListener('keydown', (event) => {
    let keyCode = getCode(event.key);
    let direction = jsHelper.getDirection(keyCode);
    if (direction != -1) {
        gameController.movePlayer(direction);
    }
});


let buttonStart = document.getElementById('buttonStart');
let buttonStop = document.getElementById('buttonStop');
let buttonConnect = document.getElementById('buttonConnect');
let buttonDisconnect = document.getElementById('buttonDisconnect');
let buttonReconnect = document.getElementById('buttonReconnect');
let buttonCancelGame = document.getElementById('buttonCancelGame');
let buttonExit = document.getElementById('buttonExit');

buttonStart.addEventListener('click', function() {
    updateCoinsAndLifes()
    gameController.start();
});

buttonStop.addEventListener('click', function() {
    gameController.stop();
});

buttonConnect.addEventListener('click', function() {
    gameController.reconnect();
});

buttonDisconnect.addEventListener('click', function() {
    gameController.disconnect();
});

buttonReconnect.addEventListener('click', function() {
    gameController.join();
});

buttonCancelGame.addEventListener('click', function() {
    gameController.cancel();
});

buttonExit.addEventListener('click', function() {
    gameController.leave();
});
