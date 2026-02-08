import { Quote, Star, MessageCircle } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';
import { getStylePresetClasses, getCustomTextClasses, shouldUseLightText } from '../shared/stylePresets';

interface TestimonialsBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ block, onChange, readOnly }) => {
  const presetStyles = getStylePresetClasses(block.stylePreset);
  
  // Determine if using custom colors
  const isCustom = block.stylePreset === 'custom' && block.customBgColor;
  const isDarkBg = isCustom ? shouldUseLightText(block) : presetStyles.isDark;
  const textStyles = isCustom ? getCustomTextClasses(block) : presetStyles;
  const containerClass = isCustom ? '' : presetStyles.container;
  
  // Parse testimonials from content (can be single or array)
  const parseTestimonials = () => {
    if (block.content) {
      try {
        const parsed = JSON.parse(block.content);
        // Handle both single testimonial and array
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch {
        return [{
          text: block.title || 'Excellent avocat, très professionnel !',
          name: 'Client satisfait',
          rating: 5
        }];
      }
    }
    return [{
      text: 'Excellent avocat, très professionnel et à l\'écoute !',
      name: 'Jean D.',
      rating: 5
    }];
  };

  const testimonials = parseTestimonials();
  const testimonial = testimonials[0] || { text: '', name: '', rating: 5 };

  return (
    <div className={`h-full flex flex-col justify-center p-6 ${containerClass}`}>
      {readOnly ? (
        <>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isDarkBg ? 'bg-white/10' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
            <Quote className={`w-5 h-5 ${isDarkBg ? 'text-white/70' : 'text-primary-600 dark:text-primary-400'}`} />
          </div>
          <p className={`text-sm leading-relaxed italic mb-4 flex-1 ${textStyles.text}`}>
            "{testimonial.text || testimonial.name || 'Témoignage'}"
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < (testimonial.rating || 5)
                      ? 'text-amber-400 fill-amber-400'
                      : isDarkBg ? 'text-white/20' : 'text-surface-300 dark:text-deep-600'
                    }`}
                />
              ))}
            </div>
            <p className={`text-xs font-semibold ${textStyles.subtext}`}>
              — {testimonial.name || testimonial.author || 'Anonyme'}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-deep-700 dark:text-surface-300">Témoignage</span>
          </div>
          <textarea
            value={testimonial.text || ''}
            onChange={(e) => {
              const newTestimonial = { ...testimonial, text: e.target.value };
              onChange(block.id, { content: JSON.stringify([newTestimonial]) });
            }}
            placeholder="Un excellent avocat qui m'a accompagné..."
            className="w-full flex-1 p-3 text-sm border border-surface-200 dark:border-deep-700 rounded-xl bg-white dark:bg-deep-800 text-deep-700 dark:text-surface-200 resize-none mb-3 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
          <input
            type="text"
            value={testimonial.name || testimonial.author || ''}
            onChange={(e) => {
              const newTestimonial = { ...testimonial, name: e.target.value };
              onChange(block.id, { content: JSON.stringify([newTestimonial]) });
            }}
            placeholder="Nom du client (ex: Jean D.)"
            className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-deep-700 rounded-xl bg-white dark:bg-deep-800 text-deep-700 dark:text-surface-200 mb-3 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500">Note :</span>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => {
                  const newTestimonial = { ...testimonial, rating };
                  onChange(block.id, { content: JSON.stringify([newTestimonial]) });
                }}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star className={`w-5 h-5 ${rating <= (testimonial.rating || 5)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-surface-300 dark:text-deep-600'
                  }`} 
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

