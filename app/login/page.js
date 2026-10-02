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
    if (cooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
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

  async function saveProfile(userId) {
    const { error: profileError } = await supabase
      .from("users")
      .update({
        full_name: fullName || null,
        college_or_org: college || null,
        branch: branch || null,
        year: year ? parseInt(year, 10) : null,
      })
      .eq("id", userId);

    return profileError;
  }

  async function handlePasswordSignIn(event) {
    event.preventDefault();

    clearMessages();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.push("/");
  }

  async function handlePasswordSignUp(event) {
    event.preventDefault();

    clearMessages();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error: signupError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (signupError) {
      setLoading(false);
      setError(signupError.message);
      return;
    }

    if (data && data.session && data.session.user) {
      const profileError = await saveProfile(
        data.session.user.id
      );

      if (profileError) {
        setLoading(false);
        setError(
          "Account created, but profile could not be saved: " +
            profileError.message
        );
        return;
      }

      setLoading(false);
      router.push("/");
      return;
    }

    setLoading(false);
    setMessage(
      "Account created. Please check your email and confirm your account."
    );
  }

  async function handleSendOtp(event) {
    event.preventDefault();

    clearMessages();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (cooldown > 0) {
      return;
    }

    setLoading(true);

    const { error: otpError } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === "signup",
        },
      });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setOtpSent(true);
    startCooldown();

    setMessage("A 6-digit OTP has been sent to your email.");
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    clearMessages();

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    const { data, error: verifyError } =
      await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    const userId =
      data?.user?.id || data?.session?.user?.id;

    if (!data?.session || !userId) {
      setLoading(false);
      setError(
        "OTP verified, but login session could not be created."
      );
      return;
    }

    if (mode === "signup") {
      const profileError = await saveProfile(userId);

      if (profileError) {
        setLoading(false);
        setError(
          "Account created, but profile could not be saved: " +
            profileError.message
        );
        return;
      }
    }

    setLoading(false);
    router.push("/");
  }

  async function handleForgotPassword() {
    clearMessages();

    if (!email) {
      setError(
        "Enter your email first, then tap Forgot Password."
      );
      return;
    }

    if (cooldown > 0) {
      return;
    }

    setLoading(true);

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    startCooldown();
    setMessage("Password reset email sent.");
  }

  function changeMode(newMode) {
    setMode(newMode);
    setOtpSent(false);
    setOtp("");
    clearMessages();
  }

  function changeMethod(newMethod) {
    setMethod(newMethod);
    setOtpSent(false);
    setOtp("");
    clearMessages();
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded-xl p-6 mt-6 shadow-sm">

      <div className="text-center mb-5">
        <div className="text-3xl mb-2">
          ✉️
        </div>

        <h1 className="text-xl font-bold text-navy">
          Welcome to CampusOpps
        </h1>

        <p className="text-sm text-gray-500">
          Sign in or create your account.
        </p>
      </div>

      <div className="flex mb-4 rounded-md overflow-hidden border">

        <button
          type="button"
          className={
            "flex-1 py-2 text-sm " +
            (mode === "signin"
              ? "bg-gray-100 font-semibold"
              : "bg-white")
          }
          onClick={() => changeMode("signin")}
        >
          Sign In
        </button>

        <button
          type="button"
          className={
            "flex-1 py-2 text-sm " +
            (mode === "signup"
              ? "bg-gray-100 font-semibold"
              : "bg-white")
          }
          onClick={() => changeMode("signup")}
        >
          Sign Up
        </button>

      </div>

      <div className="flex mb-4 rounded-md overflow-hidden border">

        <button
          type="button"
          className={
            "flex-1 py-2 text-sm " +
            (method === "password"
              ? "bg-gray-100 font-semibold"
              : "bg-white text-gray-500")
          }
          onClick={() => changeMethod("password")}
        >
          Password
        </button>

        <button
          type="button"
          className={
            "flex-1 py-2 text-sm " +
            (method === "otp"
              ? "bg-gray-100 font-semibold"
              : "bg-white text-gray-500")
          }
          onClick={() => changeMethod("otp")}
        >
          OTP Code
        </button>

      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-3">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-700 text-sm rounded-md p-3 mb-3">
          {message}
        </div>
      )}

      {mode === "signup" && (
        <div className="grid grid-cols-2 gap-2 mb-3">

          <input
            className="col-span-2 border rounded-md px-3 py-2 text-sm"
            placeholder="Full name"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
          />

          <input
            className="col-span-2 border rounded-md px-3 py-2 text-sm"
            placeholder="College / Organization"
            value={college}
            onChange={(event) =>
              setCollege(event.target.value)
            }
          />

          <input
            className="border rounded-md px-3 py-2 text-sm"
            placeholder="Branch (e.g. CSE)"
            value={branch}
            onChange={(event) =>
              setBranch(event.target.value)
            }
          />

          <input
            className="border rounded-md px-3 py-2 text-sm"
            placeholder="Year (1-4)"
            value={year}
            onChange={(event) =>
              setYear(event.target.value)
            }
          />

        </div>
      )}

      <label className="block text-sm font-medium mb-1">
        Email
      </label>

      <input
        type="email"
        className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
        placeholder="you@college.edu"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        disabled={otpSent}
      />

      {method === "password" && (
        <div>

          <label className="block text-sm font-medium mb-1">
            Password
          </label>

          <input
            type="password"
            className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
            placeholder="••••••••"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          {mode === "signin" && (
            <div>

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
                  ? "Please wait " + cooldown + "s"
                  : "Forgot password?"}
              </button>

            </div>
          )}

          {mode === "signup" && (
            <button
              type="button"
              onClick={handlePasswordSignUp}
              disabled={loading}
              className="w-full bg-navy text-white py-2.5 rounded-md font-medium disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>
          )}

        </div>
      )}

      {method === "otp" && (
        <div>

          {!otpSent && (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || cooldown > 0}
              className="w-full bg-navy text-white py-2.5 rounded-md font-medium disabled:opacity-50"
            >
              {loading
                ? "Sending OTP..."
                : cooldown > 0
                ? "Please wait " + cooldown + "s"
                : "Send OTP"}
            </button>
          )}

          {otpSent && (
            <div>

              <label className="block text-sm font-medium mb-1">
                Enter OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full border rounded-md px-3 py-2 mb-3 text-sm tracking-widest"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setOtp(value);
                }}
              />

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full bg-navy text-white py-2.5 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  clearMessages();
                }}
                className="w-full text-sm text-gray-600 mt-3"
              >
                Change email
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || cooldown > 0}
                className="w-full text-sm text-blue-600 mt-2 disabled:opacity-50"
              >
                {cooldown > 0
                  ? "Resend OTP in " + cooldown + "s"
                  : "Resend OTP"}
              </button>

            </div>
          )}

        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-5">
        By continuing, you agree to use CampusOpps responsibly.
      </p>

    </div>
  );
  }
