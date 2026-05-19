export type Framework = "JS-TS" | "React" | "Vue" | "Angular";

export type ExampleModule = {
  default: {
    title: string;
    framework: Framework;
    code: string;
  };
};

export type Example = {
  slug: string;
  title: string;
  framework: Framework;
  code: string;
};

export type Page =
  | { name: "about" }
  | { name: "examples"; framework: Framework; exampleSlug: string }
  | { name: "api"; framework: Framework }
  | { name: "not-found" };
