// Wait for the DOM to be fully loaded
$(document).ready(function () {

    const CONFIG = {
        MAP_WIDTH: 40, // cells
        MAP_HEIGHT: 24, // cells
        TILE_SIZE: 50, // px

        MIN_ROOMS: 5, // amount
        MAX_ROOMS: 10, // amount
        MIN_ROOM_SIZE: 3, // cells
        MAX_ROOM_SIZE: 8, // cells

        MIN_CORRIDORS: 3, // amount
        MAX_CORRIDORS: 5, // amount

        NUM_SWORDS: 2, // amount
        NUM_POTIONS: 10, // amount
        // NUM_ENEMIES: 10, // amount
        NUM_ENEMIES: 2, // amount

        HERO_MAX_HP: 100, // points
        HERO_SWORDS: 1, // points

        POTION_HEAL: 30, // points
        POTION_MAX_HP: 100, // points
        ENEMY_MAX_XP: 20, // points
        ENEMY_ATK: 5, // points
    };

    /**
     * Represents the player's character.
     * @constructor
     * @param {number} x - The initial x-coordinate.
     * @param {number} y - The initial y-coordinate.
     * @param {number} hp - The current health points.
     * @param {number} maxHp - The maximum health points.
     * @param {number} [swordNumber=1] - The attack power.
     */
    function Hero(x, y, hp, maxHp, swordNumber) {
        this.x = x;
        this.y = y;
        this.hp = typeof hp === "undefined" ? CONFIG.HERO_MAX_HP : hp;
        // this.hp = hp;
        this.maxHp = typeof maxHp === "undefined" ? CONFIG.HERO_MAX_HP : maxHp;
        // this.maxHp = maxHp;
        this.swordNumber = typeof swordNumber === "undefined" ? CONFIG.HERO_SWORDS : swordNumber;
        // this.swordNumber = swordNumber;
    }

    /**
     * Moves the hero on the map.
     * @param {number} dx - The change in the x-coordinate.
     * @param {number} dy - The change in the y-coordinate.
     * @param {Game} game - The game instance.
     */
    Hero.prototype.move = function (dx, dy, game) {
        var nx = this.x + dx, ny = this.y + dy;
        if (nx < 0 || ny < 0 || nx >= game.fieldWidht || ny >= game.fieldHight) return;
        var cell = game.map[ny][nx];
        if (cell === "wall") return;
        for (var i = 0; i < game.enemies.length; i++) {
            if (game.enemies[i].x === nx && game.enemies[i].y === ny) return;
        }
        if (cell === "potion") {
            this.hp = Math.min(this.hp + CONFIG.POTION_HEAL, this.maxHp);
            game.map[ny][nx] = "floor";
        } else if (cell === "sword") {
            this.swordNumber++;
            game.map[ny][nx] = "floor";
        }
        this.x = nx;
        this.y = ny;
        game.enemyTurn();
    };

    /**
     * Makes the hero attack adjacent enemies.
     * @param {Game} game - The game instance.
     */
    Hero.prototype.attack = function (game) {
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        var attacked = false;
        for (var d = 0; d < dirs.length; d++) {
            var dx = dirs[d][0], dy = dirs[d][1];
            var nx = this.x + dx, ny = this.y + dy;
            for (var i = game.enemies.length - 1; i >= 0; i--) {
                if (game.enemies[i].x === nx && game.enemies[i].y === ny) {
                    attacked = true;
                    game.enemies[i].hp -= this.swordNumber;
                    if (game.enemies[i].hp <= 0) {
                        game.enemies.splice(i, 1);
                    }
                }
            }
        }
        if (attacked) {
            // Check for win condition after attacking
            if (game.enemies.length === 0) {
                game.draw();
                showEndScreen("You win!");
                return; // Stop the turn
            }
            game.enemyTurn();
        }
    };

    /**
     * Represents an enemy character.
     * @constructor
     * @param {number} x - The initial x-coordinate.
     * @param {number} y - The initial y-coordinate.
     * @param {number} [hp=20] - The current health points.
     * @param {number} [maxHp=20] - The maximum health points.
     */
    function Enemy(x, y, hp, maxHp) {
        this.x = x;
        this.y = y;
        this.hp = typeof hp === "undefined" ? CONFIG.ENEMY_MAX_XP : hp;
        this.maxHp = typeof maxHp === "undefined" ? CONFIG.ENEMY_MAX_XP : maxHp;
    }

    /**
     * Manages the game state, map, and entities.
     * @constructor
     * @param {number} [fieldWidht=40] - The width of the game map.
     * @param {number} [fieldHight=24] - The height of the game map.
     */
    function Game(fieldWidht, fieldHight) {
        // Map width
        this.fieldWidht = typeof fieldWidht === "undefined" ? CONFIG.MAP_WIDTH : fieldWidht;
        // this.fieldWidht = fieldWidht;
        // Map height
        this.fieldHight = typeof fieldHight === "undefined" ? CONFIG.MAP_HEIGHT : fieldHight;
        // this.fieldHight = fieldHight;
        // Game map as a 2D array
        this.map = [];
        // Hero instance
        this.hero = null;
        // Enemies as a 2D array
        this.enemies = [];
    }

    /**
     * Initializes the map by filling it with "wall" tiles.
     */
    Game.prototype.createMap = function () {
        for (var y = 0; y < this.fieldHight; y++) {
            this.map[y] = [];
            for (var x = 0; x < this.fieldWidht; x++) {
                this.map[y][x] = "wall";
            }
        }
    };

    /**
     * Carves a rectangular room into the map.
     * @param {number} xStart - The starting x-coordinate of the room.
     * @param {number} yStart - The starting y-coordinate of the room.
     * @param {number} roomWidth - The width of the room.
     * @param {number} roomHeight - The height of the room.
     */
    Game.prototype.carveRoom = function (xStart, yStart, roomWidth, roomHeight) {
        for (var y = yStart; y < yStart + roomHeight; y++) {
            for (var x = xStart; x < xStart + roomWidth; x++) {
                if (x > 0 && y > 0 && x < this.fieldWidht - 1 && y < this.fieldHight - 1) {
                    // Ensure the room is within the map boundaries (with a 1-tile border)
                    this.map[y][x] = "floor";
                }
            }
        }
    };

    /**
     * Utility function to get a random integer within a specified range.
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (inclusive).
     * @returns {number} A random integer.
     */
    Game.prototype.getRandomInRange = function (min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    /**
     * Generates and carves a random number of rooms onto the map.
     */
    Game.prototype.makeRooms = function () {
        var rooms = this.getRandomInRange(CONFIG.MIN_ROOMS, CONFIG.MAX_ROOMS);
        for (var i = 0; i < rooms; i++) {
            var roomWidth = this.getRandomInRange(CONFIG.MIN_ROOM_SIZE, CONFIG.MAX_ROOM_SIZE);
            var roomHeight = this.getRandomInRange(CONFIG.MIN_ROOM_SIZE, CONFIG.MAX_ROOM_SIZE);
            var x = this.getRandomInRange(1, this.fieldWidht - roomWidth - 2); // TODO how to call the constants 1 and 2 here?
            var y = this.getRandomInRange(1, this.fieldHight - roomHeight - 2); // TODO how to call the constants 1 and 2 here?
            this.carveRoom(x, y, roomWidth, roomHeight);
        }
    };

    /**
     * Creates horizontal and vertical corridors to connect rooms.
     * This is a simple method that may result in a very open map.
     */
    Game.prototype.makeCorridors = function () {
        // Generate random horizontal corridors
        var hCorridors = this.getRandomInRange(3, 5);
        for (var i = 0; i < hCorridors; i++) {
            var y = this.getRandomInRange(1, this.fieldHight - 2);
            for (var x = 0; x < this.fieldWidht; x++) this.map[y][x] = "floor";
        }
        // Generate random vertical corridors
        var vCorridors = this.getRandomInRange(3, 5);
        for (var i = 0; i < vCorridors; i++) {
            var x = this.getRandomInRange(1, this.fieldWidht - 2);
            for (var y = 0; y < this.fieldHight; y++) this.map[y][x] = "floor";
        }
    };

    /**
     * Places a specified number of items of a certain type on random "floor" tiles.
     * @param {string} type - The type of item to place (e.g., "potion", "sword").
     * @param {number} count - The number of items to place.
     */
    Game.prototype.placeItems = function (type, count) {

        while (count > 0) {
            var x = this.getRandomInRange(0, this.fieldWidht - 1);
            var y = this.getRandomInRange(0, this.fieldHight - 1);
            if (this.map[y][x] === "floor") {
                this.map[y][x] = type;
                count--;
            }
        }

        // for (var i = 0; i < count; i++) {
        //     while (true) { // TODO comment it out? When it is commented out, the only 1 sword and 1 potion are placed.
        //         var x = this.getRandomInRange(0, this.W - 1);
        //         var y = this.getRandomInRange(0, this.H - 1);
        //         if (this.map[y][x] === "floor") {
        //             this.map[y][x] = type;
        //             break;
        //         }
        //     } // TODO comment it out?
        // }
    };

    /**
     * Places the hero on a random "floor" tile.
     */
    Game.prototype.placeHero = function () {
        while (true) {
            var x = this.getRandomInRange(0, this.fieldWidht - 1);
            var y = this.getRandomInRange(0, this.fieldHight - 1);
            if (this.map[y][x] === "floor") {
                this.hero = new Hero(x, y, CONFIG.HERO_MAX_HP, CONFIG.HERO_MAX_HP, CONFIG.HERO_SWORDS);
                break;
            }
        }
    };

    /**
     * Ensures all floor/item tiles are reachable from the hero's starting position.
     * It uses a Breadth-First Search (BFS) algorithm to find reachable tiles.
     * Any floor/item tile that is not reachable is converted back into a "wall".
     */
    Game.prototype.ensureReachable = function () {
        var visited = [];
        for (var y = 0; y < this.fieldHight; y++) {
            visited[y] = [];
            for (var x = 0; x < this.fieldWidht; x++) visited[y][x] = false;
        }
        // Start BFS from hero's position
        var queue = [[this.hero.x, this.hero.y]];
        visited[this.hero.y][this.hero.x] = true;
        while (queue.length) {
            var pos = queue.shift();
            // 4-directional movement
            var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (var d = 0; d < dirs.length; d++) {
                var nx = pos[0] + dirs[d][0], ny = pos[1] + dirs[d][1];
                // Check boundaries and if the tile has been visited
                if (nx >= 0 && ny >= 0 && nx < this.fieldWidht && ny < this.fieldHight &&
                    !visited[ny][nx] && (this.map[ny][nx] === "floor" || this.map[ny][nx] === "potion" || this.map[ny][nx] === "sword")) {
                    visited[ny][nx] = true;
                    queue.push([nx, ny]);
                }
            }
        }
        // Convert unreachable floor/item tiles to walls
        for (var y = 0; y < this.fieldHight; y++) {
            for (var x = 0; x < this.fieldWidht; x++) {
                if ((this.map[y][x] === "floor" || this.map[y][x] === "potion" || this.map[y][x] === "sword") && !visited[y][x]) {
                    this.map[y][x] = "wall";
                }
            }
        }
    };

    /**
     * Places a specified number of enemies on random "floor" tiles.
     * @param {number} n - The number of enemies to place.
     */
    Game.prototype.placeEnemies = function (n) {
        for (var i = 0; i < n; i++) {
            while (true) {
                var x = this.getRandomInRange(0, this.fieldWidht - 1);
                var y = this.getRandomInRange(0, this.fieldHight - 1);
                if (this.map[y] && this.map[y][x] === "floor") {
                    this.enemies.push(new Enemy(x, y));
                    break;
                }
            }
        }
    };

    // Game.prototype.updateTiles = function() {
    //     var html = "";
    //     for (var y = 0; y < this.H; y++) {
    //         for (var x = 0; x < this.W; x++) {
    //             var cls = this.map[y][x];
    //             if (this.hero.x === x && this.hero.y === y) cls = "hero";
    //             for (var i = 0; i < this.enemies.length; i++) {
    //                 if (this.enemies[i].x === x && this.enemies[i].y === y) cls = "enemy";
    //             }
    //             html += '<div class="tile ' + cls + '"></div>';
    //         }
    //     }
    //     this.field.innerHTML = html; // Single DOM update
    // };

    // Game.prototype.draw = function() {
    //     // this.updateTiles();
    //     var html = "";
    //     for (var y = 0; y < this.H; y++) {
    //         for (var x = 0; x < this.W; x++) {
    //             var cls = this.map[y][x];
    //             var healthBar = "";
    //             var style = "left: " + (x * 50) + "px; top: " + (y * 50) + "px;";
    //             if (this.hero.x === x && this.hero.y === y) {
    //                 cls = "hero";
    //                 var heroHealthPercent = (this.hero.hp / this.hero.maxHp) * 100;
    //                 healthBar = '<div class="health-hero" style="width: ' + heroHealthPercent + '%;"></div>';
    //             } else {
    //                 for (var i = 0; i < this.enemies.length; i++) {
    //                     var enemy = this.enemies[i];
    //                     if (enemy.x === x && enemy.y === y) {
    //                         cls = "enemy";
    //                         var enemyHealthPercent = (enemy.hp / enemy.maxHp) * 100;
    //                         healthBar = '<div class="health-enemy" style="width: ' + enemyHealthPercent + '%;"></div>';
    //                         break;
    //                     }
    //                 }
    //             }
    //             html += '<div class="tile ' + cls + '" style="' + style + '">' + healthBar + '</div>';
    //         }
    //     }
    //     $(".field").html(html);
    //     $("#health").text("❤️ " + this.hero.hp);
    //     $("#attack").text("⚔️ " + this.hero.atk);
    // };


    /**
     * Renders the entire game field, including the map, hero, enemies, and health bars.
     * This version uses a DocumentFragment for improved performance by reducing DOM manipulations.
     */
    Game.prototype.draw = function () {
        const fragment = document.createDocumentFragment();
        const field = document.querySelector(".field");
        field.innerHTML = ""; // Clear the field

        // Iterate over the map to create and style each tile
        for (let y = 0; y < this.fieldHight; y++) {
            for (let x = 0; x < this.fieldWidht; x++) {
                const tile = document.createElement("div");
                tile.classList.add("tile");
                tile.style.left = `${x * CONFIG.TILE_SIZE}px`;
                tile.style.top = `${y * CONFIG.TILE_SIZE}px`;

                let cls = this.map[y][x];
                let healthBar = null;

                // Check if the hero is at this position
                if (this.hero.x === x && this.hero.y === y) {
                    cls = "hero";
                    const heroHealthPercent = (this.hero.hp / this.hero.maxHp) * 100;
                    healthBar = document.createElement("div");
                    healthBar.classList.add("health-hero");
                    healthBar.style.width = `${heroHealthPercent}%`;
                } else {
                    // Check if an enemy is at this position
                    for (const enemy of this.enemies) {
                        if (enemy.x === x && enemy.y === y) {
                            cls = "enemy";
                            const enemyHealthPercent = (enemy.hp / enemy.maxHp) * 100;
                            healthBar = document.createElement("div");
                            healthBar.classList.add("health-enemy");
                            healthBar.style.width = `${enemyHealthPercent}%`;
                            // Found an enemy, no need to check for others on the same tile
                            break;
                        }
                    }
                }

                tile.classList.add(cls);
                if (healthBar) {
                    tile.appendChild(healthBar);
                }
                fragment.appendChild(tile);
            }
        }

        // Append the fragment to the DOM in a single operation
        field.appendChild(fragment);

        // Update UI elements for health and attack stats
        document.querySelector("#health").textContent = `❤️ ${this.hero.hp}`;
        document.querySelector("#attack").textContent = `⚔️ ${this.hero.swordNumber}`;
    };

    /**
     * Executes the turn for all enemies.
     * Enemies will attack the hero if adjacent, otherwise they move randomly.
     */
    Game.prototype.enemyTurn = function () {
        // 4-directional movement
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            var isAdjacentToHero = false;
            for (var d = 0; d < dirs.length; d++) {
                // Check if the hero is in an adjacent tile
                if (e.x + dirs[d][0] === this.hero.x && e.y + dirs[d][1] === this.hero.y) {
                    isAdjacentToHero = true;
                    break;
                }
            }
            if (isAdjacentToHero) {
                this.hero.hp -= CONFIG.ENEMY_ATK;
                // Check for game over
                if (this.hero.hp <= 0) {
                    this.draw();
                    showEndScreen("Game over!");
                    // Stop processing further enemy turns
                    return;
                }
            } else {
                // Move randomly if not adjacent to the hero
                var r = dirs[Math.floor(Math.random() * 4)];
                var nx = e.x + r[0];
                var ny = e.y + r[1];
                // Check if the new position is valid (within bounds and not a wall)
                if (nx >= 0 && ny >= 0 && nx < this.fieldWidht && ny < this.fieldHight && this.map[ny][nx] !== "wall") {
                    var blocked = false;
                    // Check if another enemy blocks the new position
                    for (var j = 0; j < this.enemies.length; j++) {
                        if (this.enemies[j].x === nx && this.enemies[j].y === ny) {
                            blocked = true;
                            break;
                        }
                    }
                    // Check if the hero blocks the new position
                    if (this.hero.x === nx && this.hero.y === ny) {
                        blocked = true;
                    }
                    if (!blocked) {
                        e.x = nx;
                        e.y = ny;
                    }
                }
            }
        }
        // Redraw the game state after all enemies have moved/attacked
        this.draw();
    };

    // --- Player Controls ---
    // Listens for keydown events to control the hero.
    $(document).keydown(function (e) {
        // Do nothing if the hero is dead
        if (game.hero.hp <= 0) return;

        // Handle movement and attack keys
        if (e.key === "w") game.hero.move(0, -1, game);
        else if (e.key === "s") game.hero.move(0, 1, game);
        else if (e.key === "a") game.hero.move(-1, 0, game);
        else if (e.key === "d") game.hero.move(1, 0, game);
        else if (e.key === " ") game.hero.attack(game);
        // Ignore other keys
        else return;

        // Redraw the game after the player's action. This is important for actions
        // that don't trigger an enemy turn (like moving into a wall).
        game.draw();
    });

    /**
     * Shows the final screen (win/lose) and stops the game.
     * @param {string} message - The message to display.
     */
    function showEndScreen(message) {
        $(document).off('keydown'); // Disable player controls
        $('#game-over-message').text(message);
        $('#game-over-screen').fadeIn(400);
    }

    $('#restart-button').click(function () {
        location.reload();
    });

    function setupGame(Game) {
        // --- Game Initialization ---
        // Creates a new game instance and sets up the level.
        var game = new Game(CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT);
        // Fill the map with walls
        game.createMap();
        // Carve out rooms
        game.makeRooms();
        // Carve out corridors
        game.makeCorridors();
        // Place swords on the map
        game.placeItems("sword", CONFIG.NUM_SWORDS);
        // Place potions on the map
        game.placeItems("potion", CONFIG.NUM_POTIONS);
        // Place the hero on the map
        game.placeHero();
        // Ensure all floor/item tiles are reachable from the hero's starting position
        game.ensureReachable();
        // Place enemies on the map
        game.placeEnemies(CONFIG.NUM_ENEMIES);
        // Draw the initial game state
        game.draw();
        // Start the game loop
        // game.start();
        return game;
    }


    var game = setupGame(Game);  // TODO move it to the index.html
});
