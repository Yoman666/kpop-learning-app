import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1DB954] px-6 text-sm font-semibold text-black transition-colors hover:bg-[#1ed760]"
      >
        Back home
      </Link>
    </div>
  );
}
