import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { USERS } from "../lib/constants";

export default function Login() {
  const { login } = useAuth();
  const [error, setError] = useState("");

  const quickLogin = (user) => {
    try {
      login(user.email, user.password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">
          <span className="login-logo-dot" />
          WayPlanner
        </div>

        <div className="login-subtitle">Спільне планування подорожей</div>

        <div className="quick-users">
          {USERS.map((u) => (
            <button
              key={u.id}
              className="quick-user-btn"
              onClick={() => quickLogin(u)}
              style={{ "--user-color": u.color }}
            >
              <span className="user-emoji">{u.avatar}</span>
              <span className="user-label">{u.name}</span>
            </button>
          ))}
        </div>

        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}
