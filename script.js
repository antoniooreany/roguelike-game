$(function() {
    var W = 40, H = 24;
    var map = []; // 2D массив карты
    var hero = {x:0, y:0, hp:100, maxHp: 100, atk:1}; // Added maxHp for hero
    var enemies = [];
    var ENEMY_MAX_HP = 20; // Define max HP for enemies

    // ---------- генерация карты ----------
    function createMap() {
        var x, y;
        for (y=0; y<H; y++) {
            map[y] = [];
            for (x=0; x<W; x++) {
                map[y][x] = "wall";
            }
        }
    }

    function carveRoom(x1,y1,w,h) {
        var x,y;
        for (y=y1; y<y1+h; y++) {
            for (x=x1; x<x1+w; x++) {
                // Check bounds to avoid carving into the outer walls
                if (x>0 && y>0 && x<W-1 && y<H-1) {
                    map[y][x] = "floor";
                }
            }
        }
    }

    function makeRooms() {
        // Random number of rooms (5-10)
        var rooms = 5 + Math.floor(Math.random()*6);
        var i;
        for (i=0; i<rooms; i++) {
            // Random width and height (3-8)
            var w = 3 + Math.floor(Math.random()*6);
            var h = 3 + Math.floor(Math.random()*6);
            // Random position (ensure it fits)
            var x = 1 + Math.floor(Math.random()*(W-w-2));
            var y = 1 + Math.floor(Math.random()*(H-h-2));
            carveRoom(x,y,w,h);
        }
    }

    function makeCorridors() {
        var i;
        // 3-5 horizontal corridors
        var hCorridors = 3 + Math.floor(Math.random() * 3);
        for(i=0; i < hCorridors; i++) {
            // Pick a random row (not the very top or bottom)
            var y = 1 + Math.floor(Math.random()*(H-2));
            for(var x=0; x<W; x++) map[y][x]="floor";
        }
        // 3-5 vertical corridors
        var vCorridors = 3 + Math.floor(Math.random() * 3);
        for(i=0; i < vCorridors; i++) {
            // Pick a random column (not the very left or right)
            var x = 1 + Math.floor(Math.random()*(W-2));
            for(var y=0; y<H; y++) map[y][x]="floor";
        }
    }

    function placeItems(type,count) {
        while(count>0) {
            var x = Math.floor(Math.random()*W);
            var y = Math.floor(Math.random()*H);
            if(map[y][x]==="floor") {
                map[y][x]=type;
                count--;
            }
        }
    }

    function placeHero() {
        while(true) {
            var x = Math.floor(Math.random()*W);
            var y = Math.floor(Math.random()*H);
            if(map[y][x]==="floor") {
                hero.x=x; hero.y=y;
                break;
            }
        }
    }

    function placeEnemies(n) {
        for(var i=0; i<n; i++) {
            while(true) {
                var x = Math.floor(Math.random()*W);
                var y = Math.floor(Math.random()*H);
                if(map[y][x]==="floor") {
                    // Add maxHp to enemies
                    enemies.push({x:x, y:y, hp: ENEMY_MAX_HP, maxHp: ENEMY_MAX_HP});
                    break;
                }
            }
        }
    }

    // ---------- рендер ----------
    function draw() {
        var html = "";
        var y,x;
        for(y=0; y<H; y++) {
            for(x=0; x<W; x++) {
                var cls = map[y][x];
                var healthBar = "";

                if(hero.x===x && hero.y===y) {
                    cls="hero";
                    var heroHealthPercent = (hero.hp / hero.maxHp) * 100;
                    healthBar = '<div class="health" style="width: '+heroHealthPercent+'%;"></div>';
                } else {
                    for(var i=0; i<enemies.length; i++) {
                        if(enemies[i].x===x && enemies[i].y===y) {
                            cls="enemy";
                            var enemyHealthPercent = (enemies[i].hp / enemies[i].maxHp) * 100;
                            healthBar = '<div class="health" style="width: '+enemyHealthPercent+'%;"></div>';
                            break;
                        }
                    }
                }
                html += '<div class="tile '+cls+'">' + healthBar + '</div>';
            }
        }
        $(".field").html(html);
        $("#health").text("❤️ "+hero.hp);
        $("#attack").text("⚔️ "+hero.atk);
    }

    // ---------- логика хода ----------
    function moveHero(dx,dy) {
        var nx = hero.x+dx, ny = hero.y+dy;
        // Check boundaries
        if(nx<0 || ny<0 || nx>=W || ny>=H) return;

        // Check for wall
        var cell = map[ny][nx];
        if(cell === "wall") return;

        // Check for enemy collision
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].x === nx && enemies[i].y === ny) {
                return; // Can't move into an enemy tile
            }
        }

        // Handle item pickup
        if(cell === "potion") {
            hero.hp = Math.min(hero.hp+30, hero.maxHp);
            map[ny][nx]="floor";
        } else if(cell === "sword") {
            hero.atk++;
            map[ny][nx]="floor";
        }

        // Move hero
        hero.x=nx; hero.y=ny;
        enemyTurn(); // Let enemies have their turn after hero moves
    }

    function heroAttack() {
        var dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        var attacked = false;
        for(var i=0; i<dirs.length; i++) {
            var nx = hero.x + dirs[i][0];
            var ny = hero.y + dirs[i][1]; // <-- BUG FIX: Was dirs[i]
            for(var j=enemies.length-1; j>=0; j--) { // Iterate backwards for safe removal
                if(enemies[j].x===nx && enemies[j].y===ny) {
                    attacked = true;
                    enemies[j].hp -= hero.atk;
                    if(enemies[j].hp<=0) {
                        enemies.splice(j,1);
                    }
                }
            }
        }
        if (attacked) {
            enemyTurn(); // Only let enemies move if an attack was performed
        }
    }

    function enemyTurn() {
        var dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        for(var i=0; i<enemies.length; i++) {
            var e = enemies[i];
            var isAdjacentToHero = false;

            // Check if hero is adjacent
            for(var d=0; d<dirs.length; d++) {
                if(e.x + dirs[d][0] === hero.x && e.y + dirs[d][1] === hero.y) { // <-- BUG FIX: was dirs[d] for y
                    isAdjacentToHero = true;
                    break;
                }
            }

            // If adjacent, attack hero
            if(isAdjacentToHero) {
                hero.hp -= 5;
                if(hero.hp <= 0) {
                    draw(); // Draw one last time to show 0 hp
                    alert("Вы погибли!");
                    location.reload();
                    return; // Exit function if hero is dead
                }
            } else { // Otherwise, move randomly
                var r = dirs[Math.floor(Math.random()*4)];
                var nx = e.x + r[0]; // <-- BUG FIX: was e.x + r
                var ny = e.y + r[1]; // <-- BUG FIX: was e.y + r

                if(nx>=0 && ny>=0 && nx<W && ny<H && map[ny][nx]!=="wall") {
                    var blocked = false;
                    // Check for other enemies
                    for(var j=0; j<enemies.length; j++) {
                        if(enemies[j].x === nx && enemies[j].y === ny) {
                            blocked = true;
                            break;
                        }
                    }
                    // Check for hero
                    if(hero.x === nx && hero.y === ny) {
                        blocked = true;
                    }

                    if(!blocked) {
                        e.x = nx;
                        e.y = ny;
                    }
                }
            }
        }
        // The draw() call was removed from here, it's handled by the keydown handler
    }

    // ---------- управление ----------
    $(document).keydown(function(e) {
        if(hero.hp <= 0) return; // Don't allow moves if hero is dead

        if(e.key==="w") moveHero(0,-1);
        else if(e.key==="s") moveHero(0,1);
        else if(e.key==="a") moveHero(-1,0);
        else if(e.key==="d") moveHero(1,0);
        else if(e.key===" ") heroAttack();
        else return; // Don't redraw if other key was pressed

        draw(); // Redraw the screen after any valid action
    });

    // ---------- старт ----------
    function init() {
        createMap();
        makeRooms();
        makeCorridors();
        placeItems("sword",2);
        placeItems("potion",10);
        placeHero();
        placeEnemies(10);
        draw();
    }

    init();
});