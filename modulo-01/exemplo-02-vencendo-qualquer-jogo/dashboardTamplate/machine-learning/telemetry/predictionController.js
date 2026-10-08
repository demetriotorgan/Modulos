import { predictFuturePosition } from "../prediction/predictor";
import { estimateVelocity } from "../prediction/velocityEstimator"

export class PredictionController {
    constructor(telemetryStore) {
        this.telemetryStore = telemetryStore
    }

    calculateVelocity() {
        console.log(
            this.telemetryStore.getDuckMovementHistory().length
        );
        return estimateVelocity(this.telemetryStore.getDuckMovementHistory());
    }

    predict(frame, x, y, latency, predictionEnabled) {
        const velocity = this.calculateVelocity();
        const future = predictFuturePosition(x, y, velocity.velocityX, velocity.velocityY, latency);
        this.telemetryStore.recordPrediction(
            frame,
            { x, y },
            future,
            velocity,
            latency,
            predictionEnabled
        )
        return {
            velocity,
            future
        }

    }
}