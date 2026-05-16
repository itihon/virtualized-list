import "../styles.css";

function HelloWorld() {
  const heading = document.createElement("h1");
  heading.textContent = "Hello world";

  return heading;
}

document.querySelector("#app")?.append(HelloWorld());
