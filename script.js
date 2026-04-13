const APP_VERSION = '1.0.1';

// Rarity Rates (Total 100%) — isGacha='Y' cards only
// Tier order: LEG > SEC > UR > SSR > SR > R > C
const RATE = {
    LEG: 0.1,
    SEC: 0.4,
    UR: 1.0,
    SSR: 6.5,
    SR: 12.0,
    R: 30.0,
    C: 50.0
};

const GOD_PACK_CHANCE = 1; // 1%

let collection = JSON.parse(localStorage.getItem('pod_collection')) || [];
let currentPack = [];

// Lot Management State
let lotSelection = new Set(JSON.parse(localStorage.getItem('pod_lot_selection')) || []);
let activeLot = JSON.parse(localStorage.getItem('pod_active_lot')) || [];
let currentLotIndex = parseInt(localStorage.getItem('pod_lot_index')) || 0;
let currentLotRarity = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showSection('opening'); // Set initial active section
    updateCollectionUI();
    document.getElementById('total-count').textContent = CARDS.length;
    document.getElementById('app-version').textContent = `Version ${APP_VERSION}`;
    checkAuth();

    // Back to Top and Header Collapse Logic
    const backToTopBtn = document.getElementById('back-to-top-btn');
    const header = document.querySelector('header');
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                // Back to Top button
                const shouldShowBackToTop = window.scrollY > 300;
                if (shouldShowBackToTop && !backToTopBtn.classList.contains('visible')) {
                    backToTopBtn.classList.add('visible');
                } else if (!shouldShowBackToTop && backToTopBtn.classList.contains('visible')) {
                    backToTopBtn.classList.remove('visible');
                }

                // Header Collapse with Hysteresis (Buffer) to prevent jitter
                const currentScroll = window.scrollY;
                const collapseThreshold = 60;
                const expandThreshold = 40;

                if (currentScroll > collapseThreshold && !header.classList.contains('collapsed')) {
                    header.classList.add('collapsed');
                } else if (currentScroll < expandThreshold && header.classList.contains('collapsed')) {
                    header.classList.remove('collapsed');
                }

                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Auth Logic
async function checkAuth() {
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
            const res = await fetch('https://pod-tcg-backend-production.up.railway.app/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("[Auth] Response status:", res.status);

            if (res.ok) {
                const userData = await res.json();
                console.log("[Auth] Successfully fetched user data:", userData);
                localStorage.setItem('pod_user', JSON.stringify(userData));
                localStorage.setItem('pod_token', token);

                // Clear guest collection when logging in
                localStorage.removeItem('pod_collection');
                collection = [];

                window.history.replaceState({}, document.title, window.location.pathname);
                showUserProfile(userData);
            } else {
                const errText = await res.text();
                console.error('[Auth] Failed to fetch user profile:', errText);
                showAlert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ' + errText, 'error');
            }
        } catch (e) {
            console.error('[Auth] Error fetching user:', e);
            showAlert('ไม่สามารถเชื่อมต่อกับ Server 3000 ได้ กรุณาเช็ค Console ครับ', 'error');
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
    const infoBtn = document.getElementById('info-btn');
    if (loginBtn) loginBtn.style.display = 'none';
    if (profileDiv) profileDiv.style.display = 'flex';
    if (infoBtn) infoBtn.style.display = 'none';

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

    // Clear all stored data
    localStorage.removeItem('pod_user');
    localStorage.removeItem('pod_token');
    localStorage.removeItem('pod_collection');

    // Reset in-memory collection
    collection = [];

    // Reset UI
    const loginBtn = document.getElementById('login-btn');
    const profileDiv = document.getElementById('user-profile');
    const infoBtn = document.getElementById('info-btn');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (profileDiv) profileDiv.style.display = 'none';
    if (infoBtn) infoBtn.style.display = 'flex';

    // Refresh collection grid and counters
    updateCollectionUI();
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
    const policyModal = document.getElementById('policy-modal');
    if (policyModal && e.target === policyModal) {
        closePolicyModal();
    }
});

// Policy Modal
function showPolicyModal() {
    const m = document.getElementById('policy-modal');
    if (m) m.style.display = 'block';
}

