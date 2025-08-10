class Game {
    constructor() {
        this.playerHealth = 100;     // Здоровье игрока
        this.playerDamage = 50;      // Базовый урон игрока
        this.playX = null;           // X-координата игрока
        this.playY = null;           // Y-координата игрока
        this.enemyCount = 0;         // Счетчик побежденных врагов
        this.rows = 24;              // Высота игрового поля
        this.cols = 40;              // Ширина игрового поля
        this.keys = {
            'ArrowDown': false, 'ArrowLeft': false,
            'ArrowRight': false, 'ArrowUp': false,
            'Shift': false,
            'a': false, 'd': false, 's': false, 'w': false,
            'в': false, 'ф': false, 'ц': false, 'ы': false
        }
        ; // Состояние нажатых клавиш
        this.tilesGrid = []; // Ссылки на DOM-элементы тайлов
        this.moveCooldown = false; // Флаг задержки движения
    }

    init() {
        const map = this.generateBaseMap();
        this.initializeMapDOM(map);

        //добавление специальных клеток на карту
        const numSwords = 2;
        const numPotions = 10;
        const numEnemies = 10;
        this.generateObjects(map, numSwords, "sword");
        this.generateObjects(map, numPotions, "potion");
        this.generateObjects(map, numEnemies, "enemy");
        this.generateObjects(map, 1, "player");

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
        // Запуск игрового цикла
        setInterval(() => this.gameLoop(map), 100);

        // Обработчики клавиш
        $(document).keydown(e => this.keys[e.key] = true);
        $(document).keyup(e => this.keys[e.key] = false);
        // Добавляем обработчик пробела
        $(document).keydown(e => {
            if (e.key === ' ') this.attack(map);
        });
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
        this.playX = 0;
        this.playY = 0;
        location.reload();
    }

    // Определение метода для генерации карты
    generateBaseMap() {
        // 1. Создаем карту из стен
        const map = Array(this.rows).fill().map(() => Array(this.cols).fill("wall"));
        // 2. Генерируем коридоры
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
        return map;
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

                // Обновляем тайл после размещения объекта
                this.updateTile(objectType, objectX, objectY);
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

        if (this.canMoveTo(map, newX, newY, false)) {
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

        // Определение здоровья
        let health = null;
        if (cellType === 'enemy') {
            const enemyData = tile.data('enemy') || {health: 100};
            health = enemyData.health;
        } else if (cellType === 'player') {
            health = Math.max(0, this.playerHealth);
        }

        // Обновление healthbar
        if (health !== null) {
            let healthBar = tile.find('.health');
            if (!healthBar.length) {
                healthBar = $('<div class="health">').appendTo(tile);
            }
            healthBar.css('width', health + '%');
        } else {
            tile.find('.health').remove();
        }
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

        // Создаем копию карты для отслеживания будущих позиций
        const futureMap = JSON.parse(JSON.stringify(map));
        const movedEnemies = new Set();

        // Список всех врагов и их новых позиций
        const plannedMoves = [];

        // Планируем перемещения
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === "enemy" && !movedEnemies.has(`${x},${y}`)) {
                    // Проверка атаки
                    const adjacent = this.getAdjacentCells(x, y);
                    let shouldAttack = false;

                    adjacent.forEach(({x: px, y: py}) => {
                        if (py >= 0 && py < map.length &&
                            px >= 0 && px < map[0].length &&
                            map[py][px] === "player") {
                            this.attackPlayer();
                            shouldAttack = true;
                        }
                    });

                    // Если не атаковали — планируем движение
                    if (!shouldAttack) {
                        // Собираем только валидные направления
                        const validDirections = [];

                        for (const dir of directions) {
                            const newX = x + dir.deltaX;
                            const newY = y + dir.deltaY;

                            // Проверяем возможность движения с учетом будущей карты
                            if (this.canMoveTo(futureMap, newX, newY, true)) {
                                validDirections.push(dir);
                            }
                        }

                        // Если есть валидные направления - выбираем случайное
                        if (validDirections.length > 0) {
                            const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
                            const newX = x + dir.deltaX;
                            const newY = y + dir.deltaY;

                            // Сохраняем запланированное перемещение
                            plannedMoves.push({
                                from: {x, y},
                                to: {x: newX, y: newY},
                                enemyData: this.tilesGrid[y][x].data('enemy') || {health: 100}
                            });

                            // Помечаем будущую позицию как занятую
                            futureMap[newY][newX] = 'enemy';
                            movedEnemies.add(`${x},${y}`);
                        }
                    }
                }
            });
        });

        // Применяем запланированные перемещения
        plannedMoves.forEach(move => {
            const {from, to, enemyData} = move;

            // Освобождаем старую позицию
            map[from.y][from.x] = 'tile';
            this.updateTile('tile', from.x, from.y);

            // Занимаем новую позицию
            map[to.y][to.x] = 'enemy';
            this.tilesGrid[to.y][to.x].data('enemy', enemyData);
            this.updateTile('enemy', to.x, to.y);
        });
    }

    //атака противника
    attackPlayer() {
        this.playerHealth -= 20; // Уменьшаем здоровье
        this.updateTile('player', this.playX, this.playY); // Обновляем отображение

        if (this.playerHealth <= 0) {
            alert("Game Over!");
            this.resetGame();
            return;
        }
    }

    //атака игрока
    attack(map) {
        const adjacent = this.getAdjacentCells(this.playX, this.playY);
        let attacked = false;

        adjacent.forEach(({x, y}) => {
            if (y < 0 || y >= this.rows || x < 0 || x >= this.cols) return;

            if (map[y][x] === "enemy") {
                const tile = this.tilesGrid[y][x];
                let enemy = tile.data('enemy') || {health: 100};

                enemy.health -= this.playerDamage;
                tile.data('enemy', enemy);
                attacked = true;

                // Обновляем отображение здоровья
                this.updateTile('enemy', x, y);

                if (enemy.health <= 0) {
                    map[y][x] = "tile";
                    this.enemyCount++;
                    tile.data('enemy', null);
                    this.updateTile('tile', x, y);
                }
            }
        });

        if (attacked && this.enemyCount >= 10) {
            alert("Победа! Вы уничтожили всех врагов!");
            this.resetGame();
        }
    }

    canMoveTo(map, x, y, forEnemy = false) {
        // Проверяем границы карты
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;

        // Проверяем тип клетки
        const tile = map[y][x];

        // Если клетка - стена, движение невозможно
        if (tile === 'wall') return false;

        // Если проверка для врага - дополнительно проверяем врагов
        if (forEnemy) {
            return tile !== 'enemy'; // Враг не может встать на клетку с другим врагом
        }

        // Для игрока - не может встать на клетку с врагом
        return tile !== 'enemy';
    }
}

$(document).ready(function () {
    const game = new Game();
    game.init();
});
