import AppNav from "@/components/AppNav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <AppNav />
      <main className="w-full flex-1 px-4 pb-24 pt-6 lg:px-10 lg:pb-10">
        {children}
      </main>
    </div>
  );
}
