/////////////////////////////////////
//
/* 

Creating Things:

var th = new Thing()

Thing variables. Set these as needed:

cosmetic elements

th.imagename -- name of image file
th.isflipped -- reverses image (set to true/false)
th.strokecolor -- color of outline
th.fillcolor -- color of filled shape
th.imagetext -- text to be drawn instead of image or shape
th.font -- font to use to draw text
th.iscentered -- set to false for x/y to refer to top-left corner
th.isoverlay -- set to true for a thing that's not attached to the board

physical elements

th.x, th.x -- position
th.z -- depth (drawing order) 100 is default, higher numbers on top
th.xvel, th.yvel -- velocity
th.zvel -- angular velocity (degrees per second)
th.width, th.height -- size
th.angle -- rotation in degrees
th.shape -- shape of thing (CIRCLE, BOX or [[x,y], [x,y], [x,y]...])
th.isfixed -- set to true to fix object in place permanently
th.bounce -- bounciness
th.friction -- coefficient of friction from 0.0 to 1.0
th.density -- mass per square meter
th.slowing -- amount of linear drag
th.spinslowing -- amount of spinning drag
th.isturnable -- set to false if object should never rotate
th.isfast -- set to true if it typically moves many times its length per frame
th.type -- the numbered type (GHOSTTYPE + number for a non-colliding object)
th.collidetypes -- list of other types it collides with [0, 1, 2, etc]

management elements

th.isdeleted -- deletes thing when set to true

th.pressfunc -- function to call when thing is pressed
th.dragfunc -- function to call as thing is dragged
th.releasefunc -- function to call when thing is released
th.framefunc -- function to call for every frame
th.collidefunc -- function to call when anything else 
	collides with or stops colliding with thing

examples:

function pressthing(thing, x, y) { do stuff }
function dragthing(thing, x, y) { do stuff }
function releasething(thing, x, y) { do stuff }
function thingframe(thing) { draw stuff }
function collidething(thing, otherthing, isTouching) { isTouching is true if colliding }

Thing functions:

th.pointat(x, y) -- changes angle to point at a spot
th.velocityat(x, y, speed, force) -- sets velocity 
	to move toward a spot with optional force
th.setvelocity(angle, speed, force) -- sets velocities 
	according to an angle and speed with optional force
th.spin(force) -- impart angular force to thing

th.distanceto(x, y) -- returns distance to a position
th.ontile() -- returns board tile letter thing is touching
th.contains(x, y) -- returns true if point is inside shape
th.isonscreen() -- returns true if thing is on screen

th.weldto(otherthing, x, y, thingx, thingy)
th.springto(otherthing, springiness, x, y, thingx, thingy)
th.axleto(otherthing, x, y, thingx, thingy, minangle, maxangle)

th.dolater(function, timedelay) -- do the function after timedelay seconds

Utility functions:

setbackground(image_file_name)
setgravity(horizontal, vertical) -- meters per second per second

tiletype('letter').imagename = image_file_name
tiletype('letter').type = tile_collision_type
tiletype('letter').shape = tile_collision_shape
tiletype('letter').bounce = tile_bounce
tiletype('letter').friction = tile_friction

setboard(array_of_strings, map_function) -- set the board after defining tile types
	map_function is function name(letter, column, row) for special initialization 

tile(column, row) -- returns board letter

drawline(start_x, start_y, end_x, end_y, color, line_width)
drawcircle(center_x, center_y, radius, color, line_width)

playsound('soundname') -- play a sound effect
playmusic('songname') -- play music loop
stopmusic('songname') -- stop music in progress

dolater(function, delay)

randint(low, high) -- return a random integer from low to high
random(low, high) -- return a random value from low to high

game.pressfunc -- called when pressing anywhere (x, y)
game.dragfunc -- called when dragging anywhere (x, y)
game.releasefunc -- called when releasing anywhere (x, y)
game.framefunc -- called every frame

set these values:

view.x, view.y -- to scroll the view
view.width, view.height, view.aspect -- to determine the view scale
board.tilesize -- to determine the size of environment squares

these are set automatically:

pointer.x, pointer.y -- the most recent absolute pointer position
board.columns, board.rows -- the size of the board
tick -- the fraction of a second that has elapsed
	since the previous frame

*/

///////////////////////////////
//
//  global settings
//

var CLICK = 1;
var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, SPACE = 32;
var KEY_A = 65, KEY_B = 66, KEY_C = 67, KEY_D = 68, KEY_E = 69, KEY_F = 70;
var KEY_G = 71, KEY_H = 72, KEY_I = 73, KEY_J = 74, KEY_K = 75, KEY_L = 76;
var KEY_M = 77, KEY_N = 78, KEY_O = 79, KEY_P = 80, KEY_Q = 81, KEY_R = 82;
var KEY_S = 83, KEY_T = 84, KEY_U = 85, KEY_V = 86, KEY_W = 87, KEY_X = 88;
var KEY_Y = 89, KEY_Z = 90, KEY_0 = 48, KEY_1 = 49, KEY_2 = 50, KEY_3 = 51;
var KEY_4 = 52, KEY_5 = 53, KEY_6 = 54, KEY_7 = 55, KEY_8 = 56, KEY_9 = 57;

var ORG;

ORG = "";
// ORG = "src/";

var GFX = ORG + "gfx/";
var BKG = ORG + "bkg/"
var SND = ORG + "snd/";
var MUS = ORG + "mus/";

// global environment variables
var pointer = {x:0, y:0, isdown:false};
var view = {x:0, y:0, aspect:1.618, height:10.0, width:16.18};
var board = {columns:0, rows:0, tilesize:1.0};
var tick = 0.01;

