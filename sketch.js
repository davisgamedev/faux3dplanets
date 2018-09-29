let pcanvas = document.querySelector("#planet-canvas");
let pctx = pcanvas.getContext('2d');

let res = 240;
let planet_rad = res * 2/3;

let topLeftPlanet = {
    x: (pcanvas.width/2) - planet_rad,
    y: (pcanvas.height/2) - planet_rad
};

/**
 * Draws an image to another canvas with optional repeating
 * @param {int?} rx - repeat in x direction
 * @param {int?} ry - repeat in y direction
 */
function repeatDrawCanvas(toCanvas, toCtx, fromCanvas, rx=null, ry=null) {
    if(!rx && !ry) {
        toCtx.drawImage(fromCanvas, 0, 0, toCanvas.width, toCanvas.height);
    }
    else {
        let scalex = toCanvas.width/rx;
        let scaley = toCanvas.height/ry;
        for(let i = 0; i < rx; i++ ) {
            for(let j = 0; j < ry; j++) {
                toCtx.drawImage(fromCanvas, scalex*i, scaley*j, scalex, scaley);
            }
        }
    }
}

/**
 * repeats x and y and morphs y-axis of a canvas
 */
function prepareLayerCanvas(canvas, rx=1, ry=1) {
    let newCanvas = quickLayerCanvas(planet_rad*rx*4, planet_rad*ry*2);
    newCtx = newCanvas.getContext("2d");
    
    repeatDrawCanvas(newCanvas, newCtx, canvas, rx, ry);
    return warpCanvasY(newCanvas, newCtx);
}

function warpCanvasY(canvas, ctx) {
    let data1 = ctx.getImageData(0, 0, canvas.width, canvas.height);
    //let data2 = ctx.createImageData(canvas.width, canvas.height);
    let data2 = new ImageData(canvas.width, canvas.height);
    for(var y = 0; y < canvas.height; y++) {
        let dy = map(y, 0, canvas.height, -1, 1);
        let my = Math.floor(map(Math.acos(dy), 0, Math.PI, 0, canvas.height));
        for(var x = 0; x < canvas.width; x++) {
            let r = (y*canvas.width*4) + (x*4);
            let r1 = (my*canvas.width*4) + (x*4);
            data2.data[r] = data1.data[r1];
            data2.data[r+1] = data1.data[r1+1];
            data2.data[r+2] = data1.data[r1+2];
            data2.data[r+3] = data1.data[r1+3];
        }
    }
    let newCanvas = quickLayerCanvas(canvas.width, canvas.height);
    let newCtx = newCanvas.getContext('2d');
    newCtx.putImageData(data2, 0, 0, 0, 0, canvas.width, canvas.height);
    return { canvas: newCanvas, ctx: newCtx };
}

//rotation: -1.0 => 1.0
function warpCanvasViewX(fromCanvas, fromCtx, toCanvas, toCtx, rotation) {

    /*
        Rotation goes from -1 to 1
    */
    let fromx = map(rotation, -1, 1, fromCanvas.width, 0);
    let tox = fromx + fromCanvas.width/2;

    let data1 = fromCtx.getImageData(0, 0, fromCanvas.width, fromCanvas.height);
    //let data2 = ctx.createImageData(canvas.width, canvas.height);
    let data2 = new ImageData(toCanvas.width, toCanvas.height);
    for(var x = fromx; x < tox; x++) {
        let ux = map(x, fromx, tox, 0, toCanvas.width);
        let dx = map(x, fromx, tox, -1, 1);
        let mx = Math.floor(map(Math.acos(dx), 0, Math.PI, fromx, tox));
        if(mx > fromCanvas.width) mx %= fromCanvas.width;
        for(var y = 0; y < fromCanvas.height; y++) {
            let r = (y*toCanvas.width*4) + ((ux*4));
            let r1 = (y*fromCanvas.width*4) + (mx*4);
            data2.data[r] = data1.data[r1];
            data2.data[r+1] = data1.data[r1+1];
            data2.data[r+2] = data1.data[r1+2];
            data2.data[r+3] = data1.data[r1+3];
        }
    }
    toCtx.putImageData(data2, 0, 0, 0, 0, toCanvas.width, toCanvas.height);
    return { canvas: toCanvas, ctx: toCtx };
} 

