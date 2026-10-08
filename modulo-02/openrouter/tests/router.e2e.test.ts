import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from '../src/server.ts'
import { config, type ModelConfig } from '../src/config.ts'
import { type LLMResponse, OpenRouterService } from '../src/openrouterService.ts'

console.assert(
    process.env.OPENROUTER_API_KEY,
    'OPENROUTER_API_KEY is not set in env variables'
)


test('routes to cheapes model by default', async () => {
    const customConfig: ModelConfig = {
        ...config,
        provider:{
            ...config.provider,
            sort:{
                ...config.provider.sort,
                by:'price'
            }
        }
    }
    const routerService = new OpenRouterService(customConfig)
    const app = createServer(routerService)
    const response = await app.inject({
    method: 'POST',
    url:'/chat',
    body:{question:'Olá como você se chama?'}
})
assert.equal(response.statusCode,200);
const body = response.json() as LLMResponse
// console.log(body);
assert.equal(body.model, 'inclusionai/ling-3.0-flash-fin:free');
});

test.skip('routes to highest throughput model by default',async () => {
    const customConfig: ModelConfig = {
        ...config,
        provider:{
            ...config.provider,
            sort:{
                ...config.provider.sort,
                by:'price'
            }
        }
    }
    const routerService = new OpenRouterService(customConfig)
    const app = createServer(routerService)
    const response = await app.inject({
    method: 'POST',
    url:'/chat',
    body:{question:'Olá como você se chama?'}
})
assert.equal(response.statusCode,200);
const body = response.json() as LLMResponse
// console.log(body);
assert.equal(body.model, 'liquid/lfm-2.5-2.6b:free');
});