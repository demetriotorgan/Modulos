import type { GraphState } from "./state.ts";

export function responseNode(state:GraphState): Partial<GraphState>{
    return {
        output: state.output
    }
}

