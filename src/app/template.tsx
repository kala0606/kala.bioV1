"use client";

/* App Router re-mounts template.tsx on every navigation, so this gives
   each route a fresh enter transition (intro/outro feel between pages). */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        animation: "page-rise 0.9s var(--ease-out-expo) both",
      }}
    >
      {children}
    </div>
  );
}
