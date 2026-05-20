"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#121212] font-sans text-white antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            Critical error
          </p>
          <h1 className="text-2xl font-semibold">
            {error.message || "Something went wrong"}
          </h1>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-[#1DB954] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#1ed760]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
