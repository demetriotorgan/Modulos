import test from 'node:test'
import assert from 'node:assert/strict'

import { classifyIntent } from '../src/graph/identifyIntentNode.ts'

test.skip('classify order intent', () => {
    assert.equal(
        classifyIntent('Quero saber onde está meu pedido'),
        'order'
    )
})

test.skip('classify support intent', () => {
    assert.equal(
        classifyIntent('Estou com problema no meu cartão'),
        'support'
    )
})

test.skip('classify financial intent', () => {
    assert.equal(
        classifyIntent('Quero consultar minha fatura'),
        'financial'
    )
})

test.skip('classify unknown intent', () => {
    assert.equal(
        classifyIntent('Qual é a capital da França?'),
        'unknown'
    )
})