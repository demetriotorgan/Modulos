import type { GraphState } from "../state.ts";

export function financialNode(state: GraphState):Partial<GraphState>{
    
    return {
         output: `A pergunta ${state.question} esta relacioando ao financeiro`
    }
}