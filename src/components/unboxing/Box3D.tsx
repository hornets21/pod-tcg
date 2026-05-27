"use client";

import React from "react";

interface Box3DProps {
  isOpen: boolean;
  onClick: () => void;
  season: string;
}

export const Box3D: React.FC<Box3DProps> = ({ isOpen, onClick, season }) => {
  const boxImg = "https://img.lucky-pod.fun/front-box.png";

  return (
    <div
      className={`box-wrapper ${isOpen ? "opened" : ""}`}
      onClick={!isOpen ? onClick : undefined}
    >
      <div className="box-container">
        {/* Lid (Top Face) */}
        <div className="box-face lid">
          <div className="lid-inner">
            <div className="lid-top-bar"></div>
            <div className="lid-content">
              <span className="box-logo-small">POD TCG</span>
            </div>
          </div>
        </div>

        {/* Front Face */}
        <div className="box-face front"></div>


        {/* Back Face */}
        <div className="box-face back">
          <div className="back-content">
            <div className="barcode"></div>
            <div className="legal-text">© 2026 LUCKY POD TCG.</div>
          </div>
        </div>

        {/* Side Faces */}
        <div className="box-face left">
          <div className="side-design">
            <div className="halftone-pattern"></div>
            <span className="vertical-text">POD TCG</span>
          </div>
        </div>

        <div className="box-face right">
          <div className="side-design">
            <div className="halftone-pattern"></div>
            <span className="vertical-text">POD TCG</span>
          </div>
        </div>

        {/* Bottom Face */}
        <div className="box-face bottom"></div>
      </div>

      <style jsx>{`
        .box-wrapper {
          perspective: 1200px;
          width: 180px;
          height: 280px;
          margin: 60px auto;
          cursor: pointer;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .box-wrapper:hover:not(.opened) {
          transform: rotateX(-5deg) rotateY(15deg) scale(1.08);
        }

        .box-wrapper.opened {
          transform: rotateX(-10deg) rotateY(10deg) translateY(300px) scale(0.5);
          pointer-events: none;
          opacity: 0;
          transition:
            transform 1.2s cubic-bezier(0.7, 0, 0.84, 0),
            opacity 0.4s ease 0.6s;
        }

        .box-container {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(-15deg) rotateY(25deg);
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .box-face {
          position: absolute;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.15);
          overflow: hidden;
          backface-visibility: visible;
          left: 50%;
          top: 50%;
        }

        /* Proportions for 180x280x110 */
        .front {
          width: 180px;
          height: 280px;
          margin-left: -90px;
          margin-top: -140px;
          transform: rotateY(0deg) translateZ(55px);
          background-image: url("${boxImg}");
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
        }

        .back {
          width: 180px;
          height: 280px;
          margin-left: -90px;
          margin-top: -140px;
          transform: rotateY(180deg) translateZ(55px);
          background: #f8fafc;
        }

        .right {
          width: 110px;
          height: 280px;
          margin-left: -55px;
          margin-top: -140px;
          transform: rotateY(90deg) translateZ(90px);
        }

        .left {
          width: 110px;
          height: 280px;
          margin-left: -55px;
          margin-top: -140px;
          transform: rotateY(-90deg) translateZ(90px);
        }

        .bottom {
          width: 180px;
          height: 110px;
          margin-left: -90px;
          margin-top: -55px;
          transform: rotateX(-90deg) translateZ(140px);
          background: #94a3b8;
        }

        .lid {
          width: 180px;
          height: 110px;
          left: 50%;
          top: 0;
          margin-left: -90px;
          transform: translateZ(-55px) rotateX(90deg);
          transform-origin: top;
          z-index: 10;
          background: white;
          transition: transform 1s cubic-bezier(0.68, -0.6, 0.32, 1.6);
        }

        .opened .lid {
          transform: translateZ(-55px) rotateX(-130deg);
        }

        /* Side Design */
        .side-design {
          width: 100%;
          height: 100%;
          background: white;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .halftone-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 6px 6px;
          opacity: 0.5;
        }

        .vertical-text {
          transform: rotate(90deg);
          font-weight: 900;
          font-size: 1.8rem;
          color: #e2e8f0;
          white-space: nowrap;
        }

        .lid-inner {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .lid-top-bar {
          height: 12px;
          background: #ef4444;
        }
        .lid-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }
        .box-logo-small {
          color: #cbd5e1;
          font-weight: bold;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};
