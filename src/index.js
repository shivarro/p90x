import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import AuthGate from "./components/AuthGate";
import App from "./App";
import "./index.css";

// Grab the div with id="root" from public/index.html
const container = document.getElementById("root");
// Create a React root and render into it
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <AuthProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  </BrowserRouter>
);
