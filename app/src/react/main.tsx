import { createRoot } from "react-dom/client";
import "../styles.css";

function HelloWorld() {
  return <h1>Hello world</h1>;
}

createRoot(document.querySelector("#app")!).render(<HelloWorld />);
