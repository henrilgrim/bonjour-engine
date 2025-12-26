import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerRating } from '@/types';

interface StarRatingProps {
  rating: CustomerRating;
  onChange?: (rating: CustomerRating) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const StarRating = ({ rating, onChange, size = 'md', readonly = false }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star as CustomerRating)}
          className={cn(
            'transition-all',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              star <= rating 
                ? 'fill-amber-400 text-amber-400' 
                : 'fill-transparent text-muted-foreground/40'
            )}
          />
        </button>
      ))}
    </div>
  );
};

export const getRatingLabel = (rating: CustomerRating): string => {
  const labels: Record<CustomerRating, string> = {
    1: 'Muito Baixo',
    2: 'Baixo',
    3: 'Regular',
    4: 'Bom',
    5: 'Excelente',
  };
  return labels[rating];
};

export const getRatingColor = (rating: CustomerRating): string => {
  if (rating >= 4) return 'text-emerald-500';
  if (rating >= 3) return 'text-amber-500';
  return 'text-red-500';
};
