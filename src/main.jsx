import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import App from "./app/App";
import Login from "./pages/Login";
import "./shared/styles/global.css";
import { markPerf, measurePerf } from "./shared/lib/perf";

export function Root() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      markPerf("auth_ready");
      measurePerf("startup_to_auth_ready", "app_start", "auth_ready");
    }
  }, [loading]);

  if (loading) return <div className="loading-screen"><calcite-icon icon="clock" scale="m" /></div>;

  return user ? <App /> : <Login />;
}

markPerf("app_start");

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <AuthProvider>
      <Root />
    </AuthProvider>

    <Analytics />
    <SpeedInsights />
  </>,
);
