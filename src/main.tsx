import { previewMode } from "./website/mode";
import PreviewApp from "./website/PreviewApp";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import App from "./App";
import GlobalLoader from "./components/GlobalLoader";
import "./styles.css";
import "./white-label.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        {previewMode ? (
          <PreviewApp />
        ) : (
          <AuthProvider>
            <>
              <App />
              <GlobalLoader />
            </>
          </AuthProvider>
        )}
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
