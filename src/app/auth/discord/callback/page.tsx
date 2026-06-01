"use client";

import { useEffect } from "react";

export default function DiscordCallbackPage() {
  useEffect(() => {
    window.location.href = "/season2";
  }, []);

  return (
    <div className="callback-container">
      <div className="glass-panel callback-card">
        <div className="cyber-spinner-wrapper">
          <div className="cyber-spinner"></div>
          <div className="cyber-spinner-inner"></div>
        </div>
        <h2>กำลังเปลี่ยนเส้นทาง...</h2>
      </div>

      <style jsx global>{`
        .callback-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: radial-gradient(circle at center, #1b1548 0%, #0c0827 100%);
          font-family: var(--font-kanit), sans-serif;
          color: #fff;
          padding: 20px;
        }

        .callback-card {
          width: 100%;
          max-width: 480px;
          padding: 40px 30px;
          border-radius: 20px;
          text-align: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .callback-card h2 {
          font-size: 1.6rem;
          font-weight: 600;
          margin-top: 25px;
          letter-spacing: 0.5px;
        }

        .cyber-spinner-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }

        .cyber-spinner {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top-color: #00d2ff;
          border-bottom-color: #00d2ff;
          border-radius: 50%;
          animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .cyber-spinner-inner {
          box-sizing: border-box;
          position: absolute;
          width: 75%;
          height: 75%;
          top: 12.5%;
          left: 12.5%;
          border: 3px solid transparent;
          border-left-color: #ff00cc;
          border-right-color: #ff00cc;
          border-radius: 50%;
          animation: spin-reverse 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}