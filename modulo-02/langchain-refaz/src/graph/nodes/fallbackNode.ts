import { AIMessage } from "@langchain/core/messages";
import { type GraphState } from "../graph.ts";

export function fallback(state: GraphState): GraphState {
    const message = 'Unknow command. Try make this uppercase or convert to lowercase';
    const fallbackMessage = new AIMessage(message).content.toString();
    
    return {
        ...state,   
        output:fallbackMessage,
        messages:[
            ...state.messages,
            // fallbackMessage 
        ]
    }
}
