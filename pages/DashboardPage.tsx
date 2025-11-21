import { format, isFuture, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { GoogleAuthProvider, linkWithPopup } from "firebase/auth";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  Video,
  XCircle,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { auth } from "../firebaseConfig";
import { useApp } from "../store/store";
import { Appointment, UserRole } from "../types";

export const DashboardPage: React.FC = () => {
  const { currentUser, appointments, lawyers, logout, t } = useApp();
  const navigate = useNavigate();

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

  // Trier les rendez-vous (à venir en premier)
  const sortedAppointments = [...myAppointments].sort((a, b) => {
    const dateA = parseISO(a.date).getTime();
    const dateB = parseISO(b.date).getTime();
    return dateA - dateB;
  });

  // Obtenir le badge de statut
  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3" />
            Confirmé
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <AlertCircle className="w-3 h-3" />
            En attente
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <XCircle className="w-3 h-3" />
            Annulé
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <CheckCircle2 className="w-3 h-3" />
            Terminé
          </span>
        );
      default:
        return null;
    }
  };

  // Obtenir l'icône du type
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

  // Vérifier si on peut rejoindre la visio
  const canJoinVideo = (appointment: Appointment) => {
    if (appointment.type !== "VIDEO") return false;
    if (appointment.status === "CANCELLED") return false;
    const aptDate = parseISO(appointment.date);
    const now = new Date();
    // Peut rejoindre 5 minutes avant et jusqu'à 1h après
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

  // Check if user is a lawyer
  const isLawyer =
    currentUser.role === UserRole.LAWYER || currentUser.role === "LAWYER";

  const connectGoogleCalendar = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/calendar");
    try {
      if (auth.currentUser) {
        await linkWithPopup(auth.currentUser, provider);
        alert("Compte Google Calendar connecté avec succès !");
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/credential-already-in-use") {
        alert("Ce compte Google est déjà lié à un autre utilisateur.");
      } else {
        alert(
          "Erreur lors de la connexion à Google Calendar : " + error.message
        );
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <img
              src={currentUser.avatarUrl}
              alt="Profile"
              className="w-20 h-20 mx-auto rounded-full mb-4 border-2 border-primary-500"
            />
            <h2 className="font-bold text-lg">{currentUser.name}</h2>
            <p className="text-sm text-slate-500 capitalize">
              {currentUser.role.toLowerCase()}
            </p>
            {isLawyer && (
              <button
                className="mt-4 w-full px-4 py-2 bg-navy dark:bg-brand-DEFAULT hover:bg-navy-light dark:hover:bg-brand-dark text-white rounded-lg font-semibold text-sm flex items-center justify-center transition-all shadow-lg hover:shadow-xl border-2 border-navy-dark dark:border-brand-dark active:scale-95"
                onClick={() => {
                  console.log("🖱️ Bouton Éditer mon profil cliqué");
                  navigate("/lawyer/profile-editor");
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Éditer mon profil
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={`mt-${
                currentUser.role === UserRole.LAWYER ||
                currentUser.role === "LAWYER"
                  ? "3"
                  : "4"
              } w-full`}
              onClick={logout}
            >
              {t.nav.signout}
            </Button>
          </div>

          <nav className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => navigate("/my-appointments")}
              className="w-full flex items-center px-6 py-4 text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-700 dark:border-primary-500 font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-3" /> {t.dashboard.appointments}
            </button>
            <a
              href="#"
              className="flex items-center px-6 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="h-5 w-5 mr-3" /> {t.dashboard.messages}
            </a>
            <a
              href="#"
              className="flex items-center px-6 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="h-5 w-5 mr-3" /> {t.dashboard.documents}
            </a>
            <a
              href="#"
              className="flex items-center px-6 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="h-5 w-5 mr-3" /> {t.dashboard.settings}
            </a>
          </nav>

          {currentUser.role === UserRole.LAWYER && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand" /> Google Calendar
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Synchronisez vos rendez-vous automatiquement.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={connectGoogleCalendar}
              >
                <ExternalLink className="h-3 w-3 mr-2" /> Connecter
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-grow space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-primary-800 to-primary-950 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-medium opacity-90">
                {t.dashboard.upcoming}
              </h3>
              <p className="text-3xl font-bold mt-2">
                {myAppointments.filter((a) => a.status === "CONFIRMED").length}
              </p>
              <p className="text-sm opacity-75 mt-1">
                {t.dashboard.appointments}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-medium text-slate-500">
                {t.dashboard.unread}
              </h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                0
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {t.dashboard.inboxClear}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-medium text-slate-500">
                {t.dashboard.documents}
              </h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                3
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {t.dashboard.sharedFiles}
              </p>
            </div>
          </div>

          {/* Appointments List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {t.dashboard.myAppointments}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/my-appointments")}
              >
                {t.dashboard.viewAll}
              </Button>
            </div>

            {sortedAppointments.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {sortedAppointments.map((appt) => {
                  const otherPartyId =
                    currentUser.role === UserRole.LAWYER
                      ? appt.clientId
                      : appt.lawyerId;
                  // In a real app we would fetch the other party's details.
                  // For now, if we are lawyer, we don't have client list loaded.
                  // If we are client, we have lawyer list loaded.

                  let otherPartyName = "Unknown";
                  let subtitle = appt.type;

                  if (currentUser.role === UserRole.CLIENT) {
                    const lawyer = lawyers.find((l) => l.id === appt.lawyerId);
                    otherPartyName = lawyer?.name || "Avocat";
                    subtitle = `${lawyer?.specialty} • ${appt.type}`;
                  } else {
                    otherPartyName =
                      "Client (ID: " + appt.clientId.substring(0, 5) + "...)";
                  }

                  const aptDate = parseISO(appt.date);
                  const isUpcoming = isFuture(aptDate) || isToday(aptDate);

                  return (
                    <div
                      key={appt.id}
                      className="p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-lg text-center min-w-[60px]">
                        <span className="block text-xs uppercase font-bold">
                          {format(aptDate, "MMM", { locale: fr })}
                        </span>
                        <span className="block text-xl font-bold">
                          {format(aptDate, "d")}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100">
                            {otherPartyName}
                          </h4>
                          {getStatusBadge(appt.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(aptDate, "HH:mm", { locale: fr })}
                          </span>
                          {appt.duration && (
                            <span className="flex items-center gap-1">
                              • {appt.duration} min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            {getTypeIcon(appt.type)}
                            {appt.type === "VIDEO"
                              ? "Visio"
                              : appt.type === "PHONE"
                              ? "Téléphone"
                              : "Présentiel"}
                          </span>
                        </div>
                        {subtitle && (
                          <p className="text-xs text-slate-400 mt-1">
                            {subtitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {canJoinVideo(appt) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoinVideo(appt)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Rejoindre la visio
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/my-appointments")}
                        >
                          Voir détails
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{t.dashboard.noAppts}</p>
                {currentUser.role === UserRole.CLIENT && (
                  <Button className="mt-4" onClick={() => navigate("/search")}>
                    {t.dashboard.findLawyer}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
