import { useEffect, useMemo, useState } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { AboutPage } from "./pages/AboutPage";
import { ApiPage } from "./pages/ApiPage";
import { ExamplesPage } from "./pages/ExamplesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { examples } from "./routes/examples";
import { parsePage } from "./routes/router";
import type { Example, Framework } from "./types";
import { getStoredFramework, storeFramework } from "./utils/frameworkStorage";

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [selectedFramework, setSelectedFramework] = useState<Framework>(getStoredFramework);
  const page = parsePage(path);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (page.name === "examples" || page.name === "api") {
      setSelectedFramework(page.framework);
      storeFramework(page.framework);
    }
  }, [page]);

  const examplesByFramework = useMemo(() => groupExamplesByFramework(examples), []);

  function navigate(nextPath: string) {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }

  function selectFramework(framework: Framework) {
    setSelectedFramework(framework);
    storeFramework(framework);

    if (page.name === "examples") {
      const nextSlug = examplesByFramework[framework]?.[0]?.slug ?? "example-1";
      navigate(`/examples/${framework}/${nextSlug}`);
    }

    if (page.name === "api") {
      navigate(`/API/${framework}`);
    }
  }

  return (
    <div className="app-shell">
      <Header
        currentPage={page.name}
        currentFramework={selectedFramework}
        currentExampleSlug={page.name === "examples" ? page.exampleSlug : undefined}
        examplesByFramework={examplesByFramework}
        onNavigate={navigate}
      />
      <main>
        {page.name === "about" && (
          <AboutPage
            selectedFramework={selectedFramework}
            onSelectFramework={selectFramework}
            onNavigate={navigate}
          />
        )}
        {page.name === "examples" && (
          <ExamplesPage
            examples={examples}
            page={page}
            selectedFramework={selectedFramework}
            onSelectFramework={selectFramework}
            onNavigate={navigate}
          />
        )}
        {page.name === "api" && (
          <ApiPage selectedFramework={selectedFramework} onSelectFramework={selectFramework} />
        )}
        {page.name === "not-found" && <NotFoundPage onNavigate={navigate} />}
      </main>
      <Footer />
    </div>
  );
}

function groupExamplesByFramework(examplesToGroup: Example[]) {
  return examplesToGroup.reduce<Partial<Record<Framework, Example[]>>>((groups, example) => {
    groups[example.framework] = [...(groups[example.framework] ?? []), example];
    return groups;
  }, {});
}
