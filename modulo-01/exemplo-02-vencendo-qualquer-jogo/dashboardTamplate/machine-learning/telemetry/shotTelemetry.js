export function createShotTelemetry({
    frame,
    clickTime,
    latency,
    duckSpeed,
    predictionEnabled
}){
      return {
        frame,
        clickTime,
        latency,
        duckSpeed,
        mode: predictionEnabled ? "BOOSTER" : "NORMAL",
        errorDistance: null,
        hit: false
    };
}