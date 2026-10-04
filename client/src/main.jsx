import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { store } from "./app/store";
import App from "./App.jsx";
import "./styles/index.css";


if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);