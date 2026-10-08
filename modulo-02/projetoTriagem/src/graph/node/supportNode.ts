import type { GraphState } from "../state.ts";

export function supportNode(state: GraphState):Partial<GraphState>{
    
    return {
        output:`A pergunta ${state.question} está relacionado ao suporte`
    }
}