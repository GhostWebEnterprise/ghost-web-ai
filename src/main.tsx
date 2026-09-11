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
import NotFound from "./pages/NotFound.tsx";

// The managed workspace can recycle without re-linking the Convex deployment,
// leaving VITE_CONVEX_URL empty. ConvexReactClient would then throw
// "No address provided" synchronously and white-screen the whole app — guard
// the URL and render a clear recovery notice instead.
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

function ConvexUnavailableNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center text-foreground">
      <h1 className="text-lg font-semibold">Backend not connected</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The Convex backend URL (<code className="font-mono">VITE_CONVEX_URL</code>)
        is not set in this environment. Reload the preview once the dev backend
        is linked, or set the variable in Settings → Environment.
      </p>
    </div>
  );
}



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
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      {convex ? (
        <ConvexAuthProvider client={convex}>
          {app}
          <Toaster />
        </ConvexAuthProvider>
      ) : (
        <ConvexUnavailableNotice />
      )}
    </InstrumentationProvider>
  </StrictMode>,
);
