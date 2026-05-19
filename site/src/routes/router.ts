import { isFramework } from "../utils/isFramework";
import type { Page } from "../types";

export function parsePage(path: string): Page {
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
