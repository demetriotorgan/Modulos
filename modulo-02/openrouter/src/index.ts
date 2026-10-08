import { config } from "./config.ts";
import { OpenRouterService } from "./openrouterService.ts";
import { createServer } from "./server.ts";

const routerService = new OpenRouterService(config)
const app = createServer(routerService)

await app.listen({port: 3000, host: '0.0.0.0'});
console.log('Servidor Rodando at 3000')

app.inject({
    method: 'POST',
    url:'/chat',
    body:{question:'Olá como você se chama?'}
}).then((response)=>{
    console.log('Response status: ', response.statusCode)
    console.log('Response body: ', response.body)
})