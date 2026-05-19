import type { Example, Framework, Page } from "../types";

type HeaderNavProps = {
  currentPage: Page["name"];
  currentFramework: Framework;
  currentExampleSlug?: string;
  examplesByFramework: Partial<Record<Framework, Example[]>>;
  onNavigate: (path: string) => void;
};

export function HeaderNav({
  currentPage,
  currentFramework,
  currentExampleSlug,
  examplesByFramework,
  onNavigate,
}: HeaderNavProps) {
  const currentExamples = examplesByFramework[currentFramework] ?? [];
  
  return (
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
        >
          Examples
        </button>
        <div className="nav-menu-panel">
          {currentExamples.map((example) => (
            <button
              className={currentExampleSlug === example.slug ? "menu-link active" : "menu-link"}
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
  );
}
