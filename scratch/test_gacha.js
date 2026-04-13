const fs = require('fs');
const path = require('path');

// Mock CARDS and RATE from the project
const RATE = {
    LEG: 0.1,
    SEC: 0.4,
    UR: 1.0,
    SSR: 6.5,
    SR: 12.0,
    R: 30.0,
    C: 50.0
};

const GOD_PACK_CHANCE = 1;

// Read CARDS from cards.js
const cardsFileContent = fs.readFileSync(path.join(process.cwd(), 'data', 'cards.js'), 'utf8');
// Simple extraction of CARDS array from the file content
const cardsMatch = cardsFileContent.match(/const CARDS = (\[[\s\S]*?\]);/);
const CARDS = JSON.parse(cardsMatch[1]);

function rollRarity() {
    const rand = Math.random() * 100;
    let cum = 0;
    for (const [tier, rate] of Object.entries(RATE)) {
        cum += rate;
        if (rand < cum) return tier;
    }
    return "C";
}

function getHighRarity() {
    const rand = Math.random() * 100;
    if (rand < 5) return "LEG";
    if (rand < 15) return "SEC";
    if (rand < 45) return "UR";
    return "SSR";
}

function isGodPack() {
    return Math.random() * 100 < GOD_PACK_CHANCE;
}

function getRandomCardByRarity(rarity) {
    const filtered = CARDS.filter(c => c.rarity === rarity && c.isGacha === 'Y');
    if (filtered.length === 0) {
        const gachaPool = CARDS.filter(c => c.isGacha === 'Y');
        return gachaPool[Math.floor(Math.random() * gachaPool.length)];
    }
    return filtered[Math.floor(Math.random() * filtered.length)];
}

function openPack() {
    const isGod = isGodPack();
    const pack = [];
    const selectedIds = new Set();

    for (let i = 0; i < 5; i++) {
        let rarity;
        if (isGod) {
            rarity = getHighRarity();
        } else {
            rarity = rollRarity();
        }

        let card = getRandomCardByRarity(rarity);
        let attempts = 0;
        while (selectedIds.has(card.role_id) && attempts < 10) {
            card = getRandomCardByRarity(rarity);
            attempts++;
        }

        if (selectedIds.has(card.role_id)) {
            const fallbackPool = CARDS.filter(c => c.isGacha === 'Y' && !selectedIds.has(c.role_id));
            if (fallbackPool.length > 0) {
                card = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
            }
        }

        pack.push(card);
        selectedIds.add(card.role_id);
    }

    // Shuffle
    for (let i = pack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pack[i], pack[j]] = [pack[j], pack[i]];
    }

    return { pack, isGod };
}

// Simulation
const NUM_TESTS = 100000;
const results = {
    rarityCounts: {},
    cardCounts: {},
    positionRarity: [{}, {}, {}, {}, {}],
    godPacks: 0
};

// Initialize counts
Object.keys(RATE).forEach(r => {
    results.rarityCounts[r] = 0;
    for (let i = 0; i < 5; i++) results.positionRarity[i][r] = 0;
});

console.log(`Simulating ${NUM_TESTS} pack openings...`);

for (let i = 0; i < NUM_TESTS; i++) {
    const { pack, isGod } = openPack();
    if (isGod) results.godPacks++;
    
    pack.forEach((card, pos) => {
        results.rarityCounts[card.rarity]++;
        results.cardCounts[card.name] = (results.cardCounts[card.name] || 0) + 1;
        results.positionRarity[pos][card.rarity]++;
    });
}

// Report
console.log("\n--- Simulation Results ---");
console.log(`Total Packs: ${NUM_TESTS}`);
console.log(`God Packs: ${results.godPacks} (${(results.godPacks / NUM_TESTS * 100).toFixed(2)}%)`);

console.log("\n--- Rarity Distribution ---");
const totalCards = NUM_TESTS * 5;
Object.keys(RATE).forEach(r => {
    const count = results.rarityCounts[r];
    const pct = (count / totalCards * 100).toFixed(3);
    const expected = isNaN(RATE[r]) ? "N/A" : RATE[r].toFixed(3);
    console.log(`${r}: ${count} (${pct}%) [Expected: ~${expected}%]`);
});

console.log("\n--- Positional Rarity Distribution ---");
results.positionRarity.forEach((posData, i) => {
    let row = `Pos ${i + 1}: `;
    Object.keys(RATE).forEach(r => {
        const pct = (posData[r] / NUM_TESTS * 100).toFixed(1);
        row += `${r}: ${pct}% | `;
    });
    console.log(row);
});

console.log("\n--- Top 10 Most Common Cards ---");
const sortedCards = Object.entries(results.cardCounts).sort((a, b) => b[1] - a[1]);
sortedCards.slice(0, 10).forEach(([name, count]) => {
    console.log(`${name}: ${count} (${(count / totalCards * 100).toFixed(4)}%)`);
});

console.log("\n--- Top 10 Rarest Cards Found ---");
sortedCards.slice(-10).reverse().forEach(([name, count]) => {
    console.log(`${name}: ${count} (${(count / totalCards * 100).toFixed(4)}%)`);
});
