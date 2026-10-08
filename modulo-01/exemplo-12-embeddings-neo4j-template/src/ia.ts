import { type Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
type DebugLog = (...args: unknown[]) => void;
type params = {
    debulog: DebugLog,
    vectorStore: Neo4jVectorStore,
    nlpModel: ChatOpenAI,
    promptConfig:any,
    templateText: string,
    topK:number
}

interface ChainState {
    question: string;
    context?: string;
    topScore?: number;
    error?: string;
    answer?: string;
}

export class AI{
    private params: params;
    constructor(params: params){
        this.params = params;
    }

    async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {
        this.params.debulog("Buscando no Vector store do Neo4j...");
        const vectorResults = await this.params.vectorStore.
        similaritySearchWithScore(input.question, this.params.topK);

        if(!vectorResults || vectorResults.length === 0){
            this.params.debulog("Nenhum resultado encontrado no Vector store do Neo4j.");
            return {
                ...input,
                error: "Nenhum resultado encontrado no Vector store do Neo4j."
            }
        }

        const topScore = vectorResults[0]![1];
        this.params.debulog(`Foram encontrados ${vectorResults.length} resultados. Top score: ${topScore.toFixed(3)}`);
        // console.log("Vector search results:", vectorResults);

        const contexts = vectorResults
        .filter(([_, score]) => score > 0.5)
        .map(([doc]) => doc.pageContent)
        .join("\n\n---\n\n");
        
        return {
            ...input,
            context: contexts,
            topScore,
        }
    }

    async generateNLPResponse(input: ChainState): Promise<ChainState> {
        if(input.error) return input;
        this.params.debulog("Gerando resposta com o modelo NLP...");
        const responsePrompt = ChatPromptTemplate.fromTemplate(this.params.templateText);
        const responseChain = responsePrompt
            .pipe(this.params.nlpModel)
            .pipe(new StringOutputParser());
        const rawResponse = await responseChain.invoke({
            role: this.params.promptConfig.role,
            task: this.params.promptConfig.task,
            tone: this.params.promptConfig.tone,
            language: this.params.promptConfig.language,
            format: this.params.promptConfig.format,
            instructions: this.params.promptConfig.instructions.map((instruction: string, idx: number) => `${idx + 1}. ${instruction}`).join("\n"),
            question: input.question,
            context: input.context,
        });

        // console.log("Raw response from NLP model:", rawResponse);
        return {
            ...input,
            answer: rawResponse,
        }
    }

    async answerQuestion(question: string):Promise<ChainState> {
        const chain = RunnableSequence.from([
            this.retrieveVectorSearchResults.bind(this),
            this.generateNLPResponse.bind(this)
        ])
        const result = await chain.invoke({ question });
        this.params.debulog("\n Pergunta");
        this.params.debulog(question, "\n");
        this.params.debulog("Resposta:");
        this.params.debulog(result.answer || result.error, "\n");
        this.params.debulog("Top Score:", result.topScore, "\n");
        // console.log("Answer:", result);
        return result;
    }
}