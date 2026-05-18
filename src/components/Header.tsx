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

export const Header: React.FC<HeaderProps> = ({
  currentSeason,
  currentSection,
  onShowPolicy,
  onLogoutClick,
}) => {
  const { user, getAvatarUrl } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getMenuLabel = () => {
    const seasonLabel = currentSeason === "season1" ? "OP-1" : "OP-2";
    const sectionLabel =
      currentSection === "opening"
        ? "เปิดซอง"
        : currentSection === "lot"
        ? "จัดการล็อต"
        : "สมุดการ์ด";
    return `📦 ${seasonLabel}: ${sectionLabel}`;
  };

  const getSectionPath = (season: string, section: string) => {
    if (section === "opening") {
      return `/${season}`;
    }
    return `/${season}/${section}`;
  };

  return (
    <header id="main-header" className={isCollapsed ? "collapsed" : ""}>
      <div className="header-inner">
        <nav className="nav-links">
          <div className={`dropdown ${isDropdownOpen ? "open" : ""}`} ref={dropdownRef}>
            <button
              className="dropdown-btn"
              id="current-menu-btn"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              {getMenuLabel()}{" "}
              <span className={`arrow ${isDropdownOpen ? "rotated" : ""}`}>▼</span>
            </button>
            <div className="dropdown-content">
              <div className="dropdown-header">OP-1 (Season 1)</div>
              <Link
                href={getSectionPath("season1", "opening")}
                onClick={() => setIsDropdownOpen(false)}
                className={
                  currentSeason === "season1" && currentSection === "opening"
                    ? "active"
                    : ""
                }
              >
                🔓 เปิดซอง OP-1
              </Link>
              <Link
                href={getSectionPath("season1", "lot")}
                onClick={() => setIsDropdownOpen(false)}
                className={
                  currentSeason === "season1" && currentSection === "lot"
                    ? "active"
                    : ""
                }
              >
                📦 จัดการล็อต OP-1
              </Link>
              <Link
                href={getSectionPath("season1", "collection")}
                onClick={() => setIsDropdownOpen(false)}
                className={
                  currentSeason === "season1" && currentSection === "collection"
                    ? "active"
                    : ""
                }
              >
                📖 สมุดการ์ด OP-1
              </Link>
              <div className="dropdown-divider"></div>
              <div className="dropdown-header">OP-2 (Season 2)</div>
              <Link
                href={getSectionPath("season2", "opening")}
                onClick={() => setIsDropdownOpen(false)}
                className={
                  currentSeason === "season2" && currentSection === "opening"
                    ? "active"
                    : ""
                }
              >
                🔓 เปิดซอง OP-2
              </Link>
              <Link
                href={getSectionPath("season2", "lot")}
                onClick={() => setIsDropdownOpen(false)}
                className={
                  currentSeason === "season2" && currentSection === "lot"
                    ? "active"
                    : ""
                }
              >
                📦 จัดการล็อต OP-2
              </Link>
              <Link
                href={getSectionPath("season2", "collection")}
                onClick={() => setIsDropdownOpen(false)}
                className={
                  currentSeason === "season2" && currentSection === "collection"
                    ? "active"
                    : ""
                }
              >
                📖 สมุดการ์ด OP-2
              </Link>
            </div>
          </div>
        </nav>

        <h1 id="main-title">
          <Link href="/">POD TCG Simulator</Link>
        </h1>

        <div className="auth-section">
          {user ? (
            <div id="user-profile" className="user-profile">
              <img
                id="user-avatar"
                src={getAvatarUrl()}
                alt="Avatar"
                width="32"
                height="32"
                className="avatar-img"
              />
              <span id="user-name" className="user-name">
                {user.global_name || user.username}
              </span>
              <button
                className="btn-primary logout-btn-small"
                onClick={onLogoutClick}
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <>
              <button
                id="login-btn"
                onClick={() => {
                  window.location.href =
                    "https://discord.com/oauth2/authorize?client_id=1485982724463525951&response_type=code&redirect_uri=https%3A%2F%2Fpod-tcg-backend-production.up.railway.app%2Fauth%2Fdiscord%2Fcallback&scope=identify%20guilds.members.read";
                }}
              >
                เข้าสู่ระบบ
              </button>
              <button
                id="info-btn"
                onClick={onShowPolicy}
                className="icon-btn"
                title="นโยบายความเป็นส่วนตัว"
              >
                ℹ️
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

