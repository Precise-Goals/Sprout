"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@hooks/useAuth";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/crops", label: "Crop Recommender" },
  { href: "/irrigation", label: "Irrigation" },
  { href: "/agro", label: "Agro-monitoring" },
  { href: "/chat", label: "Chat" },
  { href: "/voice", label: "Voice Assistant" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 shadow-sm">
      <div className="text-sm font-semibold">Sprout</div>
      <button
        className="block rounded border px-2 py-1 text-sm md:hidden"
        onClick={() => {
          const el = document.getElementById("sprout-nav-links");
          if (el) el.classList.toggle("hidden");
        }}
        aria-label="Toggle navigation"
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
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
