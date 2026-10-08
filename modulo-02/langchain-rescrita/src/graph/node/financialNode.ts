import type { GraphState } from "../state.ts";

export function financialNode(state: GraphState): Partial<GraphState> {
    return {
        output: 'Solicitação relacionada ao financeiro.'
    }
}