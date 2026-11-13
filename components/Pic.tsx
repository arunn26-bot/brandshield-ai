"use client";

import { useEffect, useRef, useState } from "react";

/** Shows /public/images/<file> when it exists, otherwise the built-in illustration. */
export default function Pic({
  src, alt, className, fallback,
}: { src: string; alt: string; className?: string; fallback: React.ReactNode }) {
  const [bad, setBad] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setBad(true);
  }, []);
  if (bad) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={className} onError={() => setBad(true)} />;
}
