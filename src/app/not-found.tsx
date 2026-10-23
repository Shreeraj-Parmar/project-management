import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center text-ink">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold">We can&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        The page you are looking for does not exist, or the link is out of date. Your boards are one click away.
      </p>
      <Link
        href="/boards"
        className="mt-6 inline-flex h-10 items-center rounded-[3px] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Go to your boards
      </Link>
    </main>
  );
}
