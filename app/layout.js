import "./globals.css";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "CampusOpps - Internships, Hackathons & Jobs Feed",
  description: "Every campus opportunity, in one feed.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
