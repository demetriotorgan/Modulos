export async function captureFrame(game) {
    const captureStart = performance.now();
    const canvas = game.app.renderer.extract.canvas(game.stage);
    const captureEnd = performance.now();

    const bitmap = await createImageBitmap(canvas);
    const bitmapReady = performance.now();

    return{
        bitmap,
        timestamps:{
            captureStart,
            captureEnd,
            bitmapReady
        }
    };
}
