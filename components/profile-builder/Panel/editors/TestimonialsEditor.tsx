import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, User } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}

interface TestimonialsEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const TestimonialsEditor: React.FC<TestimonialsEditorProps> = ({ content, onChange }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    try {
      return content ? JSON.parse(content) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(testimonials));
  }, [testimonials]);

  const addTestimonial = () => {
    setTestimonials(prev => [
      ...prev,
      { id: generateId(), name: '', text: '', rating: 5 }
    ]);
  };

  const updateTestimonial = (id: string, updates: Partial<Testimonial>) => {
    setTestimonials(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  };

  const removeTestimonial = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Ajoutez des témoignages de vos clients.
      </p>

      {testimonials.map((testimonial, index) => (
        <div
          key={testimonial.id}
          className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-deep-700 dark:text-surface-300">
              Témoignage {index + 1}
            </span>
            <button
              onClick={() => removeTestimonial(testimonial.id)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400 mb-1">
              <User className="w-3 h-3" />
              Nom du client
            </label>
            <input
              type="text"
              value={testimonial.name}
              onChange={(e) => updateTestimonial(testimonial.id, { name: e.target.value })}
              placeholder="Jean D."
              className="
                w-full px-3 py-2 rounded-lg
                bg-white dark:bg-deep-900
                border border-surface-200 dark:border-deep-600
                text-deep-900 dark:text-surface-100 text-sm
                placeholder:text-surface-400
                focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
                transition-all duration-200
              "
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1 block">Note</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => updateTestimonial(testimonial.id, { rating: star })}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= testimonial.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-surface-300 dark:text-deep-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1 block">Témoignage</label>
            <textarea
              value={testimonial.text}
              onChange={(e) => updateTestimonial(testimonial.id, { text: e.target.value })}
              placeholder="Un excellent avocat..."
              rows={3}
              className="
                w-full px-3 py-2 rounded-lg
                bg-white dark:bg-deep-900
                border border-surface-200 dark:border-deep-600
                text-deep-900 dark:text-surface-100 text-sm
                placeholder:text-surface-400
                focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
                transition-all duration-200
                resize-none
              "
            />
          </div>
        </div>
      ))}

      <button
        onClick={addTestimonial}
        className="
          w-full flex items-center justify-center gap-2
          px-4 py-3 rounded-xl
          border-2 border-dashed border-surface-300 dark:border-deep-600
          text-surface-600 dark:text-surface-400
          hover:border-primary-400 dark:hover:border-primary-600
          hover:text-primary-600 dark:hover:text-primary-400
          transition-all duration-200
        "
      >
        <Plus className="w-4 h-4" />
        Ajouter un témoignage
      </button>
    </div>
  );
};

export default TestimonialsEditor;
