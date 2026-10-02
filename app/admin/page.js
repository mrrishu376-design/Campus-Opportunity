"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data: userRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userRow?.role !== "admin") {
        router.push("/");
        return;
      }
      setAuthorized(true);
      setChecking(false);
    }
    checkAdmin();
  }, [router]);

  async function loadData() {
    const { data: pendingData } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPending(pendingData || []);

    const { data: approvedData } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    setApproved(approvedData || []);
  }

  useEffect(() => {
    if (authorized) loadData();
  }, [authorized]);

  async function handleApprove(id) {
    await supabase
      .from("listings")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);
    loadData();
  }

  async function handleReject(id) {
    if (!rejectReason) return;
    await supabase
      .from("listings")
      .update({ status: "rejected", rejection_reason: rejectReason })
      .eq("id", id);
    setRejectingId(null);
    setRejectReason("");
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this approved listing permanently?")) return;
    await supabase.from("listings").delete().eq("id", id);
    loadData();
  }

  if (checking) return <p className="text-center text-gray-500 py-10">Checking access...</p>;
  if (!authorized) return null;

  return (
    <div>
      <h1 className="text-lg font-bold text-navy mb-4">Admin Panel</h1>
      <div className="flex mb-4 border rounded-md overflow-hidden text-sm w-fit">
        <button
          className={`px-4 py-2 ${tab === "pending" ? "bg-navy text-white" : "bg-white"}`}
          onClick={() => setTab("pending")}
        >
          Pending ({pending.length})
        </button>
        <button
          className={`px-4 py-2 ${tab === "approved" ? "bg-navy text-white" : "bg-white"}`}
          onClick={() => setTab("approved")}
        >
          Approved ({approved.length})
        </button>
      </div>

      {tab === "pending" &&
        (pending.length === 0 ? (
          <p className="text-sm text-gray-500">No pending listings. All caught up!</p>
        ) : (
          pending.map((l) => (
            <div key={l.id} className="bg-white border rounded-xl p-4 mb-3">
              <p className="font-semibold text-sm">{l.title}</p>
              <p className="text-xs text-gray-500 mb-2">
                {l.organizer_name} · {l.type} · Deadline: {l.deadline}
              </p>
              <a href={l.apply_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                {l.apply_link}
              </a>

              {rejectingId === l.id ? (
                <div className="mt-2">
                  <input
                    className="w-full border rounded-md px-2 py-1.5 text-sm mb-2"
                    placeholder="Reason for rejection"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(l.id)}
                      className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setRejectingId(null)}
                      className="text-xs px-3 py-1.5 rounded-md border"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(l.id)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(l.id)}
                    className="bg-white border text-xs px-3 py-1.5 rounded-md"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        ))}

      {tab === "approved" &&
        (approved.length === 0 ? (
          <p className="text-sm text-gray-500">No approved listings yet.</p>
        ) : (
          approved.map((l) => (
            <div key={l.id} className="bg-white border rounded-xl p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{l.title}</p>
                <p className="text-xs text-gray-500">{l.organizer_name} · {l.type}</p>
              </div>
              <button
                onClick={() => handleDelete(l.id)}
                className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-md"
              >
                Delete
              </button>
            </div>
          ))
        ))}
    </div>
  );
                    }
