import Hero from "@/components/Hero";
import WorkIndex from "@/components/WorkIndex";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <>
      <Hero />
      <WorkIndex />
      <About />
      <Kala />
      <Footer />
    </>
  );
}

function About() {
  return (
    <section id="about" className="wrap" style={{ paddingBlock: "clamp(6rem, 14vh, 12rem)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: "4rem" }}>
        <Reveal>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--step-2)",
              lineHeight: 1.2,
              maxWidth: "26ch",
              color: "var(--bone)",
            }}
          >
            My work is an exploration of{" "}
            <span style={{ fontStyle: "italic", color: "var(--saffron)" }}>time</span>
            —of moments, of meaning.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gap: "3rem clamp(2rem, 6vw, 6rem)",
            gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
          }}
        >
          {[
            {
              h: "Practice",
              items: [
                "Interactive installations",
                "Real-time & audio-reactive",
                "Light, sound & body-sensitive",
                "Large / long-format work",
                "Generative art",
              ],
            },
            {
              h: "Roles",
              items: [
                "Generative Artist · 2017—",
                "Educator, SMI Bangalore · 2024—",
                "Music Producer, NOLAND · 2011—",
                "Digital Designer · 2008—2019",
              ],
            },
            {
              h: "Education",
              items: [
                "MA Computational Arts",
                "Goldsmiths, University of London · 2021",
                "B.Tech Information Technology",
                "MNIT Jaipur · 2006—2009",
              ],
            },
          ].map((col) => (
            <Reveal key={col.h}>
              <h3 className="mono" style={{ color: "var(--saffron)", marginBottom: "1.2rem" }}>
                {col.h}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.7rem" }}>
                {col.items.map((it) => (
                  <li key={it} style={{ color: "var(--bone-dim)" }}>
                    {it}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Kala() {
  return (
    <section
      id="kala"
      style={{
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        paddingBlock: "clamp(6rem, 16vh, 14rem)",
      }}
    >
      <div className="wrap" style={{ textAlign: "center" }}>
        <Reveal>
          <span className="mono" style={{ color: "var(--ash)" }}>
            A contemporary belief system
          </span>
          <h2 style={{ fontSize: "var(--step-4)", marginTop: "1.5rem" }}>
            Order of <span style={{ fontStyle: "italic", color: "var(--saffron)" }}>Kala</span>
          </h2>
          <p
            style={{
              maxWidth: "44ch",
              margin: "2rem auto 0",
              color: "var(--bone-dim)",
              fontSize: "var(--step-1)",
              lineHeight: 1.4,
            }}
          >
            That reveres Time as the ultimate power and truth — using art and
            science to explore the questions of existence.
          </p>
          <a
            href="https://www.orderofkala.org"
            target="_blank"
            rel="noreferrer"
            className="cta"
            style={{ marginTop: "2.5rem" }}
          >
            Enter the Order <span className="arrow">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="wrap" style={{ paddingBlock: "clamp(5rem, 12vh, 9rem)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "space-between", alignItems: "flex-end" }}>
        <a
          href="mailto:agarwal.ujjwal@gmail.com"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-3)", color: "var(--bone)" }}
          className="link"
        >
          Say hello.
        </a>
        <div className="mono" style={{ display: "grid", gap: "0.5rem", color: "var(--bone-dim)", textAlign: "right" }}>
          <span>agarwal.ujjwal@gmail.com</span>
          <span style={{ color: "var(--ash)" }}>Bangalore, India</span>
        </div>
      </div>
      <div
        className="mono"
        style={{
          marginTop: "4rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          color: "var(--ash)",
        }}
      >
        <span>© {new Date().getFullYear()} Ujjwal Agarwal</span>
        <span>Time is the medium.</span>
      </div>
    </footer>
  );
}
