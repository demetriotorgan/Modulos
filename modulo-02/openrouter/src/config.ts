// import type { ProviderPreferences } from "@openrouter/sdk/models";

console.assert(
    process.env.OPENROUTER_API_KEY,
    'OPENROUTER_API_KEY is not set in env variables'
)

export type ModelConfig = {
    apiKey: string;
    httpReferer: string;
    xTitle: string;
    port: number;
    models:string[];
    temperature: number;
    maxToken:number;
    systemPrompt: string;
    provider: {
         sort: {
            by: 'price' | 'throughput' | 'latency' | 'exacto';
            partition: 'model' | 'none';
        }
    }
}

export const config: ModelConfig = {
    apiKey: process.env.OPENROUTER_API_KEY!,
    httpReferer: 'http://pos-ia.com',
    xTitle: 'SmartModelRouterGateway',
    port: 3000,
    models:[
        'inclusionai/ling-3.0-flash-fin:free',
        'liquid/lfm-2.5-2.6b:free',
        // 'thinkingmachines/inkling-small:free',
        'dots-studio/dots-3-note-preview:free'
    ], 
    temperature: 0.2,
    maxToken: 200,
    systemPrompt:'You are a helpful assistant.',
    provider:{
        sort:{
            by:'price',
            // by:'throughput',
            // by:'latency',
            partition:'none'
        }
    }
}