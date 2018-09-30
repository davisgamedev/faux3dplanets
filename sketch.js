let pcanvas = document.querySelector("#planet-canvas");
let pctx = pcanvas.getContext('2d');

let res = 240;
let planet_rad = res * 2/3;
let city_reres = 2;

let keepCanvases = true;

let topLeftPlanet = {
    x: (pcanvas.width/2) - planet_rad,
    y: (pcanvas.height/2) - planet_rad
};

const PLANET_LAYER_ORDER = {
    BODY: 0,
    WATER: 1,
    CITY: 2,
    CLOUDS: 3
}

function quickLayer(width=res, height=null) {
    console.warn("creating new canvas");
    height = height||width;
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    if(keepCanvases) document.body.appendChild(canvas);
    return {canvas: canvas, ctx: canvas.getContext('2d')};
}

function drawLayer(initFn, drawFn, rx=1, ry=1, smoothA=true, scale=1, size=res) {
    console.log("rx: ", rx, ", ry:", ry);
    newNoise();
    let layer = quickLayer(size);
    initFn(layer.ctx, layer.canvas);
    for(let x = 0; x < 1; x+= 1/layer.canvas.width) {
        for (let y = 0; y < 1; y += 1/layer.canvas.height) {
            let a = fetchTileableNoise(x, y, scale);
            if (smoothA) a = smooth(a);
            drawFn(layer.ctx, x*layer.canvas.width, y*layer.canvas.height, a, scale);
        }
    }
    resizeRepeat(layer.ctx, layer.canvas, rx, ry);
    return layer;
}

function drawStar() {
    let sun = quickLayer();
    sun.ctx.strokeStyle = assembleHSB(randomTo(255), randomRange(50, 80), randomRange(80, 90));
    sun.ctx.fillStyle = "white";
    let radius = sun.canvas.width/16;
    sun.ctx.lineWidth = 2;
    for(let i = 0; i < sun.canvas.width/2; i++) {
        sun.ctx.beginPath();
        sun.ctx.arc(sun.canvas.width/2, sun.canvas.height/2, radius, 0, Math.PI*2);
        if(i <= 0) {
            sun.ctx.globalAlpha = 1;
            sun.ctx.fill();
            sun.ctx.globalCompositeOperation = "lighter";
        }
        sun.ctx.stroke();
        sun.ctx.globalAlpha = map(i, 0, sun.canvas.width/2, 0.75, -0.2);
        console.log(sun.ctx.globalAlpha);
        radius++;
    }
    return sun;
}

function drawCities(ctx, x, y, scale) {
    
    //draws smaller cities around and behind, then a central unit
    ctx.fillRect(x-1, y, 1, 1);
    ctx.fillRect(x-1, y-1, 1, 1);
    ctx.fillRect(x, y-1, 1, 1);
    ctx.fillRect(x, y, randomTo(2), randomTo(2));

    if(!flipCoin(0.25)) return;
    // draw roads
    //check for nearby cities
    for(var i = randomRange(1, 8); i >= 0; i--){
        var ex = (x + randomRange(-12, 12))/res;
        var ey = (y + randomRange(-12, 12))/res;
        if(
            fetchTileableNoise(ex, ey, scale) <= 0.6 &&
            fetchTileableNoise((ex + x/res)/2, (ey + y/res)/2, scale) <= 0.6
        ){
            ctx.globalAlpha -= 0.2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(
                randomRange(x, ex*res), 
                randomRange(y, ey*res), 
                randomRange(x, ex*res), 
                randomRange(y, ey*res), ex*res, ey*res);
            ctx.stroke();
        }
    }
}

