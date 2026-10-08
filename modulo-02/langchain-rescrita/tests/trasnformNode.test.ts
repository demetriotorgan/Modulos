import test from 'node:test'
import assert from 'node:assert/strict'

import { orderNode } from '../src/graph/node/orderNode.ts'

test('order node transforms question into output', () => {

    const state = {
        question: 'Quero saber onde está meu pedido',
        intent: 'order' as const,
        output: ''
    }

    const result = orderNode(state)

    assert.equal(
        result.output,
        'A pergunta Quero saber onde está meu pedido esta relacionada a pedidos'
    )
})