import type { GraphState } from "../state.ts";

export function orderNode(state: GraphState):Partial<GraphState>{    
    return {
        output:`A pergunta ${state.question} esta relacionada a pedidos`
    }
}