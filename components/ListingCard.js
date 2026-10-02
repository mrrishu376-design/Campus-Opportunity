"use client";

function daysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
}

const typeColors = {
  internship: "bg-blue-100 text-blue-700",
  hackathon: "bg-purple-100 text-purple-700",
  job: "bg-green-100 text-green-700",
  event: "bg-orange-100 text-orange-700",
};

export default function ListingCard({ listing }) {
  const diff = daysLeft(listing.deadline);
  let deadlineLabel = "No deadline";
  let deadlineColor = "text-gray-500";

  if (diff !== null) {
    if (diff < 0) {
      deadlineLabel = "Deadline passed";
      deadlineColor = "text-gray-400";
    } else if (diff === 0) {
      deadlineLabel = "Last day to apply!";
      deadlineColor = "text-red-600 font-semibold";
    } else {
      deadlineLabel = `${diff} day${diff > 1 ? "s" : ""} left`;
      deadlineColor = diff <= 3 ? "text-red-600 font-semibold" : "text-gray-600";
    }
  }

  return (
    <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
            typeColors[listing.type] || "bg-gray-100 text-gray-700"
          }`}
        >
          {listing.type}
        </span>
        <span className={`text-xs ${deadlineColor}`}>{deadlineLabel}</span>
      </div>
      <h3 className="font-semibold text-navy text-base mb-1">{listing.title}</h3>
      <p className="text-sm text-gray-600 mb-1">{listing.organizer_name}</p>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
        {listing.location && <span>📍 {listing.location}</span>}
        {listing.eligibility_year?.length > 0 && (
          <span>🎓 Year: {listing.eligibility_year.join(", ")}</span>
        )}
        {listing.eligibility_branch?.length > 0 && (
          <span>🏷️ {listing.eligibility_branch.join(", ")}</span>
        )}
        {listing.stipend_salary && <span>💰 {listing.stipend_salary}</span>}
      </div>
      {listing.description && (
        <p className="text-sm text-gray-700 mb-3">{listing.description}</p>
      )}
      <a
        href={listing.apply_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-navy text-white text-sm px-4 py-1.5 rounded-md"
      >
        Apply
      </a>
    </div>
  );
        }
