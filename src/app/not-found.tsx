"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="neon-backdrop" aria-hidden="true">
        <div className="neon-halftone" />
        <div className="neon-grid" />
        <div className="neon-shape shape-one" />
        <div className="neon-shape shape-two" />
        <div className="neon-scanline" />
      </div>

      <div className="not-found-card">
        <div className="glitch-wrapper">
          <h1 className="glitch-text">404</h1>
        </div>
        
        <h2>ไม่พบหน้าเพจที่ต้องการ</h2>
        <p>ที่อยู่อีเมลหรือลิงก์ปลายทางนี้อาจจะไม่ถูกต้อง หรือหน้าเพจถูกลบออกไปแล้ว</p>
        
        <div className="actions-wrapper">
          <Link href="/" className="back-home-btn">
            <span>กลับสู่หน้าแรก</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .not-found-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #050308 0%, #0a0611 48%, #020504 100%);
          font-family: var(--font-kanit), sans-serif;
          overflow: hidden;
          isolation: isolate;
        }

        .neon-backdrop {
          position: absolute;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }

        .neon-halftone {
          position: absolute;
          inset: 0;
          opacity: 0.16;
          background-image:
            radial-gradient(circle, rgba(200, 255, 45, 0.4) 0 1.2px, transparent 1.7px),
            radial-gradient(circle, rgba(213, 51, 255, 0.3) 0 1px, transparent 1.6px);
          background-position: 0 0, 11px 11px;
          background-size: 22px 22px;
          mask-image: linear-gradient(90deg, black, transparent 38%, transparent 62%, black);
        }

        .neon-grid {
          position: absolute;
          right: -15%;
          bottom: -34%;
          left: -15%;
          height: 70%;
          opacity: 0.12;
          background-image:
            linear-gradient(rgba(196, 255, 45, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(202, 48, 255, 0.5) 1px, transparent 1px);
          background-size: 64px 42px;
          transform: perspective(420px) rotateX(58deg);
          transform-origin: 50% 100%;
          animation: grid-run 8s linear infinite;
        }

        .neon-shape {
          position: absolute;
          opacity: 0.3;
          filter: drop-shadow(0 0 9px currentColor);
          animation: shape-float 12s ease-in-out infinite alternate;
        }

        .shape-one {
          top: 15%;
          left: -5%;
          width: min(30vw, 350px);
          aspect-ratio: 1.4;
          color: #c52cff;
          border: 2px solid currentColor;
          background: linear-gradient(135deg, rgba(197, 44, 255, 0.12), transparent 62%);
          clip-path: polygon(0 18%, 100% 0, 72% 100%, 18% 76%);
          transform: rotate(-12deg);
        }

        .shape-two {
          right: -5%;
          bottom: 10%;
          width: min(32vw, 400px);
          aspect-ratio: 1.6;
          color: #baff26;
          border: 2px solid currentColor;
          background: linear-gradient(145deg, rgba(186, 255, 38, 0.1), transparent 65%);
          clip-path: polygon(22% 0, 100% 26%, 77% 100%, 0 72%);
          transform: rotate(9deg);
          animation-delay: -6s;
        }

        .neon-scanline {
          position: absolute;
          inset: -20% 0;
          opacity: 0.1;
          background: linear-gradient(
            180deg,
            transparent 0%,
            transparent 45%,
            rgba(210, 255, 50, 0.2) 49%,
            rgba(195, 43, 255, 0.15) 51%,
            transparent 55%,
            transparent 100%
          );
          animation: scanline-pass 10s ease-in-out infinite;
        }

        .not-found-card {
          background: rgba(12, 10, 30, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(196, 44, 255, 0.2);
          border-radius: 24px;
          padding: 3.5rem 2rem;
          max-width: 480px;
          width: 90%;
          text-align: center;
          box-shadow: 
            0 24px 60px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          z-index: 10;
        }

        .glitch-wrapper {
          position: relative;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .glitch-text {
          font-family: var(--font-chakra), sans-serif;
          font-size: clamp(5.5rem, 15vw, 8rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.05em;
          line-height: 1;
          position: relative;
          text-shadow: 
            0 0 20px rgba(0, 210, 255, 0.6),
            0 0 40px rgba(196, 44, 255, 0.5);
          animation: text-pulse 2s ease-in-out infinite alternate;
        }

        .not-found-card h2 {
          font-size: 1.6rem;
          color: #fff;
          margin-bottom: 1rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }

        .not-found-card p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 2.5rem;
          font-weight: 300;
        }

        .actions-wrapper {
          display: flex;
          justify-content: center;
        }

        .back-home-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 36px;
          font-family: var(--font-kanit), sans-serif;
          font-size: 1rem;
          font-weight: bold;
          color: #fff;
          text-decoration: none;
          background: linear-gradient(135deg, #00d2ff 0%, #a445fc 100%);
          border: none;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 210, 255, 0.35);
        }

        .back-home-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 8px 30px rgba(0, 210, 255, 0.55);
        }

        .back-home-btn:active {
          transform: translateY(-1px) scale(0.98);
        }

        @keyframes grid-run {
          to { background-position: 0 84px, 64px 0; }
        }

        @keyframes shape-float {
          to { translate: 20px 15px; scale: 1.04; opacity: 0.45; }
        }

        @keyframes scanline-pass {
          0%, 20% { transform: translateY(-45%); }
          75%, 100% { transform: translateY(45%); }
        }

        @keyframes text-pulse {
          from {
            text-shadow: 
              0 0 15px rgba(0, 210, 255, 0.5),
              0 0 30px rgba(196, 44, 255, 0.4);
          }
          to {
            text-shadow: 
              0 0 25px rgba(0, 210, 255, 0.8),
              0 0 50px rgba(196, 44, 255, 0.7);
          }
        }
      `}</style>
    </div>
  );
}
