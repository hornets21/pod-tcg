"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  currentSeason: "season1" | "season2";
  currentSection: "opening" | "lot" | "collection";
  onShowPolicy?: () => void;
  onLogoutClick?: () => void;
}

const getDiscordAuthUrl = (): string => {
  if (process.env.NEXT_PUBLIC_DISCORD_AUTH_URL) {
    return process.env.NEXT_PUBLIC_DISCORD_AUTH_URL;
  }
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "1485982724463525951";
  const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "https://pod-tcg-backend-production.up.railway.app/auth/discord/callback";
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify%20guilds.members.read`;
};

export const Header: React.FC<HeaderProps> = ({
  currentSeason,
  currentSection,
  onShowPolicy,
  onLogoutClick,
}) => {
  const { user, getAvatarUrl } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const collapseThreshold = 60;
      const expandThreshold = 40;

      if (currentScroll > collapseThreshold) {
        setIsCollapsed(true);
      } else if (currentScroll < expandThreshold) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getSwitchSeasonPath = (targetSeason: "season1" | "season2") => {
    if (currentSection === "opening") {
      return `/${targetSeason}`;
    }
    return `/${targetSeason}/${currentSection}`;
  };

  return (
    <header id="main-header" className={isCollapsed ? "collapsed" : ""}>
      <div className="header-inner">
        {/* Left Side: Logo Group & Full-Height Nav Links */}
        <div className="nav-group-container">
          <Link href={`/${currentSeason}`} className="logo-group">
            {/* Stunning Cyber Hexagon Shield SVG */}
            <svg
              width="30"
              height="30"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="header-logo-svg"
            >
              <polygon
                points="50,5 90,25 90,75 50,95 10,75 10,25"
                stroke="#00d2ff"
                strokeWidth="7"
                fill="rgba(0, 210, 255, 0.15)"
                strokeLinejoin="round"
              />
              <polygon
                points="50,22 74,34 74,66 50,78 26,66 26,34"
                fill="#00d2ff"
                opacity="0.85"
              />
              <circle cx="50" cy="50" r="11" fill="#fff" />
            </svg>
            <span id="main-title">POD TCG</span>
          </Link>

          <nav className="nav-links">
            <Link
              href={`/${currentSeason}`}
              className={currentSection === "opening" ? "active" : ""}
            >
              🔓 เปิดซอง
            </Link>
            <Link
              href={`/${currentSeason}/lot`}
              className={currentSection === "lot" ? "active" : ""}
            >
              📦 จัดการล็อต
            </Link>
            <Link
              href={`/${currentSeason}/collection`}
              className={currentSection === "collection" ? "active" : ""}
            >
              📖 สมุดการ์ด
            </Link>
          </nav>
        </div>

        {/* Right Side: Season Switcher Dropdown & Slanted Connect Buttons */}
        <div className="auth-group-container">
          <div className="season-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="season-dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{currentSeason === "season1" ? "✨ OP-1" : "✨ OP-2"}</span>
              <svg
                className={`arrow-icon ${isDropdownOpen ? "open" : ""}`}
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 2L6 6L10.5 2"
                  stroke="currentColor"
                  strokeWidth="25%"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="season-dropdown-menu">
                <Link
                  href={getSwitchSeasonPath("season2")}
                  className={`season-dropdown-item ${currentSeason === "season2" ? "active" : ""}`}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  ✨ OP-2
                </Link>
                <Link
                  href={getSwitchSeasonPath("season1")}
                  className={`season-dropdown-item ${currentSeason === "season1" ? "active" : ""}`}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  ✨ OP-1
                </Link>
              </div>
            )}
          </div>

          <div className="auth-section">
            {user ? (
              <div 
                id="user-profile" 
                className="user-profile" 
                ref={profileDropdownRef}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                style={{ cursor: "pointer", position: "relative" }}
              >
                <img
                  id="user-avatar"
                  src={getAvatarUrl()}
                  alt="Avatar"
                  width="28"
                  height="28"
                  className="avatar-img"
                />
                <span id="user-name" className="user-name">
                  {user.global_name || user.username}
                </span>
                
                {isProfileDropdownOpen && (
                  <div className="season-dropdown-menu" style={{ right: 0, top: "calc(100% + 8px)", minWidth: "140px" }}>
                    <button
                      className="season-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onLogoutClick) {
                          onLogoutClick();
                        }
                      }}
                      style={{ 
                        width: "100%", 
                        justifyContent: "flex-start", 
                        border: "none", 
                        background: "transparent", 
                        cursor: "pointer",
                        color: "#ff4757",
                        padding: "0.55rem 1rem"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 71, 87, 0.1)";
                        e.currentTarget.style.color = "#ff4757";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#ff4757";
                      }}
                    >
                      <span style={{ color: "inherit" }}>ออกจากระบบ</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  id="login-btn"
                  className="auth-btn-slanted"
                  onClick={() => {
                    window.location.href = getDiscordAuthUrl();
                  }}
                >
                  <span>เข้าสู่ระบบ</span>
                </button>
                <button
                  id="info-btn"
                  onClick={onShowPolicy}
                  className="info-btn-cyber"
                  title="นโยบายความเป็นส่วนตัว"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="info-icon-svg"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="8" r="1.25" fill="currentColor" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
