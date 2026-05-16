import { createApp, h } from "vue";
import "../styles.css";

const App = {
  render() {
    return h("h1", "Hello world");
  },
};

createApp(App).mount("#app");
