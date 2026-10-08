importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');

const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;
const INPUT_MODEL_DIMENTIONS = 640;
const CLASS_THRESHOLD = 0.3;

let _labels = [];
let _model = null;


async function loadModelAndLabels() {
    await tf.ready();

    _labels = await (await fetch(LABELS_PATH)).json();
    _model = await tf.loadGraphModel(MODEL_PATH);

    const dummyInput = tf.ones(_model.inputs[0].shape);
    await _model.executeAsync(dummyInput);
    tf.dispose(dummyInput);

    postMessage({ type: 'model-loaded' });
}

function preprocessImage(input) {
    return tf.tidy(() => {
        const image = tf.browser.fromPixels(input);

        return tf.image
            .resizeBilinear(image, [INPUT_MODEL_DIMENTIONS, INPUT_MODEL_DIMENTIONS])
            .div(255)
            .expandDims(0);
    });
}


async function runInference(tensor) {
    const output = await _model.executeAsync(tensor);
    tf.dispose(tensor);

    const [boxes, scores, classes] = output.slice(0, 3);
    const [boxesData, scoresData, classesData] = await Promise.all([
        boxes.data(),
        scores.data(),
        classes.data(),
    ]);

    output.forEach(t => t.dispose());

    return {
        boxes: boxesData,
        scores: scoresData,
        classes: classesData
    };
}


function* processPrediction({ boxes, scores, classes }, width, height) {
    for (let index = 0; index < scores.length; index++) {

        if (scores[index] < 0) continue;
        if (scores[index] < CLASS_THRESHOLD) continue;

        const label = _labels[classes[index]];

        if (label !== 'kite' && label !== 'bird') continue;

        let [x1, y1, x2, y2] = boxes.slice(index * 4, (index + 1) * 4);
        x1 *= width;
        x2 *= width;
        y1 *= height;
        y2 *= height;

        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;
        const centerX = x1 + boxWidth / 2;
        const centerY = y1 + boxHeight / 2;

        yield {
            x: centerX,
            y: centerY,
            score: (scores[index] * 100).toFixed(2),
            label: label
        };
    }
}

loadModelAndLabels();

self.onmessage = async ({ data }) => {
    if (data.type !== 'predict') return;
    if (!_model) return;

    //Telemetria do Worker
    const workerTelemetry = {}

    //Medindo o tempo de pre-processamento
    workerTelemetry.preprocessStart = performance.now();
    const input = preprocessImage(data.image);
    workerTelemetry.preprocessEnd = performance.now();
    workerTelemetry.preprocessDuration = workerTelemetry.preprocessEnd - workerTelemetry.preprocessStart;

    const { width, height } = data.image;
    const { frame } = data;

    //Medindo o tempo de inferencia
    workerTelemetry.inferenceStart = performance.now();
    const inferenceResults = await runInference(input);
    workerTelemetry.inferenceEnd = performance.now();
    workerTelemetry.inferenceDuration = workerTelemetry.inferenceEnd - workerTelemetry.inferenceStart;


    //Medidando o tempo de execução do generator e chamadas de postMessage()
    workerTelemetry.processPredictionStart = performance.now();
    
    const predictions = [
        ...processPrediction(inferenceResults, width, height)
    ];
    workerTelemetry.processPredictionEnd = performance.now();
    workerTelemetry.processPredictionDuration = workerTelemetry.processPredictionEnd - workerTelemetry.processPredictionStart;

    workerTelemetry.postMessageStart = performance.now();
    for (const prediction of predictions) {
        postMessage({
            type: "prediction",
            frame,            
            ...prediction
        });
    }

    workerTelemetry.postMessageEnd = performance.now();

    workerTelemetry.postMessageDuration = 
        workerTelemetry.postMessageEnd -
        workerTelemetry.postMessageStart;

    // console.log('🧠 YOLOv5n Web Worker initialized');

    postMessage({
        type: 'frame-end',
        frame,
        workerTelemetry        
    });
};

