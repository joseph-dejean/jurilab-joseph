import React, { useState } from "react";
import {
  Bell,
  Globe,
  Lock,
  LogOut,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  User,
  Volume2,
  X,
  Mail,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { Button } from "./Button";
import { useApp } from "../store/store";
import { UserRole } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "profile" | "notifications" | "appearance" | "privacy" | "account";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, darkMode, toggleDarkMode, language, setLanguage, logout, t } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  // Profile settings state
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || "");
  const [profileSaved, setProfileSaved] = useState(false);
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailAppointments: true,
    emailMessages: true,
    emailReminders: true,
    pushAppointments: true,
    pushMessages: false,
    soundEnabled: true,
  });
  
  // Privacy settings state
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showOnlineStatus: true,
    allowMessagesFromAll: false,
  });
  
  // Account settings state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (!isOpen) return null;

  const tabs = [
    { id: "profile" as SettingsTab, icon: User, label: "Profil" },
    { id: "notifications" as SettingsTab, icon: Bell, label: "Notifications" },
    { id: "appearance" as SettingsTab, icon: Palette, label: "Apparence" },
    { id: "privacy" as SettingsTab, icon: Shield, label: "Confidentialité" },
    { id: "account" as SettingsTab, icon: Lock, label: "Compte" },
  ];

  const handleSaveProfile = () => {
    // Here you would save to Firebase
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    // Here you would update the password in Firebase
    alert("Mot de passe mis à jour avec succès");
    setShowPasswordChange(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async () => {
    // Here you would delete the account from Firebase
    alert("Compte supprimé. Vous allez être déconnecté.");
    await logout();
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <img
            src={currentUser?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser?.name || "User")}
            alt="Avatar"
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-surface-100 dark:ring-deep-800"
          />
          <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-deep-900 dark:text-surface-100">
            {currentUser?.name}
          </h3>
          <p className="text-sm text-deep-500 dark:text-surface-500">
            {currentUser?.role === UserRole.LAWYER ? "Avocat" : "Client"}
          </p>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
            Changer la photo de profil
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
            Nom complet
          </label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-800 text-deep-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
            Adresse email
          </label>
          <input
            type="email"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-800 text-deep-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {currentUser?.role === UserRole.LAWYER && (
          <div className="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              💼 Pour modifier vos informations professionnelles (spécialités, tarifs, etc.), 
              utilisez l'éditeur de profil avocat depuis votre tableau de bord.
            </p>
          </div>
        )}
        
        <Button variant="primary" onClick={handleSaveProfile} className="w-full">
          {profileSaved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Enregistré !
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div>
        <h3 className="text-sm font-semibold text-deep-500 dark:text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Notifications par email
        </h3>
        <div className="space-y-3">
          <SettingsToggle
            label="Rendez-vous confirmés"
            description="Recevoir un email quand un rendez-vous est confirmé"
            checked={notifications.emailAppointments}
            onChange={(checked) => setNotifications({ ...notifications, emailAppointments: checked })}
          />
          <SettingsToggle
            label="Nouveaux messages"
            description="Recevoir un email pour chaque nouveau message"
            checked={notifications.emailMessages}
            onChange={(checked) => setNotifications({ ...notifications, emailMessages: checked })}
          />
          <SettingsToggle
            label="Rappels de rendez-vous"
            description="Recevoir un rappel 24h avant chaque rendez-vous"
            checked={notifications.emailReminders}
            onChange={(checked) => setNotifications({ ...notifications, emailReminders: checked })}
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="text-sm font-semibold text-deep-500 dark:text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Notifications push
        </h3>
        <div className="space-y-3">
          <SettingsToggle
            label="Rendez-vous"
            description="Notifications push pour les rendez-vous"
            checked={notifications.pushAppointments}
            onChange={(checked) => setNotifications({ ...notifications, pushAppointments: checked })}
          />
          <SettingsToggle
            label="Messages"
            description="Notifications push pour les messages"
            checked={notifications.pushMessages}
            onChange={(checked) => setNotifications({ ...notifications, pushMessages: checked })}
          />
        </div>
      </div>

      {/* Sound */}
      <div>
        <h3 className="text-sm font-semibold text-deep-500 dark:text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Sons
        </h3>
        <SettingsToggle
          label="Sons de notification"
          description="Jouer un son pour les nouvelles notifications"
          checked={notifications.soundEnabled}
          onChange={(checked) => setNotifications({ ...notifications, soundEnabled: checked })}
        />
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <h3 className="text-sm font-semibold text-deep-500 dark:text-surface-500 uppercase tracking-wider mb-4">
          Thème
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => darkMode && toggleDarkMode()}
            className={`p-4 rounded-2xl border-2 transition-all ${
              !darkMode
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                : "border-surface-200 dark:border-deep-700 hover:border-surface-300 dark:hover:border-deep-600"
            }`}
          >
            <div className="w-full h-24 rounded-xl bg-gradient-to-br from-white to-surface-100 border border-surface-200 mb-3 flex items-center justify-center">
              <Sun className="w-8 h-8 text-amber-500" />
            </div>
            <p className="font-medium text-deep-900 dark:text-surface-100">Clair</p>
          </button>
          
          <button
            onClick={() => !darkMode && toggleDarkMode()}
            className={`p-4 rounded-2xl border-2 transition-all ${
              darkMode
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                : "border-surface-200 dark:border-deep-700 hover:border-surface-300 dark:hover:border-deep-600"
            }`}
          >
            <div className="w-full h-24 rounded-xl bg-gradient-to-br from-deep-800 to-deep-950 border border-deep-700 mb-3 flex items-center justify-center">
              <Moon className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="font-medium text-deep-900 dark:text-surface-100">Sombre</p>
          </button>
        </div>
      </div>

      {/* Language */}
      <div>
        <h3 className="text-sm font-semibold text-deep-500 dark:text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Langue
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLanguage("fr")}
            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              language === "fr"
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                : "border-surface-200 dark:border-deep-700 hover:border-surface-300 dark:hover:border-deep-600"
            }`}
          >
            <span className="text-2xl">🇫🇷</span>
            <span className="font-medium text-deep-900 dark:text-surface-100">Français</span>
            {language === "fr" && <Check className="w-5 h-5 text-primary-500 ml-auto" />}
          </button>
          
          <button
            onClick={() => setLanguage("en")}
            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              language === "en"
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                : "border-surface-200 dark:border-deep-700 hover:border-surface-300 dark:hover:border-deep-600"
            }`}
          >
            <span className="text-2xl">🇬🇧</span>
            <span className="font-medium text-deep-900 dark:text-surface-100">English</span>
            {language === "en" && <Check className="w-5 h-5 text-primary-500 ml-auto" />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-deep-500 dark:text-surface-500 uppercase tracking-wider mb-4">
          Visibilité du profil
        </h3>
        <div className="space-y-3">
          <SettingsToggle
            label="Profil public"
            description={currentUser?.role === UserRole.LAWYER 
              ? "Votre profil apparaît dans les résultats de recherche"
              : "Les avocats peuvent voir votre profil"
            }
            checked={privacy.profileVisible}
            onChange={(checked) => setPrivacy({ ...privacy, profileVisible: checked })}
          />
          <SettingsToggle
            label="Afficher le statut en ligne"
            description="Les autres utilisateurs peuvent voir quand vous êtes en ligne"
            checked={privacy.showOnlineStatus}
            onChange={(checked) => setPrivacy({ ...privacy, showOnlineStatus: checked })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-deep-500 dark:text-surface-500 uppercase tracking-wider mb-4">
          Messages
        </h3>
        <SettingsToggle
          label="Recevoir des messages de tous"
          description={currentUser?.role === UserRole.LAWYER 
            ? "Permettre aux clients de vous contacter sans rendez-vous"
            : "Permettre aux avocats de vous contacter directement"
          }
          checked={privacy.allowMessagesFromAll}
          onChange={(checked) => setPrivacy({ ...privacy, allowMessagesFromAll: checked })}
        />
      </div>

      <div className="p-4 bg-surface-50 dark:bg-deep-800 rounded-xl">
        <h4 className="font-medium text-deep-900 dark:text-surface-100 mb-2">
          Données personnelles
        </h4>
        <p className="text-sm text-deep-500 dark:text-surface-500 mb-3">
          Conformément au RGPD, vous pouvez demander une copie de vos données ou leur suppression.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm">
            Exporter mes données
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="p-4 bg-surface-50 dark:bg-deep-800 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-deep-900 dark:text-surface-100">
              Modifier le mot de passe
            </h4>
            <p className="text-sm text-deep-500 dark:text-surface-500">
              Changez votre mot de passe régulièrement pour plus de sécurité
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPasswordChange(!showPasswordChange)}
          >
            {showPasswordChange ? "Annuler" : "Modifier"}
          </Button>
        </div>
        
        {showPasswordChange && (
          <div className="space-y-3 mt-4 pt-4 border-t border-surface-200 dark:border-deep-700">
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Mot de passe actuel"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-900 text-deep-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-400"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-900 text-deep-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-400"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-900 text-deep-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            
            <Button variant="primary" onClick={handlePasswordChange} className="w-full">
              Mettre à jour le mot de passe
            </Button>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="p-4 bg-surface-50 dark:bg-deep-800 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-deep-900 dark:text-surface-100">
              Sessions actives
            </h4>
            <p className="text-sm text-deep-500 dark:text-surface-500">
              Gérez les appareils connectés à votre compte
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-deep-400" />
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full p-4 bg-surface-50 dark:bg-deep-800 rounded-xl flex items-center gap-3 hover:bg-surface-100 dark:hover:bg-deep-700 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
          <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="text-left">
          <h4 className="font-medium text-deep-900 dark:text-surface-100">
            Se déconnecter
          </h4>
          <p className="text-sm text-deep-500 dark:text-surface-500">
            Déconnexion de tous les appareils
          </p>
        </div>
      </button>

      {/* Delete Account */}
      <div className="p-4 border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-700 dark:text-red-300">
              Zone de danger
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              La suppression de votre compte est irréversible. Toutes vos données seront perdues.
            </p>
            
            {!showDeleteConfirm ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer mon compte
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Êtes-vous sûr ? Cette action est irréversible.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAccount}
                  >
                    Oui, supprimer
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-deep-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-deep-900 rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-56 bg-surface-50 dark:bg-deep-950 border-r border-surface-100 dark:border-deep-800 flex flex-col">
          <div className="p-6 border-b border-surface-100 dark:border-deep-800">
            <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100">
              {t.dashboard.settings}
            </h2>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? "bg-primary-500 text-white shadow-md"
                    : "text-deep-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-deep-800"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-deep-800">
            <h3 className="text-lg font-semibold text-deep-900 dark:text-surface-100">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-deep-800 transition-colors"
            >
              <X className="w-5 h-5 text-deep-500" />
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "notifications" && renderNotificationsTab()}
            {activeTab === "appearance" && renderAppearanceTab()}
            {activeTab === "privacy" && renderPrivacyTab()}
            {activeTab === "account" && renderAccountTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Toggle Component
interface SettingsToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-deep-800 rounded-xl">
    <div className="pr-4">
      <p className="font-medium text-deep-900 dark:text-surface-100">{label}</p>
      <p className="text-sm text-deep-500 dark:text-surface-500">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked ? "bg-primary-500" : "bg-surface-300 dark:bg-deep-600"
      }`}
    >
      <span
        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  </div>
);

export default SettingsModal;

