import React, { useEffect, useState } from "react";
import { Logo } from "../Logo";

const NAV_LINKS = [
  { label: "Servizi", href: "#come-lavoriamo" },
  { label: "Casi", href: "#casi" },
  { label: "Demo", href: "#demo" },
  { label: "Contatti", href: "#contatti" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => (e) => {
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-[rgba(10,10,10,0.72)] border-b border-[var(--border-subtle)]"
          : "bg-transparent"
      }`}
      data-testid="main-navbar"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <a
          href="#top"
          onClick={scrollTo("#top")}
          className="flex items-center"
          data-testid="navbar-logo-link"
        >
          <Logo size="lg" variant="cyan" />
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={scrollTo(link.href)}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#contatti"
            onClick={scrollTo("#contatti")}
            className="hidden md:inline-flex items-center text-sm font-medium px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors cta-glow"
            data-testid="navbar-cta-button"
          >
            Prenota una call
          </a>
          <button
            className="md:hidden p-2 text-[var(--text-primary)]"
            onClick={() => setOpen(!open)}
            aria-label="Apri menu"
            data-testid="mobile-menu-toggle"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t border-[var(--border-subtle)] bg-[rgba(10,10,10,0.96)] backdrop-blur-xl"
          data-testid="mobile-menu"
        >
          <ul className="px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={scrollTo(link.href)}
                  className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2"
                  data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contatti"
                onClick={scrollTo("#contatti")}
                className="inline-flex items-center justify-center w-full text-sm font-medium px-4 py-3 rounded-md bg-[var(--accent)] text-[var(--bg-primary)]"
                data-testid="mobile-navbar-cta"
              >
                Prenota una call
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
