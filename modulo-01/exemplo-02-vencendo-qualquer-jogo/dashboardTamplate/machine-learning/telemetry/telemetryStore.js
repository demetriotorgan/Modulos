export class TelemetryStore {
    constructor() {
        this.cycles = new Map();
        this.shotTelemetry = [];

        this.duckMovementHistory = [];
        this.predictionHistory = [];
        this.lastPrediction = null;
        this.lastLatency = 0;
    }

    //Inicializa um novo ciclo de frame
    startCycle(frame) {
        this.cycles.set(frame, {
            bitmapDuration: null,
            bitmapReady: null,
            captureDuration: null,
            captureEnd: null,
            captureStart: null,

            click: null,
            clickDuration: null,

            communicationDuration: null,
            frame: frame,

            latencyTotal: null,

            predictionReceived: null,
            workerFinished: null,

            timeCycle: performance.now(),

            worker: null,
            workerDuration: null
        });
        return this.cycles.get(frame);
    }

    getCycle(frame) {
        return this.cycles.get(frame);
    }

    recordCaptureTimestamps(frame, timestamps) {
        const cycle = this.getCycle(frame);
        if (!cycle) return;

        cycle.captureStart = timestamps.captureStart;
        cycle.captureEnd = timestamps.captureEnd;
        cycle.bitmapReady = timestamps.bitmapReady;

        //Calculos de duração da captura
        cycle.captureDuration = cycle.captureEnd - cycle.captureStart;
        cycle.bitmapDuration = cycle.bitmapReady - cycle.captureEnd;
    }

    recordWorkerTelemetry(frame, workerTelemetry, workerFinishedTime) {
        const cycle = this.getCycle(frame);
        if (!cycle) return;

        cycle.workerFinished = workerFinishedTime;
        cycle.worker = workerTelemetry;

        //Tempo total que o frame passou no worker
        cycle.workerDuration = cycle.workerFinished - cycle.bitmapReady;

        //Tempo de comunicação main e worker
        if (!cycle.worker) return;

        cycle.communicationDuration =
            cycle.workerDuration
            - cycle.worker.preprocessDuration
            - cycle.worker.inferenceDuration
            - cycle.worker.processPredictionDuration
            - cycle.worker.postMessageDuration
    }
 
    recordPredictionReceived(frame, predictionReceivedTime) {
        const cycle = this.getCycle(frame);
        if (!cycle) return;

        cycle.predictionReceived = predictionReceivedTime;
    }

    //Finaliza o ciclo calculando tempo de clique/disparo
    recordClickTelemetry(frame, clickTime) {
        const cycle = this.getCycle(frame);
        if (!cycle) return;

        cycle.click = clickTime;
        cycle.latencyTotal = cycle.click - cycle.timeCycle;
        cycle.clickDuration = cycle.click - cycle.predictionReceived;

        this.lastLatency = cycle.latencyTotal;
    }

    addPrediction(prediction) {
        this.predictionHistory.push(prediction);
    }

    addShot(shot) {
        this.shotTelemetry.push(shot);
    }
    
    recordMovement(frame, x, y, predictionReceived) {
        if (this.lastPrediction === null) {
            this.lastPrediction = { x, y, time: predictionReceived };
            return null;
        }
        const dx = x - this.lastPrediction.x;
        const dy = y - this.lastPrediction.y;
        const dt = predictionReceived - this.lastPrediction.time;
        
       let duckSpeed =0;

        if (dt > 0) {
            duckSpeed = Math.sqrt(dx * dx + dy * dy) / dt;

            this.duckMovementHistory.push({
                frame,
                x,
                y,
                deltaX: dx,
                deltaY: dy,
                deltaTime: dt,
                speed: duckSpeed,
                velocityX: dx / dt,
                velocityY: dy / dt
            });
        }

        const cycle = this.getCycle(frame);
        if(cycle){
            cycle.duckSpeed = duckSpeed;
        }
        // Atualiza o estado da última predição recebida para o próximo cálculo
        this.lastPrediction = { x, y, time: predictionReceived };
        return duckSpeed;
    }

    getDuckMovementHistory() {
    return this.duckMovementHistory;
}

    recordPrediction(frame, currentCoords, futureCoords, velocity, latency, mode) {
        this.predictionHistory.push({
            frame,
            createdAt: performance.now(),
            latency,
            currentX: currentCoords.x,
            currentY: currentCoords.y,
            predictedX: futureCoords.x,
            predictedY: futureCoords.y,
            velocityX: velocity.velocityX,
            velocityY: velocity.velocityY,
            realX: null,
            realY: null,
            errorX: null,
            errorY: null,
            errorDistance: null,
            mode: mode ? "BOOSTER" : "NORMAL",
            validated: false
        });
    }

    validatePastPredictions(realX, realY, predictionReceivedTime) {
        
        for (const prediction of this.predictionHistory) {
            if (prediction.validated) continue;
            if (predictionReceivedTime < prediction.createdAt + prediction.latency) continue;

            const errorX = realX - prediction.predictedX;
            const errorY = realY - prediction.predictedY;
            const errorDistance = Math.sqrt(errorX * errorX + errorY * errorY);

            prediction.realX = realX;
            prediction.realY = realY;
            prediction.errorX = errorX;
            prediction.errorY = errorY;
            prediction.errorDistance = errorDistance;
            prediction.validated = true;

            // Sincroniza o erro  no histórico de disparos
            const shot = this.shotTelemetry.find(s => s.frame === prediction.frame);
            if (shot) {
                shot.errorDistance = errorDistance;
            }
        }
    }

}