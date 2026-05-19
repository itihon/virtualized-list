import { FrameworkTabs } from "../components/FrameworkTabs";
import { frameworkLabels } from "../config/site";
import type { Framework } from "../types";

type ApiPageProps = {
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
};

export function ApiPage({ selectedFramework, onSelectFramework }: ApiPageProps) {
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
