function biasedShuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function fisherYatesShuffle(arr) {
    const pack = [...arr];
    for (let i = pack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pack[i], pack[j]] = [pack[j], pack[i]];
    }
    return pack;
}

const NUM_TESTS = 100000;
const cards = [1, 2, 3, 4, 5];

const biasedResults = [{}, {}, {}, {}, {}];
const fyResults = [{}, {}, {}, {}, {}];

for (let i = 0; i < NUM_TESTS; i++) {
    const b = biasedShuffle(cards);
    const f = fisherYatesShuffle(cards);
    
    for (let j = 0; j < 5; j++) {
        biasedResults[j][b[j]] = (biasedResults[j][b[j]] || 0) + 1;
        fyResults[j][f[j]] = (fyResults[j][f[j]] || 0) + 1;
    }
}

console.log("--- Biased Shuffle (sort(() => Math.random() - 0.5)) ---");
biasedResults.forEach((pos, i) => {
    let row = `Pos ${i+1}: `;
    cards.forEach(c => {
        row += `${c}: ${(pos[c]/NUM_TESTS*100).toFixed(2)}% | `;
    });
    console.log(row);
});

console.log("\n--- Fisher-Yates Shuffle ---");
fyResults.forEach((pos, i) => {
    let row = `Pos ${i+1}: `;
    cards.forEach(c => {
        row += `${c}: ${(pos[c]/NUM_TESTS*100).toFixed(2)}% | `;
    });
    console.log(row);
});