var CIRCLE = 1;
var BOX = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];

var DEFAULTTYPE = 0;
var GHOSTTYPE = 16;

var WELD = 0;
var SPRING = 1;
var AXLE = 2

var INVISIBLE = '';

var joints_ = [];
var isclearing_ = false;

//////////////////////////////////
//
// environment functions
//

function setbackground(name)
{
	if (game.backname_ == name)
		return;
	game.backname_ = name;	
}

function setboard(data, func)
{
	board.columns = 0;
	game.board_ = data;
	board.rows = game.board_.length;
	
	var bd = new Box2D.b2BodyDef();
	if (game.boardbody_)
		game.world_.DestroyBody(game.boardbody_);
	game.boardbody_ = game.world_.CreateBody(bd);

	var mapline;
	var rownum;
	for (rownum = 0; rownum < board.rows; rownum++) {
		mapline = data[rownum];
		if (mapline.length > board.columns)
			board.columns = mapline.length;
		var column = 0;
		while (column < mapline.length) {
			var character = mapline[column];
			if (character in game.tiletype_) {
				var tiledata = game.tiletype_[character];
				if (tiledata.type < GHOSTTYPE) {
					var fixtureDef = new Box2D.b2FixtureDef();
					var shape;
					var vertices = [];
					var width = 1;
					if (tiledata.shape == BOX) {
						while ((column + width < mapline.length) && (mapline[column + width] == character))
							width++;
						var boxleft = column * board.tilesize;
						var boxright = column + width * board.tilesize;
						var boxtop = rownum * board.tilesize;
						var boxbottom = (rownum + 1) * board.tilesize;
						vertices.push(new Box2D.b2Vec2(boxleft, boxtop));
						vertices.push(new Box2D.b2Vec2(boxright, boxtop));
						vertices.push(new Box2D.b2Vec2(boxright, boxbottom));
						vertices.push(new Box2D.b2Vec2(boxleft, boxbottom));
						column += width - 1;
					}
					else if (tiledata.shape.length) {
						for (var i = 0; i < tiledata.shape.length; i++)
							vertices.push(new Box2D.b2Vec2(column + tiledata.shape[i][0] * width, 
														   rownum + tiledata.shape[i][1] * width));
					}
					shape = createPolygonShape(vertices);
					fixtureDef.set_shape(shape);
					boardfixture = game.boardbody_.CreateFixture(fixtureDef);
					boardfixture.tiledata_ = tiledata;
					fixtureDef.set_density(1);
					fixtureDef.set_friction(tiledata.friction);
					fixtureDef.set_restitution(tiledata.bounce);
					var filter = fixtureDef.get_filter();
					filter.set_categoryBits(1 << tiledata.type);
					filter.set_maskBits(0xFFFF);
				}
			}
            if (func) func(character, column + 0.5, rownum + 0.5);
			column++;
		}
	}
}

function tile(col, row)
{
	return game.tile(col, row);
}

function tiletype(character)
{
	if (!(character in game.tiletype_)) {
		var data = {
			type: 0,
			imagename: null,
			shape: BOX,
			friction: 0.5,
			bounce: 0.3,
			state_: {
				imagename_: null,
				scale_ : null,
				img_: null,
				img_src_: null,
			}
		};
		game.tiletype_[character] = data;
	}
	return game.tiletype_[character];
}

function setgravity(horz, vert)
{
	game.world_.SetGravity(new Box2D.b2Vec2(horz, vert));
}

function playsound(name)
{
	if (!(name in game.sounds_))
		game.sounds_[name] = new Audio(SND + name + '.wav');
	game.sounds_[name].play();
}

function playmusic(name)
{
	if (!(name in game.sounds_))
		game.sounds_[name] = new Audio(MUS + name + '.mp3');
	game.sounds_[name].loop = true;
	game.sounds_[name].play();
}

function stopmusic(name)
{
	if (!(name in game.sounds_))
		return;
	game.sounds_[name].pause();
	game.sounds_[name].currentTime = 0;
}

///////////////////////////////
//
// utility functions
//

function randint(low, high)
{
	if (!high) {
		high = low;
		low = 0;
	}
	return low + Math.floor(Math.random() * ((high - low) + 1));
}

function random(low, high)
{
	if (!high) {
		high = low;
		low = 0;
	}
	return low + Math.random() * (high - low);
}

function dolater(func, timeout)
{
	game.settimer(func, null, timeout);
}

///////////////////////////////////
//
// input functions
//

function ispressing(k)
{
	return game.pressmap_[k] == true;
}

function isholding(k)
{
	return game.holdmap_[k] == true;
}

//////////////////////////////
//
// drawing primitives
//

function drawline(startx, starty, endx, endy, color, width = 0.03)
{
	ctx.strokeStyle = color;
	ctx.lineWidth = width * game.scale_;
	ctx.beginPath();
	ctx.moveTo((startx - view.x) * game.scale_, (starty - view.y) * game.scale_);
	ctx.lineTo((endx - view.x) * game.scale_, (endy - view.y) * game.scale_);
	ctx.stroke();
}

function drawcircle(x, y, radius, color, width = 0.03)
{
	ctx.strokeStyle = color;
	ctx.lineWidth = width * game.scale_;
	ctx.beginPath();
    ctx.arc((x - view.x) * game.scale_, (y - view.y) * game.scale_, radius * game.scale_, 0, Math.PI * 2, false);
	ctx.stroke();
}

////////////////////////////
//
// graphics Object definition
//

