import type { DataType, PretrainedModelOptions } from "@huggingface/transformers";
import { readFileSync } from "fs";
const promptsFolder = './prompts';
const promptFiles={
    answerPrompt: `${promptsFolder}/answerPrompt.json`,
    template: `${promptsFolder}/template.txt`
}

export interface TextSplitterConfig {
    chunkSize: number;
    chunkOverlap: number;
}

export const CONFIG = Object.freeze({
    promptConfig: JSON.parse(readFileSync(promptFiles.answerPrompt, 'utf-8')),
    templateText: readFileSync(promptFiles.template, 'utf-8'),
    output:{
        answersFolder: './respostas',
        fileName: 'resposta.txt'
    },
    neo4j: {
        url: process.env.NEO4J_URI!,
        username: process.env.NEO4J_USER!,
        password: process.env.NEO4J_PASSWORD!,
        indexName: "tensors_index",
        searchType: "vector" as const,
        textNodeProperties: ["text"],
        nodeLabel: "Chunk",
    },
    llm: {
        provider: "llama.cpp",
        model: "gemma-3-1b-it",
        baseURL: "http://localhost:8080/v1",
        apiKey: "local",
        temperature: 0.3,
        maxRetries: 2
    },
    pdf: {
        path: "./tensores.pdf",
    },
    textSplitter: {
        chunkSize: 1000,
        chunkOverlap: 200,
    },
    embedding: {
        modelName: process.env.EMBEDDING_MODEL!,
        pretrainedOptions: {
            dtype: "fp32" as DataType, // Options: 'fp32' (best quality), 'fp16' (faster), 'q8', 'q4', 'q4f16' (quantized)
        } satisfies PretrainedModelOptions,
    },
    similarity: {
        topK: 3,
    },
});
