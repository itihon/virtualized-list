type NotFoundPageProps = {
  onNavigate: (path: string) => void;
};

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <section className="content-section page-section">
      <div className="section-heading">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
      </div>
      <button className="primary-action" type="button" onClick={() => onNavigate("/")}>
        Back to homepage
      </button>
    </section>
  );
}
