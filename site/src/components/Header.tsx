import { githubUrl } from "../config/site";
import type { Example, Framework, Page } from "../types";

type HeaderProps = {
  currentPage: Page["name"];
  currentFramework: Framework;
  currentExampleSlug?: string;
  examplesByFramework: Partial<Record<Framework, Example[]>>;
  onNavigate: (path: string) => void;
};

export function Header({
  currentPage,
  currentFramework,
  currentExampleSlug,
  examplesByFramework,
  onNavigate,
}: HeaderProps) {
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
