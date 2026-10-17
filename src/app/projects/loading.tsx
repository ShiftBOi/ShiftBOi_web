export default function ProjectsLoading() {
  return (
    <main className="project-page is-case-study flex-1" aria-busy="true">
      <div className="cs-hero" style={{ minHeight: "70vh", background: "#0a0a0a" }}>
        <div className="cs-hero-overlay">
          <p className="cs-hero-back" style={{ opacity: 0.45 }}>
            ← All work
          </p>
          <div className="cs-hero-copy">
            <div
              style={{
                height: "2.5rem",
                width: "min(18rem, 70%)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
