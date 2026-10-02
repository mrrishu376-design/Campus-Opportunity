"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (mounted) setRole(data?.role ?? null);
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => setRole(data?.role ?? null));
      } else {
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="border-b bg-white">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-navy text-lg">
          🎓 CampusOpps
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/">Feed</Link>
          {user && <Link href="/submit">+ Post</Link>}
          {user && <Link href="/profile">Profile</Link>}
          {role === "admin" && (
            <Link href="/admin" className="font-semibold text-red-600">
              Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={handleSignOut}
              className="bg-navy text-white px-3 py-1.5 rounded-md"
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" className="bg-navy text-white px-3 py-1.5 rounded-md">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
          }