function quickLayerCanvas(width=res, height=null) {
    height = height||width;
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    return canvas;
}

function layer(initFn, drawFn, smoothA=true, scale=1, size=res) {
    newNoise();
    let canvas = quickLayerCanvas(size);
    let ctx = canvas.getContext('2d');
    initFn(ctx, canvas);
    for(let x = 0; x < 1; x+= 1/canvas.width) {
        for (let y = 0; y < 1; y += 1/canvas.height) {
            let a = fetchTileableNoise(x, y, scale);
            if (smoothA) a = smooth(a);
            drawFn(ctx, x*canvas.width, y*canvas.height, a, scale);
        }
    }
    return { canvas: canvas, ctx: ctx };
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
    let sky = layer(
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
        false, 1, res*3
    );

    let body = layer(
        (ctx, canvas) => {
            ctx.fillStyle = getRandomRGB();
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = getRandomRGB();
        },
        (ctx, x, y, a) => {
            ctx.globalAlpha = a;
            ctx.fillRect(x, y, 1, 1);
        }
    );

    body.ctx.fillStyle="red";
    body.ctx.fillRect(100, 100, 50, 50);

    /*
        water and cities are drawn together because city placement
        is based on distances to bodies of water 
        city calculations are loosely based on:
            - luck1: first chance of existing (7%)
            - luck2: second chance of existing (factored into a probability equation)
            - distance to the equator + distance to the coast + luck2 > some value
    */
    let city = { canvas: quickLayerCanvas() };
    city.ctx = city.canvas.getContext('2d');

    let water = layer(
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
                    drawCities(city.ctx, x, y, scale);
                }
            }
        },
        false,
        Math.min(Number(randomTo(1).toFixed(1)) + 0.2, 1)
    );
    let clouds = [];
    let h = randomTo(360);
    for (let i = 0; i < 3; i++) {
        clouds.push(
            layer(
                (ctx) => ctx.fillStyle = assembleHSB(h, 80, 60+i*20),
                (ctx, x, y, a) => {
                    if(a > 0.4) {
                        ctx.globalAlpha = a - 0.2;
                        ctx.fillRect(x, y, 1, 1);
                    }
                },
                true,
                0.4 + (i*0.1)
            )
        );
    }

    let mask = { canvas: quickLayerCanvas(res*3) };
    mask.ctx = mask.canvas.getContext("2d");
    
    repeatDrawCanvas(mask.canvas, mask.ctx, sky.canvas);
    mask.ctx.beginPath();
    mask.ctx.arc(mask.canvas.width/2, mask.canvas.height/2, planet_rad, 0, Math.PI * 2);
    mask.ctx.clip();
    mask.ctx.clearRect(0, 0, mask.canvas.width, mask.canvas.height);

    //repeatDrawCanvas(pcanvas, pctx, mask.canvas);
    //pctx.globalCompositeOperation = "destination-over";

    let prepared = prepareLayerCanvas(body.canvas, 2, 1);
    
    pctx.drawImage(
        prepared.canvas,
        0, 0, prepared.canvas.width/2, prepared.canvas.height,
        topLeftPlanet.x, topLeftPlanet.y, planet_rad*2, planet_rad*2);


    let between = {canvas: quickLayerCanvas(prepared.canvas.width/2, prepared.canvas.height) };
    between.ctx = between.canvas.getContext('2d');

    let rot = 0;
    let speed = 0.01;
    let doUpdate = false;

    let update = () => {
        let finished = warpCanvasViewX(prepared.canvas, prepared.ctx, between.canvas, between.ctx, (rot+=speed));
        pctx.drawImage(finished.canvas, topLeftPlanet.x, topLeftPlanet.y, planet_rad*2, planet_rad*2);
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
    })

    // repeatDrawCanvas(pcanvas, pctx, body.canvas, 2, 1);
    //repeatDrawCanvas(pcanvas, pctx, water.canvas, 3, 1);
    // repeatDrawCanvas(pcanvas, pctx, city.canvas, 3, 1);
    // clouds.forEach(
    //     c => {
    //         repeatDrawCanvas(pcanvas, pctx, c.canvas, 1, 2);
    //     }
    // );

}

planetSketch();