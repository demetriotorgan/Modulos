import { type GraphState } from "../graph.ts";

export function lowerCase(state: GraphState): GraphState {
	const responseText = state.output.toLowerCase();    
	
	return {
		...state,   
		output:responseText
	}
}
