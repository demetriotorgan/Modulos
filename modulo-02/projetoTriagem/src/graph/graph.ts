import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./state.ts";
import { identifyIntentNode } from "./identifyIntentNode.ts";
import { orderNode } from "./node/orderNode.ts";
import { routeIntent } from "./routeIntent.ts";
import { supportNode } from "./node/supportNode.ts";
import { financialNode } from "./node/financialNode.ts";
import { unknownNode } from "./node/unknownNode.ts";
import { responseNode } from "./responseNode.ts";

export function buildGraph(){
    const workflow = new StateGraph({
        stateSchema: GraphState
    })

    //Adicionando no inicial do grafo
    .addNode('response', responseNode)
    .addNode('identifyIntent', identifyIntentNode)
    .addNode('order', orderNode)
    .addNode('support', supportNode)
    .addNode('financial', financialNode) 
    .addNode('unknown', unknownNode)   

    .addEdge(START, 'identifyIntent')
    .addConditionalEdges('identifyIntent', routeIntent,
        {
            order:'order',
            support:'support',
            financial:'financial',
            unknown:'unknown'
        }
    )
    .addEdge('order', 'response')
    .addEdge('support', 'response')
    .addEdge('financial', 'response')
    .addEdge('unknown', 'response')

    .addEdge('response', END)

    return workflow.compile()
}