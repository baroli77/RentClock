import "./globals.css";

export const metadata = {
  title: "RentClock — compliance deadlines for small landlords",
  description:
    "Track gas safety, EICR, EPC and Renters' Rights Act deadlines across your properties. Never miss a renewal, never risk a fine.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
