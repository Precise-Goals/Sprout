"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/yield", label: "Yield Monitoring" },
  { href: "/crops", label: "Crop Recommender" },
  { href: "/dashboard#voice", label: "Voice Assistant" },
  { href: "/dashboard#chat", label: "Chatbot" },
];

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.includes("#")) return pathname?.startsWith("/dashboard");
    return pathname === href;
  };

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
        className="hidden w-full flex-col gap-2 md:flex md:w-auto md:flex-row"
      >
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
    </nav>
  );
}
