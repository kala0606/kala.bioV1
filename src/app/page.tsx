import IdCard from "@/components/IdCard";

/* The whole site: one ID card, centred, no scroll. The Mondrian fluid behind it
   is mounted in layout.tsx. The old portfolio lives in src/app/_portfolio/. */
export default function Home() {
  return (
    <div className="id-page">
      <IdCard />
    </div>
  );
}
