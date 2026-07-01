"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/lib/actions/auth";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams ? searchParams.get("error") : null;

  const getErrorMessage = (code: string) => {
    switch (code) {
      case "Configuration":
        return "Authentication configuration issue. The Google OAuth client credentials in .env.local may be invalid or expired. Please use the Credentials Sign In or Sign Up tabs to test.";
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        return "Failed to complete authentication. Please try again or use the credentials form.";
      case "OAuthAccountNotLinked":
        return "This email is already associated with another login method. Please sign in using your original method.";
      case "EmailSignin":
        return "The verification email could not be sent. Please check your address.";
      case "CredentialsSignin":
        return "Invalid credentials provided. Check your username/email and password.";
      case "SessionRequired":
        return "Please sign in to access this page.";
      default:
        return `An authentication error occurred: ${code}`;
    }
  };

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? getErrorMessage(urlError) : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [signUpName, setSignUpName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!username || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password: password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid username/email or password.");
      } else {
        setSuccess("Success! Redirecting...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!signUpName || !signUpUsername || !signUpEmail || !signUpPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", signUpName);
    formData.append("username", signUpUsername);
    formData.append("email", signUpEmail);
    formData.append("password", signUpPassword);

    try {
      const res = await signUp(formData);
      if (!res.success) {
        setError(res.error);
      } else {
        setSuccess("Account created successfully! Signing you in...");
        // Auto sign in after signup
        const loginRes = await signIn("credentials", {
          username: signUpUsername,
          password: signUpPassword,
          redirect: false,
        });

        if (loginRes?.error) {
          // If auto login fails for some reason, redirect to sign in tab
          setSuccess(null);
          setError("Account created, but automatic sign-in failed. Please sign in manually.");
          setActiveTab("signin");
          setUsername(signUpUsername);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await signIn("credentials", {
        idToken,
        redirect: false,
      });

      if (res?.error) {
        setError("Google credentials verified by Firebase, but session could not be established.");
      } else {
        setSuccess("Success! Redirecting...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Google Auth Error:", err);
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup closed by user before finishing.");
      } else {
        setError(firebaseErr.message || "An unexpected error occurred during Google sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "32px 28px",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab("signin");
            setError(null);
            setSuccess(null);
          }}
          style={{
            flex: 1,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "signin" ? "#f59e0b" : "transparent",
            color: activeTab === "signin" ? "#0A0A0F" : "#94a3b8",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("signup");
            setError(null);
            setSuccess(null);
          }}
          style={{
            flex: 1,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "signup" ? "#f59e0b" : "transparent",
            color: activeTab === "signup" ? "#0A0A0F" : "#94a3b8",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Sign Up
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#f87171",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "#34d399",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        </div>
      )}

      {activeTab === "signin" ? (
        /* Sign In Form */
        <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              required
              disabled={loading}
              autoComplete="username"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0A0A0F",
              fontWeight: 800,
              fontSize: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              opacity: loading ? 0.7 : 1,
              marginTop: 6,
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      ) : (
        /* Sign Up Form */
        <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Full Name
            </label>
            <input
              type="text"
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={loading}
              autoComplete="name"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
              placeholder="Enter desired username"
              required
              disabled={loading}
              autoComplete="off"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
              autoComplete="email"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              placeholder="Create password (min 6 characters)"
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0A0A0F",
              fontWeight: 800,
              fontSize: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              opacity: loading ? 0.7 : 1,
              marginTop: 6,
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      )}

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 16px 0", color: "#475569" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#475569" }}>OR CONTINUE WITH</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          padding: "13px 20px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
          fontWeight: 600,
          fontSize: 15,
          transition: "all 0.2s",
          cursor: "pointer",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google
      </button>
    </div>
  );
}
