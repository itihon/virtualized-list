import { frameworks } from "../config/site";
import type { Framework } from "../types";

export function isFramework(value: unknown): value is Framework {
  return typeof value === "string" && frameworks.includes(value as Framework);
}
