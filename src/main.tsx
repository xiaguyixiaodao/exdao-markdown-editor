import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { MdStyleProvider } from "./components/MdStyleProvider";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MdStyleProvider>
        <App />
      </MdStyleProvider>
    </ThemeProvider>
  </React.StrictMode>
);
