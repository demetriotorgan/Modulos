import Fastify from "fastify"
 import { buildGraph } from "./graph/graph.ts"
 
 const graph = buildGraph();
 
 export const createServer = ()=>{
 	const app =  Fastify({})
 	
 	app.post('/chat', {
 		schema:{
 			body: {
 				type:'object',
 				required:['question'],
 				properties:{
 					question: {type: 'string', minLength: 5}
 				}
 			}
 		}
 	}, async (request, reply)=>{
 		try {
 			const {question} = request.body as {question: string}            
 			const response = await graph.invoke({
 				question,
 				intent:'unknown',
 				output:''
 			})
 			return reply.send({
				intent:response.intent
			})            
 		} catch (error) {
 			console.error('Erro handling / chat request: ', error)
 			return reply.code(500)
 		}
 	})
 	return app;
 }