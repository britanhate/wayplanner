import { useMemo, useState } from "react";
import { USERS } from "../lib/constants";

import { AuthContext } from "./auth-context";

const getInitialUser = () => {
  try {
    const saved = sessionStorage.getItem("wp_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [loading] = useState(false);

  const login = (email, password) => {
    const found = USERS.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Невірний логін або пароль");
    const nextUser = {
      id: found.id,
      name: found.name,
      color: found.color,
      avatar: found.avatar,
    };
    setUser(nextUser);
    sessionStorage.setItem("wp_user", JSON.stringify(nextUser));
    return nextUser;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("wp_user");
  };

  const value = useMemo(() => ({ user, login, logout, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
