import type { GraphState } from "../state.ts";

export function unknownNode(state: GraphState): Partial<GraphState> {
    return {
        output: 'Solicitação não identificada'
    }
}