function destroybody(th)
{
    for (var i = 0; i < th.joints_.length; i++) {
        joint = th.joints_[i];
        if (joints_.includes(joint)) {
            game.world_.destroyJoint(joint);
            joints_.splice(joints_.indexOf(joint), 1);
        }
    }
    th.joints_ = [];
    th.body_.DestroyFixture(th.fixture_);
    th.fixture_ = null;
    game.world_.DestroyBody(th.body_);
    th.body_ = null;
}

function Thing() 
{	
	// variables for use in programs
	
	// rendering details
	this.z = 100;
	this.isflipped = false;
    this.isdeleted = false;
	this.iscentered = true;
	this.isoverlay = false;

	this.imagename = null;
	
	this.imagetext = null;
	this.font = 'Sans-serif';

	this.strokecolor = 'black';
	this.fillcolor = 'red';
	this.linewidth = 0.03;

	// event handlers
	this.pressfunc = null;
	this.dragfunc = null;
	this.releasefunc = null;
	
	this.framefunc = null;
	this.collidefunc = null;
	
	// physics details
    this.x = view.width / 2;
    this.y = view.height / 2;
	this.xvel = 0;
	this.yvel = 0;
	this.avel = 0;
	this.width = 1;
	this.height = 1;
	this.angle = 0;
	this.speed = 0;
	
	// physics attributes
	this.shape = BOX;
	this.density = 1.0;
	this.friction = 0.5;
	this.bounce = 0.3;
	this.slowing = 0;
	this.spinslowing = 0;
	this.isturnable = true;
	this.isfast = false;
	this.type = DEFAULTTYPE;
	this.collidetypes = null;
	this.bits_ = 15;
	
    this.joints_ = [];
	// variables for internal housekeeping
	// DO NOT MODIFY OR USE THESE
	this.id_ = 0;
	
	this.img_ = null;
	this.img_src_ = null;
	
	this.state_ = {};

	this._storestate();
	
	this.body_ = null;
	this.fixture_ = null;
	this.state_.shape_ = null;
	this.state_.scale_ = 0;
	
	game.addthing(this);
}

Thing.prototype.distanceto = function(x, y)
{
	var difx = x - this.x;
	var dify = y - this.y;
	return Math.sqrt(difx * difx + dify * dify)
}

Thing.prototype.contains = function(x, y)
{
	return this.fixture_ && (this.fixture_.TestPoint(new Box2D.b2Vec2(x + (this.isoverlay ? 0 : view.x), 
		y + (this.isoverlay ? 0 : view.y))));
}

Thing.prototype.ontile = function()
{
	return game.tile(this.x, this.y);
}

Thing.prototype.pointat = function(x, y, force)
{
	targetangle = Math.atan2(this.y - y, x - this.x) * 180 / Math.PI;
	if (!force)
		this.angle = targetangle;
}

Thing.prototype.spin = function(force)
{
	if (force && this.body_) {
		this.body_.ApplyAngularImpulse(force * tick, true);
	}
}

Thing.prototype.velocityat = function(x, y, speed, force)
{
	var difx = x - this.x;
	var dify = y - this.y;
	var hypotenuse = Math.sqrt(difx * difx + dify * dify);
	if (hypotenuse)
		this._setxyvel(difx * speed / hypotenuse, dify * speed / hypotenuse, force);
}

Thing.prototype.setvelocity = function(angle, speed, force)
{
	this._setxyvel(Math.cos(-angle * Math.PI / 180) * speed, Math.sin(-angle * Math.PI / 180) * speed, force);
}

Thing.prototype.isonscreen = function()
{
	if (this.x < view.x - this.width / 2)
		return false;
	if (this.y < view.y - this.height / 2)
		return false;
	if (this.x > view.x + view.width + this.width / 2)
		return false;
	if (this.y > view.y + view.height + this.height / 2)
		return false;
	return true;
}

Thing.prototype.weldto = function(other, x, y, myx, myy)
{
	this._attach(other, WELD, x, y, myx, myy);
}

Thing.prototype.springto = function(other, spring, x, y, myx, myy)
{
	this._attach(other, SPRING, x, y, myx, myy, spring);
}

Thing.prototype.axleto = function(other, x, y, myx, myy, minimum, maximum)
{
	this._attach(other, AXLE, x, y, myx, myy, 1.0, minimum, maximum);
}

Thing.prototype.dolater = function(func, timeout)
{
	game.settimer(func, this, timeout);
}

/////////////////////////////////////////////////////////////////////
//
// *** WARNING ***: variables and functions below this line 
// should NOT be modified or used outside of this source file
//
//


Thing.prototype._setxyvel = function(xvel, yvel, force)
{
	if (force && this.body_) {
		force *= tick;
		this.body_.ApplyLinearImpulse(new Box2D.b2Vec2(xvel * force, yvel * force), new Box2D.b2Vec2(this.x, this.y), true);
	}
	else {			
		this.xvel = xvel;
		this.yvel = yvel;
	}
}

Thing.prototype._attach = function(other, jointype, x, y, myx, myy, spring, minimum, maximum)
{
	if (!this.body_)
		this._update();
	if (!other.body_)
		other._update();
	var otherbody = other.body_;
	var anchora = new Box2D.b2Vec2(this.x + (myx ? myx : 0), this.y + (myy ? myy : 0));
	var anchorb = new Box2D.b2Vec2(other.x + (x ? x : 0), other.y + (y ? y : 0));
	var jdfn;
	if (jointype == WELD) {
		jdfn = new Box2D.b2WeldJointDef();
		jdfn.Initialize(this.body_, otherbody, anchora, anchorb);
	}
	else if (jointype == SPRING) {
		if (!spring || spring < 0) 
			spring = 0;
		else if (spring > 1)
			spring = 1;
		jdfn = new Box2D.b2DistanceJointDef();
		jdfn.Initialize(this.body_, otherbody, anchora, anchorb);
		jdfn.set_frequencyHz(spring * 5);
		jdfn.set_dampingRatio(spring);
	}
	else { // if (Jointype -- ROTATE)
		jdfn = new Box2D.b2RevoluteJointDef();
		jdfn.Initialize(this.body_, otherbody, anchora, anchorb);
		jdfn.set_collideConnected(false);
		if (minimum && maximum) { 
            jdfn.set_enableLimit(true);
			jdfn.set_lowerAngle((360 - minimum) * Math.PI / 180);
			jdfn.set_upperAngle((360 - maximum) * Math.PI / 180);
        }
	}

    var joint = game.world_.CreateJoint(jdfn)
	joints_.push(joint);
    this.joints_.push(joint);
    other.joints_.push(joint);
}

