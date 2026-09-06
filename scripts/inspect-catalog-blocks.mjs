import fs from 'node:fs'

const content = fs.readFileSync('src/lib/game/content/catalog.ts', 'utf-8')
const catBlocks = content.split(/\{\s*id:\s*'/).slice(1)

console.log(`Found ${catBlocks.length} category blocks`)
const categoriesInfo = []

for (const block of catBlocks) {
  const idMatch = block.match(/^([^']+)'/)
  const nameMatch = block.match(/displayName:\s*'([^']+)'/)
  const iconMatch = block.match(/icon:\s*'([^']+)'/)
  const wordMatches = [...block.matchAll(/\{\s*text:\s*'([^']+)',\s*hint:\s*'([^']*)'\s*\}/g)]
  if (idMatch && nameMatch && iconMatch) {
    categoriesInfo.push({
      id: idMatch[1],
      name: nameMatch[1],
      icon: iconMatch[1],
      wordCount: wordMatches.length,
    })
  }
}

console.log(categoriesInfo)
