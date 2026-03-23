---
trigger: manual
---

please migrate section card below 
example tempalte


<html>
  <style>
    :root {
  --ssr-color: linear-gradient(135deg, #ff00cc, #3333ff, #00ffcc, #ffcc00);
  --sr-color: linear-gradient(135deg, #ffd700, #b8860b, #daa520);
  --r-color: linear-gradient(135deg, #e0e0e0, #808080, #bdc3c7);
  --c-color: linear-gradient(135deg, #a8a8a8, #d3d3d3);
}

.card {
  width: 280px;
  height: 400px;
  border-radius: 18px;
  position: relative;
  padding: 12px; /* ขอบนอกของการ์ด */
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

/* เอฟเฟกต์เงาวิ่งผ่านหน้าการ์ด (Glossy) */
.card-gloss {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(110deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0) 50%);
  background-size: 200% 200%;
  z-index: 5;
  pointer-events: none;
}

.card:hover .card-gloss {
  animation: shine 1.5s infinite;
}

@keyframes shine {
  0% { background-position: 200% 0%; }
  100% { background-position: -200% 0%; }
}

/* พื้นหลังตามระดับ Rarity */
.card.ssr { background: var(--ssr-color); background-size: 400% 400%; animation: moveGradient 5s infinite alternate; }
.card.sr  { background: var(--sr-color); }
.card.r   { background: var(--r-color); }
.card.c   { background: var(--c-color); }

@keyframes moveGradient {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

.card-inner {
  background: #fdfdfd;
  height: 100%;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
}

/* Header: ชื่อและ HP */
.card-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.card-header .name { font-weight: bold; font-size: 1.2rem; color: #333; }
.card-header .hp { color: #d32f2f; font-weight: bold; font-size: 1.1rem; }
.card-header .hp span { font-size: 0.7rem; }

/* ช่องใส่รูป */
.image-box {
  width: 90%;
  height: 160px;
  margin: 0 auto;
  background: radial-gradient(circle, #eee 20%, #ccc 100%);
  border: 3px solid #777;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 4px 8px rgba(0,0,0,0.2);
}

.image-box img { width: 140px; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3)); }

/* รายละเอียดล่างการ์ด */
.card-body { padding: 15px; flex-grow: 1; border-top: 1px solid #ddd; margin-top: 10px; }
.ability { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 5px; }

.card-footer {
  padding: 5px 12px;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  background: rgba(0,0,0,0.05);
  border-radius: 0 0 10px 10px;
}
  </style>
  <body>
    <div class="card-container">
  <div class="card ssr">
    <div class="card-gloss"></div>
    <div class="card-inner">
      <div class="card-header">
        <span class="name">Charizard</span>
        <span class="hp"><span>HP</span> 200</span>
      </div>
      <div class="image-box">
        <img src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/006.png" alt="Pokemon">
      </div>
      <div class="card-body">
        <div class="ability">
          <strong>Fire Spin</strong>
          <span>100</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="rarity-symbol">★★★</span>
        <span class="rarity-text">SSR</span>
      </div>
    </div>
  </div>
</div>
  </body>
</html>