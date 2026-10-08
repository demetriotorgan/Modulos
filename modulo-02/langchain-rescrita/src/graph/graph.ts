import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./state.ts";
import { identifyIntentNode } from "./identifyIntentNode.ts";
import { orderNode } from "./node/orderNode.ts";
import { routeIntent } from "./routeIntent.ts";
import { supportNode } from "./node/supportNode.ts";
import { financialNode } from "./node/financialNode.ts";
import { unknownNode } from "./node/unknownNode.ts";

export function buildGraph() {
    const workflow = new StateGraph({
        stateSchema: GraphState
    })

        //adiciona os nós do grafo
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

        .addEdge('order', END)
        .addEdge('support', END)
        .addEdge('financial', END)
        .addEdge('unknown', END)

    return workflow.compile();
}