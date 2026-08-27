"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

const links = [
  ["Software", "/landlord-compliance-software"],
  ["Free tools", "/tools"],
  ["Guides", "/guides"],
  ["Pricing", "/pricing"],
];

export default function PublicHeader({ home = false }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className={`masthead public-head ${home ? "home-v2-head" : ""}`}>
    <Link href="/" className="brand-link" aria-label="RentClock home" onClick={close}><BrandLogo /></Link>
    <button type="button" className="public-menu-button" aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen((value) => !value)}>
      <span className="sr-only">{open ? "Close" : "Open"} navigation</span><span aria-hidden="true">{open ? "×" : "☰"}</span>
    </button>
    <nav id="public-navigation" className={`nav public-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
      {links.map(([label, href]) => <Link key={href} href={href} onClick={close}>{label}</Link>)}
      <Link href="/login" onClick={close}>Sign in</Link>
      <Link href="/login?trial=1" className="btn primary sm" onClick={close}>Start free trial</Link>
    </nav>
  </header>;
}
