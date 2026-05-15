import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { AuthProvider, useAuth } from "./lib/AuthContext";
import App from "./app/App";
import Login from "./pages/Login";
import "./shared/styles/global.css";

export function Root() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">⏳</div>;

  return user ? <App /> : <Login />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <AuthProvider>
      <Root />
    </AuthProvider>

    <Analytics />
    <SpeedInsights />
  </>,
);
