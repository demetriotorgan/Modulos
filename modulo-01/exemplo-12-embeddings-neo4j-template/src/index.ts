import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { CONFIG } from "./config.ts";
import { DocumentProcessor } from "./documentProcessor.ts";
import { type PretrainedModelOptions } from "@huggingface/transformers";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { displayResults } from "./util.ts";
import { ChatOpenAI } from "@langchain/openai";
import { AI } from "./ia.ts";
import {writeFile, mkdir} from "node:fs/promises";

let _neo4jVectorStore = null;

async function clearAll(vectorStore: Neo4jVectorStore, nodeLabel: string) {
    console.log(`Clearing all nodes with label: ${nodeLabel}`);
    await vectorStore.query(`MATCH (n:${nodeLabel}) DETACH DELETE n`);
    console.log(`All nodes with label ${nodeLabel} have been deleted.`);
}

try {
    console.log("Starting document processing...");
    const documentProcessor = new DocumentProcessor(
        CONFIG.pdf.path,
        CONFIG.textSplitter
    )
    const documents = await documentProcessor.loadAndSplit();
    // console.log(documents);

    const embeddings = new HuggingFaceTransformersEmbeddings({
        model: CONFIG.embedding.modelName,
        pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedModelOptions
    });

    //Importar o ChatOpen AI
    const llm = new ChatOpenAI({
        temperature: CONFIG.llm.temperature,
        maxRetries: CONFIG.llm.maxRetries,
        modelName: CONFIG.llm.model,        
        openAIApiKey: CONFIG.llm.apiKey,
        configuration:{
            baseURL: CONFIG.llm.baseURL,            
        }
        
    });

    // //teste de comunicação com o modelo
    // const response = await llm.invoke('Olá Gema estou falando com voce do vscode agora');
    // console.log(response.content);

    _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(
        embeddings,
        CONFIG.neo4j
    )
    clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel);
    // console.log(Object.entries(documents))

    //------------Inserindo documentos
    for (const [index, doc] of documents.entries()) {
        console.log(`Adding document ${index + 1} of ${documents.length} to Neo4j...`);
        await _neo4jVectorStore.addDocuments([doc]);
        console.log(`Document ${index + 1} added successfully.`);
    }
    console.log('Base de dados atualizada');

      
    //inicializando ai
    const ai = new AI({
        nlpModel:llm,
        debulog: console.log,
        vectorStore: _neo4jVectorStore,
        promptConfig: CONFIG.promptConfig,
        templateText: CONFIG.templateText,
        topK: CONFIG.similarity.topK
    });

    //------------Executando busca por similaridade-----------------
    const questions = [
        'O que é um tensor no tensor flow js?',
        // 'O que são embeddings e para que servem?'
    ]

    for (const index in questions) {
        const question = questions[index];
        const result = await ai.answerQuestion(question!);
        // console.log(results);
        // displayResults(results);
        if(result.error){
            console.log(`\n Erro:${result.error}`)
            continue;
        }        
        console.log(`\n ${result.answer}`)
        await mkdir(CONFIG.output.answersFolder, { recursive: true });
        
        const fileName = `${CONFIG.output.answersFolder}/${CONFIG.output.fileName}-${index}-${Date.now()}.md`;
        await writeFile(fileName, result.answer!);
    }

} catch (error) {
    console.error("Error during document processing:", error);
} finally {
    await _neo4jVectorStore?.close();
}