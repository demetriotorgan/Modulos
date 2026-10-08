import test from 'node:test'
import assert from 'node:assert/strict'

import  { orderNode } from '../src/graph/node/orderNode.ts'

test.skip('order node generates order response', () => {

    const state = {
        question: 'Quero saber onde está meu pedido',
        intent: 'order' as const,
        output: ''
    }

    const result = orderNode(state)

    assert.equal(
        result.output,
        'Solicitação relacionada a pedido.'
    )
})