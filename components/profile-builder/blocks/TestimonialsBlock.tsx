import { Quote, Star } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface TestimonialsBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ block, onChange, readOnly }) => {
  // Parse testimonial from content
  const testimonial = block.content ? JSON.parse(block.content || '{}') : {
    text: block.title || 'Excellent avocat, très professionnel !',
    author: 'Client satisfait',
    rating: 5
  };

  return (
    <div className="h-full flex flex-col justify-center bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
      {readOnly ? (
        <>
          <Quote className="w-8 h-8 text-primary-600 mb-3 opacity-50" />
          <p className="text-sm text-slate-700 dark:text-slate-200 italic mb-4 flex-1">
            "{testimonial.text}"
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < (testimonial.rating || 5)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-300 dark:text-slate-600'
                    }`}
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              — {testimonial.author}
            </p>
          </div>
        </>
      ) : (
        <>
          <Quote className="w-6 h-6 text-primary-600 mb-2" />
          <textarea
            value={testimonial.text || ''}
            onChange={(e) => {
              const newTestimonial = { ...testimonial, text: e.target.value };
              onChange(block.id, { content: JSON.stringify(newTestimonial) });
            }}
            placeholder="Témoignage client..."
            className="w-full flex-1 p-2 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700 resize-none mb-2"
          />
          <input
            type="text"
            value={testimonial.author || ''}
            onChange={(e) => {
              const newTestimonial = { ...testimonial, author: e.target.value };
              onChange(block.id, { content: JSON.stringify(newTestimonial) });
            }}
            placeholder="Nom du client"
            className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700 mb-2"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Note:</span>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => {
                  const newTestimonial = { ...testimonial, rating };
                  onChange(block.id, { content: JSON.stringify(newTestimonial) });
                }}
                className={`w-5 h-5 ${rating <= (testimonial.rating || 5)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-300'
                  }`}
              >
                <Star className="w-full h-full" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

