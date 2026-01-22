import Link from "next/link";

const navItems = [
  { href: "/cards", label: "Cards" },
  { href: "/community", label: "Community" },
  { href: "/sequence", label: "Sequence 🔒" },
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
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-3 text-xs text-zinc-300">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="px-2 py-1">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
