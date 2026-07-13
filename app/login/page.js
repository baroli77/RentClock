"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");

  const send = async () => {
    if (!email.includes("@")) {
      setMessage("That doesn't look like an email address.");
      return;
    }
    setState("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  };

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <Link href="/" className="brand-link">
            <svg className="brand-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> RentClock
          </Link>
        </div>
      </header>

      <section className="card login-card">
        <div className="eyebrow">Sign in</div>
        {state === "sent" ? (
          <>
            <h2>Check your email</h2>
            <p>
              We&rsquo;ve sent a sign-in link to <b>{email}</b>. Click it and you&rsquo;re in — no
              password to remember or leak.
            </p>
          </>
        ) : (
          <>
            <h1>Sign in with a magic link</h1>
            <p>Enter your email and we&rsquo;ll send you a one-click sign-in link.</p>
            <p className="login-note">
              If it doesn&rsquo;t arrive within a few minutes, please check your spam or junk folder.
            </p>
            <div className="login-row">
              <label className="sr-only" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                placeholder="you@example.co.uk"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn primary" onClick={send} disabled={state === "sending"}>
                {state === "sending" ? "Sending…" : "Send link"}
              </button>
            </div>
            {message && <p className="login-err">{message}</p>}
          </>
        )}
      </section>
    </div>
  );
}
