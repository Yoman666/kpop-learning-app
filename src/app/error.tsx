"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {error.message || "An unexpected error occurred"}
      </h1>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">Code: {error.digest}</p>
      ) : null}
      <Button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-[#1DB954] px-6 font-semibold text-black hover:bg-[#1ed760]"
      >
        Try again
      </Button>
    </div>
  );
}
