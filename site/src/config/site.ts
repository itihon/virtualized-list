import type { Framework } from "../types";

export const githubUrl = "https://github.com/itihon/layout-virtual";

export const frameworks: Framework[] = ["JS-TS", "React", "Vue", "Angular"];

export const installCommands: Record<Framework, string> = {
  "JS-TS": "npm install layout-virtual",
  React: "npm install react-layout-virtual",
  Vue: "npm install vue-layout-virtual",
  Angular: "npm install angular-layout-virtual",
};

export const frameworkLabels: Record<Framework, string> = {
  "JS-TS": "JS / TS",
  React: "React",
  Vue: "Vue",
  Angular: "Angular",
};