function closePolicyModal() {
    const m = document.getElementById('policy-modal');
    if (m) m.style.display = 'none';
}

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

    // Update active state for nav buttons
    document.querySelectorAll('.nav-links button').forEach(btn => {
        const isCurrent = btn.getAttribute('onclick').includes(`'${sectionId}'`);
        btn.classList.toggle('active', isCurrent);
    });

    if (sectionId === 'collection') {
        filterCollection();
    }

    if (sectionId === 'lot') {
        if (activeLot.length > 0) {
            showLotOpeningView();
        } else {
            showLotSelectionView();
        }
    }
}

// Helper: Fisher-Yates Shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Roll Rarity Logic — only isGacha='Y' cards enter the pool
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
    // Only allow cards with isGacha = 'Y' into the gacha pool
    const filtered = CARDS.filter(c => c.rarity === rarity && c.isGacha === 'Y');
    if (filtered.length === 0) {
        // Fallback: any gacha-eligible card
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

        // Ensure uniqueness
        let attempts = 0;
        while (selectedIds.has(card.role_id) && attempts < 10) {
            card = getRandomCardByRarity(rarity);
            attempts++;
        }

        // If still duplicate after 10 attempts (pool too small), pick ANY unique card from gacha pool
        if (selectedIds.has(card.role_id)) {
            const fallbackPool = CARDS.filter(c => c.isGacha === 'Y' && !selectedIds.has(c.role_id));
            if (fallbackPool.length > 0) {
                card = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
            }
        }

        pack.push(card);
        selectedIds.add(card.role_id);
    }

    // Shuffle pack order so high-rarity cards don't always appear at the same position
    shuffleArray(pack);

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
    const tearSound = new Audio('https://img.lucky-pod.fun/tear.mp3');
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

    // Reveal cards one by one — each awaits its own jitter + rarity suspense
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
        'UR': '★★★★★',
        'SEC': '★★★★★★',
        'LEG': '★★★★★★★'
    };
    return stars[rarity] || '★';
}

function createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.rarity.toLowerCase()}`;
    cardEl.innerHTML = `
        <div class="card-gloss"></div>
        <div class="card-holo"></div>
        <div class="card-inner">
            <div class="card-back"></div>
            <div class="card-front">
                <div class="card-content">
                    <div class="card-header">
                        <span class="name">${card.name}</span>
                    </div>
                    <div class="image-box">
                        <img src="${card.image}" alt="${card.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/180x270?text=Image+Not+Found'">
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

    setupCardInteractions(cardEl);

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

function createCardElementWithoutHolog(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.rarity.toLowerCase()}`;
    cardEl.innerHTML = `
        <div class="card-inner">
            <div class="card-back"></div>
            <div class="card-front">
                <div class="card-content">
                    <div class="card-header">
                        <span class="name">${card.name}</span>
                    </div>
                    <div class="image-box">
                        <img src="${card.image}" alt="${card.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/180x270?text=Image+Not+Found'">
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

    // No setupCardInteractions for non-holographic version

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

// Rarity suspense config: higher rarity = longer pre-reveal pause
const RARITY_SUSPENSE_MS = {
    C:   0,
    R:   0,
    SR:  200,
    SSR: 500,
    UR:  900,
    SEC: 1400,
    LEG: 2000
};

async function revealCard(card, index) {
    const display = document.getElementById('cards-display');
    const cardEl = createCardElement(card, index);
    display.appendChild(cardEl);

    // Random jitter entry delay: base stagger + random offset (±80ms)
    const baseDelay = index * 180;
    const jitter = Math.floor(Math.random() * 160) - 80;
    const entryDelay = Math.max(0, baseDelay + jitter);

    // Suspense pause before flip based on rarity
    const suspense = RARITY_SUSPENSE_MS[card.rarity] ?? 0;
    // Extra random suspense nudge so even same-rarity cards don't feel identical
    const suspenseJitter = Math.floor(Math.random() * 200);

    return new Promise(resolve => {
        setTimeout(() => {
            cardEl.style.opacity = '1';

            // Brief suspense before auto-reveal
            setTimeout(() => {
                cardEl.classList.add('revealed');
                addToCollection(card);
                resolve();
            }, 600 + suspense + suspenseJitter);
        }, entryDelay);
    });
}

