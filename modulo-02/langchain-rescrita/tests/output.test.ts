import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from '../src/server.ts';

//Testando o output do grafo
test.skip('POST /chat executes the graph and returns its output', async () => {    
    const app = createServer();
    const question = 'Quero saber sobre meu pedido';    
    const response = await app.inject({
    method: 'POST',
    url:'/chat',
    body:{question}
})
assert.equal(response.statusCode,200);
const body = JSON.parse(response.body);
assert.equal(body.intent, 'order');
});

