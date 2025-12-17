import React, { useState, useMemo, useEffect } from 'react';
import { Lawyer, Appointment } from '../types';
import { useApp } from '../store/store';
import { Button } from './Button';
import { BookingCalendar } from './BookingCalendar';
import { ProfileViewer } from './profile-builder/ProfileViewer';
import { Star, X, Briefcase, Languages, Clock, MessageSquare, Paperclip, LogIn, Video, MapPin, Phone, Award, CheckCircle, ChevronLeft } from 'lucide-react';
import { format, addDays, setHours, setMinutes, setSeconds, isPast, startOfDay, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { getGoogleCalendarCredentials } from '../services/firebaseService';
import { getAvailableSlots, refreshGoogleAccessToken, isSlotInAvailabilityHours } from '../services/googleCalendarService';

interface LawyerProfileModalProps {
  lawyer: Lawyer;
  onClose: () => void;
}

export const LawyerProfileModal: React.FC<LawyerProfileModalProps> = ({ lawyer, onClose }) => {
  const { t, translateSpecialty, currentUser, bookAppointment, appointments } = useApp();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [consultationType, setConsultationType] = useState<Appointment['type']>('VIDEO');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingGoogleCalendar, setIsLoadingGoogleCalendar] = useState(false);
  const [googleCalendarSlots, setGoogleCalendarSlots] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'booking'>('profile');
  const navigate = useNavigate();

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load Google Calendar slots if connected
  useEffect(() => {
    const loadGoogleCalendarSlots = async () => {
      if (!lawyer.googleCalendarConnected) {
        setGoogleCalendarSlots(null);
        return;
      }

      try {
        setIsLoadingGoogleCalendar(true);
        const credentials = await getGoogleCalendarCredentials(lawyer.id);
        
        if (!credentials || !credentials.googleCalendarAccessToken) {
          setGoogleCalendarSlots(null);
          return;
        }

        const now = new Date();
        const startDate = now.toISOString();
        const endDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

        let accessToken = credentials.googleCalendarAccessToken;
        try {
          const slots = await getAvailableSlots(
            accessToken, 
            startDate, 
            endDate, 
            duration, 
            15,
            lawyer.availabilityHours
          );
          setGoogleCalendarSlots(slots);
        } catch (error: any) {
          if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('expired') || error.message?.includes('Invalid Credentials')) {
            console.warn('⚠️ Google Calendar token expired. Please reconnect your calendar.');
            setGoogleCalendarSlots(null);
          } else {
            console.error('❌ Error loading Google Calendar slots:', error);
            setGoogleCalendarSlots(null);
          }
        }
      } catch (error) {
        console.error('❌ Error loading Google Calendar slots:', error);
        setGoogleCalendarSlots(null);
      } finally {
        setIsLoadingGoogleCalendar(false);
      }
    };

    loadGoogleCalendarSlots();
  }, [lawyer.id, lawyer.googleCalendarConnected, duration]);

  // Generate available slots
  const availableSlots = useMemo(() => {
    const bookedSlots = appointments
      .filter(apt => 
        apt.lawyerId === lawyer.id && 
        (apt.status === 'CONFIRMED' || apt.status === 'PENDING') &&
        apt.status !== 'CANCELLED'
      )
      .map(apt => {
        const aptDate = parseISO(apt.date);
        const aptEnd = new Date(aptDate.getTime() + (apt.duration || 60) * 60 * 1000);
        return { start: aptDate, end: aptEnd };
      });

    const clientBookedSlots = currentUser 
      ? appointments
          .filter(apt => 
            apt.clientId === currentUser.id && 
            (apt.status === 'CONFIRMED' || apt.status === 'PENDING') &&
            apt.status !== 'CANCELLED'
          )
          .map(apt => {
            const aptDate = parseISO(apt.date);
            const aptEnd = new Date(aptDate.getTime() + (apt.duration || 60) * 60 * 1000);
            return { start: aptDate, end: aptEnd };
          })
      : [];

    if (lawyer.googleCalendarConnected && googleCalendarSlots && googleCalendarSlots.length > 0) {
      const filteredGoogleSlots = googleCalendarSlots.filter(slotStr => {
        const slotDate = parseISO(slotStr);
        const slotEnd = new Date(slotDate.getTime() + (duration || 60) * 60 * 1000);
        
        const hasLawyerConflict = bookedSlots.some(booked => 
          slotDate < booked.end && slotEnd > booked.start
        );
        
        const hasClientConflict = clientBookedSlots.some(booked => 
          slotDate < booked.end && slotEnd > booked.start
        );
        
        return !hasLawyerConflict && !hasClientConflict;
      });
      
      return filteredGoogleSlots;
    }
    
    if (lawyer.availableSlots && lawyer.availableSlots.length > 0) {
      const filteredSlots = lawyer.availableSlots.filter(slotStr => {
        const slotDate = parseISO(slotStr);
        const slotEnd = new Date(slotDate.getTime() + (duration || 60) * 60 * 1000);
        
        const isInAvailability = isSlotInAvailabilityHours(slotDate, lawyer.availabilityHours);
        
        const hasLawyerConflict = bookedSlots.some(booked => 
          slotDate < booked.end && slotEnd > booked.start
        );
        
        const hasClientConflict = clientBookedSlots.some(booked => 
          slotDate < booked.end && slotEnd > booked.start
        );
        
        return isInAvailability && !hasLawyerConflict && !hasClientConflict;
      });
      
      return filteredSlots;
    }

    // Generate mock slots
    const mockSlots: string[] = [];
    const now = new Date();
    
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const targetDay = addDays(startOfDay(now), dayOffset);
      const isToday = dayOffset === 0;
      
      for (let minutesFromMidnight = 8 * 60; minutesFromMidnight < 19 * 60; minutesFromMidnight += 15) {
        const slotDate = new Date(targetDay);
        slotDate.setMinutes(minutesFromMidnight, 0, 0);
        
        if (isToday) {
          const minTime = new Date(now.getTime() + 15 * 60 * 1000);
          if (slotDate < minTime || isPast(slotDate)) {
            continue;
          }
        }
        
        if (!isPast(slotDate)) {
          mockSlots.push(slotDate.toISOString());
        }
      }
    }
    
    const uniqueSlots = Array.from(new Set(mockSlots))
      .map(slot => parseISO(slot))
      .filter(slot => slot >= new Date(now.getTime() + 15 * 60 * 1000))
      .filter(slot => isSlotInAvailabilityHours(slot, lawyer.availabilityHours))
      .filter(slot => {
        const slotEnd = new Date(slot.getTime() + (duration || 60) * 60 * 1000);
        const hasLawyerConflict = bookedSlots.some(booked => 
          slot < booked.end && slotEnd > booked.start
        );
        
        const hasClientConflict = clientBookedSlots.some(booked => 
          slot < booked.end && slotEnd > booked.start
        );
        
        return !hasLawyerConflict && !hasClientConflict;
      })
      .sort((a, b) => a.getTime() - b.getTime());
    
    return uniqueSlots.map(slot => slot.toISOString());
  }, [lawyer.availableSlots, lawyer.googleCalendarConnected, googleCalendarSlots, appointments, lawyer.id, currentUser?.id, duration, lawyer.availabilityHours]);

  const handleBooking = async () => {
    if (selectedSlot && currentUser) {
      setIsBooking(true);
      try {
        await bookAppointment(lawyer.id, selectedSlot.toISOString(), consultationType, notes, duration);
        onClose();
      } catch (error: any) {
        console.error(error);
        if (!error.message?.includes('conflict') && !error.message?.includes('créneau')) {
          alert('Erreur lors de la réservation. Veuillez réessayer.');
        }
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

  const consultationTypes = [
    { type: 'VIDEO' as const, icon: Video, label: t.modal.video },
    { type: 'IN_PERSON' as const, icon: MapPin, label: t.modal.inPerson },
    { type: 'PHONE' as const, icon: Phone, label: t.modal.phone },
  ];

  return (
    <div 
      className="fixed inset-0 bg-deep-950/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container - Full screen on mobile, centered card on desktop */}
      <div 
        className="bg-white dark:bg-deep-900 w-full md:rounded-3xl md:shadow-glass-lg md:max-w-5xl md:max-h-[90vh] h-full md:h-auto overflow-hidden animate-slide-up md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-deep-900 border-b border-surface-200 dark:border-deep-800 px-4 py-3 flex items-center gap-3 safe-area-top">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg hover:bg-surface-100 dark:hover:bg-deep-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-deep-900 dark:text-surface-100 truncate">{lawyer.name}</h2>
            <p className="text-xs text-deep-500 dark:text-surface-500 truncate">{lawyer.firmName}</p>
          </div>
          {lawyer.rating && (
            <div className="flex items-center gap-1 px-2 py-1 bg-accent-50 dark:bg-accent-950/50 rounded-lg">
              <Star className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
              <span className="text-sm font-semibold text-accent-700 dark:text-accent-300">{lawyer.rating}</span>
            </div>
          )}
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden sticky top-[60px] z-10 bg-white dark:bg-deep-900 border-b border-surface-200 dark:border-deep-800">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-deep-500 dark:text-surface-500'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'booking'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-deep-500 dark:text-surface-500'
              }`}
            >
              Réserver
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-5 h-full md:h-auto md:max-h-[90vh]">
          {/* Left Column: Profile Info */}
          <div className="md:col-span-2 bg-surface-50 dark:bg-deep-800 p-6 lg:p-8 flex flex-col overflow-y-auto">
            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <img
                  src={lawyer.avatarUrl}
                  alt={lawyer.name}
                  className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl object-cover ring-4 ring-white dark:ring-deep-700 shadow-card"
                />
                {lawyer.rating && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-accent-500 rounded-full shadow-md">
                    <Star className="w-4 h-4 text-white fill-white" />
                    <span className="text-sm font-bold text-white">{lawyer.rating}</span>
                  </div>
                )}
              </div>
              <h1 className="text-xl lg:text-2xl font-serif font-bold text-deep-900 dark:text-surface-100 mt-6">
                {lawyer.name}
              </h1>
              <p className="text-deep-500 dark:text-surface-500">{lawyer.firmName}</p>
              {lawyer.reviewCount && (
                <p className="text-sm text-deep-400 dark:text-surface-600 mt-1">
                  {lawyer.reviewCount} {t.modal.reviewsTitle}
                </p>
              )}
            </div>
            
            {/* Quick Info */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 p-3 lg:p-4 rounded-xl bg-white dark:bg-deep-900 border border-surface-100 dark:border-deep-700">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-deep-900 dark:text-surface-100">
                    {t.modal.specialties}
                  </h3>
                  <p className="text-sm text-deep-600 dark:text-surface-400">
                    {translateSpecialty(lawyer.specialty)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 lg:p-4 rounded-xl bg-white dark:bg-deep-900 border border-surface-100 dark:border-deep-700">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-deep-900 dark:text-surface-100">
                    {t.modal.experience}
                  </h3>
                  <p className="text-sm text-deep-600 dark:text-surface-400">
                    {lawyer.yearsExperience} {t.modal.years}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 lg:p-4 rounded-xl bg-white dark:bg-deep-900 border border-surface-100 dark:border-deep-700">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-surface-200 dark:bg-deep-700 flex items-center justify-center flex-shrink-0">
                  <Languages className="w-4 h-4 lg:w-5 lg:h-5 text-deep-500 dark:text-surface-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-deep-900 dark:text-surface-100">
                    {t.modal.languages}
                  </h3>
                  <p className="text-sm text-deep-600 dark:text-surface-400">
                    {lawyer.languages?.join(', ') || 'Non spécifié'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Contact */}
            <div className="mt-auto pt-6 border-t border-surface-200 dark:border-deep-700">
              <h3 className="font-semibold text-deep-900 dark:text-surface-100 mb-4">
                Envoyer un message
              </h3>
              <div className="space-y-3">
                <textarea 
                  className="w-full p-3 text-sm border-2 border-surface-200 dark:border-deep-700 rounded-xl bg-white dark:bg-deep-900 input-focus outline-none resize-none text-deep-800 dark:text-surface-200"
                  rows={3}
                  placeholder="Décrivez brièvement votre situation..."
                  style={{ fontSize: '16px' }}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Paperclip className="w-4 h-4 mr-1" />
                    Joindre
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: About & Booking */}
          <div className="md:col-span-3 p-6 lg:p-8 flex flex-col overflow-y-auto max-h-[90vh]">
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-deep-900 dark:text-surface-100">
                  {t.modal.about}
                </h2>
                <p className="text-sm text-deep-500 dark:text-surface-500">
                  Profil et disponibilités
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-deep-800 transition-colors"
              >
                <X className="w-6 h-6 text-deep-400" />
              </button>
            </div>
             
            {/* Profile Content */}
            {lawyer.profileConfig && lawyer.profileConfig.length > 0 ? (
              <div className="mb-8">
                <ProfileViewer 
                  blocks={lawyer.profileConfig}
                  lawyerData={{
                    coordinates: lawyer.coordinates,
                    location: lawyer.location
                  }}
                  onContactClick={() => {
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
              <p className="text-deep-600 dark:text-surface-400 leading-relaxed mb-8">
                {lawyer.bio}
              </p>
            )}
             
            {/* Booking Section */}
            <div className="flex-grow" data-booking-section>
              <h2 className="text-xl font-serif font-bold text-deep-900 dark:text-surface-100 mb-6">
                {t.modal.bookTitle}
              </h2>
              
              {/* Consultation Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-3">
                  Type de consultation
                </label>
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  {consultationTypes.map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setConsultationType(type)}
                      className={`p-3 lg:p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 lg:gap-2 transition-all duration-200 ${
                        consultationType === type 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300' 
                          : 'border-surface-200 dark:border-deep-700 hover:border-primary-300 dark:hover:border-primary-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                      <span className="font-medium text-xs lg:text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="mb-6">
                <BookingCalendar 
                  availableSlots={availableSlots}
                  onSlotSelect={setSelectedSlot} 
                />
              </div>

              {/* Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
                  Durée de la consultation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={`py-2.5 px-2 lg:px-3 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                        duration === mins
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-100 dark:bg-deep-800 text-deep-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-deep-700'
                      }`}
                    >
                      {mins < 60 ? `${mins}min` : `${mins / 60}h${mins % 60 > 0 ? mins % 60 : ''}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
                  Notes (optionnel)
                </label>
                <input 
                  type="text" 
                  placeholder={t.modal.notes}
                  className="w-full p-3 rounded-xl border-2 border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-900 text-sm input-focus outline-none text-deep-800 dark:text-surface-200"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Book Button */}
              <div className="pt-4 border-t border-surface-200 dark:border-deep-700">
                {currentUser ? (
                  <Button 
                    size="lg" 
                    variant="primary"
                    className="w-full shadow-glow" 
                    onClick={handleBooking}
                    disabled={!selectedSlot || isBooking}
                    isLoading={isBooking}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t.modal.confirm}
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="w-full"
                    onClick={handleLoginRedirect}
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {t.modal.loginToBook}
                  </Button>
                )}
                
                {selectedSlot && (
                  <p className="text-center text-sm text-primary-600 dark:text-primary-400 font-medium mt-3">
                    📅 {format(selectedSlot, "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="md:hidden flex-1 overflow-y-auto momentum-scroll">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-4 space-y-6 safe-area-bottom pb-24">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <img
                  src={lawyer.avatarUrl}
                  alt={lawyer.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-surface-100 dark:ring-deep-700"
                />
                <div>
                  <h2 className="font-serif font-bold text-lg text-deep-900 dark:text-surface-100">
                    {lawyer.name}
                  </h2>
                  <p className="text-sm text-deep-500 dark:text-surface-500">{lawyer.firmName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-primary text-xs">
                      {translateSpecialty(lawyer.specialty)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-100 dark:border-deep-700">
                  <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400 mb-2" />
                  <p className="text-xs text-deep-500 dark:text-surface-500">{t.modal.experience}</p>
                  <p className="font-semibold text-deep-900 dark:text-surface-100">{lawyer.yearsExperience} {t.modal.years}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-100 dark:border-deep-700">
                  <Languages className="w-5 h-5 text-accent-600 dark:text-accent-400 mb-2" />
                  <p className="text-xs text-deep-500 dark:text-surface-500">{t.modal.languages}</p>
                  <p className="font-semibold text-deep-900 dark:text-surface-100 text-sm">{lawyer.languages?.join(', ') || 'FR'}</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="font-semibold text-deep-900 dark:text-surface-100 mb-2">{t.modal.about}</h3>
                {lawyer.profileConfig && lawyer.profileConfig.length > 0 ? (
                  <ProfileViewer 
                    blocks={lawyer.profileConfig}
                    lawyerData={{
                      coordinates: lawyer.coordinates,
                      location: lawyer.location
                    }}
                    onContactClick={() => setActiveTab('booking')}
                    onVideoClick={() => {
                      setConsultationType('VIDEO');
                      setActiveTab('booking');
                    }}
                  />
                ) : (
                  <p className="text-sm text-deep-600 dark:text-surface-400 leading-relaxed">
                    {lawyer.bio}
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                onClick={() => setActiveTab('booking')}
              >
                Prendre rendez-vous
              </Button>
            </div>
          )}

          {/* Booking Tab */}
          {activeTab === 'booking' && (
            <div className="p-4 space-y-6 safe-area-bottom pb-24">
              {/* Consultation Type */}
              <div>
                <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-3">
                  Type de consultation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {consultationTypes.map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setConsultationType(type)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        consultationType === type 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300' 
                          : 'border-surface-200 dark:border-deep-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <BookingCalendar 
                availableSlots={availableSlots}
                onSlotSelect={setSelectedSlot} 
              />

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
                  Durée
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={`flex-shrink-0 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                        duration === mins
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-100 dark:bg-deep-800 text-deep-600 dark:text-surface-400'
                      }`}
                    >
                      {mins < 60 ? `${mins} min` : `${mins / 60}h${mins % 60 > 0 ? mins % 60 : ''}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
                  Notes (optionnel)
                </label>
                <input 
                  type="text" 
                  placeholder="Précisez votre demande..."
                  className="w-full p-3 rounded-xl border-2 border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-900 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Selected Slot Info */}
              {selectedSlot && (
                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800">
                  <p className="text-center text-sm font-medium text-primary-700 dark:text-primary-300">
                    📅 {format(selectedSlot, "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              )}

              {/* Book Button */}
              {currentUser ? (
                <Button 
                  size="lg" 
                  variant="primary"
                  className="w-full shadow-glow" 
                  onClick={handleBooking}
                  disabled={!selectedSlot || isBooking}
                  isLoading={isBooking}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {t.modal.confirm}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full"
                  onClick={handleLoginRedirect}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  {t.modal.loginToBook}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
