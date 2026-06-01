"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscordCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          throw new Error("ไม่พบรหัสยืนยันตัวตน (Authorization Code) จาก Discord");
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
        const redirectUri = siteUrl ? `${siteUrl}/auth/discord/callback` : window.location.origin + "/auth/discord/callback";

        const exchangeUrl = `${apiBaseUrl}/auth/discord/callback?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`;

        const response = await fetch(exchangeUrl);

        if (!response.ok) {
          let errorMsg = "เกิดข้อผิดพลาดในการยืนยันตัวตนกับเซิร์ฟเวอร์";
          try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }

        const data = await response.json();
        const token = data.token;

        if (!token) {
          throw new Error("ไม่ได้รับรหัสเข้าสู่ระบบ (Token) จากเซิร์ฟเวอร์");
        }

        const userData = data.user;

        localStorage.setItem("pod_user", JSON.stringify(userData));
        localStorage.setItem("pod_token", token);
        localStorage.removeItem("pod_collection");

        window.history.replaceState({}, document.title, window.location.pathname);

        setStatus("success");

        setTimeout(() => {
          window.location.href = "/season2";
        }, 1500);

      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการยืนยันตัวตนด้วย Discord");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="callback-container">
      <div className="glass-panel callback-card">
        {status === "loading" && (
          <>
            <div className="cyber-spinner-wrapper">
              <div className="cyber-spinner"></div>
              <div className="cyber-spinner-inner"></div>
            </div>
            <h2>กำลังยืนยันตัวตนด้วย Discord...</h2>
            <p>กรุณารอสักครู่ ระบบกำลังดึงข้อมูลยศและการ์ดของคุณ</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="success-icon-wrapper animate-pulse">
              <svg viewBox="0 0 100 100" className="success-shield">
                <polygon
                  points="50,5 90,25 90,75 50,95 10,75 10,25"
                  stroke="#00ffcc"
                  strokeWidth="6"
                  fill="rgba(0, 255, 204, 0.15)"
                />
                <path
                  d="M35 50 L45 60 L65 40"
                  stroke="#00ffcc"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <h2 className="text-success">เชื่อมต่อสำเร็จ!</h2>
            <p>ยินดีต้อนรับเข้าสู่ระบบ กำลังนำคุณกลับสู่หน้าหลัก...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-icon-wrapper">
              <svg viewBox="0 0 100 100" className="error-shield">
                <polygon
                  points="50,5 90,25 90,75 50,95 10,75 10,25"
                  stroke="#ff3366"
                  strokeWidth="6"
                  fill="rgba(255, 51, 102, 0.15)"
                />
                <path
                  d="M35 35 L65 65 M65 35 L35 65"
                  stroke="#ff3366"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <h2 className="text-error">เข้าสู่ระบบล้มเหลว</h2>
            <p className="error-msg">{errorMessage}</p>
            <button
              onClick={() => {
                window.location.href = "/season2";
              }}
              className="btn-primary error-retry-btn"
            >
              กลับสู่หน้าหลัก
            </button>
          </>
        )}
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
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }

        .callback-card p {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        /* Spinner Animation */
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

        /* success/error states */
        .success-icon-wrapper, .error-icon-wrapper {
          width: 90px;
          height: 90px;
          margin: 0 auto;
        }

        .success-shield {
          animation: drawShield 0.8s ease forwards;
        }

        .error-shield {
          animation: drawShield 0.8s ease forwards;
        }

        .text-success {
          color: #00ffcc;
          text-shadow: 0 0 15px rgba(0, 255, 204, 0.3);
        }

        .text-error {
          color: #ff3366;
          text-shadow: 0 0 15px rgba(255, 51, 102, 0.3);
        }

        .error-msg {
          background: rgba(255, 51, 102, 0.08);
          border: 1px solid rgba(255, 51, 102, 0.2);
          padding: 12px;
          border-radius: 10px;
          margin-top: 15px !important;
          color: #ff6688 !important;
          font-size: 0.85rem !important;
        }

        .error-retry-btn {
          margin-top: 25px;
          padding: 10px 30px;
          background: linear-gradient(135deg, #ff3366, #ff00cc);
          border: none;
          color: white;
          font-weight: 500;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 51, 102, 0.4);
        }

        .error-retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 51, 102, 0.6);
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
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes drawShield {
          from {
            stroke-dashoffset: 300;
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