Thing.prototype._storestate = function()
{
	var state = this.state_;
	state.imagename_ = this.imagename;
	state.isflipped_ = this.isflipped;
	
	state.imagetext_ = this.imagetext;
	state.font_ = this.font;

	state.strokecolor_ = this.strokecolor;
	state.fillcolor_ = this.fillcolor;
	state.linewidth_ = this.linewidth;
	
	state.x_ = this.x;
	state.y_ = this.y;
	state.xvel_ = this.xvel;
	state.yvel_ = this.yvel;
	state.avel_ = this.avel;
	state.width_ = this.width;
	state.height_ = this.height;
	state.angle_ = this.angle;
	state.speed_ = this.speed;
	
	state.shape_ = this.shape;
	state.density_ = this.density;
	state.friction_ = this.friction;
	state.bounce_ = this.bounce;
	state.slowing_ = this.slowing;
	state.spinslowing_ = this.spinslowing;
	state.isturnable_ = this.isturnable;
	state.isfast_ = this.isfast;
	state.isfixed_ = this.isfixed;
	state.type_ = this.type;
}

Thing.prototype._updateproperties = function()
{
	if (this.state_.z_ != this.z) {
		this.state_.z_ = this.z;
		game.issorting_ = true;
	}
	
	if (this.body_) {
		var bpos = this.body_.GetPosition();
		this.x = bpos.get_x();
		this.y = bpos.get_y();
		this.angle = 360 - (this.body_.GetAngle() * 180 / Math.PI);
		var vel = this.body_.GetLinearVelocity();
		var avel = this.body_.GetAngularVelocity() * 180 / Math.PI;
		this.xvel = vel.get_x();
		this.yvel = vel.get_y();
		this.avel = avel;
	}
}

Thing.prototype._updateimage = function()
{
	if (this.imagename == INVISIBLE)
		return;
	if (this.imagename && !this.img_src_)
		this.state_.imagename_ = null; // force a reload
	if ((this.state_.imagename_ != this.imagename) || 
			(this.state_.imagetext_ != this.imagetext) ||
			(this.state_.strokecolor_ != this.strokecolor) ||
			(this.state_.fillcolor_ != this.fillcolor) ||
			(this.state_.linewidth_ != this.linewidth) ||
			(this.state_.font_ != this.font)) {
		if (this.imagename) {
			this.state_.imagename_ = this.imagename;
			if (!this.state_.imagename_) {
				this.img_src_ = null;
				return;
			}
			this.img_src_ = ASSET_MANAGER.getAsset(GFX + this.imagename + '.png');
			this.img_ = null; // force a redraw
		}
		else if (this.font && this.imagetext) {
			this.img_ = null;
			this.img_src_ = document.createElement('canvas');
			this.img_src_.width = this.width * game.scale_;
			this.img_src_.height = this.height * game.scale_;
			var fctx = this.img_src_.getContext('2d');
			fctx.font = Math.floor((this.height - this.linewidth * 2) * game.scale_) + 'px ' + this.font;
			fctx.textAlign = 'left';
			fctx.textBaseline = 'top';
			fctx.strokeStyle = this.strokecolor;
			fctx.lineWidth = Math.floor(game.scale_ * this.linewidth);
			fctx.strokeText(this.imagetext, this.linewidth, this.linewidth);
			fctx.fillStyle = this.fillcolor;
			fctx.fillText(this.imagetext, this.linewidth, this.linewidth);			
		}		
	}
}

function createPolygonShape(vertices) {
    var shape = new Box2D.b2PolygonShape();            
    var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
    var offset = 0;
    for (var i = 0; i < vertices.length; i++) {
        Box2D.setValue(buffer + (offset), vertices[i].get_x(), 'float'); // x
        Box2D.setValue(buffer + (offset + 4), vertices[i].get_y(), 'float'); // y
        offset += 8;
    }            
    var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
    shape.Set(ptr_wrapped, vertices.length);
    return shape;
}

