"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/chrome";

// No marketing landing — forward straight to the form. Client-side
// so it works in a static export (no server to run a redirect()).
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/scroll");
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink text-white">
      <BrandLogo className="h-8" />
      <p className="readout text-xs uppercase tracking-widest text-white/50">
        Opening inspection…
      </p>
    </main>
  );
}
