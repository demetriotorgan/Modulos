import { AIMessage, SystemMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function fallbackNode(state: GraphState): GraphState {    
    const message = "I'm sorry, I didn't understand your request. Could you please rephrase it or provide more details?";
    const fallbackMessage = new AIMessage(message).content.toString();
    
    return {
        ...state,
        output: message,
        messages: [
            ...state.messages,
            // new SystemMessage('Hey there')
        ]
    }
}