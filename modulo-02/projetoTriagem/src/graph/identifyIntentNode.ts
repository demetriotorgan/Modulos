import {type Intent } from "../types/intent.ts";
import { GraphState } from "./state.ts";

export async function identifyIntentNode(state: GraphState): Promise<Partial<GraphState>>{
    const {question} = state
    const intent = classifyIntent(question)
    return{
        intent
    }
}

export function classifyIntent(question: string): Intent{
    const text = question.toLowerCase();
    if(text.includes('pedido') || text.includes('entrega') || text.includes('encomenda')){
        return 'order'
    }
    if(text.includes('cartão') || text.includes('problema') || text.includes('ajuda')){
        return 'support'
    }
    if(text.includes('fatura') || text.includes('pagamento') || text.includes('cobrança')){
        return 'financial'
    }
return 'unknown'
}