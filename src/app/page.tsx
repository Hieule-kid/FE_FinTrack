import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home page-shell">
      <span className="home-badge">FinTrack FE - Preview</span>
      <h1>Quan ly tai chinh ca nhan don gian, ro rang</h1>
      <p className="home-subtitle">
        He thong frontend da san sang skeleton. Hien tai backend API chua ket
        noi, vi vay trang Home duoc dat lam trang mac dinh de demo giao dien.
      </p>

      <div className="home-actions">
        <Link href="/login" className="btn btn-primary">
          Vao trang dang nhap
        </Link>
        <Link href="/register" className="btn btn-outline">
          Tao tai khoan moi
        </Link>
      </div>

      <section className="home-note" aria-label="status">
        <h2>Trang thai hien tai</h2>
        <ul>
          <li>Public routes: /login, /register</li>
          <li>Protected routes: /dashboard, /admin</li>
          <li>Auth guard da duoc scaffold o Proxy</li>
          <li>Dang cho API that de ket noi du lieu</li>
        </ul>
      </section>
    </main>
  );
}
