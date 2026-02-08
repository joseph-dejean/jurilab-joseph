import { format, isFuture, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FolderOpen,
  Gavel,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { GoogleCalendarConnection } from "../components/GoogleCalendarConnection";
import { AvailabilitySettings } from "../components/AvailabilitySettings";
import { SettingsModal } from "../components/SettingsModal";
import { WorkspaceAssistantV2 } from "../components/WorkspaceAssistantV2";
import { useApp } from "../store/store";
import { Appointment, UserRole } from "../types";

// Get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 18) {
    return "Bonjour";
  }
  return "Bonsoir";
};

export const DashboardPage: React.FC = () => {
  const {
    currentUser,
    appointments,
    lawyers,
    t,
    unreadMessagesCount,
    deleteAppointment,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Welcome message state
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Show assistant panel
  const [showAssistantPanel, setShowAssistantPanel] = useState(false);

  // Check for welcome message from navigation state
  useEffect(() => {
    if (location.state?.welcomeMessage) {
      setShowWelcome(true);
      setWelcomeMessage("Bienvenue sur Jurilab ! Votre profil a été créé avec succès.");
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setShowWelcome(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Calculate if user is a lawyer (memoized to avoid recalc)
  const isLawyer = currentUser?.role === UserRole.LAWYER;

  // Filter appointments for this user - must be before early return for hooks consistency
  const myAppointments = useMemo(() => {
    if (!currentUser) return [];
    return appointments.filter((a) =>
      isLawyer ? a.lawyerId === currentUser.id : a.clientId === currentUser.id
    );
  }, [appointments, currentUser, isLawyer]);

  // Sort appointments
  const sortedAppointments = useMemo(() => {
    return [...myAppointments].sort((a, b) => {
      const dateA = parseISO(a.date).getTime();
      const dateB = parseISO(b.date).getTime();
      return dateA - dateB;
    });
  }, [myAppointments]);

  // Upcoming appointments (future + today, confirmed or pending)
  const upcomingAppointments = useMemo(() => {
    return sortedAppointments.filter((a) => {
      const aptDate = parseISO(a.date);
      return (
        (isFuture(aptDate) || isToday(aptDate)) &&
        (a.status === "CONFIRMED" || a.status === "PENDING")
      );
    });
  }, [sortedAppointments]);

  // Recent appointments (for display)
  const recentAppointments = useMemo(() => {
    return sortedAppointments
      .filter((a) => a.status !== "CANCELLED")
      .slice(0, 5);
  }, [sortedAppointments]);

  // Calculate stats
  const confirmedCount = useMemo(() => {
    return myAppointments.filter((a) => a.status === "CONFIRMED").length;
  }, [myAppointments]);

  const activeClientsCount = useMemo(() => {
    if (!isLawyer) return 0;
    const clientIds = new Set(myAppointments.map((a) => a.clientId));
    return clientIds.size;
  }, [myAppointments, isLawyer]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Early return AFTER all hooks
  if (!currentUser) {
    return null;
  }

  // Get status badge
  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
            Confirmé
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
            En attente
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
            Annulé
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Terminé
          </span>
        );
      default:
        return null;
    }
  };

  // Get type icon
  const getTypeIcon = (type: Appointment["type"]) => {
    switch (type) {
      case "VIDEO":
        return <Video className="w-4 h-4" />;
      case "PHONE":
        return <Phone className="w-4 h-4" />;
      case "IN_PERSON":
        return <MapPin className="w-4 h-4" />;
    }
  };

  // Check if can join video
  const canJoinVideo = (appointment: Appointment) => {
    if (appointment.type !== "VIDEO") return false;
    if (appointment.status === "CANCELLED") return false;
    if (appointment.status !== "CONFIRMED") return false;
    return true;
  };

  const handleJoinVideo = (appointment: Appointment) => {
    if (appointment.dailyRoomUrl) {
      navigate(
        `/video-call?roomUrl=${encodeURIComponent(
          appointment.dailyRoomUrl
        )}&appointmentId=${appointment.id}`
      );
    } else {
      alert("URL de la salle de visioconférence non disponible");
    }
  };

  const firstName = currentUser.name?.split(" ")[0] || "Maître";
  const greeting = getGreeting();

  // For client view, show a simpler dashboard
  if (!isLawyer) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-deep-950">
        <div className="container mx-auto px-4 pt-4 pb-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-display-sm font-serif text-deep-900 dark:text-surface-100 mb-2">
              {greeting}, {firstName}
            </h1>
            <p className="text-deep-600 dark:text-surface-400">
              Suivez vos consultations et communiquez avec vos avocats
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="glass rounded-2xl p-6 border-l-4 border-primary-500">
              <div className="flex items-center justify-between mb-3">
                <span className="text-deep-500 dark:text-surface-500 text-sm font-medium">
                  {t.dashboard.upcoming}
                </span>
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-deep-900 dark:text-surface-100">
                {confirmedCount}
              </p>
              <p className="text-sm text-deep-500 dark:text-surface-500 mt-1">
                {t.dashboard.appointments}
              </p>
            </div>

            <div className="glass rounded-2xl p-6 border-l-4 border-accent-500">
              <div className="flex items-center justify-between mb-3">
                <span className="text-deep-500 dark:text-surface-500 text-sm font-medium">
                  {t.dashboard.unread}
                </span>
                <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-deep-900 dark:text-surface-100">
                {unreadMessagesCount}
              </p>
              <p className="text-sm text-deep-500 dark:text-surface-500 mt-1">
                {unreadMessagesCount === 0 ? t.dashboard.inboxClear : "messages"}
              </p>
            </div>
          </div>

          {/* Appointments List */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-deep-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-deep-900 dark:text-surface-100">
                  {t.dashboard.myAppointments}
                </h3>
                <p className="text-sm text-deep-500 dark:text-surface-500">
                  Vos prochaines consultations
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-appointments")}>
                {t.dashboard.viewAll}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {recentAppointments.length > 0 ? (
              <div className="divide-y divide-surface-100 dark:divide-deep-800">
                {recentAppointments.map((appt) => {
                  const lawyer = lawyers.find((l) => l.id === appt.lawyerId);
                  const aptDate = parseISO(appt.date);

                  return (
                    <div
                      key={appt.id}
                      className="p-5 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-deep-800/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">
                          {format(aptDate, "MMM", { locale: fr })}
                        </span>
                        <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
                          {format(aptDate, "d")}
                        </span>
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-deep-900 dark:text-surface-100">
                            {lawyer?.name || appt.lawyerName || "Avocat"}
                          </h4>
                          {getStatusBadge(appt.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-deep-500 dark:text-surface-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(aptDate, "HH:mm", { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(appt.type)}
                            {appt.type === "VIDEO"
                              ? "Visio"
                              : appt.type === "PHONE"
                              ? "Téléphone"
                              : "Présentiel"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canJoinVideo(appt) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoinVideo(appt)}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Rejoindre
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 dark:bg-deep-800 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-deep-300 dark:text-deep-600" />
                </div>
                <p className="text-deep-500 dark:text-surface-500 mb-4">{t.dashboard.noAppts}</p>
                <Button variant="primary" onClick={() => navigate("/search")}>
                  {t.dashboard.findLawyer}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Lawyer Dashboard - No duplicate nav bar
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-100 dark:from-deep-950 dark:via-deep-900 dark:to-deep-950">
      {/* Ambient glow effects */}
      <div className="fixed top-[20%] right-[-10%] w-[40rem] h-[40rem] bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-slate-300/20 dark:bg-slate-700/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Voici vos priorités pour aujourd'hui
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:flex items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Search className="text-slate-400 mr-2 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-slate-100 w-40 placeholder:text-slate-400"
                placeholder="Rechercher..."
              />
            </div>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-300 transition-all shadow-sm"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* New Dossier */}
            <button
              onClick={() => navigate("/my-appointments")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl text-white font-semibold text-sm shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau Dossier</span>
            </button>
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcome && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white shadow-lg mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{welcomeMessage}</h3>
                  <p className="text-primary-100 text-sm">
                    Commencez par configurer vos disponibilités pour recevoir des rendez-vous.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Upcoming Appointments */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                RDV Confirmés
              </p>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {confirmedCount}
            </h3>
            <p className="text-slate-400 text-xs mt-1">Cette semaine</p>
          </div>

          {/* Active Clients */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Clients Actifs
              </p>
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {activeClientsCount}
            </h3>
            <p className="text-slate-400 text-xs mt-1">Dans votre portfolio</p>
          </div>

          {/* Unread Messages */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Messages
              </p>
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {unreadMessagesCount}
            </h3>
            <p className="text-slate-400 text-xs mt-1">Non lus</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-5 rounded-2xl border border-primary-200/50 dark:border-primary-800/30 shadow-sm bg-gradient-to-br from-white/80 to-primary-50/30 dark:from-slate-800/80 dark:to-primary-950/30">
            <p className="text-primary-600 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Actions Rapides
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/calendar")}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" /> Agenda
              </button>
              <button
                onClick={() => setShowAssistantPanel(true)}
                className="px-3 py-1.5 text-xs font-medium bg-primary-600 rounded-lg shadow-sm hover:shadow-md transition-all text-white flex items-center gap-1"
              >
                <Bot className="w-3.5 h-3.5" /> IA
              </button>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - AI Assistant */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Assistant Panel */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-sm h-[450px]">
              <WorkspaceAssistantV2 />
            </div>

            {/* Recent Appointments */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                <h4 className="text-slate-800 dark:text-slate-100 font-bold">Dossiers Récents</h4>
                <button
                  onClick={() => navigate("/my-appointments")}
                  className="text-primary-600 text-sm font-semibold hover:underline underline-offset-4"
                >
                  Voir tout
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAppointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Aucun dossier récent</p>
                  </div>
                ) : (
                  recentAppointments.slice(0, 4).map((appt) => (
                    <div
                      key={appt.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-white/60 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      onClick={() => navigate("/my-appointments")}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                          {appt.type === "VIDEO" ? (
                            <Video className="w-5 h-5" />
                          ) : appt.type === "PHONE" ? (
                            <Phone className="w-5 h-5" />
                          ) : (
                            <Gavel className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {appt.clientName || "Client"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {format(parseISO(appt.date), "d MMM • HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(appt.status)}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                  Prochains Rendez-vous
                </h4>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Aucun RDV à venir</p>
                  </div>
                ) : (
                  upcomingAppointments.slice(0, 3).map((appt, idx) => {
                    const aptDate = parseISO(appt.date);
                    const isFirst = idx === 0;

                    return (
                      <div
                        key={appt.id}
                        className={`relative pl-6 border-l-2 space-y-1 ${
                          isFirst
                            ? "border-primary-500"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div
                          className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${
                            isFirst
                              ? "bg-primary-500 shadow-lg shadow-primary-500/40"
                              : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {appt.clientName || "Client"}
                        </p>
                        <p className={`text-xs ${isFirst ? "text-primary-600" : "text-slate-500"}`}>
                          {format(aptDate, "d MMM • HH:mm", { locale: fr })}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              <button
                onClick={() => navigate("/calendar")}
                className="w-full mt-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                Voir le calendrier
              </button>
            </div>

            {/* Calendar Settings */}
            <div className="space-y-4">
              <AvailabilitySettings lawyerId={currentUser.id} />
              <GoogleCalendarConnection
                lawyerId={currentUser.id}
                onConnectionChange={(connected) => {
                  console.log("📅 Google Calendar connection changed:", connected);
                }}
              />
            </div>

            {/* Quick Tasks */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-600" />
                Tâches du jour
              </h4>
              <div className="space-y-2">
                {["Préparer conclusions", "Relire contrat", "Envoyer facture"].map((task, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-slate-200 text-primary-600 focus:ring-primary-200 w-4 h-4"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors">
                      {task}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Full-screen AI Assistant Panel */}
      {showAssistantPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-deep-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-600" />
                Assistant Jurilab AI
              </h3>
              <button
                onClick={() => setShowAssistantPanel(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <WorkspaceAssistantV2 />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
