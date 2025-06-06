import { useEffect, useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { app } from "@/shared/lib/firebase";

const auth = getAuth(app);

function usernameToEmail(username: string) {
  return `${username}@app.local`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function login(email: string, password: string) {
    try {
      setError(null);
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      localStorage.setItem("user", JSON.stringify(res.user));
      return true;
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        try {
          const res = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          setUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
          return true;
        } catch (createErr: any) {
          setError("Failed to create user");
          return false;
        }
      }

      setError("Login failed");
      return false;
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("user");
    window.location.reload();
  }

  const username = user?.email?.split("@")[0] ?? null;
  const token = user?.getIdToken() ?? null;

  return {
    user,
    uid: user?.uid ?? null,
    login,
    logout,
    error,
    loading,
    username,
    token,
  };
}
