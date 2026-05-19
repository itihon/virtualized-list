import { frameworks } from "../config/site";
import type { Example, ExampleModule } from "../types";
import { isFramework } from "../utils/isFramework";

const exampleModules = import.meta.glob<ExampleModule>("../examples/*/*/example.ts", {
  eager: true,
});

export const examples: Example[] = Object.entries(exampleModules)
  .map(([path, module]) => {
    const match = path.match(/\.\.\/examples\/([^/]+)\/([^/]+)\/example\.ts$/);

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
