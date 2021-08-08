import path from 'path'

export const root = path.dirname((require?.main?.filename || process?.mainModule?.filename) as string)