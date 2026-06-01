"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  currentSeason: "season1" | "season2";
  currentSection: "opening" | "unboxing" | "lot" | "collection";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const getSwitchSeasonPath = (targetSeason: "season1" | "season2") => {
    if (currentSection === "opening") {
      return `/${targetSeason}`;
    }
    return `/${targetSeason}/${currentSection}`;
  };

  const navLinks = [
    { href: `/${currentSeason}`, label: "🔓 เปิดซอง", section: "opening" },
    { href: `/${currentSeason}/unboxing`, label: "📦 แกะกล่อง", section: "unboxing" },
    { href: `/${currentSeason}/lot`, label: "📦 จัดการล็อต", section: "lot" },
    { href: `/${currentSeason}/collection`, label: "📖 สมุดการ์ด", section: "collection" },
  ];

  return (
    <>
      <header id="main-header" className={isCollapsed ? "collapsed" : ""}>
        <div className="header-inner">
          <div className="nav-group-container">
            <Link href={`/${currentSeason}`} className="logo-group">
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

            <nav className="nav-links desktop-only">
              {navLinks.map((link) => (
                <Link
                  key={link.section}
                  href={link.href}
                  className={currentSection === link.section ? "active" : ""}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="auth-group-container desktop-only">
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
                    strokeWidth="2"
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
                    alt={user?.global_name || user?.username || "User"}
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
                          if (onLogoutClick) onLogoutClick();
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

          <button
            className={`hamburger-btn ${isMobileMenuOpen ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="เปิดเมนู"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div
        ref={mobileMenuRef}
        className={`mobile-nav-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === mobileMenuRef.current) {
            setIsMobileMenuOpen(false);
          }
        }}
      >
        <div className="mobile-nav-content">
          <nav className="mobile-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.section}
                href={link.href}
                className={`mobile-nav-link ${currentSection === link.section ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-season-switcher">
            <span className="mobile-season-label">Season</span>
            <div className="mobile-season-buttons">
              <Link
                href={getSwitchSeasonPath("season2")}
                className={`mobile-season-btn ${currentSeason === "season2" ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ✨ OP-2
              </Link>
              <Link
                href={getSwitchSeasonPath("season1")}
                className={`mobile-season-btn ${currentSeason === "season1" ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ✨ OP-1
              </Link>
            </div>
          </div>

          <div className="mobile-auth-section">
            {user ? (
              <div className="mobile-user-info">
<img
                   src={getAvatarUrl()}
                   alt={user?.global_name || user?.username || "User"}
                   width="32"
                   height="32"
                   className="avatar-img"
                 />
                <span className="user-name">{user.global_name || user.username}</span>
                <button
                  className="mobile-logout-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onLogoutClick) onLogoutClick();
                  }}
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="mobile-login-section">
                <button
                  className="auth-btn-slanted mobile-login-btn"
                  onClick={() => {
                    window.location.href = getDiscordAuthUrl();
                  }}
                >
                  <span>เข้าสู่ระบบ</span>
                </button>
                <button
                  className="mobile-policy-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onShowPolicy) onShowPolicy();
                  }}
                >
                  🛡️ นโยบายความเป็นส่วนตัว
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
