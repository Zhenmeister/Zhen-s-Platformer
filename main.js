var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	
		// validate that the delta is within range
	if(deltaTime > 1)
		deltaTime = 1;
		
	return deltaTime;
}


//-------------------- Don't modify anything above here

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;


// some variables to calculate the Frames Per Second (FPS - this tells use
// how fast our game is running, and allows us to make the game run at a 
// constant speed)
var fps = 0;
var fpsCount = 0;
var fpsTime = 0;
var score = 0;
var lives = 3;

// Specifiy how big the level is, in tiles
var MAP = {tw: 60, th: 15};

// The width of a tile, these dimensions refer to the map grid tiles.
var TILE = 35;

// The width/height of a tile in the tileset. because the images are twice as big as the grid 
// in our map we need to be careful.
var TILESET_TILE = TILE * 2;

//The amount of pixes between the image border and the tile images in the tile map.
var TILESET_PADDING = 2;

// The amount of pixels between the tile images in the tilemap
var TILESET_SPACING = 2;

// The amount of columns of tile images are in the tileset.
var TILESET_COUNT_X = 14;

// The amount of rows of tile images in the tileset.
var TILESET_COUNT_Y = 14;


// These constant variables map to the layers of our level
var LAYER_COUNT = 3;
var LAYER_BACKGROUND = 0;
var LAYER_PLATFORMS = 1;
var LAYER_LADDERS = 2;
var LAYER_OBJECT_ENEMIES = 3;
var LAYER_OBJECT_TRIGGERS = 4;
var worldOffsetX = 0;

var player = new Player();
var keyboard = new keyboard();
var cells = [];		// The array that holds our simplified collision data
var enemies = [];
var bullets =[];

// "Applying Forces" variables

	// arbitrary choice for 1m
var METER = TILE;

	// very exaggerated gravity (6x)
var GRAVITY = METER * 9.8 * 6;
	
	// max horizontal speed (10 tiles per sec)
var MAXDX = METER * 10;

	// max vertical speed (15 tiles per sec)
var MAXDY = METER * 15;

	// horizontal acceleration - take 1/2 second to reach maxdx
var ACCEL = MAXDX * 2;

	// horizontal friction - take 1/6 second to stop from maxdx
var FRICTION = MAXDX * 6;

	// (a large) instantaneous jump impulse
var JUMP = METER * 2000;	


//Enemies
var ENEMY_MAXDX = METER * 5;
var ENEMY_ACCEL = ENEMY_MAXDX * 2;

// Game States
var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_GAMEOVER = 2;
var STATE_GAMEWIN = 3;
var splashTimer = 300;
var gameState = STATE_SPLASH;

var musicBackground;
var sfxFire;

var splash = {
	image: document.createElement("img"),
	x: SCREEN_WIDTH,
	y: SCREEN_HEIGHT,
	width: 640,
	height: 480,
}
	splash.image.src = "Splash.png";

	var gameover = {
		image: document.createElement("img"),
		x: SCREEN_WIDTH,
		y: SCREEN_HEIGHT,
		width: 640,
		height: 480,
}
	gameover.image.src = "Lose.png";

	var gamewin = {
		image: document.createElement("img"),
		x: SCREEN_WIDTH,
		y: SCREEN_HEIGHT,
		width: 640,
		height: 480,
}
	gamewin.image.src = "Win.png";

var Heart = document.createElement("img");
	Heart.src = "Heart.png";


// lOAD THE IMAGE TO USE FOR THE LEVEL TILES
var tileset = document.createElement("img");
	tileset.src = "tileset.png";





function cellAtPixelCoord(layer, x, y)
{
	if(x<0 || x>SCREEN_WIDTH || y<0)
		return 1;
	//let the player drop off the bottom of the screen (this means death)
	if(y>SCREEN_HEIGHT)
		return 0;
	return cellAtTileCoord(layer, p2t(x), p2t(y));
};

