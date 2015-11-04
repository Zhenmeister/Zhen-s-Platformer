	var LEFT = 0;
	var RIGHT = 1;
	var UP = 3;
	var DOWN = 4;

	var ANIM_DEAD = 0;
	var ANIM_IDLE = 1;
	var ANIM_RUN = 2;
	var ANIM_DROP = 3;
	var ANIM_MAX = 5;
	
	var bombs = [];

var Player = function()
{
	this.sprite = new Sprite("player.png");
	//ANIM_DEAD
	this.sprite.buildAnimation(10, 4, 50, 50, 0.05,
		[0,1 ,2, 3, 4, 5, 6, 7, 8, 9, 10]);
	//ANIM_IDLE
	this.sprite.buildAnimation(10, 4, 50, 50, 0.05,
		[11, 12, 13, 14, 15, 16, 17, 18, 19, 20,]);
	//ANIM_RUN
	this.sprite.buildAnimation(10, 4, 50, 50, 0.05,
		[21, 22, 23, 24, 25, 26, 27, 28]);
	//ANIM_DROP
	this.sprite.buildAnimation(10, 4, 50, 50, 0.05,
		[11, 29, 12]);
	
	for(var i=0; i<ANIM_MAX; i++)
	{
	this.sprite.setAnimationOffset(i, 50, 50);
	}
	
	this.position = new Vector2();
	this.position.set( 9*TILE, 0*TILE );
	
	this.width = 50;
	this.height = 50;
		
	this.velocity = new Vector2();

	this.direction = LEFT;
};

Player.prototype.update = function(deltaTime)
{
	this.sprite.update(deltaTime);
	
	//var keyboard = new Keyboard();
	var acceleration = new Vector2(0, 0);
	var playerAccel = 1000;
	var playerDrag = 11;
	var left = false;
	var right = false;
	var up = false;
	var down = false;
	var drop = false;
	
	
	
	//Check keypress events
	if(keyboard.isKeyDown(keyboard.KEY_LEFT) == true)
	{
		left = true;
		this.direction = LEFT;
		this.sprite.setAnimation(ANIM_RUN);
	}
		else if(keyboard.isKeyDown(keyboard.KEY_LEFT) == false)
		{
			left = false
			this.sprite.setAnimation(ANIM_IDLE);
		}
	if(keyboard.isKeyDown(keyboard.KEY_RIGHT) == true)
	{
		right = true;
		this.direction = RIGHT;
		this.sprite.setAnimation(ANIM_RUN);
	}
		else if(keyboard.isKeyDown(keyboard.KEY_RIGHT) == false)
		{
			right = false
			this.sprite.setAnimation(ANIM_IDLE);
		}
	if(keyboard.isKeyDown(keyboard.KEY_UP) == true)
	{
		up = true;
		this.direction = UP;
		this.sprite.setAnimation(ANIM_RUN);
	}
		else if(keyboard.isKeyDown(keyboard.KEY_UP) == false)
		{
			up = false
			this.sprite.setAnimation(ANIM_IDLE);
		}
	if(keyboard.isKeyDown(keyboard.KEY_DOWN) == true)
	{
		down = true;
		this.direction = DOWN;
		this.sprite.setAnimation(ANIM_RUN);
	}
		else if(keyboard.isKeyDown(keyboard.KEY_DOWN) == false)
		{
			down = false
			this.sprite.setAnimation(ANIM_IDLE);
		}


	if(keyboard.isKeyDown(keyboard.KEY_SPACE) == true && this.cooldownTimer <= 0);
	{
		drop = true;
		this.sprite.setAnimation(ANIM_DROP);
		var	tempBomb = new Bomb((this.position.x), this.position.y);
		this.cooldownTimer=0.3;
		tempBomb.position.x = player.position.x;
		tempBomb.position.y = player.position.y;
		//Bombs.push(tempBomb);
	}
	
	//movement code
	var wasleft = this.velocity.x < 0;
	var wasright = this.velocity.x > 0;
	var wasup = this.velocity.y < 0;
	var wasdown = this.velocity.y > 0;
	var ddx = 0;
	var ddy = 0;
	//left
	if(left)
		ddx = ddx - XACCEL;
	else if(wasleft)
		ddx = ddx + FRICTION;
	
	//right
	if(right)
		ddx = ddx + XACCEL;
	else if(wasright)
		ddx = ddx - FRICTION;
	
	//up
	if(up)
		ddy = ddy - YACCEL;
	else if(wasup)
		ddy = ddy + FRICTION;
	//down
	if(down)
		ddy = ddy + YACCEL;
	if(wasdown)
		ddy = ddy - FRICTION;
	
		//calculate the new position and velocity
	this.position.y = Math.floor(this.position.y + (deltaTime * this.velocity.y));
	this.position.x = Math.floor(this.position.x + (deltaTime * this.velocity.x));
	this.velocity.x = bound(this.velocity.x + (deltaTime * ddx), -MAXDX, MAXDX);
	this.velocity.y = bound(this.velocity.y + (deltaTime * ddy), -MAXDY, MAXDY);

	if ((wasleft && (this.velocity.x > 0)) ||
		(wasright && (this.velocity.x < 0)))
	{
		this.velocity.x = 0;
	}
	//collision detection \\probs need to be tested*****************************************
	//Variables
	var tx = pixelToTile(this.position.x);
	var ty = pixelToTile(this.position.y);
	var nx = (this.position.x)%TILE;
	var ny = (this.position.y)%TILE;
	
	//BELOW VARIABLES ARE CURRENTLY BROKEN
	//var cell = tileToPixel(LAYER_ROCK, tx, ty);
	//var cellright = tileToPixel(LAYER_ROCK, tx + 1, ty);
	//var cellleft = tileToPixel(LAYER_ROCK, tx - 1, ty);
	//var celldown = tileToPixel(LAYER_ROCK, tx, ty + 1);
	//var celldiag = tileToPixel(LAYER_ROCK, tx + 1, ty + 1);

	var cell = tileToPixel(LAYER_BUILDING, tx, ty);
	var cellright = tileToPixel(LAYER_BUILDING, tx + 1, ty);
	var cellleft = tileToPixel(LAYER_BUILDING, tx - 1, ty);
	var celldown = tileToPixel(LAYER_BUILDING, tx, ty + 1);
	var celldiag = tileToPixel(LAYER_BUILDING, tx + 1, ty + 1);
	//actual collision 
	if(this.velocity.y > 0)
	{
		//Y down
		if((celldown && !cell) || (celldiag && !cellright && nx))
		{
			this.position.y = tileToPixel(ty);
			this.velocity.y = 0
			ny = 0;
		}
	}
		//Y Up
		else if (this.velocity.y < 0)
	{
		if((cell && !celldown) || (cellright && !celldiag && nx))
		{
			this.position.y = tileToPixel(ty + 1);
			this.velocity.y = 0;
			ny = 0;
		}
	}
		//X Right
		if(this.velocity.x > 0)
	{
			if((cellright && !cell) || (celldiag && !celldown && ny))
			{
				this.position.x = tileToPixel(tx);
				this.velocity.x = 0;
			}
	}
		//X Left
		else if (this.velocity.x < 0)
	{
		if((cell && !cellright) || (celldown && !celldiag && ny))
		{
			this.position.x = tileToPixel(tx + 1);
			this.velocity.x = 0;
		}
	}
}

Player.prototype.draw = function()
{
	var screenX = this.position.x - worldOffsetX;
	this.sprite.draw(context, screenX, this.position.y);
}
