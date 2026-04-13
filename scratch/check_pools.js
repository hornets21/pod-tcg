const fs = require('fs');
const path = require('path');

const cardsFileContent = fs.readFileSync(path.join(process.cwd(), 'data', 'cards.js'), 'utf8');
const cardsMatch = cardsFileContent.match(/const CARDS = (\[[\s\S]*?\]);/);
const CARDS = JSON.parse(cardsMatch[1]);

const rarityCounts = {};
CARDS.filter(c => c.isGacha === 'Y').forEach(c => {
    rarityCounts[c.rarity] = (rarityCounts[c.rarity] || 0) + 1;
});

console.log("Gacha Pool Card Counts by Rarity:");
Object.entries(rarityCounts).sort().forEach(([rarity, count]) => {
    console.log(`${rarity}: ${count} cards`);
});
