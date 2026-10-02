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

  // OTP cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
  }

  function clearMessages() {
    setError("");
    setMessage("");
  }

  async function upsertProfile(userId) {
    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName || null,
        college_or_org: college || null,
        branch: branch || null,
        year: year ? parseInt(year, 10) : null,
      })
      .eq("id", userId);

    return error;
  }

  // -----------------------------
  // SEND OTP
  // -----------------------------
  async function handleSendOtp(e) {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (cooldown > 0) return;

    clearMessages();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "signup",
      },
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

  // -----------------------------
  // VERIFY OTP
  // -----------------------------
  async function handleVerifyOtp(e) {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    clearMessages();
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

    if (!data?.session || !userId) {
      setLoading(false);
      setError(
        "OTP verified, but a session could not be created. Please try again."
      );
      return;
    }

    // Save profile information after signup
    if (mode === "signup") {
      const profileError = await upsertProfile(userId);

      if (profileError) {
        setLoading(false);
        setError(
          "Account created, but profile information could not be saved: " +
            profileError.message
        );
        return;
      }

      // If password was entered, also save it
      if (password) {
        const { error: passwordError } =
          await supabase.auth.updateUser({
            password,
          });

        if (passwordError) {
          setLoading(false);
          setError(
            "Signed in, but saving password failed: " +
              passwordError.message
          );
          return;
        }
      }
    }

    setLoading(false);
    router.push("/");
  }

  // -----------------------------
  // PASSWORD SIGN IN
  // -----------------------------
  async function handlePasswordSignIn(e) {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    clearMessages();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  }

  // -----------------------------
  // PASSWORD SIGN UP
  // -----------------------------
  async function handlePasswordSignUp(e) {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    clearMessages();
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
      const profileError = await upsertProfile(
        data.session.user.id
      );

      if (profileError) {
        setError(
          "Account created, but profile information could not be saved: " +
            profileError.message
        );
        return;
      }

      router.push("/");
    } else {
      setMessage(
        "Account created. Please check your email to confirm your address, then sign in."
      );
    }
  }

  // -----------------------------
  // FORGOT PASSWORD
  // -----------------------------
  async function handleForgotPassword() {
    if (!email) {
      setError(
        "Enter your email above first, then tap 'Forgot password'."
      );
      return;
    }

    if (cooldown > 0) return;

    clearMessages();
    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/reset-password`
            : undefined,
      });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    startCooldown();
    setMessage(
      "Password reset email sent. Please check your inbox."
    );
  }

  // -----------------------------
  // SWITCH MODE
  // -----------------------------
  function switchMode(newMode) {
    setMode(newMode);
    setOtpSent(false);
    setOtp("");
    clearMessages();
  }

  // -----------------------------
  // SWITCH METHOD
  // -----------------------------
  function switchMethod(newMethod) {
    setMethod(newMethod);
    setOtpSent(false);
    setOtp("");
    clearMessages();
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded-xl p-6 mt-6 shadow-sm">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="text-3xl mb-2">✉️</div>

        <h1 className="text-xl font-bold text-navy">
          Welcome to CampusOpps
        </h1>

        <p className="text-sm text-gray-500">
          Sign in or create your account.
        </p>
      </div>

      {/* Sign In / Sign Up */}
      <div className="flex mb-4 rounded-md overflow-hidden border">
        <button
          type="button"
          className={`flex-1 py-2 text-sm ${
            mode === "signin"
              ? "bg-gray-100 font-semibold"
              : "bg-white"
          }`}
          onClick={() => switchMode("signin")}
        >
          Sign In
        </button>

        <button
          type="button"
          className={`flex-1 py-2 text-sm ${
            mode === "signup"
              ? "bg-gray-100 font-semibold"
              : "bg-white"
          }`}
          onClick={() => switchMode("signup")}
        >
          Sign Up
        </button>
      </div>

      {/* Password / OTP */}
      <div className="flex mb-4 rounded-md overflow-hidden border text-sm">
        <button
          type="button"
          className={`flex-1 py-2 ${
            method === "password"
              ? "bg-white font-semibold"
              : "bg-gray-50 text-gray-500"
          }`}
          onClick={() => switchMethod("password")}
        >
          Password
        </button>

        <button
          type="button"
          className={`flex-1 py-2 ${
            method === "otp"
              ? "bg-white font-semibold"
              : "bg-gray-50 text-gray-500"
          }`}
          onClick={() => switchMethod("otp")}
        >
          OTP Code
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-3">
          {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="bg-green-50 text-green-700 text-sm rounded-md p-3 mb-3">
          {message}
        </div>
      )}

      {/* Signup Profile Fields */}
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

      {/* Email */}
      <label className="block text-sm font-medium mb-1">
        Email
      </label>

      <input
        type="email"
        className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
        placeholder="you@college.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={otpSent}
      />

      {/* PASSWORD METHOD */}
      {method === "password" && (
        <>
          <label className="block text-sm font-medium mb-1">
            Password
          </label>

          <input
            type="password"
            className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Sign In */}
          {mode === "signin" && (
            <>
              <button
                type="button"
                onClick={handlePasswordSignIn}
                disabled={loading}
                className="w-full bg-navy text-white py-2.5 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading || cooldown > 0}
                className="w-full text-sm text-blue-600 mt-3 disabled:opacity-50"
              >
                {cooldown > 0
                  ? `Please wait ${cooldown}s`
                  : "Forgot password?"}
              </button>
            </>
          )}

          {/* Sign Up */}
          {mode === "signup
