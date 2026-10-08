import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};
let _model = null;

const WEIGHTS = {
    category: 0.4,
    color: 0.3,
    price: 0.2,
    age: 0.1
};

//2. normalizando
const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

//3.Criando vetores
const oneHotWeighted = (index, length, weight) =>
    tf.oneHot(index, length).cast('float32').mul(weight)


function encodeProduct(product, context) {

    //normalizando dados de 0-1 e aplicar peso na recomendação
    const price = tf.tensor1d([
        normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price
    ]);

    const age = tf.tensor1d([
        (
            context.productAvgAgeNorm[product.name] ?? 0.5
        ) * WEIGHTS.age
    ])

    const category = oneHotWeighted(
        context.categoriesIndex[product.category],
        context.numCategories,
        WEIGHTS.category
    );

    const color = oneHotWeighted(
        context.colorsIndex[product.color],
        context.numColors,
        WEIGHTS.color
    );

    return tf.concat1d(
        [price, age, category, color]
    )
}


//1. Criando a função makeContext recebe productso e usuarios para montar um contexto
function makeContext(products, users) {

    //buscando idades e preços
    const ages = users.map(u => u.age);
    const prices = products.map(p => p.price);

    //fazndo o range de idade
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);

    //fazendo o range de preços
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    //buscando cores, categorias e evitando duplicadas
    const colors = [...new Set(products.map(p => p.color))];
    const categories = [...new Set(products.map(p => p.category))];

    //criando os indices
    const colorsIndex = Object.fromEntries(
        colors.map((color, index) => {
            return [color, index]
        }));

    const categoriesIndex = Object.fromEntries(
        categories.map((category, index) => {
            return [category, index]
        }));

    //calculando a media de idade dos compradores por produtos 
    //ajuda a personalizar

    const midAge = (minAge + maxAge) / 2;
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        user.purchases.forEach(p => {
            ageSums[p.name] = (ageSums[p.name] || 0) + user.age
            ageCounts[p.name] = (ageCounts[p.name] || 0) + 1
        })
    })

    //media de idade por produto
    const productAvgAgeNorm = Object.fromEntries(
        products.map(product => {
            const avg = ageCounts[product.name] ? ageSums[product.name] / ageCounts[product.name] : midAge
            return [product.name, normalize(avg, minAge, maxAge)];
        })
    )

    return {
        products,
        users,
        colorsIndex,
        categoriesIndex,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        productAvgAgeNorm,
        numCategories: categories.length,
        numColors: colors.length,
        //price + age + categories + colors
        dimensions: 2 + categories.length + colors.length
    }
}

//retonra o perfil de usuario
function encodeUser(user, context) {
    if (user.purchases.length) {
        return tf.stack(
            user.purchases.map(
                product => encodeProduct(product, context)
            )
        )
            .mean(0)
            .reshape([
                1,
                context.dimensions
            ])
    }
    return tf.concat1d(
        [
            tf.zeros([1]), //preco é ignorado
            tf.tensor1d([
                normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age
            ]),
            tf.zeros([context.numCategories]), //ignora categoria
            tf.zeros([context.numColors]), //ignora cores
        ]
    ).reshape([1, context.dimensions])
}

//cria vetores de treino
function createTrainingData(context) {
    const inputs = []
    const labels = []
    context.users
    .filter(u=> u.purchases.length)
    .forEach(user => {
        const userVector = encodeUser(user, context).dataSync()
        context.products.forEach(product => {
            const productVector = encodeProduct(product, context).dataSync()
            const label = user.purchases.some(
                purchases => purchases.name === product.name ? 1 : 0
            )
            //combinar usuario + product
            inputs.push([...userVector, ...productVector])
            labels.push(label)
        })
    });
    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        inputDimension: context.dimensions * 2
        //o tamanho = userVetor + productVetor
    }
};


//configurando a rede
async function configureNeuralNetAndTrain(trainData) {
    const model = tf.sequential()
    model.add(
        tf.layers.dense({
            //numero de caracteristicas a serem usadas, se vetor produto + usuario = 20 numeros, então inputShape=20
            inputShape: [trainData.inputDimension],
            //unidade de neuronios
            units: 128,
            //mantem somente sinais positivos
            activation: 'relu'
        })
    );

    model.add(
        tf.layers.dense({
            units: 68,
            activation: 'relu'
        })
    );

    model.add(
        tf.layers.dense({
            units: 32,
            activation: 'relu'
        })
    );

    //ativiação
    model.add(
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
    )

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    //executando treino
    await model.fit(trainData.xs, trainData.ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                postMessage({
                    type: workerEvents.trainingLog,
                    epoch: epoch,
                    loss: logs.loss,
                    accuracy: logs.acc
                });

            }
        }
    })
    return model
}

//executando treino
async function trainModel({ users }) {
    console.log('Training model with users:', users)
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } });

    //importando productso
    const products = await (await fetch('/data/products.json')).json();
    let context = makeContext(products, users)
    context.productVectors = products.map(product => {
        return {
            name: product.name,
            meta: { ...product },
            vector: encodeProduct(product, context).dataSync()
        }
    })

    _globalCtx = context

    const trainData = createTrainingData(context);
    _model = await configureNeuralNetAndTrain(trainData)

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}

function recommend(user) {
    if(!_model) return;
    const context = _globalCtx;

    //preços ignorados, idade normalizada, categorias ignoradas
    const userVector = encodeUser(user, context).dataSync();

    //cria par de entrada para cada produto, para cada produto concatena o vetor de usuario com  vetor codificado do produto
    const inputs = context.productVectors.map(({vector})=>{
        return [...userVector, ...vector]
    })

    //converte todos os pares (usuario, produto) em um único tensor
    const inputTensor = tf.tensor2d(inputs)
    const predictions = _model.predict(inputTensor)

    const scores = predictions.dataSync();

    //faz o mapeamento das recomendações
    const recommendations = context.productVectors.map((item, index)=> {
        return {
            ...item.meta,
            name: item.name,
            score: scores[index] //previsao do modelo para este produto            
        }
    });

    const sortedItems = recommendations
        .sort((a, b) => b.score - a.score)

    //Envia recomendaçao com base no aprendizado
      postMessage({ 
        type: workerEvents.recommend, 
        user,
        recommendations: sortedItems
    });

    console.log('will recommend for user:', user)
    // postMessage({
    //     type: workerEvents.recommend,
    //     user,
    //     recommendations: []
    // });
}


const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: d => recommend(d.user, _globalCtx),
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};
