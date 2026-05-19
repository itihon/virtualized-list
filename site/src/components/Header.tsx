import { githubUrl } from "../config/site";
import type { Example, Framework, Page } from "../types";
import { HeaderNav } from "./HeaderNav";

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
        <HeaderNav
          currentPage={currentPage}
          currentFramework={currentFramework}
          currentExampleSlug={currentExampleSlug}
          examplesByFramework={examplesByFramework}
          onNavigate={onNavigate}
        />
      </div>
    </header>
  );
}
