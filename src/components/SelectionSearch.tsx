"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import type { Card as CardType } from "@/data/types";

interface SelectionSearchProps {
  value: string;
  onChange: (value: string) => void;
  options: CardType[];
  placeholder: string;
  ariaLabel: string;
  side: "left" | "right";
}

export function SelectionSearch({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  side,
}: SelectionSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.role_id === value);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.rarity.toLowerCase().includes(q),
    );
  }, [options, search]);

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <button
        type="button"
        className={`searchable-select-trigger ${side}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
      >
        <span className="searchable-select-trigger-content">
          {selectedOption ? (
            <>
              <span className={`rarity-badge ${selectedOption.rarity}`}>{selectedOption.rarity}</span>
              <span className="searchable-select-selected-name">{selectedOption.name}</span>
            </>
          ) : (
            <span className="searchable-select-placeholder">{placeholder}</span>
          )}
        </span>
        <span className="searchable-select-arrow">▼</span>
      </button>

      {isOpen && (
        <div className={`searchable-select-dropdown ${side}`}>
          <div className="searchable-select-search-box">
            <span className="searchable-select-search-icon">🔍</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อการ์ดหรือระดับความหายาก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <ul className="searchable-select-options">
            <li>
              <button
                type="button"
                className={`searchable-select-option ${!value ? "selected" : ""}`}
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
              >
                <span className="searchable-select-option-text">{placeholder}</span>
                {!value && <span className="searchable-select-check">✓</span>}
              </button>
            </li>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li key={opt.role_id}>
                  <button
                    type="button"
                    className={`searchable-select-option ${value === opt.role_id ? "selected" : ""}`}
                    onClick={() => {
                      onChange(opt.role_id);
                      setIsOpen(false);
                    }}
                  >
                    <span className="searchable-select-option-left">
                      <span className={`rarity-badge ${opt.rarity}`}>{opt.rarity}</span>
                      <span className="searchable-select-option-name">{opt.name}</span>
                    </span>
                    {value === opt.role_id && <span className="searchable-select-check">✓</span>}
                  </button>
                </li>
              ))
            ) : (
              <li className="searchable-select-no-results">ไม่พบผลลัพธ์</li>
            )}
          </ul>
        </div>
      )}

      <style jsx>{`
        .searchable-select-container {
          position: relative;
          width: 100%;
          z-index: 100;
        }

        .searchable-select-trigger {
          width: 100%;
          min-height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          background: rgba(5, 4, 8, 0.84);
          color: #fff;
          font:
            400 0.95rem var(--font-kanit),
            sans-serif;
          padding: 0 0.8rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .searchable-select-trigger:hover {
          background-color: rgba(5, 4, 8, 0.92);
        }

        .searchable-select-trigger.left:hover {
          border-color: rgba(0, 210, 255, 0.45);
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.2);
        }

        .searchable-select-trigger.right:hover {
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
        }

        .searchable-select-trigger-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
          overflow: hidden;
        }

        .searchable-select-selected-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        .searchable-select-placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .searchable-select-arrow {
          font-size: 0.65rem;
          opacity: 0.6;
          transition: transform 0.25s ease;
          margin-left: 0.5rem;
        }

        .searchable-select-container:focus-within .searchable-select-trigger.left {
          border-color: rgba(0, 210, 255, 0.5);
          box-shadow: 0 0 16px rgba(0, 210, 255, 0.25);
        }

        .searchable-select-container:focus-within .searchable-select-trigger.right {
          border-color: rgba(255, 215, 0, 0.55);
          box-shadow: 0 0 16px rgba(255, 215, 0, 0.25);
        }

        .searchable-select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          background: rgba(8, 7, 12, 0.97);
          backdrop-filter: blur(16px);
          border-radius: 12px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.65);
          overflow: hidden;
          z-index: 200;
          animation: selectFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
        }

        .searchable-select-dropdown.left {
          border: 1px solid rgba(0, 210, 255, 0.25);
        }

        .searchable-select-dropdown.right {
          border: 1px solid rgba(255, 215, 0, 0.25);
        }

        @keyframes selectFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scaleY(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }

        .searchable-select-search-box {
          padding: 0.6rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(0, 0, 0, 0.15);
        }

        .searchable-select-search-icon {
          font-size: 0.85rem;
          opacity: 0.5;
        }

        .searchable-select-search-box input {
          flex: 1;
          min-height: 38px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font:
            400 0.9rem var(--font-kanit),
            sans-serif;
          padding: 0 0.6rem;
          transition: all 0.2s ease;
        }

        .searchable-select-dropdown.left .searchable-select-search-box input:focus {
          border-color: rgba(0, 210, 255, 0.45);
          background: rgba(0, 0, 0, 0.25);
          outline: none;
        }

        .searchable-select-dropdown.right .searchable-select-search-box input:focus {
          border-color: rgba(255, 215, 0, 0.5);
          background: rgba(0, 0, 0, 0.25);
          outline: none;
        }

        .searchable-select-options {
          list-style: none;
          margin: 0;
          padding: 0.25rem 0;
          max-height: 240px;
          overflow-y: auto;
        }

        /* Custom Scrollbar for Options */
        .searchable-select-options::-webkit-scrollbar {
          width: 6px;
        }
        .searchable-select-options::-webkit-scrollbar-track {
          background: transparent;
        }
        .searchable-select-options::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        .searchable-select-options::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .searchable-select-options li {
          display: block;
        }

        .searchable-select-option {
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          padding: 0.65rem 0.8rem;
          font:
            400 0.92rem var(--font-kanit),
            sans-serif;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .searchable-select-option:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .searchable-select-dropdown.left .searchable-select-option.selected {
          background: rgba(0, 210, 255, 0.12);
          color: #00d2ff;
          font-weight: 600;
        }

        .searchable-select-dropdown.right .searchable-select-option.selected {
          background: rgba(255, 215, 0, 0.12);
          color: #ffd700;
          font-weight: 600;
        }

        .searchable-select-option-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
          overflow: hidden;
        }

        .searchable-select-option-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .searchable-select-dropdown.left .searchable-select-check {
          color: #00d2ff;
          font-weight: 700;
          font-size: 0.9rem;
          text-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
        }

        .searchable-select-dropdown.right .searchable-select-check {
          color: #ffd700;
          font-weight: 700;
          font-size: 0.9rem;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
        }

        .searchable-select-no-results {
          padding: 1rem;
          font:
            400 0.9rem var(--font-kanit),
            sans-serif;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
        }

        .rarity-badge {
          font-family: var(--font-chakra), sans-serif;
          font-weight: 700;
          font-size: 0.72rem;
          padding: 1px 5px;
          border-radius: 4px;
          display: inline-block;
          min-width: 46px;
          text-align: center;
        }

        .rarity-badge.LEG { color: #ffd700; background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.35); text-shadow: 0 0 4px rgba(255, 215, 0, 0.2); }
        .rarity-badge.SEC { color: #ff5e00; background: rgba(255, 94, 0, 0.15); border: 1px solid rgba(255, 94, 0, 0.35); text-shadow: 0 0 4px rgba(255, 94, 0, 0.2); }
        .rarity-badge.UR { color: #ff007f; background: rgba(255, 0, 127, 0.15); border: 1px solid rgba(255, 0, 127, 0.35); text-shadow: 0 0 4px rgba(255, 0, 127, 0.2); }
        .rarity-badge.SSR { color: #9c27b0; background: rgba(156, 39, 176, 0.15); border: 1px solid rgba(156, 39, 176, 0.35); text-shadow: 0 0 4px rgba(156, 39, 176, 0.2); }
        .rarity-badge.SR { color: #3f51b5; background: rgba(63, 81, 181, 0.15); border: 1px solid rgba(63, 81, 181, 0.35); }
        .rarity-badge.R { color: #4caf50; background: rgba(76, 175, 80, 0.15); border: 1px solid rgba(76, 175, 80, 0.35); }
        .rarity-badge.C { color: #9ca3af; background: rgba(156, 163, 175, 0.15); border: 1px solid rgba(156, 163, 175, 0.35); }
        .rarity-badge.EVENT { color: #e91e63; background: rgba(233, 30, 99, 0.15); border: 1px solid rgba(233, 30, 99, 0.35); }
      `}</style>
    </div>
  );
}