function cellAtTileCoord(layer, tx, ty)
{
	if(tx<0 || tx>=MAP.tw || ty<0)
		return 1;
	//let the player drop off the bottom of the screen (this means death)
	if(ty>=MAP.th)
		return 0;
	return cells[layer][ty][tx];
};

function tileToPixel(tile)
{
	return tile * TILE;
};

function pixelToTile(pixel)
{
	return Math.floor(pixel/TILE);
};

function bound(value, min, max)
{
	if(value < min)
			return min;
	if(value > max)
			return max;
	return value;			
}


function drawMap()
{
	var startX = -1;
	var maxTiles = Math.floor(SCREEN_WIDTH / TILE) + 2;
	var tileX = pixelToTile(player.position.x);
	var offsetX = TILE + Math.floor(player.position.x%TILE);

	startX = tileX - Math.floor(maxTiles / 2);

	if(startX < 1)
	{
		startX = 0;
		offsetX = 0;
	}
	if(startX > MAP.tw - maxTiles)
	{
		startX = MAP.tw - maxTiles + 1;
		offsetX = TILE;
	}

	worldOffsetX = startX * TILE + offsetX;

 for(var layerIdx=0; layerIdx<LAYER_COUNT; layerIdx++)
 {
 	for( var y = 0; y < level1.layers[layerIdx].height; y++ )
 	{
 		var idx = y * level1.layers[layerIdx].width + startX;
 		for( var x = startX; x < startX + maxTiles; x++ )
 		{
 			if( level1.layers[layerIdx].data[idx] != 0 )
 			{
				// the tiles in the Tiled map are base 1 (meaning a value of 0 means no tile), so subtract one from the tileset id to get the
				 // correct tile
				var tileIndex = level1.layers[layerIdx].data[idx] - 1;
 				var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * (TILESET_TILE + TILESET_SPACING);
 				var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) * (TILESET_TILE + TILESET_SPACING);
 				context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE, (x-startX)*TILE - offsetX, (y-1)*TILE, TILESET_TILE, TILESET_TILE);
 			}
 			idx++;
 			}
 		}
 	}
}



//Initialize the collision map
function initialize() 
{
	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) 
	{ 
		cells[layerIdx] = [];
		var idx = 0;
		for(var y = 0; y < level1.layers[layerIdx].height; y++) 
		{
			cells[layerIdx][y] = [];
			for(var x = 0; x < level1.layers[layerIdx].width; x++) 
			{
				if(level1.layers[layerIdx].data[idx] !=0) 
				{
					 //for each tile we find in the layer data, we need to create 4 collisions
					 //(because our collision squares are 35x35 but the tile in the level are 70x70)
					cells[layerIdx][y][x] = 1;
					cells[layerIdx][y-1][x] = 1;
					cells[layerIdx][y-1][x+1] = 1;
					cells[layerIdx][y][x+1] = 1;
				}
				else if(cells[layerIdx][y][x] != 1)
				{
					 //if we haven't set this cell's value, then set it to 0 now
					cells[layerIdx][y][x] = 0;
				}
				idx++;
			}
		}
	}
	musicBackground = new Howl (
	{
		urls: ["background.ogg"],
		loop: true, 
		buffer: true,
		volume: 0.5
	});
	musicBackground.play();

	sfxFire = new Howl(
	{
		urls: ["fireEffect.ogg"],
		buffer: true,
		volume: 0.5,
		onend: function() 
		{
			isSfxPlaying = false;
		}
	})

	// add enemies

	idx = 0;
	for(var y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++) 
	{
		for(var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++) 
		{
			if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0) 
			{
				var px = tileToPixel(x);
				var py = tileToPixel(y);
				var e = new Enemy(px, py);
				enemies.push(e);
			}
			idx++;
		}
	}
}

function intersects(x1, y1, w1, h1, x2, y2, w2, h2)
{
	if(y2 + h2 < y1 ||
		x2 + w2 < x1 ||
			x2 > x1 + w1 ||
			y2 > y1 + h1)
	{
		return false;
	}
	return true;
}




