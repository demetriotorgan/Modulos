import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from '../src/server.ts';

test('command upper transforms message into UPERCASE', async () => {    
    const app = createServer();
    const msg = 'make this message UPPER pelase';
    const expected = msg.toUpperCase();
    const response = await app.inject({
    method: 'POST',
    url:'/chat',
    body:{question:msg}
})
assert.equal(response.statusCode,200);
assert.equal(response.body, expected);
});

test('command upper transforms message into LOWERCASE', async () => {    
    const app = createServer();
    const msg = 'make this message LOWER pelase';
    const expected = msg.toLowerCase();
    const response = await app.inject({
    method: 'POST',
    url:'/chat',
    body:{question:msg}
})
assert.equal(response.statusCode,200);
assert.equal(response.body, expected);
});

test('command upper transforms message into UNKNOWN', async () => {    
    const app = createServer();
    const msg = 'Hey there';
    const expected = "I'm sorry, I didn't understand your request. Could you please rephrase it or provide more details?"
    const response = await app.inject({
    method: 'POST',
    url:'/chat',
    body:{question:msg}
})
assert.equal(response.statusCode,200);
assert.equal(response.body, expected);
});
