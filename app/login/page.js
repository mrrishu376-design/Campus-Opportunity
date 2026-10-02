"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("signin");
  const [method, setMethod] = useState("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
  }

  async function upsertProfile(userId) {
    await supabase
      .from("users")
      .update({
        full_name: fullName || null,
        college_or_org: college || null,
        branch: branch || null,
        year: year ? parseInt(year, 10) : null,
      })
      .eq("id", userId);
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (cooldown > 0) return;
    setError("");
    setMessage("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: mode === "signup" },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOtpSent(true);
    startCooldown();
    setMessage("We sent a 6-digit code to your email.");
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const userId = data?.user?.id || data?.session?.user?.id;

    if (data?.session && userId) {
      if (mode === "signup") {
        await upsertProfile(userId);
        if (password) {
          const { error: pwError } = await supabase.auth.updateUser({ password });
          if (pwError) {
            setLoading(false);
            setError(
              "Signed in, but saving password failed: " + pwError.message
            );
            return;
          }
        }
      }
      setLoading(false);
      router.push("/");
    } else {
      setLoading(false);
      setError("Could not establish a session. Please try again.");
    }
  }

  async function handlePasswordSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  }

  async function handlePasswordSignUp(e) {
    e.preventDefault();
    if (cooldown > 0) return;
    setError("");
    setMessage("");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    startCooldown();

    if (data?.session?.user) {
      await upsertProfile(data.session.user.id);
      router.push("/");
    } else {
      setMessage(
        "Account created. Please check your email to confirm your address, then sign in."
      );
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then tap 'Forgot password'.");
      return;
    }
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    startCooldown();
    setMessage("Password reset email sent.");
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded-xl p-6 mt-6">
      <div className="text-center mb-5">
        <div className="text-3xl mb-2">✉️</div>
        <h1 className="text-xl font-bold text-navy">Welcome to CampusOpps</h1>
        <p className="text-sm text-gray-500">Sign in or create your account.</p>
      </div>

      <div className="flex mb-4 rounded-md overflow-hidden border">
        <button
          className={`flex-1 py-2 text-sm ${mode === "signin" ? "bg-gray-100 font-semibold" : ""}`}
          onClick={() => {
            setMode("signin");
            setOtpSent(false);
            setError("");
            setMessage("");
          }}
        >
          Sign In
        </button>
        <button
          className={`flex-1 py-2 text-sm ${mode === "signup" ? "bg-white font-semibold" : "bg-gray-50"}`}
          onClick={() => {
            setMode("signup");
            setOtpSent(false);
            setError("");
            setMessage("");
          }}
        >
          Sign Up
        </button>
      </div>

      <div className="flex mb-4 rounded-md overflow-hidden border text-sm">
        <button
          className={`flex-1 py-2 ${method === "password" ? "bg-white font-semibold" : "bg-gray-50 text-gray-500"}`}
          onClick={() => {
            setMethod("password");
            setOtpSent(false);
            setError("");
          }}
        >
          Password
        </button>
        <button
          className={`flex-1 py-2 ${method === "otp" ? "bg-white font-semibold" : "bg-gray-50 text-gray-500"}`}
          onClick={() => {
            setMethod("otp");
            setError("");
          }}
        >
          OTP Code
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-3">{error}</div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 text-sm rounded-md p-2 mb-3">{message}</div>
      )}

      {mode === "signup" && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            className="col-span-2 border rounded-md px-3 py-2 text-sm"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            className="col-span-2 border rounded-md px-3 py-2 text-sm"
            placeholder="College / Organization"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />
          <input
            className="border rounded-md px-3 py-2 text-sm"
            placeholder="Branch (e.g. CSE)"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
          <input
            className="border rounded-md px-3 py-2 text-sm"
            placeholder="Year (1-4)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
      )}

      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        type="email"
        className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
        placeholder="you@college.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={otpSent}
      />

      {method === "password" && (
        <>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded-md px-3 py-2 mb-4 text-sm"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "signin" ? (
            <button
              onClick={handlePasswordSignIn}
              disabled={loading}
              className="w-full bg-navy text-white py-2.5 rounded-md font-medium disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Sign in"}
            </button>
          ) : (
            <button
              onClick={handlePasswordSignUp}
              disabled={loading || cooldown > 0}
              className="w-full bg-navy text-white py-2.5 rounded-md font-medium disabled:opacity-50"
            >
              {cooldown > 0
                ? `Please wait ${cooldown}s`
                : loading
                ? "Please wait..."
                : "Create account"}
            </button>
