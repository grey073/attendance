"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <button
          className="logo-button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <img
            src="/powerpuff/logo.png"
            alt="Powerpuff Girls"
            className="navbar-logo"
          />
        </button>

        <h2 className="navbar-title">
           Planner
        </h2>
      </nav>

      <div
        className={`side-menu ${
          menuOpen ? "menu-open" : ""
        }`}
      >
        <button
          className="close-menu"
          onClick={() => setMenuOpen(false)}
        >
          ×
        </button>

        <h2>Menu</h2>

        <Link href="/" className="menu-item" onClick={() => setMenuOpen(false)}>
          Attendance
        </Link>

        <Link href="/todo" className="menu-item" onClick={() => setMenuOpen(false)}>
          Todo
        </Link>
      </div>

      {menuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}