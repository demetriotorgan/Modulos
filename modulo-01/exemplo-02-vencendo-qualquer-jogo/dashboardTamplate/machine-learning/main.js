import { captureFrame } from "./capture/frameCapture";
import { buildLayout } from "./layout";
import { PredictionConfig } from "./prediction/config";
import { PredictionDebugger } from "./prediction/predictionDebugger";
import { MatchController } from "./telemetry/matchController";
import { generateMatchStatistics } from "./telemetry/matchStatistics";
import { PredictionController } from "./telemetry/predictionController";
import { createShotTelemetry } from "./telemetry/shotTelemetry";
import { TelemetryStore } from "./telemetry/telemetryStore";

export default async function main(game) {
    const container = buildLayout(game.app);
    const predictionDebugger = new PredictionDebugger(game.stage);
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    game.stage.aim.visible = false;

    const telemetryStore = new TelemetryStore();
    const predictionController = new PredictionController(telemetryStore);
    const matchController  = new MatchController();

    //Variáveis de Controle
    let frame = 0;
    telemetryStore.lastLatency;
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
            telemetryStore.recordWorkerTelemetry(frame, data.workerTelemetry, performance.now());
            processing = false;
            return;
        }

        if (type === 'prediction') {
            const now = performance.now();
            telemetryStore.recordPredictionReceived(frame, now);

            //1. Valida predições passadas com a posição real atual que chegou
            telemetryStore.validatePastPredictions(x, y, now);

            // 2. Calcula dinâmica de movimento
            const duckSpeed = telemetryStore.recordMovement(frame, x, y, now) || 0;

            container.updateHUD(data);
            game.stage.aim.visible = true;

            // 3. Estima velocidade futura e gera as coordenadas preditivas
            const {velocity, future} = predictionController.predict(
                frame,
                x,
                y,
                telemetryStore.lastLatency,
                PredictionConfig.enabled
            );         

            let aimX = PredictionConfig.enabled ? future.x : x;
            let aimY = PredictionConfig.enabled ? future.y : y;

            // Define a mira usando os valores internos da IA
            game.stage.aim.setPosition(aimX, aimY);


            const pixiGlobalX = aimX * game.stage.scale.x;
            const pixiGlobalY = aimY * game.stage.scale.y;
            // 2. Coordenadas calculadas pelo PixiJS para a Viewport do Navegador (Janela)
            const position = game.stage.aim.getGlobalPosition();

            //Telemetria de Acerto
            const clickTime =
                performance.now();
            const shot = createShotTelemetry({
                frame,
                clickTime,
                latency: telemetryStore.lastLatency,
                duckSpeed: duckSpeed,
                predictionEnabled: PredictionConfig.enabled                
            });

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
                console.log("IA acertou o pato!");
                shot.hit = true;
            }

            //Adiciona tiro a lista
            telemetryStore.addShot(shot);
            console.log(telemetryStore.shotTelemetry);

            //Métricas
            telemetryStore.recordClickTelemetry(frame, clickTime);

            //LOGS--------------------------
            console.log(
                "Cycle",
                telemetryStore.getCycle(frame)
            );

            console.log(
                "Prediction",
                telemetryStore.predictionHistory.at(-1)
            );

            console.log(
                "Shot",
                telemetryStore.shotTelemetry.at(-1)
            );

            console.log(
                "Movement",
                telemetryStore.getDuckMovementHistory().at(-1)
            );

        }
    };

    worker.onerror = (err) => {
        console.error("❌ Erro no Worker:", err);
        processing = false;
    };

    setInterval(async () => {
        if (isModelReady && !processing) {

            //verifica se a partida acabou e gera estatistica
            if (matchController.finished(game) && !matchFinished) {
                matchFinished = true;
                const statistics = generateMatchStatistics(telemetryStore.shotTelemetry);
                console.table(statistics);
                return;
            }

            //Criando telemetria
            processing = true;
            //1.Abre o ciclo na Store
            telemetryStore.startCycle(frame);

            //Executa a captura
            const { bitmap, timestamps } = await captureFrame(game);

            telemetryStore.recordCaptureTimestamps(frame, timestamps);

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