export const metadata = {
  title: { absolute: "Second Memory Privacy Policy" },
  description: "Privacy policy for the Second Memory Android app.",
  alternates: { canonical: "/second-memory/privacy" },
  robots: { index: true, follow: true },
};

export default function SecondMemoryPrivacyPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "48px 22px 72px",
        fontFamily: "var(--font-plex-sans), system-ui, sans-serif",
        lineHeight: 1.7,
      }}
    >
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 14, opacity: 0.65, marginBottom: 10 }}>SECOND MEMORY</div>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.25rem)", lineHeight: 1.08, margin: 0 }}>
          Privacy Policy
        </h1>
        <p style={{ opacity: 0.65, marginTop: 14 }}>Last updated: 10 September 2026</p>
      </div>

      <p>
        Second Memory is a local-first Android app. <strong>Pay once. No ads. No subscription.</strong>
      </p>

      <h2>What we collect</h2>
      <p>
        Nothing on our servers. There are no accounts, no analytics, no advertising identifiers, and no crash reporters in this app.
      </p>

      <h2>What stays on your phone</h2>
      <ul>
        <li>Notes, links, photos and files you pin</li>
        <li>Notification pin state</li>
        <li>Settings, including appearance and lock-screen privacy. Your backup passphrase is never stored.</li>
      </ul>
      <p>
        Android&apos;s notification permission is optional. If you decline it, pins still save in the app; they just will not appear in the shade.
      </p>

      <h2>Network</h2>
      <p>
        The app may fetch a page title and description over <strong>HTTPS</strong> when you save a public link. That request goes to the site you saved, not to us. Cleartext HTTP is blocked.
      </p>

      <h2>Backups</h2>
      <p>
        Export is optional and happens only when you choose it. An encrypted backup is locked with a passphrase you set. We never receive that file.
      </p>
      <p>Google cloud backup is turned off for this app.</p>

      <h2>Sharing</h2>
      <p>
        When you use Android&apos;s share sheet, the other app sends content to Second Memory on your device. We do not upload it.
      </p>

      <h2>Children</h2>
      <p>Second Memory is not directed at children under 13.</p>

      <h2>Contact</h2>
      <p>
        Questions: open an issue at{" "}
        <a href="https://github.com/baroli77/SecMem" rel="noreferrer">
          github.com/baroli77/SecMem
        </a>.
      </p>
    </main>
  );
}
