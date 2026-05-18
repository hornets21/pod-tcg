"use client";

import { useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  roles?: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") return;

      let searchString = window.location.search;
      if (!searchString && window.location.href.includes("?")) {
        searchString = "?" + window.location.href.split("?")[1];
      }

      const urlParams = new URLSearchParams(searchString);
      const extractedToken = urlParams.get("token");

      if (extractedToken && extractedToken !== "null" && extractedToken !== "undefined") {
        try {
          const res = await fetch("https://pod-tcg-backend-production.up.railway.app/auth/me", {
            headers: { Authorization: `Bearer ${extractedToken}` },
          });

          if (res.ok) {
            const userData = await res.json();
            localStorage.setItem("pod_user", JSON.stringify(userData));
            localStorage.setItem("pod_token", extractedToken);
            localStorage.removeItem("pod_collection"); // Clear guest collection when logging in

            setUser(userData);
            setToken(extractedToken);

            // Clear query string from address bar
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error("[Auth] Failed to fetch user profile with query token");
          }
        } catch (e) {
          console.error("[Auth] Error fetching user:", e);
        }
      } else {
        const storedUser = localStorage.getItem("pod_user");
        const storedToken = localStorage.getItem("pod_token");
        if (storedUser && storedToken) {
          try {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          } catch (e) {
            console.error("[Auth] Stored user data parsing error:", e);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("pod_user");
    localStorage.removeItem("pod_token");
    localStorage.removeItem("pod_collection");
    setUser(null);
    setToken(null);
    // Reload page or trigger collection refresh
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const getAvatarUrl = (): string => {
    if (!user) return "";
    if (user.avatar && user.avatar !== "null") {
      if (user.avatar.startsWith("http")) {
        return user.avatar;
      }
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  };

  return { user, token, loading, logout, getAvatarUrl };
};