function runGame()
{
	context.fillStyle = "#ccc";		
	context.fillRect(0, 0, canvas.width, canvas.height);

	var deltaTime = getDeltaTime();

	// draw player
	player.update(deltaTime);
	//draw map
	drawMap();
	player.draw();


	// Enemies
	for(var i=0; i<enemies.length; i++)
	{
		enemies[i].update(deltaTime);
	}
	for(var i=0; i<enemies.length; i++)
	{
		enemies[i].draw(deltaTime);
	}

	// Bullets
	for(var i=0; i<bullets.length; i++)
	{
		bullets[i].draw(deltaTime);
	}

	// Bullet Collision
	var hit = false;
	for(var i=0; i<bullets.length; i++)
	{
		bullets[i].update(deltaTime);
		if(bullets[i].position.x - worldOffsetX < 0 || bullets[i].position.x - worldOffsetX > SCREEN_WIDTH)
		{
			hit = true;
		}

		for(var j=0; j<enemies.length; j++)
		{
			if(intersects(bullets[i].position.x, bullets[i].position.y,
			 TILE, TILE, enemies[j].position.x, enemies[j].position.y, TILE, TILE) == true)
			{
				enemies.splice(j, 1);
				hit = true;
				break;
			}
		}
	}

	// Player vs Enemy collision
	for(var i=0; i<enemies.length; i++)
	{
		if(intersects(
				player.position.x, player.position.y,
				TILE, TILE,
				enemies[i].position.x, enemies[i].position.y,
				TILE, TILE) == true)
		{
			lives --;
			player.position.y = 7* TILE;
			player.position.x = 11 * TILE;
			break;
			// increment the player score
				score += 1;
				break;
		}
	}


	// life counter
	context.draw = Heart;
	if (lives == 3)
	{
		context.drawImage(Heart, 5, 5)
		context.drawImage(Heart, 45, 5)
		context.drawImage(Heart, 85, 5)
	};

	if (lives == 2)
	{
		context.drawImage(Heart, 5, 5)
		context.drawImage(Heart, 45, 5)
	};

	if (lives == 1)
	{
		context.drawImage(Heart, 5, 5)
	};

	if (lives == 0)
	{
		gameState = STATE_GAMEOVER;
		return;
	}

	// Falling off
	if (player.position.y > 600 || player.position.x < -50)
	{
		player.position.y = 7 * TILE;
		player.position.x = 11 * TILE;
		lives --;
	};

	// Winning the game
	if(player.position.y > 650 || player.position.x > 2020)
	{
		gameState = STATE_GAMEWIN;
		return;
	};	

	
		
	// update the frame counter 
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1)
	{
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}

		
	// draw the FPS
	context.fillStyle = "#f00";
	context.font="14px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);

		//score 
	context.fillStyle = "blue";
	context.font = "32px Arial";
	var scoreText = "Score: " + score;
	context.fillText(scoreText, SCREEN_WIDTH - 170, 35);

}

function runSplash()
{
	if(splashTimer > 0)
	{
		splashTimer --
	}	
	if(splashTimer <=300)
	{
		context.drawImage(splash.image, 1, 1)
	}
	if(splashTimer <= 0)
	{
		gameState = STATE_GAME;
		return;
	}	
}

function runGameOver()
{
	context.drawImage(gameover.image, 1, 1)
}

function runGamwWin()
{
	context.drawImage(gamewin.image, 1, 1)

	context.fillStyle = "blue";
	context.font = "32px Arial";
	var scoreText = " = " + score;
	context.fillText(scoreText, SCREEN_WIDTH - 60, 25);
}

function run()
{
	switch(gameState)
	{
		case STATE_SPLASH:
		runSplash();
		break;
		case STATE_GAME:
		runGame();
		break;
		case STATE_GAMEOVER:
		runGameOver();
		break;
		case STATE_GAMEWIN:
		runGameWin();
		break;
	}
}


initialize();



//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  
  window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);
