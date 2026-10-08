export const intents = [
    'order',
    'support',
    'financial',
    'unknown'
] as const 

export type Intent = typeof intents[number]