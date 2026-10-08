import { OpenRouter } from "@openrouter/sdk";
import { config, type ModelConfig } from "./config.ts";

export type LLMResponse = {
    model: string,
    content: string
}


export class OpenRouterService {
    private client: OpenRouter
    private config: ModelConfig

    constructor(configOverride?: ModelConfig) {
        this.config = configOverride ?? config;

        this.client = new OpenRouter({
            apiKey: this.config.apiKey,
            httpReferer: this.config.httpReferer,
            appTitle: this.config.xTitle
        })
    }

    async generate(prompt: string): Promise<LLMResponse> {
        const response = await this.client.chat.send({
            chatRequest: {
                models: this.config.models,
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                stream: false,
                temperature: this.config.temperature,
                maxTokens: this.config.maxToken,
                provider: this.config.provider
            }
        })
        // console.log('response:', response)
        // console.log('typeof response:', typeof response)
        // console.log('response keys:', Object.keys(response))
        // console.log('has choices:', 'choices' in response)
        // console.log('response.choices:', response.choices)
        
        if (!('choices' in response)) {
            throw new Error('OpenRouter returned a streaming response');
        }

        const content = response.choices.at(0)?.message.content

        if(content == null){
            throw new Error('LLM response does not contain content');
        }

        if(typeof content !== 'string'){
            throw new Error('LLM returned non-text content')
        }

        return {
            model: response.model,
            content 
        }
    }
}