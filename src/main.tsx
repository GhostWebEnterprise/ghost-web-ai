import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import "./types/global.d.ts";

// Pages are imported statically (no lazy/dynamic route imports): the managed
// dev server can recycle while the app is open, and a lazy import issued
// against the stale graph fails with "Failed to fetch dynamically imported
// module". Static imports load with the app shell instead.
import Landing from "./pages/Landing.tsx";
import AuthPage from "./pages/Auth.tsx";
import Chat from "./pages/Chat.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import BuildWizard from "./pages/BuildWizard.tsx";
import TeamBoard from "./pages/TeamBoard.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

// The managed workspace can recycle without re-linking the Convex deployment,
// leaving VITE_CONVEX_URL empty — ConvexReactClient would then throw "No
// address provided" synchronously and white-screen the whole app. Fall back
// to the project's linked cloud deployment (fully deployed, RSA-keyed for
// Convex Auth) so the app stays functional through workspace drift; the
// injected variable always wins when present (local dev backend in preview).
const FALLBACK_CONVEX_URL = "https://dutiful-chihuahua-732.eu-west-1.convex.cloud";
const CONVEX_URL =
  (import.meta.env.VITE_CONVEX_URL as string | undefined) || FALLBACK_CONVEX_URL;
const convex = new ConvexReactClient(CONVEX_URL);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


const app = (
  <BrowserRouter>
    <RouteSyncer />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/auth"
        element={<AuthPage redirectAfterAuth="/dashboard" />}
      />
      <Route
        path="/chat"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/build"
        element={
          <RequireAuth>
            <BuildWizard />
          </RequireAuth>
        }
      />
      <Route
        path="/team"
        element={
          <RequireAuth>
            <TeamBoard />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        {app}
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);
