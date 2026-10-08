import type { GraphState } from "../state.ts";

export function supportNode(state: GraphState): Partial<GraphState> {
    return {
        output: 'Solicitação relacionada a suporte.'
    }
}