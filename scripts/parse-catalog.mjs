import fs from 'node:fs'

const content = fs.readFileSync('src/lib/game/content/catalog.ts', 'utf-8')
const wordMatches = [...content.matchAll(/\{\s*text:\s*'([^']+)',\s*hint:\s*'([^']*)'\s*\}/g)]

console.log('Total words found in catalog:', wordMatches.length)
const withHints = wordMatches.filter(m => m[2].trim().length > 0)
console.log('Words with non-empty hints:', withHints.length)
if (withHints.length > 0) {
  console.log('Sample words with hints:', withHints.slice(0, 5))
}
