---
trigger: manual
---

# 🃏 TCG Card Pack Opening Simulator (Vanilla JS)

## 🎯 Objective

สร้างเว็บจำลองการ "เปิดซองการ์ด TCG"

* 1 ซอง = 5 ใบ
* มี rarity:

  * SSSR
  * SSR
  * SR
  * R
  * C
* มีโอกาส **GOD PACK**
* มี animation + sound
* มีระบบสมุดการ์ด (เช่น OP-1)

---

## 📁 Project Structure

```
project/
│── index.html
│── style.css
│── script.js
│── data/
│    └── cards.js
│── assets/
│    ├── cards/
│    ├── sounds/
│    └── effects/
│── instructions.md
```

---

## 🎲 Rarity Rate

```js
const RATE = {
  SSSR: 0.5,
  SSR: 2,
  SR: 7.5,
  R: 20,
  C: 70
};
```

---

## 🌟 GOD PACK

```js
const GOD_PACK_CHANCE = 1; // 1%

function isGodPack() {
  return Math.random() * 100 < GOD_PACK_CHANCE;
}
```

### Behavior:

* ถ้าเป็น GOD PACK:

  * การ์ดทั้ง 5 ใบ = SR ขึ้นไป
  * มีโอกาส SSR / SSSR สูงขึ้น

---

## 🎴 Card Data (cards.js)

```js
const CARDS = [
  {
    id: "OP1-001",
    name: "Luffy",
    rarity: "SSSR",
    image: "assets/cards/luffy.png",
    set: "OP-1"
  },
  {
    id: "OP1-010",
    name: "Zoro",
    rarity: "SSR",
    image: "assets/cards/zoro.png",
    set: "OP-1"
  }
];
```

---

## 🎯 Pack Opening Logic

### เปิดซอง

```js
function openPack() {
  const isGod = isGodPack();
  const pack = [];

  for (let i = 0; i < 5; i++) {
    pack.push(drawCard(isGod));
  }

  return pack;
}
```

---

### สุ่มการ์ด

```js
function drawCard(isGod) {
  let rarity;

  if (isGod) {
    rarity = getHighRarity();
  } else {
    rarity = rollRarity();
  }

  return getRandomCardByRarity(rarity);
}
```

---

### Roll Rarity

```js
function rollRarity() {
  const rand = Math.random() * 100;

  if (rand < 0.5) return "SSSR";
  if (rand < 2.5) return "SSR";
  if (rand < 10) return "SR";
  if (rand < 30) return "R";
  return "C";
}
```

---

### GOD PACK Roll

```js
function getHighRarity() {
  const rand = Math.random() * 100;

  if (rand < 10) return "SSSR";
  if (rand < 40) return "SSR";
  return "SR";
}
```

---

### เลือกการ์ด

```js
function getRandomCardByRarity(rarity) {
  const filtered = CARDS.filter(c => c.rarity === rarity);
  return filtered[Math.floor(Math.random() * filtered.length)];
}
```

---

## 🎬 Animation Flow

1. กดปุ่ม "เปิดซอง"
2. เล่นเสียงซอง
3. แสดง animation ซองแตก
4. การ์ดออกทีละใบ
5. flip การ์ด
6. ถ้า rare:

   * glow effect
   * particle

---

## 🔊 Sound

* pack_open.mp3
* card_flip.mp3
* rare.mp3
* godpack.mp3

---

## 💻 HTML

```html
<button onclick="startOpening()">เปิดซอง</button>

<div id="pack"></div>
<div id="cards"></div>
```

---

## 🎨 CSS

```css
.card {
  width: 120px;
  height: 180px;
  perspective: 1000px;
}

.inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip {
  transform: rotateY(180deg);
}
```

---

## 🧠 JS Animation

```js
async function startOpening() {
  const pack = openPack();

  for (let i = 0; i < pack.length; i++) {
    await revealCard(pack[i], i);
  }
}
```

---

## 📚 Collection System

```js
let collection = [];

function addToCollection(card) {
  if (!collection.includes(card.id)) {
    collection.push(card.id);
  }
}
```

---

## 💾 Save

```js
localStorage.setItem("collection", JSON.stringify(collection));
```

---

## ⚙️ Rules

* 1 ซอง = 5 ใบ
* แนะนำ:

  * อย่างน้อย 1 ใบ R+
* GOD PACK override rate ปกติ

---

## 🚀 Future Features

* pity system
* multi-pack opening
* card filter
* animation ขั้นสูง

---

## ✅ Success Criteria

* เปิดซองได้
* rate ถูกต้อง
* มี GOD PACK
* มี animation
* มี collection

---

## 📌 Notes

* ใช้ Vanilla JS เท่านั้น
* ห้าม hardcode logic
* แยก data / logic / UI
* ต้องไม่มี error ใน console
