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
const cardsMatch = cardsFileContent.match(/const CARDS = (\[[\s\S]*?\]);/);
const CARDS = JSON.parse(cardsMatch[1]);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

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
    if (rand < 5) return "LEG"; // 5%
    if (rand < 15) return "SEC"; // 10%
    if (rand < 45) return "UR"; // 30%
    return "SSR"; // 55%
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

    shuffleArray(pack);

    return { pack, isGod };
}

// Simulation
const NUM_TESTS = 200000;
const results = {
    totalPacks: 0,
    godPacks: 0,
    godPackRarityCounts: { LEG: 0, SEC: 0, UR: 0, SSR: 0 },
    lastGodPacks: []
};

console.log(`Simulating ${NUM_TESTS} pack openings focusing on GOD PACKS...`);

for (let i = 0; i < NUM_TESTS; i++) {
    const { pack, isGod } = openPack();
    results.totalPacks++;
    
    if (isGod) {
        results.godPacks++;
        pack.forEach(card => {
            results.godPackRarityCounts[card.rarity]++;
        });
        
        if (results.lastGodPacks.length < 5) {
            results.lastGodPacks.push(pack.map(c => `${c.name} (${c.rarity})`));
        }
    }
}

// Report
console.log("\n--- GOD PACK Analysis ---");
console.log(`Total Packs: ${results.totalPacks}`);
console.log(`God Packs Found: ${results.godPacks}`);
console.log(`Observed Chance: ${(results.godPacks / results.totalPacks * 100).toFixed(2)}% (Target: ${GOD_PACK_CHANCE}%)`);

console.log("\n--- Rarity Distribution WITHIN God Packs ---");
const totalGodCards = results.godPacks * 5;
const godRatesSpec = { LEG: "5.0%", SEC: "10.0%", UR: "30.0%", SSR: "55.0%" };

Object.keys(results.godPackRarityCounts).forEach(r => {
    const count = results.godPackRarityCounts[r];
    const pct = (count / totalGodCards * 100).toFixed(1);
    console.log(`${r}: ${count} (${pct}%) [Target: ~${godRatesSpec[r]}]`);
});

console.log("\n--- Examples of GOD PACKS (Random Orders) ---");
results.lastGodPacks.forEach((p, i) => {
    console.log(`God Pack ${i + 1}: ${p.join(" | ")}`);
});
