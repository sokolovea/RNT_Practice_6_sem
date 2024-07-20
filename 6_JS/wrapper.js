/*
	Обёртка над обёрткой GameApi предоставляет упрощённый доступ к серверу игры
	GameController в качестве параметра принимает canvas на котором будет
	рисоваться карта
	
	Это усложнённый вариант
	
	Предоставляет следующие методы для пользования:
		
		displayMap - должны написать сами, метод рисования карты		
		displayPlayers - должны написать сами, метод рисования игроков			
		start - начать игру				
		stop - остановить игру, пауза		
		cancel - отменить игру, возобновить нельзя	
		reconnect - переподключиться, нужно если с сетью проблемы
		disconnect - отключиться от игры, нужно нажать reconnect, чтобы вернуться
		leave - выйти из команды и стать подписчиком	
		join - вернуться в команду (таже команда, очки и пр.)	
		movePlayer - принимает в качестве параметра направление 0, 1, 2, 3
		players - массив с игроками
		game - объект с игрой, не обязательно им пользоваться - advanced level
		icons - объект
		log - функция для логирования, должны написать сами
		incrementProgress - функция для изменения состояния progressBar, должны написать сами
		remainingSwitchTime - время, оставшееся до смены ролей в миллисекундах
		user - текущий пользователь
*/

