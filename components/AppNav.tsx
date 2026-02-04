import Link from "next/link";

const navItems = [
  { href: "/cards", label: "Cards" },
  { href: "/community", label: "Community" },
  { href: "/sequence", label: "Sequence" },
  { href: "/profile", label: "Profile" },
];

export default function AppNav() {
  return (
    <>
      <aside className="hidden h-screen w-60 flex-col border-r border-zinc-800 bg-zinc-950 p-6 lg:flex">
        <div className="text-lg font-semibold">Animal Kaiser Plus</div>
        <nav className="mt-8 flex flex-col gap-3 text-sm text-zinc-300">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-800 bg-zinc-950/95 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-4 text-sm font-semibold text-zinc-100">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-center text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
