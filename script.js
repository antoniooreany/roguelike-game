// Wait for the DOM to be fully loaded
$(document).ready(function() {
    class Hero {
        constructor(x, y, hp = 100, maxHp = 100, atk = 1) {
            this.x = x;
            this.y = y;
            this.hp = hp;
            this.maxHp = maxHp;
            this.atk = atk;
        }

        move(dx, dy, game) {
            const nx = this.x + dx, ny = this.y + dy;
            if (nx < 0 || ny < 0 || nx >= game.W || ny >= game.H) return;
            const cell = game.map[ny][nx];
            if (cell === "wall") return;
            for (let enemy of game.enemies) {
                if (enemy.x === nx && enemy.y === ny) return;
            }
            if (cell === "potion") {
                this.hp = Math.min(this.hp + 30, this.maxHp);
                game.map[ny][nx] = "floor";
            } else if (cell === "sword") {
                this.atk++;
                game.map[ny][nx] = "floor";
            }
            this.x = nx;
            this.y = ny;
            game.enemyTurn();
        }

        attack(game) {
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            let attacked = false;
            for (let [dx, dy] of dirs) {
                const nx = this.x + dx, ny = this.y + dy;
                for (let i = game.enemies.length - 1; i >= 0; i--) {
                    if (game.enemies[i].x === nx && game.enemies[i].y === ny) {
                        attacked = true;
                        game.enemies[i].hp -= this.atk;
                        if (game.enemies[i].hp <= 0) {
                            game.enemies.splice(i, 1);
                        }
                    }
                }
            }
            if (attacked) {
                game.enemyTurn();
            }
        }
    }

    class Enemy {
        constructor(x, y, hp = 20, maxHp = 20) {
            this.x = x;
            this.y = y;
            this.hp = hp;
            this.maxHp = maxHp;
        }
    }

    class Game {
        constructor(W = 40, H = 24) {
            this.W = W;
            this.H = H;
            this.map = [];
            this.hero = null;
            this.enemies = [];
        }

        createMap() {
            for (let y = 0; y < this.H; y++) {
                this.map[y] = [];
                for (let x = 0; x < this.W; x++) {
                    this.map[y][x] = "wall";
                }
            }
        }

        carveRoom(x1, y1, w, h) {
            for (let y = y1; y < y1 + h; y++) {
                for (let x = x1; x < x1 + w; x++) {
                    if (x > 0 && y > 0 && x < this.W - 1 && y < this.H - 1) {
                        this.map[y][x] = "floor";
                    }
                }
            }
        }

        // Utility to get a random integer in a range [min, max]
        getRandomInRange(min, max) {
            return min + Math.floor(Math.random() * (max - min + 1));
        }

        makeRooms() {
            let rooms = this.getRandomInRange(5, 10);
            for (let i = 0; i < rooms; i++) {
                let w = this.getRandomInRange(3, 8);
                let h = this.getRandomInRange(3, 8);
                let x = this.getRandomInRange(1, this.W - w - 2);
                let y = this.getRandomInRange(1, this.H - h - 2);
                console.log(`Room made: ${i}: x=${x}, y=${y}, w=${w}, h=${h}`);
                this.carveRoom(x, y, w, h);
            }
        }

        makeCorridors() {
            let hCorridors = this.getRandomInRange(3, 5);
            for (let i = 0; i < hCorridors; i++) {
                let y = this.getRandomInRange(1, this.H - 2);
                for (let x = 0; x < this.W; x++) this.map[y][x] = "floor";
            }
            let vCorridors = this.getRandomInRange(3, 5);
            for (let i = 0; i < vCorridors; i++) {
                let x = this.getRandomInRange(1, this.W - 2);
                for (let y = 0; y < this.H; y++) this.map[y][x] = "floor";
            }
        }

        placeItems(type, count) {
            while (count > 0) {
                let x = this.getRandomInRange(0, this.W - 1);
                let y = this.getRandomInRange(0, this.H - 1);
                if (this.map[y][x] === "floor") {
                    this.map[y][x] = type;
                    count--;
                }
            }
        }

        placeHero() {
            while (true) {
                let x = this.getRandomInRange(0, this.W - 1);
                let y = this.getRandomInRange(0, this.H - 1);
                if (this.map[y][x] === "floor") {
                    this.hero = new Hero(x, y);
                    break;
                }
            }
        }

        placeEnemies(n) {
            for (let i = 0; i < n; i++) {
                while (true) {
                    let x = this.getRandomInRange(0, this.W - 1);
                    let y = this.getRandomInRange(0, this.H - 1);
                    if (this.map[y] && this.map[y][x] === "floor") {
                        this.enemies.push(new Enemy(x, y));
                        break;
                    }
                }
            }
        }

        draw() {
            let html = "";
            for (let y = 0; y < this.H; y++) {
                for (let x = 0; x < this.W; x++) {
                    let cls = this.map[y][x];
                    let healthBar = "";
                    let style = `left: ${x * 50}px; top: ${y * 50}px;`;
                    let logMsg = `Rendering tile at (${x},${y}): class=${cls}`;
                    if (this.hero.x === x && this.hero.y === y) {
                        cls = "hero";
                        let heroHealthPercent = (this.hero.hp / this.hero.maxHp) * 100;
                        healthBar = '<div class="health" style="width: ' + heroHealthPercent + '%;"></div>';
                        logMsg += ", HERO present";
                    } else {
                        for (let enemy of this.enemies) {
                            if (enemy.x === x && enemy.y === y) {
                                cls = "enemy";
                                let enemyHealthPercent = (enemy.hp / enemy.maxHp) * 100;
                                healthBar = '<div class="health" style="width: ' + enemyHealthPercent + '%;"></div>';
                                logMsg += ", ENEMY present";
                                break;
                            }
                        }
                    }
                    console.log(logMsg);
                    html += `<div class="tile ${cls}" style="${style}">${healthBar}</div>`;
                }
            }
            $(".field").html(html);
            $("#health").text("❤️ " + this.hero.hp);
            $("#attack").text("⚔️ " + this.hero.atk);
            console.log("Rendering complete. HTML length:", html.length);
        }

        enemyTurn() {
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (let i = 0; i < this.enemies.length; i++) {
                let e = this.enemies[i];
                let isAdjacentToHero = false;
                for (let d = 0; d < dirs.length; d++) {
                    if (e.x + dirs[d][0] === this.hero.x && e.y + dirs[d][1] === this.hero.y) {
                        isAdjacentToHero = true;
                        break;
                    }
                }
                if (isAdjacentToHero) {
                    this.hero.hp -= 5;
                    if (this.hero.hp <= 0) {
                        this.draw();
                        alert("Вы погибли!");
                        location.reload();
                        return;
                    }
                } else {
                    let r = dirs[Math.floor(Math.random() * 4)];
                    let nx = e.x + r[0];
                    let ny = e.y + r[1];
                    if (nx >= 0 && ny >= 0 && nx < this.W && ny < this.H && this.map[ny][nx] !== "wall") {
                        let blocked = false;
                        for (let j = 0; j < this.enemies.length; j++) {
                            if (this.enemies[j].x === nx && this.enemies[j].y === ny) {
                                blocked = true;
                                break;
                            }
                        }
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
            this.draw();
        }
    }

    // ---------- управление ----------
    $(document).keydown(function (e) {
        if (game.hero.hp <= 0) return;

        if (e.key === "w") game.hero.move(0, -1, game);
        else if (e.key === "s") game.hero.move(0, 1, game);
        else if (e.key === "a") game.hero.move(-1, 0, game);
        else if (e.key === "d") game.hero.move(1, 0, game);
        else if (e.key === " ") game.hero.attack(game);
        else return;

        game.draw();
    });

    // ---------- старт ----------
    const game = new Game();
    game.createMap();
    game.makeRooms();
    game.makeCorridors();
    game.placeItems("sword", 2);
    game.placeItems("potion", 10);
    game.placeHero();
    game.placeEnemies(10);
    game.draw();
});