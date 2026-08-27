"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return <Suspense fallback={null}><Login /></Suspense>;
}

function Login() {
  const isTrial = useSearchParams().get("trial") === "1";
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
      setMessage(
        typeof error.message === "string" && error.message !== "{}"
          ? error.message
          : "We couldn't send the sign-in email. Please try again in a few minutes."
      );
    } else {
      setState("sent");
    }
  };

  return (
    <div className="app">
      <PublicHeader />

      <section className="card login-card">
        <div className="eyebrow">{isTrial ? "Start your free trial" : "Sign in"}</div>
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
            <h1>{isTrial ? "Start your 14-day free trial" : "Sign in with a magic link"}</h1>
            <p>{isTrial ? "Enter your email to create your RentClock account and continue to secure checkout. You will not be charged today." : "Enter your email and we&rsquo;ll send you a one-click sign-in link."}</p>
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
                {state === "sending" ? "Sending…" : isTrial ? "Continue" : "Send link"}
              </button>
            </div>
            {message && <p className="login-err">{message}</p>}
          </>
        )}
      </section>
    </div>
  );
}
