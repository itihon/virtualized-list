import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Framework = "JS-TS" | "React" | "Vue" | "Angular";

type ExampleModule = {
  default: {
    title: string;
    framework: Framework;
    code: string;
  };
};

type Example = {
  slug: string;
  title: string;
  framework: Framework;
  code: string;
};

type Page =
  | { name: "about" }
  | { name: "examples"; framework: Framework; exampleSlug: string }
  | { name: "api"; framework: Framework }
  | { name: "not-found" };

const frameworks: Framework[] = ["JS-TS", "React", "Vue", "Angular"];

const githubUrl = "https://github.com/itihon/layout-virtual";

const installCommands: Record<Framework, string> = {
  "JS-TS": "npm install layout-virtual",
  React: "npm install react-layout-virtual",
  Vue: "npm install vue-layout-virtual",
  Angular: "npm install angular-layout-virtual",
};

const frameworkLabels: Record<Framework, string> = {
  "JS-TS": "JS / TS",
  React: "React",
  Vue: "Vue",
  Angular: "Angular",
};

const exampleModules = import.meta.glob<ExampleModule>("./examples/*/*/example.ts", {
  eager: true,
});

const examples = Object.entries(exampleModules)
  .map(([path, module]) => {
    const match = path.match(/\.\/examples\/([^/]+)\/([^/]+)\/example\.ts$/);

    if (!match) {
      return undefined;
    }

    const [, framework, slug] = match;

    if (!isFramework(framework) || !slug) {
      return undefined;
    }

    return {
      slug,
      title: module.default.title,
      framework,
      code: module.default.code,
    };
  })
  .filter((example): example is Example => Boolean(example))
  .sort((a, b) => {
    const frameworkDiff = frameworks.indexOf(a.framework) - frameworks.indexOf(b.framework);
    return frameworkDiff || a.slug.localeCompare(b.slug);
  });

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [selectedFramework, setSelectedFramework] = useState<Framework>(getInitialFramework);
  const page = parsePage(path);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (page.name === "examples" || page.name === "api") {
      setSelectedFramework(page.framework);
      window.localStorage.setItem("layout-virtual-framework", page.framework);
    }
  }, [page]);

  const examplesByFramework = useMemo(() => {
    return examples.reduce<Partial<Record<Framework, Example[]>>>((groups, example) => {
      groups[example.framework] = [...(groups[example.framework] ?? []), example];
      return groups;
    }, {});
  }, []);

  const currentFrameworkExamples = examplesByFramework[selectedFramework] ?? [];
  const firstExampleSlug = currentFrameworkExamples[0]?.slug ?? examples[0]?.slug ?? "example-1";

  function navigate(nextPath: string) {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }

  function selectFramework(framework: Framework) {
    setSelectedFramework(framework);
    window.localStorage.setItem("layout-virtual-framework", framework);

    if (page.name === "examples") {
      const nextSlug = examplesByFramework[framework]?.[0]?.slug ?? firstExampleSlug;
      navigate(`/examples/${framework}/${nextSlug}`);
    }

    if (page.name === "api") {
      navigate(`/API/${framework}`);
    }
  }

  return (
    <div className="app-shell">
      <Header
        currentPage={page.name}
        currentFramework={selectedFramework}
        currentExampleSlug={page.name === "examples" ? page.exampleSlug : undefined}
        examplesByFramework={examplesByFramework}
        onNavigate={navigate}
      />
      <main>
        {page.name === "about" && (
          <AboutPage
            selectedFramework={selectedFramework}
            onSelectFramework={selectFramework}
            onNavigate={navigate}
          />
        )}
        {page.name === "examples" && (
          <ExamplesPage
            examples={examples}
            page={page}
            selectedFramework={selectedFramework}
            onSelectFramework={selectFramework}
            onNavigate={navigate}
          />
        )}
        {page.name === "api" && (
          <ApiPage selectedFramework={selectedFramework} onSelectFramework={selectFramework} />
        )}
        {page.name === "not-found" && <NotFoundPage onNavigate={navigate} />}
      </main>
      <Footer />
    </div>
  );
}

function Header({
  currentPage,
  currentFramework,
  currentExampleSlug,
  examplesByFramework,
  onNavigate,
}: {
  currentPage: Page["name"];
  currentFramework: Framework;
  currentExampleSlug?: string;
  examplesByFramework: Partial<Record<Framework, Example[]>>;
  onNavigate: (path: string) => void;
}) {
  const currentExamples = examplesByFramework[currentFramework] ?? [];
  const firstExampleSlug = currentExamples[0]?.slug ?? "example-1";

  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-link" type="button" onClick={() => onNavigate("/")}>
          <span className="brand-mark">LV</span>
          <span>Layout Virtual</span>
        </button>
        <a className="github-link" href={githubUrl} rel="noreferrer" target="_blank">
          GitHub
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <button
            className={currentPage === "about" ? "nav-link active" : "nav-link"}
            type="button"
            onClick={() => onNavigate("/")}
          >
            About
          </button>
          <div className="nav-menu">
            <button
              className={currentPage === "examples" ? "nav-link active" : "nav-link"}
              type="button"
              onClick={() => onNavigate(`/examples/${currentFramework}/${firstExampleSlug}`)}
            >
              Examples
            </button>
            <div className="nav-menu-panel">
              {currentExamples.map((example) => (
                <button
                  className={
                    currentExampleSlug === example.slug ? "menu-link active" : "menu-link"
                  }
                  key={example.slug}
                  type="button"
                  onClick={() => onNavigate(`/examples/${currentFramework}/${example.slug}`)}
                >
                  {example.title}
                </button>
              ))}
            </div>
          </div>
          <button
            className={currentPage === "api" ? "nav-link active" : "nav-link"}
            type="button"
            onClick={() => onNavigate(`/API/${currentFramework}`)}
          >
            API
          </button>
        </nav>
      </div>
    </header>
  );
}

