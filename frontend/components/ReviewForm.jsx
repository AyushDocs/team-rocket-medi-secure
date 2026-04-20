"use client";

import { useState } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { StarRating } from "./DoctorReputation";
import toast from "react-hot-toast";

export function ReviewForm({ doctorAddress, doctorName, appointmentId, onReviewSubmitted }) {
  const { account, doctorContract } = useWeb3();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    if (!account) {
      toast.error("Please connect your wallet");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);

    try {
      if (doctorContract) {
        await doctorContract.methods
          .submitReview(doctorAddress, rating, comment, appointmentId || 0, !!appointmentId)
          .send({ from: account });

        toast.success("Review submitted successfully!");
        onReviewSubmitted?.();
        setRating(0);
        setComment("");
      } else {
        toast.error("Contract not available, please reconnect");
      }
    } catch (err) {
      console.error("Review error:", err);
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Review {doctorName || "Doctor"}
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <StarRating rating={rating} onChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/500 characters
        </p>
      </div>

      <button
        onClick={submitReview}
        disabled={loading || rating === 0 || !account}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}

export default ReviewForm;