// Collection Logic
function addToCollection(card) {
    const isLoggedIn = !!localStorage.getItem('pod_token');
    // Only track local collection if guest
    if (!isLoggedIn && !collection.some(c => c.role_id === card.role_id)) {
        collection.push(card);
        updateCollectedCount();
    }
}

function saveCollection() {
    localStorage.setItem('pod_collection', JSON.stringify(collection));
}

let currentRarity = 'ALL';
let searchTimeout;

function filterCollection(rarity) {
    if (rarity !== undefined) currentRarity = rarity;

    const searchInput = document.getElementById('card-search');
    const search = searchInput ? searchInput.value.toLowerCase() : '';

    // Debounce the UI update for search to prevent lag
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        updateCollectionUI(currentRarity, search);
    }, search ? 250 : 0); // No debounce for rarity filters, only for search

    document.querySelectorAll('.filters button').forEach(btn => {
        const label = btn.textContent.trim();
        const isActive =
            (currentRarity === 'ALL' && label === 'ทั้งหมด') ||
            (currentRarity === 'OWNED' && label === '⭐ OWNED') ||
            (currentRarity !== 'ALL' && currentRarity !== 'OWNED' && label === currentRarity);
        btn.classList.toggle('active', isActive);
    });
}

function updateCollectedCount() {
    document.getElementById('collected-count').textContent = collection.length;
}

