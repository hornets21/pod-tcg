"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

type NavSection = HeaderProps["currentSection"];

const NavIcon = ({ section }: { section: NavSection }) => {
  const paths: Record<NavSection, React.ReactNode> = {
    opening: <><path d="M4 9.5h16v10H4z" /><path d="M7 9.5V7a5 5 0 0 1 9.7-1.7" /><path d="M12 13v3" /></>,
    unboxing: <><path d="m4 7 8-4 8 4-8 4z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
    lot: <><path d="M5 6h14v14H5zM8 3h8v3" /><path d="M8 10h8M8 14h5" /></>,
    collection: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z" /></>,
    "hall-of-fame": <><path d="M8 4h8v4a4 4 0 0 1-8 0z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6" /></>,
  };

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[section]}
    </svg>
  );
};

interface HeaderProps {
  currentSeason?: "season1" | "season2";
  currentSection: "opening" | "unboxing" | "lot" | "collection" | "hall-of-fame";
  onShowPolicy?: () => void;
  onLogoutClick?: () => void;
}

const getDiscordAuthUrl = (): string => {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "1485982724463525951";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const redirectUri = `${apiBaseUrl}/auth/discord/callback`;
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentSection === "opening" || currentSection === "unboxing") {
      return;
    }

    // กำหนดสถานะเริ่มต้นสำหรับหน้าที่สามารถเลื่อนได้ (Scrollable pages) แบบ asynchronous เพื่อหลีกเลี่ยง react-hooks/set-state-in-effect
    const initialCollapsed = window.scrollY > 60;
    const t = setTimeout(() => {
      setIsCollapsed(initialCollapsed);
    }, 0);

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
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [currentSection]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMobileMenuOpen(false);
      setIsProfileDropdownOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const season = currentSeason || "season2";
  const playableSeason = "season2";
  const collectionSeason = currentSection === "collection" ? season : playableSeason;

const navLinks = [
    { href: `/${playableSeason}`, label: "เปิดซอง", section: "opening" },
    { href: `/${playableSeason}/unboxing`, label: "แกะกล่อง", section: "unboxing" },
    { href: `/${playableSeason}/lot`, label: "จัดการล็อต", section: "lot" },
    { href: `/${collectionSeason}/collection`, label: "สมุดการ์ด", section: "collection" },
    { href: "/hall-of-fame", label: "Hall of Fame", section: "hall-of-fame" },
  ] satisfies Array<{ href: string; label: string; section: NavSection }>;

  const finalIsCollapsed = (currentSection === "opening" || currentSection === "unboxing") ? true : isCollapsed;

  return (
    <>
      <header id="main-header" className={finalIsCollapsed ? "collapsed" : ""}>
        <div className="header-inner">
          <div className="nav-group-container">
            <Link href={`/${playableSeason}`} className="logo-group" aria-label="POD TCG หน้าหลัก">
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
              <span className="brand-copy">
                <span id="main-title">POD TCG</span>
                <span className="brand-subtitle">CARD VAULT</span>
              </span>
            </Link>

            <nav className="nav-links desktop-only" aria-label="เมนูหลัก">
              {navLinks.map((link) => (
                <Link
                  key={link.section}
                  href={link.href}
                  className={currentSection === link.section ? "active" : ""}
                  aria-current={currentSection === link.section ? "page" : undefined}
                >
                  <NavIcon section={link.section} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="auth-group-container desktop-only">
            <div className="auth-section">
              {user ? (
                <div
                  id="user-profile"
                  className="user-profile"
                  ref={profileDropdownRef}
                >
                  <button
                    type="button"
                    className="profile-trigger"
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    aria-expanded={isProfileDropdownOpen}
                    aria-haspopup="menu"
                  >
                    <img
                      id="user-avatar"
                      src={getAvatarUrl()}
                      alt=""
                      width="30"
                      height="30"
                      className="avatar-img"
                    />
                    <span id="user-name" className="user-name">
                      {user.global_name || user.username}
                    </span>
                    <svg className={`profile-chevron ${isProfileDropdownOpen ? "open" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m8 10 4 4 4-4" />
                    </svg>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="profile-menu" role="menu">
                      <button
                        className="profile-menu-item danger"
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProfileDropdownOpen(false);
                          if (onLogoutClick) onLogoutClick();
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></svg>
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    id="login-btn"
                    className="auth-btn-slanted"
                    type="button"
                    onClick={() => {
                      window.location.href = getDiscordAuthUrl();
                    }}
                  >
                    <span>เข้าสู่ระบบ Discord</span>
                  </button>
                  <button
                    id="info-btn"
                    onClick={onShowPolicy}
                    className="info-btn-cyber"
                    title="นโยบายความเป็นส่วนตัว"
                    aria-label="นโยบายความเป็นส่วนตัว"
                    type="button"
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
            aria-label={isMobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div
        ref={mobileMenuRef}
        id="mobile-navigation"
        className={`mobile-nav-overlay ${isMobileMenuOpen ? "open" : ""}`}
        aria-hidden={!isMobileMenuOpen}
        onClick={(e) => {
          if (e.target === mobileMenuRef.current) {
            setIsMobileMenuOpen(false);
          }
        }}
      >
        <div className="mobile-nav-content">
          <div className="mobile-nav-heading">
            <span>สำรวจ POD TCG</span>
            <small>SEASON {season === "season2" ? "02" : "01"}</small>
          </div>
          <nav className="mobile-nav-links" aria-label="เมนูมือถือ">
            {navLinks.map((link) => (
              <Link
                key={link.section}
                href={link.href}
                className={`mobile-nav-link ${currentSection === link.section ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={currentSection === link.section ? "page" : undefined}
              >
                <NavIcon section={link.section} />
                <span>{link.label}</span>
                <svg className="mobile-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>
              </Link>
            ))}
          </nav>

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
                  type="button"
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
                  type="button"
                  onClick={() => {
                    window.location.href = getDiscordAuthUrl();
                  }}
                >
                  <span>เข้าสู่ระบบ</span>
                </button>
                <button
                  className="mobile-policy-btn"
                  type="button"
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
