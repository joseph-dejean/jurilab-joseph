import React, { useState } from 'react';
import { Lawyer, Appointment } from '../types';
import { BookingCalendar } from './BookingCalendar';
import { Button } from './Button';
import { useApp } from '../store/store';
import { X, Check, MapPin, Briefcase, Clock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LawyerProfileModalProps {
  lawyer: Lawyer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LawyerProfileModal: React.FC<LawyerProfileModalProps> = ({ lawyer, isOpen, onClose }) => {
  const { t, translateSpecialty, bookAppointment, currentUser, appointments } = useApp();
  const navigate = useNavigate();
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<Appointment['type']>('VIDEO');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !lawyer) return null;

  // Filter out slots that are already booked in the system
  const availableSlots = lawyer.availableSlots.filter(slot => {
    return !appointments.some(a => a.lawyerId === lawyer.id && a.date === slot && a.status === 'CONFIRMED');
  });

  // If mock data has no slots, generate some for the demo to look good
  const displaySlots = availableSlots.length > 0 ? availableSlots : [
     new Date(Date.now() + 86400000 * 1 + 3600000 * 10).toISOString(),
     new Date(Date.now() + 86400000 * 2 + 3600000 * 14).toISOString(),
     new Date(Date.now() + 86400000 * 3 + 3600000 * 9).toISOString(),
     new Date(Date.now() + 86400000 * 3 + 3600000 * 16).toISOString(),
     new Date(Date.now() + 86400000 * 5 + 3600000 * 11).toISOString(),
  ];

  const handleBook = () => {
    if (!currentUser) {
      onClose();
      navigate('/login');
      return;
    }
    if (selectedSlot) {
      bookAppointment(lawyer.id, selectedSlot, consultationType, notes);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedSlot(null);
        onClose();
        navigate('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        {/* Left Column: Profile Info */}
        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-navy-dark p-6 md:p-8 border-b md:border-b-0 md:border-r">
          <div className="flex flex-col items-center text-center mb-6">
            <img 
              src={lawyer.avatarUrl} 
              alt={lawyer.name} 
              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg mb-4"
            />
            <h2 className="text-2xl font-serif text-navy dark:text-white">{lawyer.name}</h2>
            <p className="text-brand-dark dark:text-brand font-medium">{lawyer.firmName}</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
               <Briefcase className="h-5 w-5 text-slate-400 mt-0.5" />
               <div>
                 <h4 className="font-semibold text-navy dark:text-white">{t.modal.specialties}</h4>
                 <p className="text-slate-600 dark:text-slate-400">{translateSpecialty(lawyer.specialty)}</p>
               </div>
            </div>
            
            <div className="flex items-start gap-3">
               <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
               <div>
                 <h4 className="font-semibold text-navy dark:text-white">{lawyer.location}</h4>
               </div>
            </div>

            <div className="flex items-start gap-3">
               <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
               <div>
                 <h4 className="font-semibold text-navy dark:text-white">{t.modal.experience}</h4>
                 <p className="text-slate-600 dark:text-slate-400">{lawyer.yearsExperience} {t.modal.years}</p>
               </div>
            </div>

             <div className="flex items-start gap-3">
               <Globe className="h-5 w-5 text-slate-400 mt-0.5" />
               <div>
                 <h4 className="font-semibold text-navy dark:text-white">{t.modal.languages}</h4>
                 <div className="flex flex-wrap gap-1 mt-1">
                    {lawyer.languages.map(lang => (
                      <span key={lang} className="px-2 py-0.5 bg-slate-200 dark:bg-navy rounded text-xs text-slate-700 dark:text-slate-300">
                        {lang}
                      </span>
                    ))}
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white dark:bg-navy rounded-xl border">
             <h4 className="font-semibold text-navy dark:text-white mb-2">{t.modal.about}</h4>
             <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{lawyer.bio}</p>
          </div>
        </div>

        {/* Right Column: Booking */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b mb-6 pb-4">
            <h3 className="text-xl font-semibold text-navy dark:text-white">{t.modal.bookTitle}</h3>
            <div className="text-lg font-semibold text-navy dark:text-white">
              {lawyer.hourlyRate}€<span className="text-sm font-normal text-slate-500">/h</span>
            </div>
          </div>
          
          {/* Booking Content */}
          {(
            <>
              {isSuccess ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                       <Check className="h-8 w-8" />
                    </div>
                    <h4 className="text-2xl font-bold text-navy dark:text-white mb-2">{t.modal.success}</h4>
                    <p className="text-slate-500">Redirection vers le tableau de bord...</p>
                 </div>
              ) : (
                 <div className="flex-col flex h-full">
                   <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.modal.selectSlot}</label>
                      <BookingCalendar 
                        availableSlots={displaySlots} 
                        selectedSlot={selectedSlot}
                        onSelectSlot={setSelectedSlot}
                      />
                   </div>

                   {selectedSlot && (
                      <div className="space-y-4 animate-fade-in">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.modal.consultationType}</label>
                            <div className="grid grid-cols-3 gap-2">
                               {[
                                 { id: 'VIDEO', label: t.modal.video }, 
                                 { id: 'IN_PERSON', label: t.modal.inPerson }, 
                                 { id: 'PHONE', label: t.modal.phone }
                               ].map((type) => (
                                  <button
                                    key={type.id}
                                    onClick={() => setConsultationType(type.id as any)}
                                    className={`p-2 rounded-lg text-xs font-medium border transition-all ${consultationType === type.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-300'}`}
                                  >
                                     {type.label}
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.modal.notes}</label>
                            <textarea 
                               rows={3}
                               value={notes}
                               onChange={(e) => setNotes(e.target.value)}
                               className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                               placeholder="..."
                            />
                         </div>
                      </div>
                   )}

                   <div className="mt-auto pt-6">
                      <Button 
                         onClick={handleBook} 
                         disabled={!selectedSlot} 
                         className="w-full"
                         size="lg"
                      >
                         {currentUser ? t.modal.confirm : t.modal.loginToBook}
                      </Button>
                   </div>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};