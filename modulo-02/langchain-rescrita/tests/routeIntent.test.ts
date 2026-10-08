import test from 'node:test'
import assert from 'node:assert/strict'

import { routeIntent } from '../src/graph/routeIntent.ts'

test.skip('routes order intent to order node', () => {

    const state = {
        question: 'Quero saber onde está meu pedido',
        intent: 'order' as const,
        output: ''
    }

    const result = routeIntent(state)

    assert.equal(result, 'order')
});

test.skip('routes support intent to support node', () => {

    const state = {
        question: 'Estou com problema no meu cartão',
        intent: 'support' as const,
        output: ''
    }

    assert.equal(routeIntent(state), 'support')
})

test.skip('routes financial intent to financial node', () => {

    const state = {
        question: 'Quero consultar minha fatura',
        intent: 'financial' as const,
        output: ''
    }

    assert.equal(routeIntent(state), 'financial')
})

test.skip('routes unknown intent to unknown node', () => {

    const state = {
        question: 'Qual é a capital da França?',
        intent: 'unknown' as const,
        output: ''
    }

    assert.equal(routeIntent(state), 'unknown')
})