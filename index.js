class Game {
    constructor() {
        this.playerHealth = 100;
        this.enemyHealth = 100;
        this.playerDamage = 50;
        this.playX = null;
        this.playY = null;
        this.enemyCount = 0;
        this.rows = 24;
        this.cols = 40;
        this.keys = {
            'ArrowDown': false,
            'ArrowLeft': false,
            'ArrowRight': false,
            'ArrowUp': false,
            'Shift': false,
            'a': false,
            'd': false,
            's': false,
            'w': false,
            'в': false,
            'ф': false,
            'ц': false,
            'ы': false
        }
        ; // Состояние нажатых клавиш
        this.tilesGrid = []; // Ссылки на DOM-элементы тайлов
        this.moveCooldown = false; // Флаг задержки движения
    }

    init() {
        const map = this.generateMap();
        this.initializeMapDOM(map);

        // Проверка инициализации позиции игрока
        if (this.playX === null || this.playY === null) {
            console.error("Player position not initialized!");
            return;
        }

        // Сохраняем начальные координаты игрока
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === "player") {
                    this.playX = x;
                    this.playY = y;
                }
            });
        });
        let lastKeyPressTime = 0; //флаг для создания интервала между ходом игрока
        // Изменяем обработчик событий клавиш
        // Игровой цикл
        setInterval(() => this.gameLoop(map), 100); // Обновление каждые 100мс

        // Обработчики клавиш
        $(document).keydown(e => this.keys[e.key] = true);
        $(document).keyup(e => this.keys[e.key] = false);
        // Добавляем обработчик пробела
        $(document).keydown(e => {if (e.key === ' ') this.attack(map);});
    }

    // случайное число
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // соседние координаты при атаке
    getAdjacentCells(x, y) {
        return [
            {x: x - 1, y},
            {x: x + 1, y},
            {x, y: y - 1},
            {x, y: y + 1},
        ];
    }

    // Сбрасываем состояние игры
    resetGame() {
        this.playerHealth = 100;
        this.playerDamage = 50;
        this.enemyHealth = 100;
        this.playX = 0;
        this.playY = 0;
        location.reload();
    }

    //добавление объектов на карту
    generateObjects(map, numObjects, objectType) {
        for (let i = 0; i < numObjects; i++) {
            let objectX, objectY;
            let attempts = 0;
            do {
                objectX = this.getRandomInt(0, this.cols - 1);
                objectY = this.getRandomInt(0, this.rows - 1);
                attempts++;
            } while (map[objectY][objectX] !== "tile" && attempts < 1000);

            if (attempts < 1000) {
                map[objectY][objectX] = objectType;
                if (objectType === 'player') {
                    this.playX = objectX;
                    this.playY = objectY;
                }
            }
        }
    }

    gameLoop(map) {
        if (this.moveCooldown) return;
        this.moveCooldown = true;

        // Обработка движения
        const direction = this.getMovementDirection();
        if (direction) {
            this.movePlayer(map, direction.deltaY, direction.deltaX);
        }

        setTimeout(() => {
            this.moveCooldown = false;
        }, 100); // Интервал между движениями
    }

    getMovementDirection() {
        if (this.keys['ц'] || this.keys['w'] || this.keys['ArrowUp']) return {deltaY: -1, deltaX: 0};
        if (this.keys['ы'] || this.keys['s'] || this.keys['ArrowDown']) return {deltaY: 1, deltaX: 0};
        if (this.keys['ф'] || this.keys['a'] || this.keys['ArrowLeft']) return {deltaY: 0, deltaX: -1};
        if (this.keys['в'] || this.keys['d'] || this.keys['ArrowRight']) return {deltaY: 0, deltaX: 1};
        return null;
    }

    initializeMapDOM(map) {
        const field = $(".field");
        field.empty();
        this.tilesGrid = [];

        map.forEach((row, y) => {
            const tileRow = [];
            row.forEach((cell, x) => {
                const tile = $("<div></div>");
                tile.addClass("tile");
                this.updateTileAppearance(tile, cell);
                tile.css({
                    width: "20px",
                    height: "20px",
                    top: y * 20 + "px",
                    left: x * 20 + "px"
                });
                tile.appendTo(field);
                tile.data("cell-type", cell);
                tileRow.push(tile);
            });
            this.tilesGrid.push(tileRow);
        });
    }

    updateTileAppearance(tile, cellType) {
        tile.removeClass("tileW tileE tileP tileHP tileSW");
        switch (cellType) {
            case 'enemy':
                tile.addClass("tileE");
                if (!tile.find('.health').length) {
                    tile.append($('<div class="health">'));
                }
                break;
            case 'wall':
                tile.addClass("tileW");
                break;
            case 'player':
                tile.addClass("tileP");
                break;
            case 'potion':
                tile.addClass("tileHP");
                break;
            case 'sword':
                tile.addClass("tileSW");
                break;
        }
    }

    movePlayer(map, deltaY, deltaX) {
        const newX = this.playX + deltaX;
        const newY = this.playY + deltaY;

        if (this.canMoveTo(map, newX, newY)) {
            // Удаляем игрока со старой позиции
            map[this.playY][this.playX] = 'tile';
            this.updateTile('tile', this.playX, this.playY);

            // Обрабатываем предметы
            const newTile = map[newY][newX];
            if (newTile === 'potion') {
                this.playerHealth = Math.min(100, this.playerHealth + 30);
            }
            if (newTile === 'sword') {
                this.playerDamage += 25;
            }

            // Обновляем позицию игрока
            this.playX = newX;
            this.playY = newY;
            map[this.playY][this.playX] = 'player';
            this.updateTile('player', this.playX, this.playY);

            // Обновляем врагов
            this.moveEnemies(map);
        }
    }

    updateTile(cellType, x, y) {
        const tile = this.tilesGrid[y][x];
        tile.data("cell-type", cellType);
        this.updateTileAppearance(tile, cellType);

        // Обновление здоровья
        const health = cellType === 'enemy' ? this.enemyHealth :
            cellType === 'player' ? Math.max(0, this.playerHealth) : null;

        if (health !== null) {
            let healthBar = tile.find('.health');
            if (!healthBar.length) healthBar = $('<div class="health">').appendTo(tile);
            healthBar.css('width', health + '%');
        } else {
            tile.find('.health').remove();
        }
    }

    // Определение метода для генерации карты
    generateMap() {
        const map = [];
        for (let i = 0; i < this.rows; i++) {
            const row = [];
            for (let j = 0; j < this.cols; j++) {
                row.push("wall");
            }
            map.push(row);
        }
        const corridors = [];
        // Генерация коридоров по вертикали
        const numHallV = this.getRandomInt(3, 5);
        for (let i = 0; i < numHallV; i++) {
            let hallLineX, hallLineY, hallWidth, hallHeight;
            let validCorridor = false;
            do {
                hallLineX = this.getRandomInt(1, this.cols - 1);
                hallLineY = 0;
                hallWidth = 1;
                hallHeight = this.rows;
                validCorridor = corridors.every(
                    (corridor) => Math.abs(hallLineX - corridor.x) >= 2
                );
            } while (
                !validCorridor ||
                map
                    .slice(hallLineY - 1, hallLineY + hallHeight + 1)
                    .some((row) =>
                        row.slice(hallLineX - 1, hallLineX + hallWidth + 1).includes("tile")
                    )
                );
            this.createRoomOrCorridor(
                map,
                hallLineX,
                hallLineY,
                hallWidth,
                hallHeight
            );
            corridors.push({
                x: hallLineX,
                y: hallLineY,
                width: hallWidth,
                height: hallHeight,
            });
        }
        // Генерация коридоров по горизонтали
        const numHallH = this.getRandomInt(3, 5);
        for (let i = 0; i < numHallH; i++) {
            let hallLineX, hallLineY, hallWidth, hallHeight;
            let validCorridor = false;
            do {
                hallLineX = 0;
                hallLineY = this.getRandomInt(1, this.rows - 1);
                hallWidth = this.cols;
                hallHeight = 1;
                validCorridor = corridors.every(
                    (corridor) => Math.abs(hallLineY - corridor.y) >= 2
                );
            } while (
                !validCorridor ||
                map
                    .slice(hallLineY - 1, hallLineY + hallHeight + 1)
                    .some((row) =>
                        row.slice(hallLineX - 1, hallLineX + hallWidth + 1).includes("tile")
                    )
                );
            this.createRoomOrCorridor(
                map,
                hallLineX,
                hallLineY,
                hallWidth,
                hallHeight
            );
            corridors.push({
                x: hallLineX,
                y: hallLineY,
                width: hallWidth,
                height: hallHeight,
            });
        }
        // Генерация комнат
        const numRooms = 10;
        const existingRooms = [];
        for (let i = 0; i < numRooms; i++) {
            let roomX, roomY, roomWidth, roomHeight;
            let connected = false;
            const corridor = corridors[this.getRandomInt(0, corridors.length - 1)];
            // Генерируем координаты комнаты в пределах коридора с учетом размеров самой комнаты
            roomX = this.getRandomInt(corridor.x, corridor.x + corridor.width);
            roomY = this.getRandomInt(corridor.y, corridor.y + corridor.height);
            roomWidth = this.getRandomInt(3, 8);
            roomHeight = this.getRandomInt(3, 8);
            if (
                roomX >= 0 &&
                roomY >= 0 &&
                roomX + roomWidth - 3 < this.cols &&
                roomY + roomHeight - 3 < this.rows
            ) {
                let intersects = false;
                for (const existingRoom of existingRooms) {
                    if (
                        !(
                            roomX + roomWidth < existingRoom.x ||
                            roomX > existingRoom.x + existingRoom.width ||
                            roomY + roomHeight < existingRoom.y ||
                            roomY > existingRoom.y + existingRoom.height
                        )
                    ) {
                        intersects = true;
                        break;
                    }
                }
                if (!intersects) {
                    connected = true;
                }
            }
            // Если комната подходит, добавляем ее в массив существующих комнат
            if (connected) {
                existingRooms.push({
                    x: roomX,
                    y: roomY,
                    width: roomWidth,
                    height: roomHeight,
                });
                this.createRoomOrCorridor(map, roomX, roomY, roomWidth, roomHeight);
            }
        }

        //добавление специальных клеток на карту
        const numSwords = 2;
        const numPotions = 10;
        const numEnemies = 10;
        this.generateObjects(map, numSwords, "sword");
        this.generateObjects(map, numPotions, "potion");
        this.generateObjects(map, numEnemies, "enemy");
        this.generateObjects(map, 1, "player");

        return map;
    }


    // Определение метода для создания комнаты или коридора
    createRoomOrCorridor(map, startX, startY, width, height) {
        for (let x = startX; x < startX + width; x++) {
            for (let y = startY; y < startY + height; y++) {
                if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
                    // Добавляем проверку, чтобы не перезаписывать клетку с зельем
                    map[y][x] = "tile"; // Обозначаем проходимую область
                }
            }
        }
    }

    //перемещение врага
    moveEnemies(map) {
        const directions = [
            {deltaY: -1, deltaX: 0},
            {deltaY: 1, deltaX: 0},
            {deltaY: 0, deltaX: -1},
            {deltaY: 0, deltaX: 1},
        ];

        // Временный массив для изменений
        const changes = [];

        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === "enemy") {
                    // Проверка атаки
                    const adjacent = this.getAdjacentCells(x, y);
                    let shouldAttack = false;

                    adjacent.forEach(({x: px, y: py}) => {
                        if (py >= 0 && py < map.length &&
                            px >= 0 && px < map[0].length &&
                            map[py][px] === "player") {
                            this.attackPlayer(map);
                            shouldAttack = true;
                        }
                    });

                    // Если не атаковали — двигаемся
                    if (!shouldAttack) {
                        const dir = directions[Math.floor(Math.random() * 4)];
                        const newX = x + dir.deltaX;
                        const newY = y + dir.deltaY;

                        if (this.canMoveTo(map, newX, newY)) {
                            changes.push({x, y, type: 'tile'});
                            changes.push({x: newX, y: newY, type: 'enemy'});
                        }
                    }
                }
            });
        });

        // Применяем все изменения
        changes.forEach(change => {
            map[change.y][change.x] = change.type;
            this.updateTile(change.type, change.x, change.y);
        });
    }

    //атака противника
    attackPlayer(map) {
        this.playerHealth -= 20; // Уменьшаем здоровье
        this.updateTile('player', this.playX, this.playY); // Обновляем отображение

        if (this.playerHealth <= 0) {
            alert("Game Over!");
            this.resetGame();
        }
    }

    //атака игрока
    attack(map) {
        const adjacent = this.getAdjacentCells(this.playX, this.playY);
        let attacked = false;

        adjacent.forEach(({x, y}) => {
            // Проверяем границы карты
            if (y < 0 || y >= this.rows || x < 0 || x >= this.cols) return;

            if (this.tilesGrid[y][x].hasClass('tileE')) {
                // Создаём отдельное здоровье для каждого врага
                let enemy = this.tilesGrid[y][x].data('enemy');
                if (!enemy) {
                    enemy = {health: 100};
                    this.tilesGrid[y][x].data('enemy', enemy);
                }

                enemy.health -= this.playerDamage;
                attacked = true;

                // Обновляем отображение здоровья
                const healthBar = this.tilesGrid[y][x].find('.health');
                if (healthBar.length) {
                    healthBar.css('width', `${enemy.health}%`);
                }

                if (enemy.health <= 0) {
                    map[y][x] = "tile"
                    this.enemyCount++
                    this.tilesGrid[y][x].removeClass('tileE').addClass('tile');
                    this.tilesGrid[y][x].find('.health').remove();
                    this.tilesGrid[y][x].data('enemy', null);
                }
            }
        });

        if (attacked) {
            // Проверка победы после каждой успешной атаки
            if (this.enemyCount >= 10) {
                alert("Победа! Вы уничтожили всех врагов!");
                this.resetGame();
            }
        }
    }

    canMoveTo(map, x, y) {
        // Проверяем границы карты
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;

        // Проверяем тип клетки
        const tile = map[y][x];
        return tile !== 'wall' && tile !== 'enemy';
    }
}

$(document).ready(function () {
    var game = new Game();
    game.init();
});
