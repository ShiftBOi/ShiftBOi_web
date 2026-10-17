export default function CmsProjectLoading() {
  return (
    <div className="cms-project-loading" aria-busy="true" aria-label="Loading editor">
      <div className="cms-project-loading-bar" />
      <div className="cms-project-loading-stage">
        <div className="cms-project-loading-block is-hero" />
        <div className="cms-project-loading-block" />
        <div className="cms-project-loading-block" />
      </div>
    </div>
  );
}
