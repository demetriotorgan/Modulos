import {z} from 'zod/v3'
import { intents } from '../types/intent.ts'

export const GraphState = z.object({
    question: z.string(),
    intent: z.enum(intents),
    output:z.string()
})

export type GraphState = z.infer<typeof GraphState>