function AboutPage({
  selectedFramework,
  onSelectFramework,
  onNavigate,
}: {
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Framework agnostic virtualized layout</p>
          <h1>Virtualization has never been easier.</h1>
          <p className="hero-description">
            Layout Virtual renders dynamic lists and responsive grids without making application
            code measure item heights, predict layout, or reshape content for a special container.
          </p>
          <div className="hero-actions">
            <button
              className="primary-action"
              type="button"
              onClick={() => onNavigate(`/examples/${selectedFramework}/example-1`)}
            >
              View examples
            </button>
            <a className="secondary-action" href={githubUrl} rel="noreferrer" target="_blank">
              Source on GitHub
            </a>
          </div>
        </div>
        <VirtualGridPreview />
      </section>

      <section className="content-section" id="installation">
        <div className="section-heading">
          <p className="eyebrow">Install</p>
          <h2>Choose your adapter</h2>
        </div>
        <FrameworkTabs selectedFramework={selectedFramework} onSelectFramework={onSelectFramework} />
        <pre className="install-command">
          <code>{installCommands[selectedFramework]}</code>
        </pre>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Features</p>
          <h2>Built for content that refuses to stay one size</h2>
        </div>
        <div className="feature-grid">
          <FeatureCard
            title="Dynamic heights"
            text="Items render naturally, then the layout adapts as their measured size changes."
          />
          <FeatureCard
            title="Responsive grids"
            text="A list can become a grid as the container grows, without manual row math."
          />
          <FeatureCard
            title="Framework adapters"
            text="Use the core engine directly or reach for React, Vue, and Angular packages."
          />
          <FeatureCard
            title="Window scrolling"
            text="Virtualize inside a local scroller or coordinate with the document viewport."
          />
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Use cases</p>
          <h2>Layouts worth stress testing</h2>
        </div>
        <div className="use-case-list">
          {[
            "Unknown-height article feeds",
            "Contact lists with sticky groups",
            "Chat messages and live insertion",
            "Tables with dynamic row content",
            "Lazy loaded ranges at arbitrary scroll positions",
          ].map((useCase) => (
            <div className="use-case" key={useCase}>
              {useCase}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ExamplesPage({
  examples: allExamples,
  page,
  selectedFramework,
  onSelectFramework,
  onNavigate,
}: {
  examples: Example[];
  page: Extract<Page, { name: "examples" }>;
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
  onNavigate: (path: string) => void;
}) {
  const frameworkExamples = allExamples.filter((example) => example.framework === page.framework);
  const activeExample = frameworkExamples.find((example) => example.slug === page.exampleSlug);

  if (!activeExample) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  return (
    <section className="content-section page-section">
      <div className="section-heading">
        <p className="eyebrow">Examples</p>
        <h1>{activeExample.title}</h1>
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

function ApiPage({
  selectedFramework,
  onSelectFramework,
}: {
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
}) {
  return (
    <section className="content-section page-section">
      <div className="section-heading">
        <p className="eyebrow">API</p>
        <h1>{frameworkLabels[selectedFramework]} API</h1>
      </div>
      <FrameworkTabs selectedFramework={selectedFramework} onSelectFramework={onSelectFramework} />
      <div className="api-placeholder">
        <h2>Documentation placeholder</h2>
        <p>
          This route is ready for build-time markdown parsing from the API directory for{" "}
          {frameworkLabels[selectedFramework]}.
        </p>
      </div>
    </section>
  );
}

function FrameworkTabs({
  selectedFramework,
  onSelectFramework,
}: {
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
}) {
  return (
    <div className="framework-tabs" role="tablist" aria-label="Framework selector">
      {frameworks.map((framework) => (
        <button
          aria-selected={selectedFramework === framework}
          className={selectedFramework === framework ? "framework-tab active" : "framework-tab"}
          key={framework}
          role="tab"
          type="button"
          onClick={() => onSelectFramework(framework)}
        >
          {frameworkLabels[framework]}
        </button>
      ))}
    </div>
  );
}

function VirtualGridPreview() {
  return (
    <div className="grid-preview" aria-label="Responsive virtualized grid preview">
      {Array.from({ length: 18 }, (_, index) => (
        <div className="grid-preview-item" key={index}>
          <span>{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function NotFoundPage({ onNavigate }: { onNavigate: (path: string) => void }) {
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

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Layout Virtual</strong>
        <span> by Alexandr Kalabin</span>
      </div>
      <span>MIT licensed. Built for dynamic layouts across UI frameworks.</span>
    </footer>
  );
}

function parsePage(path: string): Page {
  if (path === "/") {
    return { name: "about" };
  }

  const exampleMatch = path.match(/^\/examples\/([^/]+)\/([^/]+)\/?$/);
  if (exampleMatch) {
    const [, framework, exampleSlug] = exampleMatch;
    if (isFramework(framework) && exampleSlug) {
      return { name: "examples", framework, exampleSlug };
    }
  }

  const apiMatch = path.match(/^\/API\/([^/]+)\/?$/);
  if (apiMatch) {
    const [, framework] = apiMatch;
    if (isFramework(framework)) {
      return { name: "api", framework };
    }
  }

  return { name: "not-found" };
}

function getInitialFramework(): Framework {
  const savedFramework = window.localStorage.getItem("layout-virtual-framework");
  return isFramework(savedFramework) ? savedFramework : "JS-TS";
}

function isFramework(value: unknown): value is Framework {
  return typeof value === "string" && frameworks.includes(value as Framework);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
