import type { Framework } from "../types";
import { isFramework } from "./isFramework";

const storageKey = "layout-virtual-framework";

export function getStoredFramework(): Framework {
  const savedFramework = window.localStorage.getItem(storageKey);
  return isFramework(savedFramework) ? savedFramework : "JS-TS";
}

export function storeFramework(framework: Framework) {
  window.localStorage.setItem(storageKey, framework);
}
