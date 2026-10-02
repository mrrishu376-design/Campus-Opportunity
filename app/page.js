"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import ListingCard from "../components/ListingCard";

const PAGE_SIZE = 20;

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [type, setType] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("newest");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "approved");

    if (type) query = query.eq("type", type);
    if (branch) query = query.contains("eligibility_branch", [branch]);
    if (year) query = query.contains("eligibility_year", [year]);
    if (location) query = query.ilike("location", `%${location}%`);

    if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("deadline", { ascending: true });
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (!error) {
      setListings(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [type, branch, year, location, sort, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    setPage(0);
  }, [type, branch, year, location, sort]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className="bg-navy text-white rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Every campus opportunity, in one feed.</h1>
        <p className="text-sm text-gray-200 mb-4">
          Internships, hackathons, jobs and tech events — posted by students, for students.
          Never miss a deadline again.
        </p>
        <Link
          href="/submit"
          className="inline-block bg-white text-navy font-semibold px-4 py-2 rounded-md"
        >
          + Post an opportunity
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-gray-500 mb-1">Type</label>
          <select
            className="w-full border rounded-md px-2 py-1.5"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="internship">Internship</option>
            <option value="hackathon">Hackathon</option>
            <option value="job">Job</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Branch</label>
          <input
            className="w-full border rounded-md px-2 py-1.5"
            placeholder="e.g. CSE"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Year</label>
          <select
            className="w-full border rounded-md px-2 py-1.5"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Location</label>
          <input
            className="w-full border rounded-md px-2 py-1.5"
            placeholder="e.g. Remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-gray-500 mb-1">Sort by</label>
          <select
            className="w-full border rounded-md px-2 py-1.5"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="deadline">Deadline Approaching First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading opportunities...</p>
      ) : listings.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          No opportunities found. Be the first to post one!
        </div>
      ) : (
        <>
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
          <div className="flex items-center justify-between mt-4 text-sm">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 border rounded-md disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border rounded-md disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
            }
