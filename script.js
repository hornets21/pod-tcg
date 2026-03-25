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
    checkAuth();
});

// Auth Logic
async function checkAuth() {
    console.log("[Auth] Current URL:", window.location.href);
    console.log("[Auth] Current Location Search:", window.location.search);

    // In case Live Server or hashes mess up the query string
    let searchString = window.location.search;
    if (!searchString && window.location.href.includes('?')) {
        searchString = '?' + window.location.href.split('?')[1];
    }

    const urlParams = new URLSearchParams(searchString);
    const token = urlParams.get('token');

    console.log("[Auth] Extracted token:", token);

    if (token && token !== 'null' && token !== 'undefined') {
        try {
            console.log(`[Auth] Fetching user profile using token...`);
            const res = await fetch('http://localhost:3000/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("[Auth] Response status:", res.status);

            if (res.ok) {
                const userData = await res.json();
                console.log("[Auth] Successfully fetched user data:", userData);
                localStorage.setItem('pod_user', JSON.stringify(userData));
                localStorage.setItem('pod_token', token);
                window.history.replaceState({}, document.title, window.location.pathname);
                showUserProfile(userData);
            } else {
                const errText = await res.text();
                console.error('[Auth] Failed to fetch user profile:', errText);
                alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ' + errText);
            }
        } catch (e) {
            console.error('[Auth] Error fetching user:', e);
            alert('ไม่สามารถเชื่อมต่อกับ Server 3000 ได้ กรุณาเช็ค Console ครับ');
        }
    } else {
        const storedUser = localStorage.getItem('pod_user');
        if (storedUser) {
            console.log("[Auth] Loaded stored user from localStorage");
            showUserProfile(JSON.parse(storedUser));
        }
    }
}

function showUserProfile(user) {
    const loginBtn = document.getElementById('login-btn');
    const profileDiv = document.getElementById('user-profile');
    if (loginBtn) loginBtn.style.display = 'none';
    if (profileDiv) profileDiv.style.display = 'flex';

    const userNameEl = document.getElementById('user-name');
    const userAvatarEl = document.getElementById('user-avatar');

    if (userNameEl) userNameEl.textContent = user.global_name || user.username;

    if (userAvatarEl) {
        if (user.avatar && user.avatar !== 'null') {
            if (user.avatar.startsWith('http')) {
                userAvatarEl.src = user.avatar;
            } else {
                userAvatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
            }
        } else {
            userAvatarEl.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
    }
}

function logout() {
    showLogoutDialog();
}

function showLogoutDialog() {
    document.getElementById('logout-dialog').classList.add('active');
}

function closeLogoutDialog() {
    document.getElementById('logout-dialog').classList.remove('active');
}

function confirmLogout() {
    closeLogoutDialog();
    localStorage.removeItem('pod_user');
    localStorage.removeItem('pod_token');
    const loginBtn = document.getElementById('login-btn');
    const profileDiv = document.getElementById('user-profile');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (profileDiv) profileDiv.style.display = 'none';
}

// Close dialog when clicking outside
document.addEventListener('click', (e) => {
    const dialog = document.getElementById('logout-dialog');
    if (dialog && e.target === dialog) {
        closeLogoutDialog();
    }
    const gpDialog = document.getElementById('godpack-dialog');
    if (gpDialog && e.target === gpDialog) {
        closeGodpackDialog();
    }
});

// GOD PACK Dialog
function showGodpackDialog() {
    document.getElementById('godpack-dialog').classList.add('active');
    document.body.classList.add('god-pack-effect');
}

function closeGodpackDialog() {
    document.getElementById('godpack-dialog').classList.remove('active');
    setTimeout(() => document.body.classList.remove('god-pack-effect'), 5000);
}

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
        showGodpackDialog();
    }

    for (let i = 0; i < pack.length; i++) {
        await revealCard(pack[i], i);
    }

    // Reset pack visual for next time
    packVisual.classList.remove('tearing', 'torn');
    saveCollection();
}

function getRarityStars(rarity) {
    const stars = {
        'C': '★',
        'R': '★★',
        'SR': '★★★',
        'SSR': '★★★★',
        'SSSR': '★★★★★',
        'SSSSR': '★★★★★★'
    };
    return stars[rarity] || '★';
}

function createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.rarity.toLowerCase()}`;
    cardEl.innerHTML = `
        <div class="card-gloss"></div>
        <div class="card-inner">
            <div class="card-back"></div>
            <div class="card-front">
                <div class="card-content">
                    <div class="card-header">
                        <span class="name">${card.name}</span>
                    </div>
                    <div class="image-box">
                        <img src="${card.image}" alt="${card.name}" onerror="this.src='https://via.placeholder.com/180x270?text=Image+Not+Found'">
                    </div>
                    <div class="card-body">
                        <div class="ability">
                            <strong>ความสามารถ</strong>
                            <p>${card.ability}</p>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span class="rarity-symbol">${getRarityStars(card.rarity)}</span>
                        <span class="rarity-text">${card.rarity}</span>
                    </div>
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
        cardEl.className = `card revealed ${card.rarity.toLowerCase()} ${isCollected ? '' : 'locked'}`;
        cardEl.innerHTML = `
            <div class="card-gloss"></div>
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-content">
                        <div class="card-header">
                            <span class="name">${card.name}</span>
                        </div>
                        <div class="image-box">
                            <img src="${card.image}" alt="${card.name}">
                        </div>
                        <div class="card-body">
                            <div class="ability">
                                <strong>ความสามารถ</strong>
                                <p>${card.ability}</p>
                            </div>
                        </div>
                        <div class="card-footer">
                            <span class="rarity-symbol">${getRarityStars(card.rarity)}</span>
                            <span class="rarity-text">${card.rarity}</span>
                        </div>
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
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === (rarity === 'ALL' ? 'ทั้งหมด' : rarity));
    });
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

window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
}
