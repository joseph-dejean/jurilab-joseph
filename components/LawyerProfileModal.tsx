import React, { useState, useMemo } from 'react';
import { Lawyer, Appointment } from '../types';
import { useApp } from '../store/store';
import { Button } from './Button';
import { BookingCalendar } from './BookingCalendar';
import { ProfileViewer } from './profile-builder/ProfileViewer';
import { Star, X, Briefcase, Languages, Clock, MessageSquare, Paperclip, LogIn, Video, MapPin, Phone } from 'lucide-react';
import { format, addDays, setHours, setMinutes, setSeconds, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface LawyerProfileModalProps {
  lawyer: Lawyer;
  onClose: () => void;
}

export const LawyerProfileModal: React.FC<LawyerProfileModalProps> = ({ lawyer, onClose }) => {
  const { t, translateSpecialty, currentUser, bookAppointment } = useApp();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [consultationType, setConsultationType] = useState<Appointment['type']>('VIDEO');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const navigate = useNavigate();

  // Generate mock slots if the lawyer has none, for demonstration purposes
  const availableSlots = useMemo(() => {
    if (lawyer.availableSlots && lawyer.availableSlots.length > 0) {
      return lawyer.availableSlots;
    }
    const mockSlots: string[] = [];
    const now = new Date();
    const hours = [9, 10, 11, 14, 15, 16];
    for (let i = 1; i < 8; i++) {
      for (const hour of hours) {
        const slotDate = setSeconds(setMinutes(setHours(addDays(now, i), hour), 0), 0);
        if (!isPast(slotDate)) {
          mockSlots.push(slotDate.toISOString());
        }
      }
    }
    return mockSlots;
  }, [lawyer.availableSlots]);

  const handleBooking = async () => {
    if (selectedSlot && currentUser) {
      setIsBooking(true);
      try {
        await bookAppointment(lawyer.id, selectedSlot.toISOString(), consultationType, notes);
        alert(`${t.booking.confirmMessage} ${lawyer.name} ${t.booking.confirmOn} ${format(selectedSlot, 'PPPP p', { locale: fr })}`);
        onClose();
      } catch (error) {
        console.error(error);
      } finally {
        setIsBooking(false);
      }
    } else {
      alert(t.booking.selectSlotFirst);
    }
  };

  const handleLoginRedirect = () => {
      onClose();
      navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-navy-dark rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        
        {/* Left Column: Info & Contact */}
        <div className="lg:col-span-1 bg-slate-50 dark:bg-navy p-6 flex flex-col overflow-y-auto">
          <div className="text-center">
            <img
              src={lawyer.avatarUrl}
              alt={lawyer.name}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-white dark:ring-navy mx-auto"
            />
            <h1 className="text-2xl font-bold text-navy dark:text-white mt-4">{lawyer.name}</h1>
            <p className="text-md text-slate-500 dark:text-slate-400">{lawyer.firmName}</p>
            {lawyer.rating && lawyer.reviewCount && (
              <div className="flex items-center justify-center mt-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <p className="ml-1 text-sm text-slate-600 dark:text-slate-300">
                  {lawyer.rating} ({lawyer.reviewCount} {t.modal.reviewsTitle})
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-8 space-y-4">
             <div className="flex items-start space-x-3">
              <Briefcase className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-navy dark:text-white">{t.modal.specialties}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{translateSpecialty(lawyer.specialty)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Languages className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-navy dark:text-white">{t.modal.languages}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{lawyer.languages?.join(', ') || 'Non spécifié'}</p>
              </div>
            </div>
             <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-navy dark:text-white">{t.modal.experience}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{lawyer.yearsExperience} {t.modal.years}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
             <h3 className="text-lg font-semibold text-navy dark:text-white border-b-2 border-red-500 pb-2 mb-4 inline-block">Contacter</h3>
             <div className="space-y-3">
                <textarea 
                  className="w-full p-2 text-sm border border-slate-300 dark:border-navy-light rounded-md bg-transparent focus:ring-2 focus:ring-red-500 outline-none"
                  rows={3}
                  placeholder="Votre message..."
                />
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Joindre un document
                  </Button>
                   <Button variant="solid" size="sm" className="bg-red-600 hover:bg-red-700 text-white flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
             </div>
           </div>
        </div>

        {/* Right Column: About & Booking */}
        <div className="lg:col-span-2 p-8 flex flex-col overflow-y-auto">
           <div className="flex items-start justify-between">
             <h2 className="text-xl font-semibold text-navy dark:text-white border-b-2 border-red-500 pb-2 inline-block">{t.modal.about}</h2>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-navy-light transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>
           </div>
           
           {/* Show profile blocks if they exist, otherwise show classic bio */}
           {lawyer.profileConfig && lawyer.profileConfig.length > 0 ? (
             <div className="mt-4">
               <ProfileViewer 
                 blocks={lawyer.profileConfig}
                 lawyerData={{
                   coordinates: lawyer.coordinates,
                   location: lawyer.location
                 }}
                 onContactClick={() => {
                   // Scroll to booking section
                   const bookingSection = document.querySelector('[data-booking-section]');
                   bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }}
                 onVideoClick={() => {
                   setConsultationType('VIDEO');
                   const bookingSection = document.querySelector('[data-booking-section]');
                   bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }}
               />
             </div>
           ) : (
             <p className="mt-4 text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none flex-shrink-0">{lawyer.bio}</p>
           )}
           
           <div className="mt-8 flex-grow flex flex-col" data-booking-section>
              <h2 className="text-xl font-semibold text-navy dark:text-white mb-4">{t.modal.bookTitle}</h2>
              
              {/* Consultation Type Selection */}
              <div className="mb-6 flex gap-4">
                <button
                  onClick={() => setConsultationType('VIDEO')}
                  className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    consultationType === 'VIDEO' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Video className="h-6 w-6" />
                  <span className="font-medium text-sm">{t.modal.video}</span>
                </button>
                <button
                  onClick={() => setConsultationType('IN_PERSON')}
                  className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    consultationType === 'IN_PERSON' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <MapPin className="h-6 w-6" />
                  <span className="font-medium text-sm">{t.modal.inPerson}</span>
                </button>
                <button
                  onClick={() => setConsultationType('PHONE')}
                  className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    consultationType === 'PHONE' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Phone className="h-6 w-6" />
                  <span className="font-medium text-sm">{t.modal.phone}</span>
                </button>
              </div>

              <div className="flex-grow">
                <BookingCalendar 
                  availableSlots={availableSlots}
                  onSlotSelect={setSelectedSlot} 
                />
              </div>

              {/* Optional Notes */}
              <div className="mt-4">
                <input 
                    type="text" 
                    placeholder={t.modal.notes}
                    className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-red-500"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="mt-4 pt-2">
                {currentUser ? (
                  <Button 
                    size="lg" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white" 
                    onClick={handleBooking}
                    disabled={!selectedSlot || isBooking}
                  >
                    {isBooking ? 'Réservation...' : t.modal.confirm}
                  </Button>
                ) : (
                   <Button 
                    size="lg" 
                    className="w-full flex items-center justify-center"
                    variant="outline"
                    onClick={handleLoginRedirect}
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {t.modal.loginToBook}
                  </Button>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
