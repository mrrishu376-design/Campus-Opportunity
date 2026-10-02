"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(userRow);

      const { data: myListings } = await supabase
        .from("listings")
        .select("*")
        .eq("posted_by", session.user.id)
        .order("created_at", { ascending: false });
      setListings(myListings || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <p className="text-center text-gray-500 py-10">Loading...</p>;

  return (
    <div>
      <div className="bg-white border rounded-xl p-5 mb-5">
        <h1 className="text-lg font-bold text-navy mb-2">My Profile</h1>
        <p className="text-sm text-gray-600">
          <strong>Name:</strong> {profile?.full_name || "—"}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Email:</strong> {profile?.email}
        </p>
        <p className="text-sm text-gray-600">
          <strong>College/Org:</strong> {profile?.college_or_org || "—"}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Branch:</strong> {profile?.branch || "—"} &nbsp;
          <strong>Year:</strong> {profile?.year || "—"}
        </p>
      </div>

      <h2 className="font-semibold text-navy mb-2">My Submitted Listings</h2>
      {listings.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't posted anything yet.</p>
      ) : (
        listings.map((l) => (
          <div key={l.id} className="bg-white border rounded-xl p-4 mb-2 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{l.title}</p>
              <p className="text-xs text-gray-500">{l.organizer_name}</p>
              {l.status === "rejected" && l.rejection_reason && (
                <p className="text-xs text-red-500 mt-1">Reason: {l.rejection_reason}</p>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[l.status]}`}>
              {l.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
        }
