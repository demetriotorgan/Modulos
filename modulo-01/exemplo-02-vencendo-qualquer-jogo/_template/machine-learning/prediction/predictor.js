export function predictFuturePosition(
    x,
    y,
    velocityX,
    velocityY,
    latency
){

    const predictedX =
        x + (velocityX * latency);


    const predictedY =
        y + (velocityY * latency);


    return {

        x: predictedX,
        y: predictedY,
        latency

    };

}