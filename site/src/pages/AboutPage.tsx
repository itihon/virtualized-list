import { FeatureCard } from "../components/FeatureCard";
import { FrameworkTabs } from "../components/FrameworkTabs";
import { VirtualGridPreview } from "../components/VirtualGridPreview";
import { githubUrl, installCommands } from "../config/site";
import type { Framework } from "../types";

type AboutPageProps = {
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
  onNavigate: (path: string) => void;
};

const useCases = [
  "Unknown-height article feeds",
  "Contact lists with sticky groups",
  "Chat messages and live insertion",
  "Tables with dynamic row content",
  "Lazy loaded ranges at arbitrary scroll positions",
];

export function AboutPage({
  selectedFramework,
  onSelectFramework,
  onNavigate,
}: AboutPageProps) {
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
          {useCases.map((useCase) => (
            <div className="use-case" key={useCase}>
              {useCase}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
