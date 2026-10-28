import React from "react";
import { createRoot } from "react-dom/client";
import "@go-wind/editor-react/style.css";
import "@go-wind/bi-react/style.css";
import { installS2Engine } from "@go-wind/bi-engine-s2";
import { installG6Engine } from "@go-wind/bi-engine-g6";

installS2Engine();
installG6Engine();
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
