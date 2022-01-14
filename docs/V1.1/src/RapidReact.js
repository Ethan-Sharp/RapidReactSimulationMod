
var robot;
var arrow;
var ballvel = 1;
var ballangle = 90;
var ballspin = 0;

var stats;

function maketarget(x, y)
{
    t = new Thing();
    t.shape = CIRCLE;
    t.isfixed = true;
    t.x = x;
    t.y = y;
    t.width = t.height = 0.05;
}

function makeside(x, y, w, a)
{
    t = new Thing();
    t.isfixed = true;
    t.x = x;
    t.y = y;
    t.angle = a;
    t.width = w;
    t.height = 0.05;
}

function deleteit(o) { o.isdeleted = true; }

function sanefloat(x) {
    return Number.parseFloat(x).toFixed(2);
}

function updatestats()
{
    stats.imagetext = "angle:" + sanefloat(ballangle) + 
        " vel:" + sanefloat(ballvel) + " m/s, spin:" + sanefloat(ballspin / 360) + "rps";
}

function aim()
{
    if (isholding(LEFT))
        robot.xvel = -1;
    else if (isholding(RIGHT))
        robot.xvel = 1;
    if (isholding(UP))
        ballspin += tick * 3600;
    else if (isholding(DOWN))
        ballspin -= tick * 3600;
    x = pointer.x;
    y = pointer.y;
    drawline(x, y, robot.x, robot.y - 0.5, 'yellow', 0.02);
    arrow.pointat(x, y);
    dist = arrow.distanceto(x, y);
    ballvel = dist * 5;
    ballangle = arrow.angle;
    updatestats();
}

function shoot()
{
    ball = new Thing();
    ball.shape = CIRCLE;
    ball.imagename = "cargo_ball";
    ball.bounce = 0.75;
    ball.width = ball.height = 0.24;

    ball.x = robot.x;
    ball.y = robot.y - 0.5;
    
    ball.setvelocity(ballangle, ballvel);
    ball.avel = ballspin;

    ball.dolater(deleteit, 3);
}

function startgame()
{
    setbackground('sky');
    setgravity(0, 9.80665);
    
    view.width = 8;
    view.height = 6;

    stats = new Thing();
    stats.x = 5;
    stats.y = 0.2;
    stats.width = 8;
    stats.height = 0.2;
    stats.isfixed = true;
    stats.isoverlay = true;
    stats.type = GHOSTTYPE;
    
    ground = new Thing();
    ground.isfixed = true;
    ground.x = 4;
    ground.y = 6;
    ground.width = 20;
    ground.height = 4;
    ground.fillcolor = 'rgb(84, 84, 84)';
    ground.strokecolor = 'rgb(84, 84, 84)';
    
    robot = new Thing();
    robot.width = 0.80;
    robot.height = 0.2;
    robot.slowing = 10;
    robot.isturnable = false;
    robot.x = 4;
    robot.y = 4;

    arrow = new Thing();
    arrow.x = robot.x;
    arrow.y = robot.y - 0.5;
    arrow.type = GHOSTTYPE;
    arrow.width = 0.001;
    arrow.height = 0.001;
    arrow.weldto(robot);
    
    robotlabel = new Thing();
    robotlabel.x = robot.x;
    robotlabel.y = robot.y;
    robotlabel.isturnable = false;
    robotlabel.width = robot.width;
    robotlabel.height = 0.2;
    robotlabel.iscentered = true;
    robotlabel.imagetext = '4451';
    robotlabel.fillcolor = 'white';
    robotlabel.strokecolor = 'black'
    robotlabel.weldto(robot)
    
    gy = ground.y - ground.height / 2;
    upperwid = 1.22;
    lowerwid = 1.53;
    
    maketarget(ground.x - 2 - upperwid / 2, gy - 2.64);
    maketarget(ground.x - 2 + upperwid / 2, gy - 2.64);

    maketarget(ground.x - 2 - lowerwid / 2, gy - 1.04);
    maketarget(ground.x - 2 + lowerwid / 2, gy - 1.04);
    
    makeside(ground.x - 2.40, gy - 2.25, 0.6, -65);
    makeside(ground.x - 1.62, gy - 2.25, 0.6, 65);
    makeside(ground.x - 2, gy - 2.1, 0.1, 0);
    
    game.framefunc = aim;
    game.pressfunc = shoot;
    
    updatestats();
}

startgame();