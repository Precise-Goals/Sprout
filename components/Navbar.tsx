"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@hooks/useAuth";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agro", label: "Agro Monitoring" },
  { href: "/chat", label: "Chat" },
  { href: "/voice", label: "Voice Assistant" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 shadow-sm">
      <Link
        href="/"
        className="text-sm font-semibold tracking-tight hover:opacity-90"
      >
        Sprout
      </Link>
      <button
        className="block rounded border px-2 py-1 text-sm md:hidden"
        onClick={() => {
          const el = document.getElementById("sprout-nav-links");
          if (el) el.classList.toggle("hidden");
          const expanded =
            document
              .getElementById("sprout-nav-toggle")
              ?.getAttribute("aria-expanded") === "true";
          document
            .getElementById("sprout-nav-toggle")
            ?.setAttribute("aria-expanded", (!expanded).toString());
        }}
        aria-label="Toggle navigation"
        id="sprout-nav-toggle"
        aria-expanded="false"
      >
        Menu
      </button>
      <div
        id="sprout-nav-links"
        className="hidden w-full items-center gap-2 md:flex md:w-auto"
      >
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-emerald-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => {
                const el = document.getElementById("sprout-nav-links");
                if (el && window.innerWidth < 768) el.classList.add("hidden");
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-xs text-gray-600 md:inline">
                {user?.email || "Signed in"}
              </span>
              <button
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                onClick={() => logout()}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
