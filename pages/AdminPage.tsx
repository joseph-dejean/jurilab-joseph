import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/store';
import { Appointment, User, UserRole, Lawyer } from '../types';
import { 
  getAllUsers, 
  getAllAppointments, 
  deleteAppointmentData, 
  deleteUserAccountCascade, 
  setUserDisabled,
  updateUserProfile,
  setUserRole,
  disconnectGoogleCalendar
} from '../services/firebaseService';
import { Button } from '../components/Button';
import { 
  Trash2, 
  Search, 
  ShieldOff, 
  ShieldCheck, 
  Edit2, 
  X, 
  Check, 
  RefreshCw,
  Eye,
  EyeOff,
  UserCog,
  Calendar,
  FolderOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EditingUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const AdminPage: React.FC = () => {
  const { currentUser, isAuthLoading } = useApp();
  const navigate = useNavigate();

  const [clients, setClients] = useState<User[]>([]);
  const [lawyerAccounts, setLawyerAccounts] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [lawyerSearch, setLawyerSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  
  // Edition state
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) return;

    fetchData();
  }, [currentUser, isAuthLoading]);

  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const allUsers = await getAllUsers();
      setClients(allUsers.filter(u => u.role === UserRole.CLIENT));
      setLawyerAccounts(allUsers.filter(u => u.role === UserRole.LAWYER));
      const allAppointments = await getAllAppointments();
      setAppointments(allAppointments);
      
      if (showRefreshIndicator) {
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.textContent = '✅ Données actualisées avec succès';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.remove();
        }, 3000);
      }
    } catch (e: any) {
      console.error('Admin fetch error:', e);
      setError(e?.message || 'Erreur de chargement (permissions Firebase ?)');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const filteredLawyers = useMemo(() => {
    const q = lawyerSearch.trim().toLowerCase();
    if (!q) return lawyerAccounts;
    return lawyerAccounts.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }, [lawyerAccounts, lawyerSearch]);

  const filteredAppointments = useMemo(() => {
    const q = appointmentSearch.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.clientId.toLowerCase().includes(q) ||
      a.lawyerId.toLowerCase().includes(q) ||
      (a.clientName || '').toLowerCase().includes(q) ||
      (a.lawyerName || '').toLowerCase().includes(q)
    );
  }, [appointments, appointmentSearch]);

  const handleToggleDisabled = async (userId: string, disabled: boolean) => {
    try {
      await setUserDisabled(userId, disabled);
      setClients(prev => prev.map(u => (u.id === userId ? { ...u, disabled } : u)));
      setLawyerAccounts(prev => prev.map(u => (u.id === userId ? { ...u, disabled } : u)));
      alert(disabled ? '✅ Compte désactivé' : '✅ Compte réactivé');
    } catch (error) {
      console.error('Error updating disabled flag:', error);
      alert("❌ Impossible de mettre à jour le statut du compte.");
    }
  };

  const handleDeleteUser = async (userId: string, label: string) => {
    if (window.confirm(`⚠️ Supprimer ${label} ?\n\nCette action est IRRÉVERSIBLE et supprimera:\n- Le compte utilisateur\n- Tous ses rendez-vous\n- Toutes ses données\n\nContinuer ?`)) {
      try {
        await deleteUserAccountCascade(userId);
        setClients(prev => prev.filter(u => u.id !== userId));
        setLawyerAccounts(prev => prev.filter(u => u.id !== userId));
        setAppointments(prev => prev.filter(a => a.clientId !== userId && a.lawyerId !== userId));
        alert('✅ Compte supprimé avec succès');
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('❌ Échec de la suppression: ' + (error as Error).message);
      }
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      await updateUserProfile(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email
      });
      
      // Update role separately if changed
      const originalUser = [...clients, ...lawyerAccounts].find(u => u.id === editingUser.id);
      if (originalUser && originalUser.role !== editingUser.role) {
        await setUserRole(editingUser.id, editingUser.role);
      }
      
      // Update local state
      const updateUser = (u: User) => u.id === editingUser.id ? { ...u, ...editingUser } : u;
      setClients(prev => prev.map(updateUser).filter(u => u.role === UserRole.CLIENT));
      setLawyerAccounts(prev => prev.map(updateUser).filter(u => u.role === UserRole.LAWYER));
      
      setEditingUser(null);
      alert('✅ Utilisateur modifié avec succès');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('❌ Erreur lors de la modification');
    }
  };

  const handleCleanGoogleConnection = async (userId: string, userName: string) => {
    if (window.confirm(`Nettoyer les connexions Google Drive/Calendar pour ${userName} ?`)) {
      try {
        await disconnectGoogleCalendar(userId);
        alert('✅ Connexions Google nettoyées. L\'utilisateur devra se reconnecter.');
        await fetchData(); // Refresh data
      } catch (error) {
        console.error('Error cleaning Google connection:', error);
        alert('❌ Erreur lors du nettoyage');
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (window.confirm('⚠️ Supprimer ce rendez-vous ?')) {
      try {
        await deleteAppointmentData(appointmentId);
        setAppointments(appointments.filter(a => a.id !== appointmentId));
        alert('✅ Rendez-vous supprimé');
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert('❌ Échec de la suppression du rendez-vous');
      }
    }
  };

  const UserDetailsModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
    const lawyer = user.role === UserRole.LAWYER ? user as Lawyer : null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold">{user.name}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Informations générales</h4>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="font-medium">ID:</span> {user.id}</p>
                <p><span className="font-medium">Rôle:</span> <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">{user.role}</span></p>
                <p><span className="font-medium">Status:</span> <span className={user.disabled ? 'text-red-600' : 'text-green-600'}>{user.disabled ? 'Désactivé' : 'Actif'}</span></p>
              </div>
            </div>
            
            {lawyer && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Profil Avocat</h4>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="font-medium">Spécialité:</span> {lawyer.specialty}</p>
                    <p><span className="font-medium">Localisation:</span> {lawyer.location}</p>
                    <p><span className="font-medium">Tarif horaire:</span> {lawyer.hourlyRate}€</p>
                    <p><span className="font-medium">Années d'expérience:</span> {lawyer.yearsExperience}</p>
                    <p><span className="font-medium">Langues:</span> {lawyer.languages?.join(', ') || 'N/A'}</p>
                    {lawyer.firmName && <p><span className="font-medium">Cabinet:</span> {lawyer.firmName}</p>}
                    {lawyer.phone && <p><span className="font-medium">Téléphone:</span> {lawyer.phone}</p>}
                    {lawyer.barNumber && <p><span className="font-medium">Numéro barreau:</span> {lawyer.barNumber}</p>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Connexions Google</h4>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="font-medium">Google Calendar:</span> <span className={lawyer.googleCalendarConnected ? 'text-green-600' : 'text-slate-400'}>{lawyer.googleCalendarConnected ? '✅ Connecté' : '❌ Non connecté'}</span></p>
                    {lawyer.googleCalendarLastSyncAt && (
                      <p><span className="font-medium">Dernière synchro:</span> {new Date(lawyer.googleCalendarLastSyncAt).toLocaleString('fr-FR')}</p>
                    )}
                    {lawyer.googleCalendarConnected && (
                      <button
                        onClick={() => {
                          handleCleanGoogleConnection(user.id, user.name);
                          onClose();
                        }}
                        className="mt-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Nettoyer connexions Google
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <div>
              <h4 className="font-semibold mb-2">Rendez-vous</h4>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 text-sm">
                <p>Total: {appointments.filter(a => a.clientId === user.id || a.lawyerId === user.id).length}</p>
                <p>Confirmés: {appointments.filter(a => (a.clientId === user.id || a.lawyerId === user.id) && a.status === 'CONFIRMED').length}</p>
                <p>En attente: {appointments.filter(a => (a.clientId === user.id || a.lawyerId === user.id) && a.status === 'PENDING').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isAuthLoading) {
    return <div className="p-8 text-center">Chargement de la session…</div>;
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-slate-500 mt-2">Vous devez être connecté pour accéder à cette page.</p>
          <div className="mt-4">
            <Button onClick={() => navigate('/login')}>Se connecter</Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h1 className="text-2xl font-bold">Accès refusé</h1>
          <p className="text-sm text-slate-500 mt-2">Votre compte n'est pas admin.</p>
          <div className="mt-4 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <p><span className="font-semibold">UID</span>: {currentUser.id}</p>
            <p><span className="font-semibold">Email</span>: {currentUser.email}</p>
            <p><span className="font-semibold">Role</span>: {currentUser.role}</p>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Pour activer l'admin, mettez <span className="font-semibold">`users/{currentUser.id}/role`</span> à <span className="font-semibold">`ADMIN`</span> dans la Realtime Database (console Firebase), puis rechargez.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/')}>Retour</Button>
            <Button onClick={() => window.location.reload()}>Recharger</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4">Chargement du panneau Admin…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">🛡️ Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion complète des utilisateurs et rendez-vous
          </p>
          <p className="text-xs text-slate-400 mt-1">Connecté en tant que: {currentUser.email}</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser Tout'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Clients</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{clients.length}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl p-6">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Avocats</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{lawyerAccounts.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-6">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Rendez-vous</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{appointments.length}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 rounded-xl p-4">
          <p className="font-semibold">❌ Erreur de chargement Admin</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      {/* Clients Section */}
      <section>
        <div className="flex justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-semibold">👥 Clients ({filteredClients.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {filteredClients.map(client => (
            <div key={client.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {editingUser?.id === client.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="px-3 py-2 border rounded-lg flex-1"
                    placeholder="Nom"
                  />
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="px-3 py-2 border rounded-lg flex-1"
                    placeholder="Email"
                  />
                  <button onClick={handleSaveEdit} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingUser(null)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-bold">{client.name}</p>
                    <p className="text-sm text-slate-500">{client.email}</p>
                    <p className="text-xs text-slate-400 mt-1">ID: {client.id.substring(0, 20)}...</p>
                    {client.disabled && (
                      <span className="inline-block text-xs mt-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDetails(showDetails === client.id ? null : client.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      title="Voir détails"
                    >
                      {showDetails === client.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleStartEdit(client)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCleanGoogleConnection(client.id, client.name)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      title="Nettoyer Google (tokens, connexions)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <Button
                      variant={client.disabled ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleToggleDisabled(client.id, !client.disabled)}
                    >
                      {client.disabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteUser(client.id, "ce client")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">Aucun client trouvé.</div>
          )}
        </div>
      </section>

      {/* Lawyers Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">⚖️ Avocats ({filteredLawyers.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={lawyerSearch}
              onChange={(e) => setLawyerSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {filteredLawyers.map(lawyer => (
            <div key={lawyer.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {editingUser?.id === lawyer.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="px-3 py-2 border rounded-lg flex-1"
                    placeholder="Nom"
                  />
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="px-3 py-2 border rounded-lg flex-1"
                    placeholder="Email"
                  />
                  <button onClick={handleSaveEdit} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingUser(null)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-bold">{lawyer.name}</p>
                    <p className="text-sm text-slate-500">{lawyer.email}</p>
                    <p className="text-xs text-slate-400 mt-1">ID: {lawyer.id.substring(0, 20)}...</p>
                    <div className="flex items-center gap-2 mt-1">
                      {lawyer.disabled && (
                        <span className="inline-block text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                          Désactivé
                        </span>
                      )}
                      {(lawyer as Lawyer).googleCalendarConnected && (
                        <span className="inline-block text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Google Calendar
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDetails(showDetails === lawyer.id ? null : lawyer.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      title="Voir détails"
                    >
                      {showDetails === lawyer.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleStartEdit(lawyer)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCleanGoogleConnection(lawyer.id, lawyer.name)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      title="Nettoyer Google (tokens, connexions)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <Button
                      variant={lawyer.disabled ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleToggleDisabled(lawyer.id, !lawyer.disabled)}
                    >
                      {lawyer.disabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteUser(lawyer.id, "cet avocat")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredLawyers.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">Aucun avocat trouvé.</div>
          )}
        </div>
      </section>

      {/* Appointments Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">📅 Rendez-vous ({filteredAppointments.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={appointmentSearch}
              onChange={(e) => setAppointmentSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {filteredAppointments.map(appt => (
            <div key={appt.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex-1">
                <p className="font-bold">{new Date(appt.date).toLocaleString('fr-FR')}</p>
                <p className="text-sm text-slate-500">
                  Client: {appt.clientName || appt.clientId.substring(0,12)}... | 
                  Avocat: {appt.lawyerName || appt.lawyerId.substring(0,12)}...
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    appt.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    appt.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                    appt.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {appt.status}
                  </span>
                  <span className="text-xs text-slate-400">{appt.type}</span>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDeleteAppointment(appt.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          ))}
          {filteredAppointments.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">Aucun rendez-vous trouvé.</div>
          )}
        </div>
      </section>

      {/* Details Modal */}
      {showDetails && (
        <UserDetailsModal 
          user={[...clients, ...lawyerAccounts].find(u => u.id === showDetails)!}
          onClose={() => setShowDetails(null)}
        />
      )}
    </div>
  );
};
