import { FrameworkTabs } from "../components/FrameworkTabs";
import { frameworkLabels } from "../config/site";
import type { Example, Framework, Page } from "../types";
import { NotFoundPage } from "./NotFoundPage";

type ExamplesPageProps = {
  examples: Example[];
  page: Extract<Page, { name: "examples" }>;
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
  onNavigate: (path: string) => void;
};

export function ExamplesPage({
  examples: allExamples,
  page,
  selectedFramework,
  onSelectFramework,
  onNavigate,
}: ExamplesPageProps) {
  const frameworkExamples = allExamples.filter((example) => example.framework === page.framework);
  const activeExample = frameworkExamples.find((example) => example.slug === page.exampleSlug);

  if (!activeExample) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  return (
    <section className="content-section page-section">
      <div className="section-heading">
        <p className="eyebrow">Examples</p>
        <h2>{activeExample.title}</h2>
      </div>
      <FrameworkTabs selectedFramework={selectedFramework} onSelectFramework={onSelectFramework} />
      <div className="example-layout">
        <aside className="example-list" aria-label="Examples">
          {frameworkExamples.map((example) => (
            <button
              className={example.slug === activeExample.slug ? "example-link active" : "example-link"}
              key={example.slug}
              type="button"
              onClick={() => onNavigate(`/examples/${page.framework}/${example.slug}`)}
            >
              {example.title}
            </button>
          ))}
        </aside>
        <article className="example-preview">
          <p className="preview-label">{frameworkLabels[activeExample.framework]}</p>
          <h2>
            {activeExample.title} for {frameworkLabels[activeExample.framework]}
          </h2>
          <pre>
            <code>{activeExample.code}</code>
          </pre>
        </article>
      </div>
    </section>
  );
}
