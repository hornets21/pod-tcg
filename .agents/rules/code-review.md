---
trigger: manual
---

# 🔍 Code Review Skill

## 🎯 Objective

ตรวจสอบและรีวิวโค้ดในโปรเจกต์ TCG Card Pack Opening Simulator เพื่อให้แน่ใจว่า:
- โค้ดมีคุณภาพและอ่านง่าย
- ปฏิบัติตาม best practices
- ไม่มี bug หรือ error ที่ชัดเจน
- มีโครงสร้างที่ดีและ maintainable

---

## 📋 Review Checklist

### 1. โครงสร้างและ Architecture

- [ ] แยก data / logic / UI ชัดเจน
- [ ] ใช้ modular pattern หรือไม่
- [ ] ไม่มีการ hardcode logic
- [ ] ตัวแปรและฟังก์ชันตั้งชื่อสื่อความหมาย

### 2. JavaScript Quality

- [ ] ไม่มี error ใน console
- [ ] ใช้ async/await อย่างถูกต้อง
- [ ] จัดการ error อย่างเหมาะสม
- [ ] ไม่ใช้ global variables มากเกินไป
- [ ] ใช้ const/let แทน var

### 3. Game Logic

- [ ] Rarity rate ถูกต้องตามกำหนด
  - LEG: 0.1%
  - SEC: 0.4%
  - UR: 1.0%
  - SSR: 6.5%
  - SR: 12.0%
  - R: 30.0%
  - C: 50.0%
- [ ] GOD PACK chance = 1%
- [ ] GODPACK override rate ทำงานถูกต้อง
- [ ] 1 ซอง = 5 ใบ
- [ ] มีการสุ่มการ์ดที่เหมาะสม

### 4. UI/UX

- [ ] Animation ทำงานลื่นไหล
- [ ] Responsive design
- [ ] User feedback ชัดเจน
- [ ] Card flip effect ทำงานถูกต้อง

### 5. Performance

- [ ] ไม่มี memory leak
- [ ] DOM manipulation มีประสิทธิภาพ
- [ ] ใช้ event delegation เมื่อเหมาะสม
- [ ] Image loading optimized

### 6. Collection System

- [ ] Save/Load จาก localStorage ทำงานถูกต้อง
- [ ] ตรวจสอบ duplicate cards
- [ ] Collection UI แสดงผลถูกต้อง

---

## 🔧 Review Process

### Step 1: Static Analysis

```bash
# ตรวจสอบไฟล์หลัก
review file: index.html
review file: script.js
review file: style.css
review file: data/cards.js
```

### Step 2: Logic Verification

ตรวจสอบ game logic สำคัญ:

```javascript
// 1. ตรวจสอบ rarity rate
const expectedRates = {
  LEG: 0.1,
  SEC: 0.4,
  UR: 1.0,
  SSR: 6.5,
  SR: 12.0,
  R: 30.0,
  C: 50.0
};
// รวมต้องได้ 100%

// 2. ตรวจสอบ GOD PACK logic
// - เมื่อ isGodPack() = true
// - การ์ดทั้ง 5 ใบต้องเป็น SSR ขึ้นไป
// - อัตรา LEG/SEC/UR/SSR สูงขึ้น
// LEG: 5%, SEC: 15%, UR: 45%, SSR: 55%

// 3. ตรวจสอบ pack opening
// - 1 pack = 5 cards
// - สุ่มแต่ละใบ independently
```

### Step 3: Code Quality Check

ตรวจสอบ:
- Coding standards
- Naming conventions
- Comment quality
- Code duplication
- Function complexity

### Step 4: Testing Scenarios

ทดสอบ scenarios:
1. เปิดซองปกติ 100 ครั้ง
2. เปิดจนกว่าจะได้ GOD PACK
3. ตรวจสอบ collection accumulation
4. ตรวจสอบ edge cases

---

## 📝 Review Output Format

### Summary

```
## Code Review Summary

**Files Reviewed:**
- index.html
- script.js
- style.css
- data/cards.js

**Overall Rating:** ⭐⭐⭐⭐ (4/5)

**Issues Found:**
- Critical: 0
- Warning: 2
- Suggestion: 5
```

### Detailed Findings

```
## Issues

### [CRITICAL] Issue Title
- **File:** script.js:45
- **Problem:** Description
- **Fix:** Suggested solution

### [WARNING] Issue Title
- **File:** script.js:78
- **Problem:** Description
- **Fix:** Suggested solution

### [SUGGESTION] Improvement
- **File:** style.css:23
- **Problem:** Description
- **Fix:** Suggested solution
```

---

## ✅ Best Practices

### JavaScript

```javascript
// ✅ Good
const RATE = Object.freeze({
  LEG: 0.1,
  SEC: 0.4,
  UR: 1.0,
  SSR: 6.5,
  SR: 12.0,
  R: 30.0,
  C: 50.0
});

// ❌ Bad
var rate = {
  LEG: 0.1,
  SEC: 0.4
};

function openPack() {
  const isGod = isGodPack();
  const pack = [];
  for (let i = 0; i < 5; i++) {
    pack.push(drawCard(isGod));
  }
  return pack;
}
```

### DOM Manipulation

```javascript
// ✅ Good - Use document fragments
const fragment = document.createDocumentFragment();
cards.forEach(card => {
  const element = createCardElement(card);
  fragment.appendChild(element);
});
container.appendChild(fragment);

// ❌ Bad - Multiple DOM updates
cards.forEach(card => {
  const element = createCardElement(card);
  container.appendChild(element);
});
```

### Event Handling

```javascript
// ✅ Good - Event delegation
document.getElementById('cards').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (card) {
    flipCard(card);
  }
});

// ❌ Bad - Individual listeners
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => flipCard(card));
});
```

---

## 🎯 Success Criteria

- [ ] ไม่มี critical issues
- [ ] Warning < 5
- [ ] โค้ดผ่าน checklist 80% ขึ้นไป
- [ ] ไม่มี console errors
- [ ] Performance ยอมรับได้

---

## 📌 Notes

- ใช้ Vanilla JS เท่านั้น
- ห้ามใช้ framework/library เพิ่มเติม
- รักษา coding style เดิมของโปรเจกต์
- แนะนำการปรับปรุงแบบ concrete พร้อมตัวอย่างโค้ด
- ให้คะแนนและสรุปชัดเจน