Thing.prototype._updatebody = function()
{
	var state = this.state_;
	
	// properties that require deleting and re-adding the body
	if (this.body_ && (
			(state.bounce_ != this.bounce) 
			|| (state.density_ != this.density) 
			|| (state.shape_ != this.shape) 
			|| (state.isfixed_ != this.isfixed) 
			|| (state.width_ != this.width) 
			|| (state.height_ != this.height) 
			)) {
        destroybody(this);
	}

	// properties that can be modified in-place
	if (this.body_) {
		if ((state.x_ != this.x) || (state.y_ != this.y) || (state.angle_ != this.angle)) {
			// first, preserve the new values of any properties not being deliberately changed
			var bpos = this.body_.GetPosition();
			if (this.x == state.x_) this.x = bpos.get_x();
			if (this.y == state.y_) this.y = bpos.get_y();
			if (this.angle == state.angle_) this.angle = this.body_.GetAngle();
			this.body_.SetTransform(new Box2D.b2Vec2(this.x, this.y), (360 - this.angle) * Math.PI / 180);
		}
		if (state.isturnable_ != this.isturnable) 
			this.body_.SetFixedRotation(this.isturnable);
		if (state.slowing_ != this.slowing) 
			this.body_.SetLinearDamping(this.slowing);
		if (state.spinslowing_ != this.spinslowing) 
			this.body_.SetAngularDamping(this.spinslowing);
		if (state.isfast_ != this.isfast) 
			this.body_.SetBullet(this.isfast);
		if (state.avel_ != this.avel) 
			this.body_.SetAngularVelocity(this.avel * Math.PI / 180);
		if ((state.xvel_ != this.xvel) || (state.yvel_ != this.yvel)) 
			this.body_.SetLinearVelocity(new Box2D.b2Vec2(this.xvel, this.yvel));
	}

	if (!this.body_) {
		var bd = new Box2D.b2BodyDef();
		if (!this.isfixed)
			bd.set_type(Box2D.b2_dynamicBody);
		bd.set_position(new Box2D.b2Vec2(this.x, this.y));
		bd.set_angle((360 - this.angle) * Math.PI / 180);
		this.body_ = game.world_.CreateBody(bd);
		var fixtureDef = new Box2D.b2FixtureDef();
		var shape;
		var vertices = [];
		if (this.shape == CIRCLE) {	
			shape = new Box2D.b2CircleShape();
			shape.set_m_radius(this.width / 2);
		}
		else if (this.shape.length) {
			for (var i = 0; i < this.shape.length; i++)
				vertices.push(new Box2D.b2Vec2(this.shape[i][0] * this.width, 
											   this.shape[i][1] * this.height));
			shape = createPolygonShape(vertices);
		}
		fixtureDef.set_shape(shape);
		fixtureDef.set_density(this.density);
		fixtureDef.set_friction(this.friction);
		fixtureDef.set_restitution(this.bounce);
		if (this.collidetypes) {
			this.bits_ = 0;
			for (bit in this.collidetypes)
				this.bits_ += 1 << this.collidetypes[bit];
		}
		var filter = fixtureDef.get_filter();
		filter.set_categoryBits(1 << this.type);
		filter.set_maskBits(this.bits_);
		this.fixture_ = this.body_.CreateFixture(fixtureDef);
		this.fixture_.thingid_ = this.id_;
		this.body_.SetFixedRotation(!this.isturnable);
		this.body_.SetLinearDamping(this.slowing);
		this.body_.SetAngularDamping(this.spinslowing);
		this.body_.SetBullet(this.isfast);
		this.body_.SetLinearVelocity(new Box2D.b2Vec2(this.xvel, this.yvel));
		this.body_.SetAngularVelocity(this.avel * Math.PI / 180);
	}
}

Thing.prototype._draw = function() 
{
	if (this.imagename == INVISIBLE)
		return;
	var rads = (360 - this.angle) * Math.PI / 180;
	if (!this.img_src_) {
		if (!this.shape)
			return;
		// draw the circle/polygon
		ctx.strokeStyle = this.strokecolor;
		ctx.lineWidth = Math.floor(game.scale_ * this.linewidth);
		ctx.strokeText(this.imagetext, this.linewidth, this.linewidth);
		ctx.fillStyle = this.fillcolor;
		ctx.beginPath();
		if (this.shape == CIRCLE) {
			ctx.arc((this.x - (this.isoverlay ? 0 : view.x)) * game.scale_, 
				(this.y - (this.isoverlay ? 0 : view.y)) * game.scale_, this.width * game.scale_ / 2, 0, 2 * Math.PI);
		}
		else {
			for (var i = 0; i < this.shape.length; i++) {
				var asin = Math.sin(rads);
				var acos = Math.cos(rads);
				var sx = this.shape[i][0] * this.width;
				var sy = this.shape[i][1] * this.height;
				x = (this.x - (this.isoverlay ? 0 : view.x) + sx * acos - sy * asin) * game.scale_;
				y = (this.y - (this.isoverlay ? 0 : view.y) + sy * acos + sx * asin) * game.scale_;
				if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
			}
			ctx.closePath();
		}
		ctx.fill();
		ctx.stroke();
		return;
	}
		
	if ( (!this.img_) || 
		 (this.angle != this.state_.angle_) ||
		 (this.state_.scale_ != game.scale_) ||
		 (this.width != this.state_.width_) ||
		 (this.height != this.state_.height_) ||
		 (this.isflipped != this.state_.isflipped_) ) {
		 
		this.img_ = document.createElement('canvas');
		var size = Math.max(this.width, this.height) * 1.4;
		var width = this.width * game.scale_;
		var height = this.height * game.scale_;
		this.img_.width = size * game.scale_;
		this.img_.height = size * game.scale_;
		
		var tempctx = this.img_.getContext('2d');
		tempctx.save();
		tempctx.translate(this.iscentered ? this.img_.width / 2 : 0, 
			this.iscentered ? this.img_.height / 2 : 0);
		tempctx.rotate(rads);
		tempctx.translate(0, 0);
		tempctx.scale(this.isflipped ? -1 : 1, 1);
		tempctx.drawImage(this.img_src_, this.iscentered ? -width / 2 : 0, 
			this.iscentered ? -height / 2 : 0, width, height);
		tempctx.restore();
		
		this.isflipped_ = this.isflipped;
		this.state_.scale_ = game.scale_;
	}
    ctx.drawImage(this.img_, (this.x - (this.isoverlay ? 0 : view.x)) * game.scale_- 
								(this.iscentered ? this.img_.width / 2 : 0), 
							 (this.y - (this.isoverlay ? 0 : view.y)) * game.scale_ - 
								(this.iscentered? this.img_.height / 2 : 0));
}

