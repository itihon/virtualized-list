import { frameworkLabels, frameworks } from "../config/site";
import type { Framework } from "../types";

type FrameworkTabsProps = {
  selectedFramework: Framework;
  onSelectFramework: (framework: Framework) => void;
};

export function FrameworkTabs({ selectedFramework, onSelectFramework }: FrameworkTabsProps) {
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
