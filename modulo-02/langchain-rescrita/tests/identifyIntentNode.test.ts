import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from '../src/server.ts';
import { identifyIntentNode } from '../src/graph/identifyIntentNode.ts';

//TESTE 01 - Testando a resposta do identifiyIntentNode com base na question
test.skip('identifies an order intent', async () => {

    const state = {
        question: 'Quero saber onde está meu pedido',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'order')
});

//Teste para o intent support
test.skip('identifies a support intent', async () => {
    const state = {
        question: 'Estou com problema no meu cartão',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'support')
});

//Teste para o intent financial
test.skip('identifies a financial intent', async () => {
    const state = {
        question: 'Quero consultar minha fatura',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'financial')
});

//Teste para o intent unknown
test.skip('returns unknown for an unrecognized question', async () => {
    const state = {
        question: 'Qual é a capital da França?',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'unknown')
});