function planetSketch() {
    let sky = drawLayer(
        (ctx, canvas) => {
            ctx.fillStyle = "rgb(10, 0, 20)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        },
        (ctx, x, y) => {
            //todo: nebulae with a value
            // percent distribution of 5000 stars over a 2048*2048 area
            if (!flipCoin(0.0119209289)) return;
            ctx.fillStyle = assembleHSB(randomTo(360), randomTo(60), 80);
            let starsz = randomTo(1);
            ctx.fillRect(x, y, starsz, starsz);
        },
        1, 1, false, 1, res*3
    );

    let sun = drawStar();

    let flatPlanetLayers = [];

    let body = drawLayer(
        (ctx, canvas) => {
            ctx.fillStyle = getRandomRGB();
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = getRandomRGB();
        },
        (ctx, x, y, a) => {
            ctx.globalAlpha = a;
            ctx.fillRect(x, y, 1, 1);
        }, 2, 1
    );

    body.ctx.fillStyle="red";
    body.ctx.fillRect(100, 100, 50, 50);

    flatPlanetLayers.push(body);

    /*
        water and cities are drawn together because city placement
        is based on distances to bodies of water 
        city calculations are loosely based on:
            - luck1: first chance of existing (7%)
            - luck2: second chance of existing (factored into a probability equation)
            - distance to the equator + distance to the coast + luck2 > some value
    */
    let city = quickLayer(res*city_reres);

    let water = drawLayer(
        (ctx) => {
            ctx.fillStyle = getRandomRGB();
            city.ctx.fillStyle = "white";
            city.ctx.strokeStyle = "white";
        },
        (ctx, x, y, a, scale) => {
            if ( a > 0.6 ) {
                a = smooth(a);
                ctx.globalAlpha = a + 0.1;
                ctx.fillRect(x, y, 1, 1);
            }
            else if(flipCoin(0.07)) {
                let equator = 1 - Math.abs(y/res - 0.5)*2;
                let coast = a/0.6;
                let luck = Math.random();

                if (equator + coast*25 + luck > 0.7 * 4.5) {
                    city.ctx.globalAlpha = Math.random();
                    drawCities(city.ctx, x*city_reres, y*city_reres, scale);
                }
            }
        },
        3, 1, false, randomRange(0.4, 1.2)
    );
    resizeRepeat(city.ctx, city.canvas, 3, 1);
    flatPlanetLayers.push(water);

    let clouds = [];
    let h = randomTo(360);
    for (let i = 0; i < 3; i++) {
        clouds.push(
            drawLayer(
                (ctx) => ctx.fillStyle = assembleHSB(h, 80, 60+i*20),
                (ctx, x, y, a) => {
                    if(a > 0.4) {
                        ctx.globalAlpha = a - 0.2;
                        ctx.fillRect(x, y, 1, 1);
                    }
                },
                1, 2, true, 0.4 + (i*0.1)
            )
        );
    }

    let mask = quickLayer(res*3);
    mask.ctx.drawImage(sky.canvas, 0, 0, mask.canvas.width, mask.canvas.height);
    mask.ctx.beginPath();
    mask.ctx.arc(mask.canvas.width/2, mask.canvas.height/2, planet_rad, 0, Math.PI * 2);
    mask.ctx.clip();
    mask.ctx.clearRect(0, 0, mask.canvas.width, mask.canvas.height);

    let preparedPlanetYLayers = flatPlanetLayers.map(
        l => prepareCanvasWarpY(l.canvas)
    );

    let preparedPlanetXLayers = [];
    for(let i = 0; i < preparedPlanetYLayers.length; i++) {
        preparedPlanetXLayers.push(quickLayer(planet_rad*2, planet_rad*2));
    }

    let combined = quickLayer(planet_rad*2);

    let rot = 0;
    let speed = 0.01;
    let doUpdate = false;

    let update = () => {
        
        preparedPlanetXLayers.forEach(
            (lx, i) => {
                warpCanvasViewX(preparedPlanetYLayers[i], lx, rot+=speed);
                if (i === PLANET_LAYER_ORDER.WATER) {
                    lx.ctx.globalAlpha = 0.4;
                    lx.ctx.globalCompositeOperation = "source-atop";
                    lx.ctx.drawImage(sky.canvas, 0, 0, lx.canvas.width, lx.canvas.height);
                    lx.ctx.globalAlpha = 0.8;
                    lx.ctx.drawImage(sun.canvas, 80, -40, lx.canvas.width, lx.canvas.height);
                }
                combined.ctx.drawImage(lx.canvas, 0, 0);
            }
        );
        
        pctx.drawImage(combined.canvas, topLeftPlanet.x, topLeftPlanet.y, planet_rad*2, planet_rad*2);
        pctx.drawImage(mask.canvas, 0, 0, pcanvas.width, pcanvas.height);
        if(rot > 1) rot = -1;
        if(doUpdate) requestAnimationFrame(update);
    };
    update();

    window.onkeydown = function(e) { 
        return !(e.keyCode == 32);
    };
    document.addEventListener("keyup", (e) => {
        if (e.keyCode == 32) {
            if(!doUpdate){
                doUpdate = true;
                update();
            }
            else doUpdate = false;
        }
    });

}

planetSketch();