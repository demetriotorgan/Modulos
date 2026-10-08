import type { Intent } from "../types/intent.ts";
import type { GraphState } from "./state.ts";

export function routeIntent(state: GraphState):Intent {
    return state.intent
}