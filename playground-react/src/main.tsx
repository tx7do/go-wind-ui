import React from "react";
import { createRoot } from "react-dom/client";
import "@go-wind-ui/editor-react/style.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