function updateCollectionUI(filter = 'ALL', search = '') {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    const isLoggedIn = !!localStorage.getItem('pod_token');
    const userData = JSON.parse(localStorage.getItem('pod_user') || '{}');
    const userRoleIds = new Set(Array.isArray(userData.roles) ? userData.roles : []);
    const localCollectionIds = new Set(collection.map(c => c.role_id));

    let ownedCount = 0;

    CARDS.forEach(card => {
        let isOwned = false;
        if (isLoggedIn) {
            // If logged in, only roles count
            isOwned = userRoleIds.has(card.role_id);
        } else {
            // If guest, use local gacha history
            isOwned = localCollectionIds.has(card.role_id);
        }

        if (isOwned) ownedCount++;

        // Filter by Search
        if (search && !card.name.toLowerCase().includes(search)) return;

        // Filter by Rarity/Owned
        if (filter === 'OWNED' && !isOwned) return;
        if (filter !== 'ALL' && filter !== 'OWNED' && card.rarity !== filter) return;

        const cardEl = document.createElement('div');
        cardEl.className = `card revealed ${card.rarity.toLowerCase()}${isOwned ? '' : ' not-owned'}`;
        cardEl.innerHTML = `
            <div class="card-gloss"></div>
            <div class="card-holo"></div>
            ${!isOwned ? '<div class="not-owned-badge">ยังไม่มี</div>' : ''}
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-content">
                        <div class="card-header">
                            <span class="name">${card.name}</span>
                        </div>
                        <div class="image-box">
                            <img src="${card.image}" alt="${card.name}" loading="lazy" onerror="this.style.display='none'">
                        </div>
                        <div class="card-body">
                            <div class="ability">
                                <strong>ความสามารถ</strong>
                                <p>${card.ability || '—'}</p>
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

        setupCardInteractions(cardEl);

        cardEl.onclick = () => showCardDetail(card);

        fragment.appendChild(cardEl);
    });

    grid.appendChild(fragment);

    // collected-count = cards owned via Discord roles, total-count = all cards
    document.getElementById('collected-count').textContent = ownedCount;
    document.getElementById('total-count').textContent = CARDS.length;
}

// Modal Detail
function showCardDetail(card) {
    const modal = document.getElementById('modal');
    const detail = document.getElementById('modal-card-detail');

    detail.innerHTML = `
        <div class="detail-container">
            <div class="modal-card-wrapper">
                <div class="card revealed ${card.rarity.toLowerCase()}" id="modal-card">
                    <div class="card-gloss"></div>
                    <div class="card-holo"></div>
                    <div class="card-inner">
                        <div class="card-front">
                            <div class="card-content">
                                <div class="card-header">
                                    <span class="name">${card.name}</span>
                                </div>
                                <div class="image-box">
                                    <img src="${card.image}" alt="${card.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/180x270?text=Image+Not+Found'">
                                </div>
                                <div class="card-body">
                                    <div class="ability">
                                        <strong>ความสามารถ</strong>
                                        <p>${card.ability || '—'}</p>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <span class="rarity-symbol">${getRarityStars(card.rarity)}</span>
                                    <span class="rarity-text">${card.rarity}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="detail-info">
                <h2 class="rarity-${card.rarity}">${card.name}</h2>
                <div class="detail-stats">
                    <p><strong>ระดับ:</strong> <span class="rarity-tag ${card.rarity.toLowerCase()}">${card.rarity}</span></p>
                    <p><strong>ความสามารถ:</strong></p>
                    <div class="detail-ability-box">${card.ability}</div>
                </div>
            </div>
        </div>
    `;

    const modalCard = document.getElementById('modal-card');
    setupCardInteractions(modalCard);

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById('modal').style.display = "none";
}

/* --- Custom Dialog System --- */
function showAlert(message, type = 'info') {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    const titles = {
        info: 'แจ้งเตือน',
        success: 'สำเร็จ',
        warning: 'คำเตือน',
        error: 'เกิดข้อผิดพลาด'
    };

    return showCustomDialog(titles[type], message, icons[type], [
        { text: 'ตกลง', type: 'primary' }
    ]);
}

function showConfirm(message, title = 'ยืนยัน') {
    return showCustomDialog(title, message, '❓', [
        { text: 'ยกเลิก', type: 'secondary', value: false },
        { text: 'ยืนยัน', type: 'primary', value: true }
    ]);
}

function showCustomDialog(title, message, icon, buttons) {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-dialog');
        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const iconEl = document.getElementById('dialog-icon');
        const buttonsEl = document.getElementById('dialog-buttons');

        titleEl.textContent = title;
        messageEl.textContent = message;
        iconEl.textContent = icon;
        buttonsEl.innerHTML = '';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.className = btn.type === 'primary' ? 'btn-primary' : 'btn-secondary';
            button.onclick = () => {
                modal.style.display = 'none';
                resolve(btn.hasOwnProperty('value') ? btn.value : true);
            };
            buttonsEl.appendChild(button);
        });

        modal.style.display = 'block';
    });
}

function setupCardInteractions(cardEl) {
    cardEl.addEventListener('mousemove', (e) => {
        const rect = cardEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        cardEl.style.setProperty('--mx', x);
        cardEl.style.setProperty('--my', y);
    });

    cardEl.addEventListener('mouseleave', () => {
        cardEl.style.setProperty('--mx', 0.5);
        cardEl.style.setProperty('--my', 0.5);
    });
}

window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
}

/* --- Lot Management Logic --- */

function showLotSelectionView() {
    document.getElementById('lot-selection-view').style.display = 'block';
    document.getElementById('lot-opening-view').style.display = 'none';
    renderLotSelection();
}

function showLotOpeningView() {
    document.getElementById('lot-selection-view').style.display = 'none';
    document.getElementById('lot-opening-view').style.display = 'block';
    updateLotOpeningUI();
}

function renderLotSelection() {
    const grid = document.getElementById('lot-selection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!currentLotRarity) {
        grid.innerHTML = '<div class="empty-lot-msg">กรุณาเลือกระดับการ์ดด้านบน เพื่อแสดงรายการการ์ด</div>';
        updateLotSelectionCount();
        return;
    }

    const fragment = document.createDocumentFragment();

    CARDS.forEach(card => {
        // Only gacha cards allowed in lot
        if (card.isGacha !== 'Y') return;

        // Filter by selected rarity
        if (card.rarity !== currentLotRarity) return;

        const isSelected = lotSelection.has(card.role_id);

        const cardEl = createCardElementWithoutHolog(card, 0); // index not used for logic here
        cardEl.classList.add('revealed');
        if (isSelected) cardEl.classList.add('selected');

        cardEl.onclick = () => toggleLotCard(card.role_id);
        fragment.appendChild(cardEl);
    });

    grid.appendChild(fragment);
    updateLotSelectionCount();
}

async function toggleLotCard(cardId) {
    if (lotSelection.has(cardId)) {
        lotSelection.delete(cardId);
    } else {
        if (lotSelection.size >= 10) {
            await showAlert('คุณสามารถเลือกได้สูงสุด 10 ใบเท่านั้น', 'warning');
            return;
        }
        lotSelection.add(cardId);
    }

    localStorage.setItem('pod_lot_selection', JSON.stringify([...lotSelection]));
    renderLotSelection();
}

function updateLotSelectionCount() {
    const count = lotSelection.size;
    document.getElementById('lot-selected-count').textContent = count;
    // Enable if there's at least 1 card and it's within limit (1-10)
    document.getElementById('start-lot-btn').disabled = (count === 0 || count > 10);
}

function filterLotByRarity(rarity) {
    currentLotRarity = rarity || null;
    renderLotSelection();
}

async function clearLotSelection() {
    if (await showConfirm('คุณต้องการล้างรายการที่เลือกทั้งหมดใช่หรือไม่?')) {
        lotSelection.clear();
        localStorage.removeItem('pod_lot_selection');
        renderLotSelection();
    }
}



async function startLot() {
    if (lotSelection.size === 0 || lotSelection.size > 10) {
        await showAlert('กรุณาเลือกการ์ดอย่างน้อย 1 ใบ (สูงสุด 10 ใบ)', 'warning');
        return;
    }

    // Prepare active lot
    const selectedIds = [...lotSelection];
    const selectedCards = selectedIds.map(id => CARDS.find(c => c.role_id === id)).filter(Boolean);

    // Shuffle and add isOpened state
    activeLot = shuffleArray([...selectedCards]).map(c => ({ ...c, isOpened: false }));
    currentLotIndex = 0;

    localStorage.setItem('pod_active_lot', JSON.stringify(activeLot));
    localStorage.setItem('pod_lot_index', currentLotIndex);

    // Clear previous lot display to force re-render
    const display = document.getElementById('lot-cards-display');
    if (display) display.innerHTML = '';

    showLotOpeningView();
}

function updateLotOpeningUI() {
    const total = activeLot.length;
    const openedCount = activeLot.filter(c => c.isOpened).length;
    const remaining = total - openedCount;

    document.getElementById('lot-remaining-count').textContent = remaining;
    document.getElementById('lot-total-count').textContent = total;

    const display = document.getElementById('lot-cards-display');

    // Always render all cards if they are not already rendered correctly
    if (display.children.length !== total) {
        display.innerHTML = '';
        activeLot.forEach((card, index) => {
            const cardEl = createCardElementWithoutHolog(card, index);
            if (card.isOpened) {
                cardEl.classList.add('revealed');
            } else {
                cardEl.classList.remove('revealed');
            }
            cardEl.onclick = () => handleLotCardFlip(cardEl, index);
            display.appendChild(cardEl);
            setTimeout(() => cardEl.style.opacity = '1', index * 100);
        });
    }
}

function handleLotCardFlip(cardEl, index) {
    const card = activeLot[index];
    if (!card.isOpened) {
        // First click: Reveal
        card.isOpened = true;
        cardEl.classList.add('revealed');
        addToCollection(card);
        saveCollection();
        localStorage.setItem('pod_active_lot', JSON.stringify(activeLot));

        // Update counts
        const total = activeLot.length;
        const openedCount = activeLot.filter(c => c.isOpened).length;
        document.getElementById('lot-remaining-count').textContent = total - openedCount;

        if (openedCount === total) {
            // Optional: highlight completion
        }
    } else {
        // Subsequent clicks: Show detail
        showCardDetail(card);
    }
}

async function confirmResetLot() {
    if (await showConfirm('คุณต้องการจบล็อตนี้และกลับไปหน้าเดิมใช่หรือไม่? (ความคืบหน้าจะหายไป และรายการที่เลือกจะถูกล้าง)')) {
        // Clear active opening lot
        activeLot = [];
        currentLotIndex = 0;
        localStorage.removeItem('pod_active_lot');
        localStorage.removeItem('pod_lot_index');

        // Clear selection grid as well
        lotSelection.clear();
        localStorage.removeItem('pod_lot_selection');
        currentLotRarity = null; // Reset rarity filter as well for a clean start
        if (document.getElementById('rarity-select')) {
            document.getElementById('rarity-select').selectedIndex = 0;
        }

        const display = document.getElementById('lot-cards-display');
        if (display) display.innerHTML = '';

        showLotSelectionView();
    }
}
