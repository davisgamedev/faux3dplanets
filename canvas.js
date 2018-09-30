
/**
 * repeats x and y and morphs y-axis of a canvas
 */
function prepareCanvasWarpY(flatCanvas, width=planet_rad*4, height=planet_rad*2) {
    let layer = quickLayer(width, height);
    layer.ctx.drawImage(flatCanvas, 0, 0, layer.canvas.width, layer.canvas.height);
    
    let data1 = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
    let data2 = new ImageData(layer.canvas.width, layer.canvas.height);
    for(var y = 0; y < layer.canvas.height; y++) {
        let dy = map(y, 0, layer.canvas.height, -1, 1);
        let my = Math.floor(map(Math.acos(dy), 0, Math.PI, 0, layer.canvas.height));
        for(var x = 0; x < layer.canvas.width; x++) {
            let r = (y*layer.canvas.width*4) + (x*4);
            let r1 = (my*layer.canvas.width*4) + (x*4);
            data2.data[r] = data1.data[r1];
            data2.data[r+1] = data1.data[r1+1];
            data2.data[r+2] = data1.data[r1+2];
            data2.data[r+3] = data1.data[r1+3];
        }
    }
    layer.ctx.putImageData(data2, 0, 0, 0, 0, layer.canvas.width, layer.canvas.height);
    return layer;
}



//rotation: -1.0 => 1.0
function warpCanvasViewX(fromLayer, toLayer, rotation) {

    /*
        Rotation goes from -1 to 1
    */
    let fromx = map(rotation, -1, 1, fromLayer.canvas.width, 0);
    let tox = fromx + fromLayer.canvas.width/2;

    let data1 = fromLayer.ctx.getImageData(0, 0, fromLayer.canvas.width, fromLayer.canvas.height);
    //let data2 = ctx.createImageData(canvas.width, canvas.height);
    let data2 = new ImageData(toLayer.canvas.width, toLayer.canvas.height);
    for(var x = fromx; x < tox; x++) {
        let ux = map(x, fromx, tox, 0, toLayer.canvas.width);
        let dx = map(x, fromx, tox, -1, 1);
        let mx = Math.floor(map(Math.acos(dx), 0, Math.PI, fromx, tox));
        if(mx > fromLayer.canvas.width) mx %= fromLayer.canvas.width;
        for(var y = 0; y < fromLayer.canvas.height; y++) {
            let r = (y*toLayer.canvas.width*4) + ((ux*4));
            let r1 = (y*fromLayer.canvas.width*4) + (mx*4);
            data2.data[r] = data1.data[r1];
            data2.data[r+1] = data1.data[r1+1];
            data2.data[r+2] = data1.data[r1+2];
            data2.data[r+3] = data1.data[r1+3];
        }
    }
    toLayer.ctx.putImageData(data2, 0, 0, 0, 0, toLayer.canvas.width, toLayer.canvas.height);
} 

function resizeRepeat(ctx, canvas, rx, ry) {
    if(rx != 1 || ry != 1) {
        let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let scalex = canvas.width;
        let scaley = canvas.height;
        canvas.width *= rx;
        canvas.height *= ry;
        for(let i = 0; i < rx; i++ ) {
            for(let j = 0; j < ry; j++) {
                ctx.putImageData(data, scalex*i, scaley*j);
            }
        }
    }
}
