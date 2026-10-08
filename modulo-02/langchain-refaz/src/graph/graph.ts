import { BaseMessage } from '@langchain/core/messages';
import {END, MessagesZodMeta, START, StateGraph} from '@langchain/langgraph'
import { withLangGraph } from '@langchain/langgraph/zod'
import {z} from 'zod/v3'
import { identifyIntent } from './nodes/identifyIntentNode.ts';
import { chatResponse } from './nodes/chatResponseNode.ts';
import { upperCase } from './nodes/upperCaseNode.ts';
import { lowerCase } from './nodes/lowerCaseNode.ts';
import { fallback } from './nodes/fallbackNode.ts';

const GraphState = z.object({
    messages: withLangGraph(
        z.custom<BaseMessage[]>(), 
        MessagesZodMeta
    ),
    output: z.string(),
    command: z.enum(['uppercase', 'lowercase', 'unknown'])
})

export type GraphState = z.infer<typeof GraphState>

export function buildGraph() {
    const workflow = new StateGraph({
        stateSchema: GraphState,
    })

    .addNode('identifyIntent', identifyIntent)
    .addNode('chatResponse', chatResponse)

    .addNode('uppercase', upperCase)
    .addNode('lowercase', lowerCase)
    .addNode('fallback', fallback)

    //Adicionando o primiero nó, que é o nó inicial do grafo
    // .addNode('identifyIntent', (state: GraphState) => {
    //     return{
    //         ...state,
    //         output: 'teste'
    //     }
    // })

    //Adicionando addEdge, que é a transição entre os nós do grafo
    .addEdge(START, 'identifyIntent')
    .addConditionalEdges('identifyIntent',
        (state: GraphState)=>{
            switch(state.command){
                case 'uppercase':
                    return 'uppercase';
                case 'lowercase':
                    return 'lowercase';
                default:
                    return 'fallback'
            }
        },
        {
            'uppercase': 'uppercase',
            'lowercase': 'lowercase',
            'fallback': 'fallback',

        }
    )
    .addEdge('uppercase','chatResponse')
    .addEdge('lowercase','chatResponse')
    .addEdge('fallback','chatResponse')
    .addEdge('chatResponse',END)

    return workflow.compile()
}
