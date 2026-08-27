"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="app"><main className="legal-page"><p className="eyebrow">Something went wrong</p><h1>RentClock tripped over itself.</h1><p>Try again, or return to the homepage if the problem persists.</p><p><button className="btn brass" onClick={() => reset()}>Try again</button> <Link href="/">Return home</Link></p></main></div>;
}
