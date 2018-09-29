function map(x, minx, maxx, miny, maxy){
    return (x-minx)*(maxy - miny)/(maxx-minx) + miny;
}

function getRandomRGB(){
    var r = Math.random()*255|0;
    var g = Math.random()*255|0;
    var b = Math.random()*255|0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function getRandomHSB(h){
    if(!h) h = Math.random()*360|0;
    var s = Math.random()*100|0;
    var b = Math.random()*100|0;
    return 'hsl(' + h + ',' + s + '%,' + b + '%)';
}

function smooth(a) {
    return Math.floor(a * 5)/10 + 0.2;
}

let assembleHSB =          (h, s, b)                 => { return 'hsl(' + h + ',' + s + '%,' + b + '%)'; };
let randomVariationRange = (source, minVar, maxVar)  => { return randomRange(source * minVar, source * maxVar); };
let randomRange =          (from, to)                => { return Math.random() * (to-from) + from; };
let randomTo =             (to)                      => { return Math.random() * to; };
let flipCoin =             (chanceSuccess)           => { return Math.random() < chanceSuccess; };

function fetchTileableNoise(x, y, scale){
    return getTileableNoise(x, y, scale);    
}

function getTileableNoise(x, y, scale){
    //warp 2d perlin around 3d torus for tileable
    //https://gamedev.stackexchange.com/questions/23625/how-do-you-generate-tileable-perlin-noise/23679#23679
    var ct = 1;
    var at = 4;
    
    var xt = (ct + at * Math.cos(2 * Math.PI * y))
                * Math.cos(2*Math.PI*x);

    var yt = (ct + at * Math.cos(2 * Math.PI * y))
                * Math.sin(2 * Math.PI * x);

    var zt = at * Math.sin(2 * Math.PI * y);
    return noise.perlin3( xt*scale, yt*scale, zt*scale)/2 + 0.5 ; // torus
}

function newNoise() {
    noise.seed(Math.random());
}