function GameController(canvas) {
	var api = new GameApi(),
		game,
		gameInstance,
		lastDirection,
		switchProgress,
		remainingSwitchTime,
		logBox = document.getElementById('log'),	
		ctlProgress = document.getElementById('progressBar'),
		gameStart, //interval
		user,
		blockSizeX, blockSizeY,
		icons = initIcons(),
		canvas = document.getElementById('map'),
		context = canvas.getContext('2d'),
		players = [],
		_ = jsHelper;
	
	
	
	/*
		public API которым будут пользоваться студенты
	*/
	var _gameController = {
		//должны написать сами
		displayMap: null,
		
		//должны написать сами
		displayPlayers: null,
		
		//начать игру
		start: start,
		
		//остановить игру, пауза
		stop: stop,
		
		//отменить игру, возобновить нельзя
		cancel: cancel,
		
		//переподключиться, нужно если с сетью проблемы
		reconnect: reconnect,
		
		//отключиться от игры, нужно нажать reconnect, чтобы вернуться
		disconnect: disconnect,
		
		//выйти из команды и стать подписчиком
		leave: leave,
		
		//вернуться в команду (таже команда, очки и пр.)
		join: join,
		
		//принимает в качестве параметра направление 0, 1, 2, 3.
		movePlayer: movePlayer,
		
		//массив с игроками
		players: players,
		
		//объект с игрой
		game: game,
		
		//объект с икнонками
		icons: icons,
		
		//функция для логирования, должны написать сами
		log: null,
		
		//функция для изменения состояния progressBar
		incrementProgress: null,
		
		//время в миллисекундах до смены ролей
		remainingSwitchTime: remainingSwitchTime,
		
		//текущий пользователь
		user: api.questor.user
	};
	
	
	/*
		Получаем объект игры тестовой или обычной
	*/
	if (api) {
		resizeMapBlock(canvas);
		
		if (api) {
			user = api.questor.user;
			var params = _.parseGet();

			if (params.gameID !== 'test') {
				api.games.getGame(params.gameID, initGame);
			} else {
				api.games.getTest(initGame);
			}
		} else {
			console.log('GameApi is not found');
		}
	}
	
	//инициализация основных глобальных переменных, получение объекта GameConnectionInstance
	function initGame(g) {
		if (g) {
			game = g;
			gameInstance = api.connect(params.gameID);
			attachGameEvents(gameInstance);
		} else {
			alert('Не получилось создать игру');
		}
	};
	
	//загрузка иконок, иконки должны иметь определённые имена
	function initIcons () {
        var icons = {
            empty: null,
            wall: null,
            coin: null,
            life: null,
            switch: null,
            police: null,
            thief: null,
            playerPolice: null,
            playerThief: null
        };
        
        for(var img in icons) {
            var image = new Image();
            image.src = img + '.png';
            icons[img] = image;
        }
        
        return icons;
    };
	
	/*
		вызывается, когда происходит событие onSync
		распаковывается карта, полностью отображается
		инициализируется массив с игроками
		изменяется оставшееся до переключения ролей время
	*/
	function refreshGame (actualGame) {
		if (actualGame) {
            game = actualGame;
			game.map = unpackMap(game.map);
			showMap(game.map);
			
			initPlayers(game);											
			_gameController.remainingSwitchTime = game.switchTimeout - game.millisecodsToSwitch;
			_gameController.game = game;
		}
	};
	
	//распаковка карты
	function unpackMap (map) {
		var cellsCount = map.width * map.height;
		var unpacked = [];
		
		for (var i = 0; i < cellsCount; i++) {
			unpacked.push(0);
		}
		
		for (var i = 0; i < map.cells.length; i++) {
			var cell = map.cells[i];
			var cellNum = cell.location.x * map.height + cell.location.y;
			
			if (cell.type !== GameApi.MapCellType.policeRespawn &&
                cell.type !== GameApi.MapCellType.thiefRespawn) {
				
                    unpacked[cellNum] = cell.type;
			}
			
		}
		
		return { width: map.width, height: map.height, cells: unpacked };	
	};
	
	//инициализация массива игроков
	function initPlayers(g) {
		players = [];
		fillPlayers(g.team1Stats);
		fillPlayers(g.team2Stats);
	};
	
	//заполнение массива игроков
	function fillPlayers(team) {		
		for (var i = 0; i < team.playerStats.length; i++) {
			var p = team.playerStats[i];
			
			if (user.id !== p.userId) {
				p.icon = (team.role == GameApi.GameTeamRole.police)? icons.police : icons.thief;
			} else {
				p.icon = (team.role == GameApi.GameTeamRole.police)?  icons.playerPolice : icons.playerThief;
			}
			
			players.push(p);
		}
	};
	
	//изменяются значения очков в команде
	function refreshTeamData (teamId, data) {
        var team = defineTeam(teamId);
        
		if (team) {
            team.coinsCollected = (data.coins >= 0)? data.coins : team.coinsCollected;
			team.currentLives = (data.lives >= 0)? data.lives : team.currentLives;
        }        
	};
    
	//определение объекта команды по id
    function defineTeam (teamId) {
        switch (teamId) {
            case game.team1Stats.teamId:
                return game.team1Stats;
            case game.team2Stats.teamId:
                return game.team2Stats;
            default:
                return null;
        }
    };
	
	//ресайз канваса, чтобы всё было красиво
	function resizeMapBlock(canvas) {
		if (canvas) {
			canvas.style.height = canvas.clientWidth + 'px';
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			
			if (game && game.map) {
				showMap(game.map);
			}
		}
	};	
	
	//логирование в textarea	
	function log(message) {
		if (message && _gameController.log) {
			_gameController.log(message);
		}
	};
	
	//вызывается когда проиходит событие onFinished
	function showResult (teamId) {
		var team = defineTeam(teamId);
		if (team) {
			alert('Кодманда "' + team.name + '" победила');
		}
	};
	
	//интервал для нарашифания прогресс бара
	function startSwitchProgress () {
		if (switchProgress) {
			stopSwitchProgress();
		}
		
		var percent;
		switchProgress = setInterval(function () {
			if (_gameController.incrementProgress) {
				_gameController.incrementProgress();
			}
		}, 100);
	};
	
	function stopSwitchProgress() {
		if (switchProgress) {
			clearInterval(switchProgress);
			switchProgress = null;
		}
	};
	
	//Controller-----------------------------------------------------------------------
	
	function start () {
		if (gameInstance) {
			try {
				gameInstance.start();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	
	function stop () {
		if (gameInstance) {
			try {
				gameInstance.pause();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	
	function cancel () {
		if (gameInstance) {
			try {
				gameInstance.cancel();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	
	function reconnect () {
		if (gameInstance) {
			try {
				gameInstance.reconnect();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	
	function disconnect () {
		if (gameInstance) {
			try {
				gameInstance.disconnect();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	
	function leave () {
		if (gameInstance) {
			try {
				gameInstance.leave();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	
	function join () {
		if (gameInstance) {
			try {
				gameInstance.join();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	
	function movePlayer (direction) {
		gameInstance.beginMove(direction);
	};
	
	//---------------------------------------------------------------------------------
	
	
	
	//Map Adapter----------------------------------------------------------------------
	
	//отображение всей карты
	function showMap (map) {
        if (map) {
			blockSizeX = canvas.clientWidth / map.width;
			blockSizeY = canvas.clientHeight / map.height;

			context.drawImage(icons.empty, 0, 0, canvas.clientWidth, canvas.clientHeight);
			
			if (map && context) {
				for (var i = 0; i < map.cells.length; i++) {
					var cell = map.cells[i];
					var x = parseInt(i/map.height);
					var y = i - x * map.height;
					displayCell(x, y, cell);
				}
			}
		}
	};
	
    //отображение одной ячейки
	function displayCell (x, y, type) {
		var x = x * blockSizeX;
		var y = y * blockSizeY;
		
		var img = defineCellType(type);
		if (img) {
			context.drawImage(img, x, y, blockSizeX, blockSizeY);
        }
    };
	
	//определение по ячейки
	function defineCellType (type) {
		switch(type) {
			case GameApi.MapCellType.empty:
			default:
				return icons.empty || null;
			case GameApi.MapCellType.wall:
				return icons.wall || null;
			case GameApi.MapCellType.coin:
				return icons.coin || null;
			case GameApi.MapCellType.life:
				return icons.life || null;
			case GameApi.MapCellType.swtch:
				return icons.switch || null;
			case GameApi.MapCellType.thiefRespawn:
				return icons.empty || null;
			case GameApi.MapCellType.policeRespawn:
				return icons.empty || null;
			case 7:
				return icons.police || null; //полицейский
			case 8:
				return icons.thief || null; //вор
		}
	};
	
	//---------------------------------------------------------------------------------
	
	
	
	//Handlers-------------------------------------------------------------------------
	
	//инициализация интервала для отображения карты
	function startGameInterval() {
		if (gameStart) {
			stopGameInterval();
		}
		
		gameStart = setInterval(function () {
			_gameController.displayMap(game.map);
			_gameController.displayPlayers(players);
		}, 25);
	};
	
	//остановка отображения карты
	function stopGameInterval() {
		if (gameStart) {
			clearInterval(gameStart);
			gameStart = null;
		}
	}
	
	//изменение типа ячейки в объекте карты
	function changeCell(x, y, type) {
		//displayCell(x, y, type);
		
		var cellNum = x * game.map.height + y;
		game.map.cells[cellNum] = type;
	};
	
	//вызывается в событии onPlayerMoved
	function changePlayerLocation (id, location) {
		for (var i = 0; i < players.length; i++) {
			var p = players[i];
			if (p.userId == id) {
				p.location = location;
				break;
			}			
		}
	};
	
	//вызывается в событии onPlayerLeft
	function removePlayer (id) {
		for (var i = 0; i < players.length; i++) {
			var p = players[i];
			if (p.userId == id) {
				p.location.x = -1;
				players.splice(i, 1);
			}
		}
	};
	
	//вызывается в событии onRolesSwitched
	function switchRoles (teamsData) {
		for (var i = 0; i < teamsData.length; i++) {
			var data = teamsData[i];
			var team = (game.team1Stats.teamId === data.teamId)? game.team1Stats : game.team2Stats;
			team.role = data.role;
		}
		initPlayers(game);
	};
	
	//изменение размеров канваса
	$(window).resize(function () {
		if (canvas) {
			resizeMapBlock(canvas);
		}
	});
	
	//---------------------------------------------------------------------------------
	
	
	
	//Game events----------------------------------------------------------------------
	
	function attachGameEvents(gameInstance) {
		gameInstance.onAny(function (message){ console.log('Game message:', message); });
		gameInstance.onSync(onSync);
		gameInstance.onError(onError);
		gameInstance.onReady(onReady);
		gameInstance.onOpen(onOpen);
		gameInstance.onStarting(onStarting);
		gameInstance.onStarted(onStarted);
		gameInstance.onPaused(onPaused);
		gameInstance.onCanceled(onCanceled);
		gameInstance.onFinished(onFinished);
		gameInstance.onCoinsChanged(onCoinsChanged);
		gameInstance.onLivesChanged(onLivesChanged);
		gameInstance.onCellChanged(onCellChanged);
		gameInstance.onRolesSwitched(onRolesSwitched);
		gameInstance.onPlayerJoined(onPlayerJoined);
		gameInstance.onPlayerLeft(onPlayerLeft);
		gameInstance.onPlayerMoved(onPlayerMoved);
		gameInstance.onPlayerDied(onPlayerDied);
		gameInstance.onPlayerRespawned(onPlayerRespawned);
		gameInstance.onLifeCollected(onLifeCollected);
		gameInstance.onCoinCollected(onCoinCollected);
	};
	
	function onSync(event) {
        refreshGame(event.game);
		log('Игра синхронизирована');
		
		if (game.status === GameApi.GameStatus.inProcess) {
			startSwitchProgress();
			startGameInterval();
			isStarted = true;
		}
    }

    function onError(event) {
		console.log(event);
		var mess = event.message || event.code.description; 
		log(mess);
		stopSwitchProgress();
		stopGameInterval();
    }

    function onReady(event) {
		log('Игра готова к запуску');
    }

    function onOpen(event) {
    }

    function onStarting(event) {//milliseconts
		log('Игра начинается...');
    }

    function onStarted(event) {
		gameInstance.sync();
		startGameInterval();
		log('Игра началась!');
    }

    function onPaused(event) {
		log('Игра приостановлена');
		stopSwitchProgress();
		stopGameInterval();
    }

    function onCanceled(event) {
		stop();
		log('Игра отменена');
		stopSwitchProgress();
		stopGameInterval();
    }

    function onFinished(event) {//event.teamId
		stopGameInterval();
		log('Игра закончена');
		showResult(event.teamId);
		stopSwitchProgress();
		stopGameInterval();
    }

    function onCoinsChanged(event) {//teamId, coins
        refreshTeamData(event.teamId, {coins : event.coins});
    }

    function onLivesChanged(event) {//teamId, lives
        refreshTeamData(event.teamId, {lives : event.lives});
    }

    function onCellChanged(event) {//x, y, type
        changeCell(event.x, event.y, event.type);
    }

    function onRolesSwitched(event) {//(teamId, role)[]
		switchRoles(event);
		log(event.message);
		_gameController.remainingSwitchTime = 0;
    }

    function onPlayerJoined(event) {//teamId, user
        gameInstance.sync();
		log('Игрок ' + event.user.nativeName + ' подключился');
    }

    function onPlayerLeft(event) {//teamId, user
		removePlayer(event.user.id);
		log('Игрок ' + event.user.nativeName + ' отключился');
    }

    function onPlayerMoved(event) {//userId, location
        changePlayerLocation(event.userId, event.location);
    }

    function onPlayerDied(event) {//userId
		log('Произашло съедение!!!');
    }

    function onPlayerRespawned(event) {//userId, location
		changePlayerLocation(event.userId, event.location);
		log('Игрок воскрес в точке (' + event.location.x + ';' + event.location.y + ')');
    }

    function onLifeCollected(event) {//userId, location
    }

    function onCoinCollected(event) {//userId, location
    }
	
	return _gameController;
}