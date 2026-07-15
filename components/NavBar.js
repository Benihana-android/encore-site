import Link from "next/link";
import { useRouter } from "next/router";

export default function NavBar() {
  const router = useRouter();
  const isActive = (path) => router.pathname === path;
  return (
    <nav className="navbar">
      <Link href="/" className="logo">🎫 ENCORE</Link>
      <div className="nav-tabs">
        <Link href="/" className={`nav-tab ${isActive("/") ? "active" : ""}`}>Home</Link>
        <Link href="/concerts" className={`nav-tab ${router.pathname.startsWith("/concerts") ? "active" : ""}`}>Concerts</Link>
        <Link href="/venues" className={`nav-tab ${router.pathname.startsWith("/venues") ? "active" : ""}`}>Venues</Link>
        <Link href="/concerts/near" className={`nav-tab ${router.pathname === "/concerts/near" ? "active" : ""}`}>Near You</Link>
        <Link href="/concerts/add" className="icon-btn" title="Log a show">+</Link>
      </div>
    </nav>
  );
}
