import type { GraphState } from "../state.ts";

export function unknownNode(state: GraphState):Partial<GraphState>{
    
    return {
        output:`A pergunta ${state.question} não pode ser identificada`
    }
}