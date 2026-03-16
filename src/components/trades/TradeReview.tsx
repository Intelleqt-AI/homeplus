import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TradeReviewProps {
  tradeName: string;
  jobTitle: string;
  onSubmit: (review: { rating: number; comment: string }) => void;
}

const TradeReview = ({ tradeName, jobTitle, onSubmit }: TradeReviewProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    onSubmit({ rating, comment });
    setSubmitted(true);
    toast.success('Review submitted! Thank you.');
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 rounded-[12px] p-4 border border-emerald-200 text-center">
        <Star className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
        <p className="text-emerald-700 text-sm font-medium">Review submitted</p>
        <p className="text-emerald-600 text-xs mt-1">Thank you for your feedback on {tradeName}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FEF9E7] rounded-[12px] p-4 border border-[#FDE68A]/50">
      <h4 className="text-[#1A1A1A] text-sm font-semibold mb-1">Rate {tradeName}</h4>
      <p className="text-[#6B6B6B] text-xs mb-3">How was the work on "{jobTitle}"?</p>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoveredRating || rating)
                  ? 'text-[#FBBF24] fill-[#FBBF24]'
                  : 'text-[#D1D5DB]'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-xs text-[#6B6B6B] ml-2">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Tell others about your experience (optional)"
        className="w-full px-3 py-2 border border-[#E8E8E3] rounded-lg text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/50"
      />

      <Button
        onClick={handleSubmit}
        className="mt-2 bg-[#1A1A1A] text-white text-xs h-8 px-4 rounded-full hover:bg-[#333]"
      >
        Submit Review
      </Button>
    </div>
  );
};

export default TradeReview;
