// Rarity Rates (Total 100%)
const RATE = {
    SSSSR: 0.1,
    SSSR: 0.4,
    SSR: 2.0,
    SR: 7.5,
    R: 20.0,
    C: 70.0
};

const GOD_PACK_CHANCE = 1; // 1%

let collection = JSON.parse(localStorage.getItem('pod_collection')) || [];
let currentPack = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCollectionUI();
    document.getElementById('total-count').textContent = CARDS.length;
});

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');
    
    if (sectionId === 'collection') {
        updateCollectionUI();
    }
}

// Roll Rarity Logic
function rollRarity() {
    const rand = Math.random() * 100;
    
    if (rand < RATE.SSSSR) return "SSSSR";
    if (rand < (RATE.SSSSR + RATE.SSSR)) return "SSSR";
    if (rand < (RATE.SSSSR + RATE.SSSR + RATE.SSR)) return "SSR";
    if (rand < (RATE.SSSSR + RATE.SSSR + RATE.SSR + RATE.SR)) return "SR";
    if (rand < (RATE.SSSSR + RATE.SSSR + RATE.SSR + RATE.SR + RATE.R)) return "R";
    return "C";
}

function getHighRarity() {
    const rand = Math.random() * 100;
    
    if (rand < 5) return "SSSSR";
    if (rand < 15) return "SSSR";
    if (rand < 45) return "SSR";
    return "SR";
}

function isGodPack() {
    return Math.random() * 100 < GOD_PACK_CHANCE;
}

function getRandomCardByRarity(rarity) {
    const filtered = CARDS.filter(c => c.rarity === rarity);
    if (filtered.length === 0) {
        // Fallback if no cards in that rarity
        return CARDS[Math.floor(Math.random() * CARDS.length)];
    }
    return filtered[Math.floor(Math.random() * filtered.length)];
}

function openPack() {
    const isGod = isGodPack();
    const pack = [];
    
    for (let i = 0; i < 5; i++) {
        let rarity;
        if (isGod) {
            rarity = getHighRarity();
        } else {
            rarity = rollRarity();
        }
        pack.push(getRandomCardByRarity(rarity));
    }
    
    return { pack, isGod };
}

// UI Opening Flow
async function startOpening() {
    const display = document.getElementById('cards-display');
    const packVisual = document.getElementById('pack-visual');
    
    if (packVisual.classList.contains('tearing')) return;

    display.innerHTML = '';
    packVisual.classList.add('tearing');
    
    // Play tearing sound
    const tearSound = new Audio('assets/tear.mp3');
    tearSound.play().catch(e => console.log("Sound play error:", e));

    // Wait for shake, then tear
    await new Promise(r => setTimeout(r, 500));
    packVisual.classList.add('torn');
    
    // Wait for tear animation to finish
    await new Promise(r => setTimeout(r, 600));

    const { pack, isGod } = openPack();
    currentPack = pack;

    if (isGod) {
        alert("GOD PACK DETECTED!");
        document.body.classList.add('god-pack-effect');
        setTimeout(() => document.body.classList.remove('god-pack-effect'), 5000);
    }

    for (let i = 0; i < pack.length; i++) {
        await revealCard(pack[i], i);
    }

    // Reset pack visual for next time
    packVisual.classList.remove('tearing', 'torn');
    saveCollection();
}

function createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.innerHTML = `
        <div class="card-inner">
            <div class="card-back"></div>
            <div class="card-front">
                <img src="${card.image}" alt="${card.name}" onerror="this.src='https://via.placeholder.com/180x270?text=Image+Not+Found'">
                <div class="rarity-tag rarity-${card.rarity}">${card.rarity}</div>
                <div class="card-info">
                    <strong>${card.name}</strong>
                </div>
            </div>
        </div>
    `;
    
    cardEl.onclick = () => {
        if (!cardEl.classList.contains('revealed')) {
            cardEl.classList.add('revealed');
            addToCollection(card);
        } else {
            showCardDetail(card);
        }
    };
    
    return cardEl;
}

async function revealCard(card, index) {
    return new Promise(resolve => {
        const display = document.getElementById('cards-display');
        const cardEl = createCardElement(card, index);
        display.appendChild(cardEl);
        
        // Staggered entry
        setTimeout(() => {
            cardEl.style.opacity = '1';
            // Auto-reveal after a short delay
            setTimeout(() => {
                cardEl.classList.add('revealed');
                addToCollection(card);
                resolve();
            }, 600);
        }, index * 200);
    });
}

// Collection Logic
function addToCollection(card) {
    if (!collection.some(c => c.name === card.name)) {
        collection.push(card);
        updateCollectedCount();
    }
}

function saveCollection() {
    localStorage.setItem('pod_collection', JSON.stringify(collection));
}

function updateCollectedCount() {
    document.getElementById('collected-count').textContent = collection.length;
}

function updateCollectionUI(filter = 'ALL') {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    
    CARDS.forEach(card => {
        if (filter !== 'ALL' && card.rarity !== filter) return;
        
        const isCollected = collection.some(c => c.name === card.name);
        const cardEl = document.createElement('div');
        cardEl.className = `card revealed ${isCollected ? '' : 'locked'}`;
        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <img src="${card.image}" alt="${card.name}">
                    <div class="rarity-tag rarity-${card.rarity}">${card.rarity}</div>
                    <div class="card-info">
                        <strong>${card.name}</strong>
                    </div>
                </div>
            </div>
        `;
        
        if (isCollected) {
            cardEl.onclick = () => showCardDetail(card);
        }
        
        grid.appendChild(cardEl);
    });
    
    updateCollectedCount();
}

function filterCollection(rarity) {
    updateCollectionUI(rarity);
}

// Modal Detail
function showCardDetail(card) {
    const modal = document.getElementById('modal');
    const detail = document.getElementById('modal-card-detail');
    
    detail.innerHTML = `
        <div class="detail-container">
            <img src="${card.image}" alt="${card.name}" style="width: 250px; border-radius: 15px;">
            <div class="detail-info">
                <h2 class="rarity-${card.rarity}">${card.name}</h2>
                <p><strong>ระดับ:</strong> ${card.rarity}</p>
                <p><strong>ความสามารถ:</strong> ${card.ability}</p>
            </div>
        </div>
    `;
    
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById('modal').style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
}
