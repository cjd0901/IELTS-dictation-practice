import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const file = new URL('../fixtures/legacy-lib.txt', import.meta.url)
const vocabulary = new URL('../../src/vocabulary.json', import.meta.url).href
const source = readFileSync(file, 'utf8').replace(
  "import vocabulary from './vocabulary.json'",
  `import vocabulary from '${vocabulary}' with { type: 'json' }`,
)

// Frozen pre-refactor implementation is an oracle, not a production dependency.
export const legacy = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`
)
