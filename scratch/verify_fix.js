function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const NUM_TESTS = 100000;
const cards = [1, 2, 3, 4, 5];

const results = [{}, {}, {}, {}, {}];

for (let i = 0; i < NUM_TESTS; i++) {
    const f = shuffleArray([...cards]);
    
    for (let j = 0; j < 5; j++) {
        results[j][f[j]] = (results[j][f[j]] || 0) + 1;
    }
}

console.log("--- Verified Shuffle (Fisher-Yates) ---");
results.forEach((pos, i) => {
    let row = `Pos ${i+1}: `;
    cards.forEach(c => {
        row += `${c}: ${(pos[c]/NUM_TESTS*100).toFixed(2)}% | `;
    });
    console.log(row);
});
