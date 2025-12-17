import { format, isFuture, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  Video,
  XCircle,
  User,
  ArrowRight,
  Bell,
  Briefcase,
} from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { GoogleCalendarConnection } from "../components/GoogleCalendarConnection";
import { AvailabilitySettings } from "../components/AvailabilitySettings";
import { LawyerWorkstation } from "../components/LawyerWorkstation";
import { SettingsModal } from "../components/SettingsModal";
import { useApp } from "../store/store";
import { Appointment, UserRole } from "../types";

export const DashboardPage: React.FC = () => {
  const { currentUser, appointments, lawyers, logout, t, unreadMessagesCount } =
    useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  // Filter appointments for this user
  const myAppointments = appointments.filter((a) =>
    currentUser.role === UserRole.LAWYER
      ? a.lawyerId === currentUser.id
      : a.clientId === currentUser.id
  );

  // Sort appointments
  const sortedAppointments = [...myAppointments].sort((a, b) => {
    const dateA = parseISO(a.date).getTime();
    const dateB = parseISO(b.date).getTime();
    return dateA - dateB;
  });

  // Get status badge
  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmé
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
            <AlertCircle className="w-3.5 h-3.5" />
            En attente
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5" />
            Annulé
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-200 dark:bg-deep-800 text-deep-600 dark:text-surface-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
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
    const aptDate = parseISO(appointment.date);
    const now = new Date();
    const canJoinBefore = new Date(aptDate.getTime() - 5 * 60 * 1000);
    const canJoinAfter = new Date(aptDate.getTime() + 60 * 60 * 1000);
    return now >= canJoinBefore && now <= canJoinAfter;
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

  const isLawyer = currentUser.role === UserRole.LAWYER;

  const menuItems = [
    { path: "/my-appointments", icon: Calendar, label: t.dashboard.appointments },
    { path: "/messages", icon: MessageSquare, label: t.dashboard.messages, badge: unreadMessagesCount },
    { path: "/documents", icon: FileText, label: t.dashboard.documents },
    { path: "#settings", icon: Settings, label: t.dashboard.settings },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-50 dark:bg-deep-950">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-display-sm font-serif text-deep-900 dark:text-surface-100 mb-2">
            Bonjour, {currentUser.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-deep-600 dark:text-surface-400">
            {isLawyer ? "Gérez vos rendez-vous et votre activité" : "Suivez vos consultations et communiquez avec vos avocats"}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <div className="glass rounded-2xl p-6 text-center">
              <div className="relative inline-block">
                <img
                  src={currentUser.avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-deep-800 shadow-card mx-auto"
                />
                <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-glow">
                  <User className="w-4 h-4 text-white" />
                </span>
              </div>
              <h2 className="font-semibold text-lg text-deep-900 dark:text-surface-100 mt-4">
                {currentUser.name}
              </h2>
              <p className="text-sm text-deep-500 dark:text-surface-500 capitalize mb-4">
                {currentUser.role === UserRole.LAWYER ? "Avocat" : "Client"}
              </p>
              
              {isLawyer && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mb-3"
                  onClick={() => navigate("/lawyer/profile-editor")}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Éditer mon profil
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={logout}
              >
                {t.nav.signout}
              </Button>
            </div>

            {/* Navigation */}
            <nav className="glass rounded-2xl overflow-hidden">
              {menuItems.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => {
                    if (item.path === '#settings') {
                      setIsSettingsOpen(true);
                    } else if (!item.path.startsWith('#')) {
                      navigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 transition-all duration-200 ${
                    location.pathname === item.path
                      ? "bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-l-4 border-primary-500"
                      : "text-deep-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-deep-800"
                  } ${index !== menuItems.length - 1 ? "border-b border-surface-100 dark:border-deep-800" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </nav>

            {/* Lawyer-specific settings */}
            {isLawyer && (
              <div className="space-y-4">
                <AvailabilitySettings lawyerId={currentUser.id} />
                <GoogleCalendarConnection
                  lawyerId={currentUser.id}
                  onConnectionChange={(connected) => {
                    console.log("📅 Google Calendar connection changed:", connected);
                  }}
                />
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  {myAppointments.filter((a) => a.status === "CONFIRMED").length}
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

              <div className="glass rounded-2xl p-6 border-l-4 border-deep-300 dark:border-deep-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-deep-500 dark:text-surface-500 text-sm font-medium">
                    {t.dashboard.documents}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-deep-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-deep-500 dark:text-surface-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-deep-900 dark:text-surface-100">3</p>
                <p className="text-sm text-deep-500 dark:text-surface-500 mt-1">
                  {t.dashboard.sharedFiles}
                </p>
              </div>
            </div>

            {/* Lawyer Workstation */}
            {isLawyer && (
              <div className="glass rounded-2xl overflow-hidden h-[500px]">
                <LawyerWorkstation />
              </div>
            )}

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
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {sortedAppointments.length > 0 ? (
                <div className="divide-y divide-surface-100 dark:divide-deep-800">
                  {sortedAppointments.slice(0, 5).map((appt) => {
                    let otherPartyName = "Unknown";
                    let subtitle: string = appt.type;

                    if (currentUser.role === UserRole.CLIENT) {
                      const lawyer = lawyers.find((l) => l.id === appt.lawyerId);
                      otherPartyName = lawyer?.name || "Avocat";
                      subtitle = `${lawyer?.specialty} • ${appt.type}`;
                    } else {
                      otherPartyName = appt.clientName || "Client";
                    }

                    const aptDate = parseISO(appt.date);

                    return (
                      <div
                        key={appt.id}
                        className="p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-surface-50 dark:hover:bg-deep-800/50 transition-colors"
                      >
                        {/* Date Badge */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/50 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">
                            {format(aptDate, "MMM", { locale: fr })}
                          </span>
                          <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                            {format(aptDate, "d")}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-deep-900 dark:text-surface-100">
                              {otherPartyName}
                            </h4>
                            {getStatusBadge(appt.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-deep-500 dark:text-surface-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(aptDate, "HH:mm", { locale: fr })}
                            </span>
                            {appt.duration && (
                              <span>{appt.duration} min</span>
                            )}
                            <span className="flex items-center gap-1">
                              {getTypeIcon(appt.type)}
                              {appt.type === "VIDEO" ? "Visio" : appt.type === "PHONE" ? "Téléphone" : "Présentiel"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/my-appointments")}
                          >
                            Détails
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
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
                  {currentUser.role === UserRole.CLIENT && (
                    <Button variant="primary" onClick={() => navigate("/search")}>
                      {t.dashboard.findLawyer}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};