Thing.prototype._update = function()
{
	this._updatebody();
	this._updateproperties();
	this._updateimage();
	this._draw();
	this._storestate();
}

/////////////////////////////////
//
// browser window housekeeping
//

var canvas_ = document.getElementById('gamescreen');
var ctx = canvas_.getContext('2d');

window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function(callback, element){
                window.setTimeout(callback, 1000 / 60);
              };
})();

function preventEvent(e)
{
	e.preventDefault();
}

document.onkeydown = preventEvent;
document.onclick = preventEvent;
document.onmousedown = preventEvent;
document.onmouseup = preventEvent;
document.ondblclick = preventEvent;
document.onmousemove = preventEvent;
document.onmouseover = preventEvent;

function pageWidth() {return window.innerWidth;}
function pageHeight() {return window.innerHeight;} 
function checksize() 
{
	if (!canvas_)
		return;
	game.setsize();
}

////////////////////////////////
//
// asset manager for loading graphics
//

var ASSET_PENDING = 'pending';

function AssetManager() 
{
	this.pendingdownloads = 0;
    this.cache = {};
}

AssetManager.prototype.download = function(path, downloadCallback) 
{
	this.pendingdownloads++;
	var img = new Image();
	img.src = path;
	var manager = this;
	manager.cache[path] = ASSET_PENDING;
	img.addEventListener("load", function() {
		console.log(this.src + ' is loaded');
		manager.cache[path] = this;
		manager.pendingdownloads--;
		if (!manager.pendingdownloads && downloadCallback)
			downloadCallback();
	}, false);
	img.addEventListener("error", function() {
		console.log(this.src + ' error');
		manager.pendingdownloads--;
		if (!manager.pendingdownloads && downloadCallback)
			downloadCallback();
	}, false);
}

AssetManager.prototype.getAsset = function(path) 
{
	var asset = this.cache[path];
	if (!asset)
		this.download(path);
	else if (asset != ASSET_PENDING)
		return asset;
}

var ASSET_MANAGER = new AssetManager();

////////////////////////////////////////
//
//  timer to handle fractional frame movement
//

