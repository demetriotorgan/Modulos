import test from 'node:test'
import assert from 'node:assert/strict'

import { identifyIntentNode } from '../src/graph/identifyIntentNode.ts'

test.skip('identifies an order intent', async () => {

    const state = {
        question: 'Quero saber onde está meu pedido',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'order')
})

test.skip('identifies a support intent', async () => {
    const state = {
        question: 'Estou com problema no meu cartão',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'support')
})

test.skip('identifies a financial intent', async () => {
    const state = {
        question: 'Quero consultar minha fatura',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'financial')
})

test.skip('returns unknown for an unrecognized question', async () => {
    const state = {
        question: 'Qual é a capital da França?',
        intent: 'unknown' as const,
        output: ''
    }

    const result = await identifyIntentNode(state)

    assert.equal(result.intent, 'unknown')
})