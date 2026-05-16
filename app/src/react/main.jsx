import React from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";

function App() {
  return React.createElement("h1", null, "Hello world");
}

createRoot(document.querySelector("#app")).render(React.createElement(App));
