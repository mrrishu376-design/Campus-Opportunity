"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SubmitPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("internship");
  const [organizer, setOrganizer] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [stipend, setStipend] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUserId(session.user.id);
        setCheckingAuth(false);
      }
    });
  }, [router]);

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title || !organizer || !deadline || !applyLink) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isValidUrl(applyLink)) {
      setError("Please enter a valid Apply Link (must start with http:// or https://).");
      return;
    }

    setLoading(true);

    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("apply_link", applyLink)
      .maybeSingle();

    if (existing) {
      setLoading(false);
      setError("This opportunity is already posted on CampusOpps.");
      return;
    }

    const { error: insertError } = await supabase.from("listings").insert({
      posted_by: userId,
      title,
      type,
      organizer_name: organizer,
      eligibility_branch: branch ? branch.split(",").map((b) => b.trim()) : [],
      eligibility_year: year ? [year] : [],
      location,
      deadline,
      apply_link: applyLink,
      stipend_salary: stipend || null,
      description: description || null,
      status: "pending",
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSuccess(true);
  }

  if (checkingAuth) return <p className="text-center text-gray-500 py-10">Loading...</p>;

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white border rounded-xl p-6 mt-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <h1 className="text-lg font-bold text-navy mb-2">Submitted!</h1>
        <p className="text-sm text-gray-600 mb-4">
          Your listing is under review and will appear in the feed once approved.
        </p>
        <button
          onClick={() => router.push("/profile")}
          className="bg-navy text-white px-4 py-2 rounded-md text-sm"
        >
          View my submissions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded-xl p-6 mt-6">
      <h1 className="text-lg font-bold text-navy mb-4">Post an Opportunity</h1>
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-3">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div>
          <label className="block font-medium mb-1">Title *</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Type *</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="internship">Internship</option>
            <option value="hackathon">Hackathon</option>
            <option value="job">Job</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Organizer / Company *</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium mb-1">Eligible Branch(es)</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="CSE, IT"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Eligible Year</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Location</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Remote / City"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Deadline *</label>
          <input
            type="date"
            className="w-full border rounded-md px-3 py-2"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Apply Link *</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="https://..."
            value={applyLink}
            onChange={(e) => setApplyLink(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Stipend / Salary</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Optional"
            value={stipend}
            onChange={(e) => setStipend(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded-md px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white py-2.5 rounded-md font-medium disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit for review"}
        </button>
      </form>
    </div>
  );
    }
