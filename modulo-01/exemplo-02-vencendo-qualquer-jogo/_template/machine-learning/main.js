import { buildLayout } from "./layout";
import { PredictionConfig } from "./prediction/config";
import { PredictionDebugger } from "./prediction/predictionDebugger";
import { predictFuturePosition } from "./prediction/predictor";
import { estimateVelocity } from "./prediction/velocityEstimator";
import { generateMatchStatistics } from "./telemetry/matchStatistics";

export default async function main(game) {
    const container = buildLayout(game.app);
    const predictionDebugger = new PredictionDebugger(game.stage);
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    game.stage.aim.visible = false;

    //Variáveis de Telemetria
    let frame = 0;
    const telemetry = new Map();
    let lastPrediction = null;
    let duckMovementHistory = [];
    const predictionHistory = [];
    const shotTelemetry = [];
    let lastLatency = 0;
    let matchFinished = false;

    //Variaveis do estado do modelo
    let processing = false;
    let isModelReady = false;

    worker.onmessage = ({ data }) => {
        const { type, frame, x, y } = data;

        if (type === 'model-loaded') {
            // console.log("🎮 IA pronta no jogo! Iniciando capturas...");
            isModelReady = true;
            return;
        }

        if (type === 'frame-end') {
            //Telemetria Recebida
            const cycle = telemetry.get(frame);
            cycle.worker = data.workerTelemetry;

            if (cycle.workerDuration != null) {
                cycle.communicationDuration =
                    cycle.workerDuration
                    - cycle.worker.preprocessDuration
                    - cycle.worker.inferenceDuration
                    - cycle.worker.processPredictionDuration
                    - cycle.worker.postMessageDuration;
            }

            if (cycle.workerDuration) {
                // console.log(cycle);
            }
            processing = false;
            return;
        }

        if (type === 'prediction') {

            const cycle = telemetry.get(frame);
            cycle.predictionReceived = performance.now();

            //validando predição corrigida
            const now = performance.now();

            for (const prediction of predictionHistory) {
                if (prediction.validated) continue;
                if (now < prediction.createdAt + prediction.latency) continue;
                const errorX = x - prediction.predictedX;
                const errorY = y - prediction.predictedY;

                const errorDistance = Math.sqrt(errorX * errorX + errorY * errorY);

                prediction.realX = x;
                prediction.realY = y;

                prediction.errorX = errorX;
                prediction.errorY = errorY;
                prediction.errorDistance = errorDistance;
                prediction.validated = true;

                //Atualizando telemetria de tiro
                const shot = shotTelemetry.find(
                    s => s.frame === prediction.frame
                );
                if(shot){
                    shot.errorDistance = prediction.errorDistance;
                }
                
                // console.log('Historico de Previsão:',predictionHistory)
            }

            //Calculo da velocidade do Pato
            if (lastPrediction === null) {
                lastPrediction = {
                    x,
                    y,
                    time: cycle.predictionReceived
                }
            } else {
                const dx = x - lastPrediction.x;
                const dy = y - lastPrediction.y;
                const dt = cycle.predictionReceived - lastPrediction.time;
                if (dt > 0) {
                    const duckSpeed = Math.sqrt(dx * dx + dy * dy) / dt;
                    cycle.duckSpeed = duckSpeed;
                    duckMovementHistory.push({
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
                    // console.log('Histórico de Dinamica: ',duckMovementHistory);
                };

                lastPrediction = {
                    x,
                    y,
                    time: cycle.predictionReceived
                }
            }


            // 1. Coordenadas Nativas da IA (Espaço Interno do Canvas)
            let aimX = x;
            let aimY = y;

            container.updateHUD(data);
            game.stage.aim.visible = true;

            //Criando histórico de previsões
            const velocity = estimateVelocity(duckMovementHistory);
            const future = predictFuturePosition(
                x,
                y,
                velocity.velocityX,
                velocity.velocityY,
                lastLatency
            );

            //Historico de previsões               
            predictionHistory.push({
                frame,
                createdAt: performance.now(),
                latency: lastLatency,

                //Coordenadas atuais
                currentX: x,
                currentY: y,

                //coordenadas corrigidas
                predictedX: future.x,
                predictedY: future.y,

                velocityX: velocity.velocityX,
                velocityY: velocity.velocityY,

                //coordenadas validadas
                realX: null,
                realY: null,

                errorX: null,
                errorY: null,
                errorDistance: null,

                //modo de jogo
                mode: PredictionConfig.enabled
                    ? "BOOSTER"
                    : "NORMAL",

                validated: false
            });




            if (PredictionConfig.enabled) {
                aimX = future.x;
                aimY = future.y;
            }


            // Define a mira usando os valores internos da IA
            game.stage.aim.setPosition(aimX, aimY);


            const pixiGlobalX = aimX * game.stage.scale.x;
            const pixiGlobalY = aimY * game.stage.scale.y;
            // 2. Coordenadas calculadas pelo PixiJS para a Viewport do Navegador (Janela)
            const position = game.stage.aim.getGlobalPosition();

            //Telemetria de Acerto
            const shot = {
                frame,
                clikTime: performance.now(),
                latency: lastLatency,
                duckSpeed: cycle.duckSpeed ? cycle.duckSpeed : 0,                
                mode:  PredictionConfig.enabled ? 'BOOSTER' : 'NORMAL',
                errorDistance:null,
                hit: false
            }

            //Mede o estado antes para telemetria de Acerto
            const ducksBefore = game.ducksShot;

            // Dispara o clique usando a posição calculada globalmente            
            game.handleClick({
                global: {
                    x: pixiGlobalX,
                    y: pixiGlobalY
                }
            });

            const hit = game.ducksShot > ducksBefore;
            if (hit) {
                console.log("🔥 IA/Predictor acertou o pato!");
                shot.hit = true;
            }

            //Adiciona tiro a lista
            shotTelemetry.push(shot);
            // console.log('Telemetria de Disparos: ', shotTelemetry);


            cycle.click = performance.now();
            cycle.latencyTotal =
                cycle.click - cycle.timeCycle;

            cycle.captureDuration =
                cycle.captureEnd - cycle.captureStart;

            cycle.bitmapDuration =
                cycle.bitmapReady - cycle.captureEnd;

            cycle.workerDuration =
                cycle.predictionReceived - cycle.bitmapReady;

            cycle.clickDuration =
                cycle.click - cycle.predictionReceived;

            lastLatency = cycle.latencyTotal;
            // console.log(lastLatency);
        }
    };

    worker.onerror = (err) => {
        console.error("❌ Erro no Worker:", err);
        processing = false;
    };

    setInterval(async () => {
        if (isModelReady && !processing) {

            //verifica se a partida acabou e gera estatistica
            if(game.stage.hud.replayButton && !matchFinished){
                matchFinished = true;
                const statistics = generateMatchStatistics(shotTelemetry)
                console.table(statistics);
                return;
            }

            //Criando telemetria
            processing = true;            
            telemetry.set(frame, {
                frame: frame,
                timeCycle: performance.now()
            });

            const cycle = telemetry.get(frame);

            cycle.captureStart = performance.now();
            const canvas = game.app.renderer.extract.canvas(game.stage);
            cycle.captureEnd = performance.now();

            // Mantém apenas o log de performance a cada 10 frames
            // if (frame % 10 === 0) {
            //     console.log(`⏱️ Extract Canvas: ${(tExtractEnd - tExtractStart).toFixed(2)}ms`);
            // }

            const bitmap = await createImageBitmap(canvas);
            cycle.bitmapReady = performance.now();

            worker.postMessage({
                type: 'predict',
                frame,
                image: bitmap,
            }, [bitmap]);            
        }

        frame++;
    }, 200);

    return container;
}