function Timer() 
{
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function() 
{
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;
    
    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

//////////////////////////
//
// global game object
//

var game;

function GameEngine() 
{
    this.ctx = null;
    this.timer = new Timer();

	this.pressfunc = null;
	this.releasefunc = null;
	this.dragfunc = null;
    this.keyupfunc = null;
    this.keydownfunc = null;

	this.screen_ = {width:0, height:0};
	this.view_width_ = 0;
	this.view_height_ = 0;
	this.view_aspect_ = 0;
	this.scale_ = 0;
	
	this.holdmap_ = {}
	this.pressmap_ = {}
	
	this.backimg_ = null;
	this.backname_ = null;
	
	this.tiletype_ = {};
	this.tileimg_ = {};
	this.tilesrc_ = {};
	
	this.issorting_ = false;
	
	this.ispressing_ = false;
	this.isdragging_ = false;
	this.isreleasing_ = false;
	
	this.focusthing_ = null;
	
	this.thinglist_ = [];
	this.thingmap_ = {};
	this.thingid_ = 0;
	
	this.sounds_ = {};
	
	this.timers_ = {};
	this.timernum_ = 0;
	
	this.gravity_ = new Box2D.b2Vec2(0.0, 0.0);
	this.world_ = new Box2D.b2World(this.gravity_);
	
	this.contactlistener_ = new Box2D.JSContactListener();
	this.contactlistener_.BeginContact = begincontact;
	this.contactlistener_.EndContact = endcontact;
	this.contactlistener_.PreSolve = function() {};
	this.contactlistener_.PostSolve = function() {};
	this.world_.SetContactListener(this.contactlistener_);
	
	this.setsize();
	
}

GameEngine.prototype.addthing = function(thing)
{
	this.thinglist_.push(thing);
	this.thingid_++;
	thing.id_ = this.thingid_;
	this.thingmap_[thing.id_] = thing;
}

GameEngine.prototype.init = function() 
{
    this.ctx = ctx;
    this.startInput();
    
    console.log('game initialized');
//	startgame(); // this.startFunc();
	this.start();
}

GameEngine.prototype.start = function() 
{
    console.log("starting game");
    (function gameLoop() {
        game.loop();
        requestAnimFrame(gameLoop, game.ctx.canvas);
    })();
}

GameEngine.prototype.settimer = function(timerfunc, timerdata, timeout)
{
	this.timers_[this.timernum_++] = {func: timerfunc, data: timerdata, timeleft: timeout};
}

function pointerdown()
{
	pointer.isdown = true;
	game.ispressing_ = true;
}

function pointermove(x, y)
{
	pointer.x = x;
	pointer.y = y;
}

function pointerup()
{
	pointer.isdown = false;
	game.isreleasing_ = true;
}

function mouseDown(e) 
{
	ctx.canvas.focus();
	pointerdown();
	mouseMove(e);
	game.holdmap_[CLICK] = true;
	game.pressmap_[CLICK] = true;
}

function mouseMove(e)
{
	if (game.scale_ == 0) // (!pointer.isdown || (game.scale_ == 0))
		return;
	pointermove((e.clientX - game.ctx.canvas.getBoundingClientRect().left) / game.scale_, 
				(e.clientY - game.ctx.canvas.getBoundingClientRect().top) / game.scale_);
	e.preventDefault();
    if (game.holdmap_[CLICK])
        game.isdragging_ = true;
}

function mouseUp(e)
{
	mouseMove(e);
	pointerup();
	game.holdmap_[CLICK] = false;
}

function touchDown(e)
{
	pointerdown();
	touchMove(e);
	e.preventDefault();
}

function touchMove(e)
{
	if (game.scale_ != 0) {
		pointermove((e.targetTouches[0].pageX - game.ctx.canvas.offsetLeft) / game.scale_, 
					(e.targetTouches[0].pageY - game.ctx.canvas.offsetTop) / game.scale_);
	}
	e.preventDefault();
	game.event_ = MOVE;
    game.isdragging_ = true;
}

function touchUp(e)
{
	touchMove(e);
	pointerup();
}


function keydownEvent(e)
{
    if (game.keydownfunc && !e.repeat)
        game.keydownfunc(e.keyCode);
}

function keyupEvent(e)
{
    if (game.keyupfunc)
        game.keyupfunc(e.keyCode);
}


function keydownEvent(e)
{
	game.holdmap_[e.keyCode] = true;
	game.pressmap_[e.keyCode] = true;
}

function keyupEvent(e)
{
	game.holdmap_[e.keyCode] = false;
}

GameEngine.prototype.startInput = function() 
{
	ctx.canvas.addEventListener("mousedown", mouseDown, false);
	ctx.canvas.addEventListener("mousemove", mouseMove, false);
	document.body.addEventListener("mouseup", mouseUp, false);

	ctx.canvas.addEventListener("touchstart", touchDown, false);
	ctx.canvas.addEventListener("touchmove", touchMove, true);
	ctx.canvas.addEventListener("touchend", touchUp, false);
	document.body.addEventListener("touchcancel", touchUp, false);
	
	document.addEventListener('keydown', keydownEvent, false);
	document.addEventListener('keyup', keyupEvent, false);	
}

GameEngine.prototype.drawTile = function(row, col)
{
	if ((row < 0) || (row >= this.board_.rows) ||
			(col < 0) || (col >= this.board_.columns))
		return;

	var data = game.tiletype_[tile(col, row)];
	if (data) {
		if (data.imagename != data.state_imagename_) {
			data.state_imagename_ = data.imagename;
			data.state_.img_ = null;
			data.state_.img_src_ = ASSET_MANAGER.getAsset(GFX + data.imagename + '.png');
			if (!data.state_.img_src_)
				data.state_imagename_ = null; // not loaded yet
		}
		if (game.scale_ != data.state_.scale_) {
			data.state_.scale_ = game.scale_;
			data.state_.img_ = null;
		}
		var tileimg = data.state_.img_;
		if (!tileimg) {
			var tilesrc = data.state_.img_src_;
			if (!tilesrc)
				return;
			// transform the source and save it in the tileimg cache
			tileimg = document.createElement('canvas');
			tileimg.width = board.tilesize * game.scale_;
			tileimg.height = tileimg.width;
			tileimg.getContext('2d').drawImage(tilesrc, 0, 0, tileimg.width, tileimg.height);
			data.state_.img_ = tileimg;
		}
		ctx.drawImage(tileimg, (col * board.tilesize - view.x) * game.scale_, 
			(row * board.tilesize - view.y) * game.scale_);
	}
	
}

GameEngine.prototype.tile = function(col, row)
{
	col = Math.floor(col);
	row = Math.floor(row);
	if (!this.board_)
		return;
	if ((row < 0) || (row >= this.board_.length))
		return ' ';
	if ((col < 0) || (col >= this.board_[row].length))
		return ' ';
	return this.board_[row][col];
}

GameEngine.prototype.setsize = function()
{
	var maxwidth = pageWidth() - 20;
	var maxheight = pageHeight() - 25;
	
	this.aspect_ = view.aspect;
	if (maxwidth / maxheight > view.aspect) {
		canvas_.height = maxheight;
		canvas_.width = maxheight * view.aspect;
	}
	else {
		canvas_.width = maxwidth;
		canvas_.height = maxwidth / view.aspect;
	}
	
	this.screen_.width_ = canvas_.width;
	this.screen_.height_ = canvas_.height;
	
	if (this.view_aspect_ != view.aspect) {
		this.view_aspect_ = view.aspect;
		this.view_width_ = null;
		this.view_height_ = null;
	}
	if (this.view_width_ != view.width) {
		this.view_width_ = view.width;
		this.view_height_ = view.height = view.width / view.aspect;
	}
	else {
		this.view_height_ = view.height;
		this.view_width_ = view.width = view.height * view.aspect;
	}
	
	this.scale_ = this.screen_.height_ / view.height;

	// all images will need rescaling
	this.backimg_ = null;
	this.tileimg_ = {};
}

function processcontact(contactPtr, isBegin)
{
	var contact = Box2D.wrapPointer(contactPtr, Box2D.b2Contact);
	var fixtureA = contact.GetFixtureA();
	var fixtureB = contact.GetFixtureB();
	var thingA = game.thingmap_[fixtureA.thingid_];
	if (!thingA && ('tiledata_' in fixtureA))
		thingA = fixtureA.tiledata_;
	var thingB = game.thingmap_[fixtureB.thingid_];
	if (!thingB && ('tiledata_' in fixtureB))
		thingB = fixtureB.tiledata_;
	if (thingA && thingB) {
		if (thingA.collidefunc)
			thingA.collidefunc(thingA, thingB, isBegin);
		if (thingB.collidefunc)
			thingB.collidefunc(thingB, thingA, isBegin);
	}
}

GameEngine.prototype.clear = function()
{
    isclearing_ = true;
    for (var i = 0; i < joints_.length; i++)
        this.world_.DestroyJoint(joints_[i]);
    joints_ = [];
	for (var i = 0; i < this.thinglist_.length; i++) {
		thing = this.thinglist_[i];
		thing.isdeleted = true;
		if (thing.body_) 
            destroybody(thing);
	}
	this.thinglist_ = [];
	this.thingmap_ = {};
	if (game.boardbody_) {
		game.world_.DestroyBody(game.boardbody_);
		game.boardbody_ = null;
	}
	game.board_ = null;
	
	game.pressfunc = null;
	game.releasefunc = null;
	game.dragfunc = null;

	game.backimg_ = null;
	game.backname_ = null;
	
//	this.timers_ = {};
	
	board.columns = 0;
	board.rows = 0;
	view.x = 0;
	view.y = 0;
	this.pressmap_ = {};
    this.holdmap_ = {};
}

function begincontact(contactPtr) { processcontact(contactPtr, true); }
function endcontact(contactPtr) { processcontact(contactPtr, false); }

GameEngine.prototype.loop = function() 
{
    tick = this.timer.tick();

	var timernum;
	for (timernum in this.timers_) {
		var mytimer = this.timers_[timernum];
		mytimer.timeleft -= tick;
		if (mytimer.timeleft <= 0) {
			if (mytimer.func && !(mytimer.data && mytimer.data.isdeleted))
				mytimer.func(mytimer.data);
			delete this.timers_[timernum];
		}
	}
    if (isclearing_) { isclearing_ = false; return; }
	
	if ((this.scale_ == 0) || (this.view_width_ != view.width) || 
			(this.view_height_ != view.height) || (this.view_aspect_ != view.aspect))
		this.setsize();

    ctx.clearRect(0, 0, canvas_.width, canvas_.height);

	if (!this.backimg_ && this.backname_) {
		var tempimg = ASSET_MANAGER.getAsset(BKG + this.backname_ + '.jpg');
		if (tempimg) {
			var backscale = Math.max(this.screen_.width_ / tempimg.width, this.screen_.height_ / tempimg.height);
			this.backimg_ = document.createElement('canvas');
			this.backimg_.width = tempimg.width * backscale;
			this.backimg_.height = tempimg.height * backscale;
			var tempctx = game.backimg_.getContext('2d');
			tempctx.drawImage(tempimg, 0, 0, this.backimg_.width, this.backimg_.height);
		}
	}
	if (this.backimg_)
		ctx.drawImage(this.backimg_, 0, 0);
	
	if (this.board_) {
		var starty = Math.floor(view.y / board.tilesize);
		var endy = Math.floor(starty + (view.height / board.tilesize) + 2);
		var startx = Math.floor(view.x / board.tilesize);
		var endx = Math.floor(startx + (view.width / board.tilesize) + 2);
		var row, col;
		for (row = starty; row < endy; row++)
			for (col = startx; col < endx; col++)
				this.drawTile(row, col);
	}

	this.world_.Step(tick, 2, 2);
	
	var thing;
	if (this.issorting_)
		this.thinglist_.sort(function(a, b) { return b.z - a.z; });
	var i;
	
	// handle events
	if (this.ispressing_) {
		for (i = this.thinglist_.length - 1; 
				(i >= 0) && (i < this.thinglist_.length) && this.ispressing_; i--) {
			thing = this.thinglist_[i];
			if (!thing.isdeleted && (thing.pressfunc || thing.dragfunc) && 
					thing.contains(pointer.x, pointer.y)) {
				this.focusthing_ = thing;
				if (thing.pressfunc && thing.pressfunc(thing, pointer.x + view.x, pointer.y + view.y))
					this.ispressing_ = false;
                if (isclearing_) { isclearing_ = false; return; }
			}
		}
		if (this.ispressing_ && this.pressfunc)
			this.pressfunc(pointer.x + view.x, pointer.y + view.y);
        if (isclearing_) { isclearing_ = false; return; }
	}
	if (this.isdragging_) {
		thing = this.focusthing_;
		if (!thing || !thing.dragfunc || !thing.dragfunc(thing, pointer.x + view.x, pointer.y + view.y))
			if (this.isdragging_ && this.dragfunc)
				this.dragfunc(pointer.x + view.x, pointer.y + view.y);
        if (isclearing_) { isclearing_ = false; return; }
	}
	if (this.isreleasing_) {
		thing = this.focusthing_;
		if (thing && !thing.isdeleted && thing.releasefunc) {
			if (thing.releasefunc(thing, pointer.x + view.x, pointer.y + view.y))
				this.isreleasing_ = false;
		}
        if (isclearing_) { isclearing_ = false; return; }
		if (this.isreleasing_ && this.releasefunc)
			this.releasefunc(pointer.x + view.x, pointer.y + view.y);
        if (isclearing_) { isclearing_ = false; return; }
		this.isdragging_ = false;
		this.focusthing_ = null;
	}
	this.ispressing_ = false;
	this.isreleasing_ = false;
	
	if (game.framefunc)
		game.framefunc();
	
    if (isclearing_) { isclearing_ = false; return; }

//    ctx.save();
	
	i = 0;
	while (i < this.thinglist_.length) {
		thing = this.thinglist_[i]
		if (thing.isdeleted) {
			game.world_.DestroyBody(thing.body_);
            thing.body_ = null;
			this.thinglist_.splice(i, 1);
			delete this.thingmap_[thing.id_];
		}
		else {
			thing._update();
			if (thing.framefunc)
				thing.framefunc(thing);
            if (isclearing_) { isclearing_ = false; return; }
			i++;
		}
	}
	
//    ctx.restore();
		
	this.pressmap_ = {};
}

/////////////////////////////////
//
// engine initialization
//

document.body.style.background = "#000000";
window.onresize = checksize;
game = new GameEngine();
game.init();

