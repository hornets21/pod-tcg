"use client";

import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  roles?: string[];
}

const extractTokenFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  const hashToken = hashParams.get("token");
  if (hashToken && hashToken !== "null" && hashToken !== "undefined") {
    return hashToken;
  }

  let searchString = window.location.search;
  if (!searchString && window.location.href.includes("?")) {
    searchString = "?" + window.location.href.split("?")[1];
  }
  const urlParams = new URLSearchParams(searchString);
  const queryToken = urlParams.get("token");
  if (queryToken && queryToken !== "null" && queryToken !== "undefined") {
    return queryToken;
  }

  return null;
};

const extractErrorFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  return hashParams.get("error");
};

const cleanUrlFragment = () => {
  if (typeof window === "undefined") return;
  if (window.location.hash || window.location.search.includes("token=")) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") return;

      const urlError = extractErrorFromUrl();
      if (urlError) {
        console.error("[Auth] Login failed:", urlError);
        cleanUrlFragment();
        setLoading(false);
        return;
      }

      const extractedToken = extractTokenFromUrl();

      if (extractedToken) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
          const res = await fetch(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${extractedToken}` },
          });

          if (res.ok) {
            const userData = await res.json();
            localStorage.setItem("pod_user", JSON.stringify(userData));
            localStorage.setItem("pod_token", extractedToken);
            localStorage.removeItem("pod_collection");

            setUser(userData);
            setToken(extractedToken);

            cleanUrlFragment();
          } else {
            console.error("[Auth] Failed to fetch user profile with token");
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

  const logout = useCallback(() => {
    localStorage.removeItem("pod_user");
    localStorage.removeItem("pod_token");
    localStorage.removeItem("pod_collection");
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  const getAvatarUrl = useCallback((): string => {
    if (!user) return "";
    if (user.avatar && user.avatar !== "null") {
      if (user.avatar.startsWith("http")) {
        return user.avatar;
      }
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }, [user]);

  return { user, token, loading, logout, getAvatarUrl };
};
