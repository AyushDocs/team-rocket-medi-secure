"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/context/Web3Context";

export function DoctorReputation({ doctorAddress }) {
  const { doctorContract } = useWeb3();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorStats();
  }, [doctorAddress]);

  const loadDoctorStats = async () => {
    if (!doctorContract || !doctorAddress) return;
    try {
      const doctorStats = await doctorContract.methods.getDoctorStats(doctorAddress).call();
      setStats({
        totalReviews: doctorStats.totalReviews,
        rating: doctorStats.currentRating,
        reputationScore: doctorStats.reputationScore,
        verifiedVisits: doctorStats.verifiedVisits
      });
    } catch (err) {
      console.error("Failed to load doctor stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />;
  }

  if (!stats) {
    return <div className="text-gray-500">No reputation data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Doctor Rating</h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={stats.rating} />
            <span className="text-gray-600">({stats.totalReviews} reviews)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{stats.reputationScore}</div>
          <div className="text-sm text-gray-500">Reputation Score</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-xl font-semibold">{stats.totalReviews}</div>
          <div className="text-sm text-gray-600">Total Reviews</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-xl font-semibold">{stats.verifiedVisits}</div>
          <div className="text-sm text-gray-600">Verified Visits</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-xl font-semibold">{stats.rating}/5</div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
      </div>
    </div>
  );
}

export function StarRating({ rating, maxRating = 5, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            className={`text-2xl ${
              starValue <= (hover || rating)
                ? "text-yellow-400"
                : "text-gray-300"
            } ${onChange ? "cursor-pointer" : "cursor-default"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default DoctorReputation;