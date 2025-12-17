import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/store';
import { Appointment, User, UserRole } from '../types';
import { getAllUsers, getAllAppointments, deleteAppointmentData, deleteUserAccountCascade, setUserDisabled } from '../services/firebaseService';
import { Button } from '../components/Button';
import { Trash2, Search, ShieldOff, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allUsers = await getAllUsers();
        setClients(allUsers.filter(u => u.role === UserRole.CLIENT));
        setLawyerAccounts(allUsers.filter(u => u.role === UserRole.LAWYER));
        const allAppointments = await getAllAppointments();
        setAppointments(allAppointments);
      } catch (e: any) {
        console.error('Admin fetch error:', e);
        setError(e?.message || 'Erreur de chargement (permissions Firebase ?)');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, isAuthLoading, navigate]);

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

  const handleToggleDisabled = async (userId: string, disabled: boolean) => {
    try {
      await setUserDisabled(userId, disabled);
      setClients(prev => prev.map(u => (u.id === userId ? { ...u, disabled } : u)));
      setLawyerAccounts(prev => prev.map(u => (u.id === userId ? { ...u, disabled } : u)));
    } catch (error) {
      console.error('Error updating disabled flag:', error);
      alert("Impossible de mettre à jour le statut du compte.");
    }
  };

  const handleDeleteUser = async (userId: string, label: string) => {
    if (window.confirm(`Supprimer ${label} ? Cette action est irréversible (données applicatives).`)) {
      try {
        await deleteUserAccountCascade(userId);
        setClients(prev => prev.filter(u => u.id !== userId));
        setLawyerAccounts(prev => prev.filter(u => u.id !== userId));
        setAppointments(prev => prev.filter(a => a.clientId !== userId && a.lawyerId !== userId));
        alert('Compte supprimé.');
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('Échec de la suppression.');
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Supprimer ce rendez-vous ?')) {
      try {
        await deleteAppointmentData(appointmentId);
        setAppointments(appointments.filter(a => a.id !== appointmentId));
        alert('Rendez-vous supprimé.');
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert('Échec de la suppression du rendez-vous.');
      }
    }
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
          <p className="text-sm text-slate-500 mt-2">
            Votre compte n’est pas admin.
          </p>
          <div className="mt-4 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <p><span className="font-semibold">UID</span>: {currentUser.id}</p>
            <p><span className="font-semibold">Email</span>: {currentUser.email}</p>
            <p><span className="font-semibold">Role</span>: {currentUser.role}</p>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Pour activer l’admin, mettez <span className="font-semibold">`users/{currentUser.id}/role`</span> à <span className="font-semibold">`ADMIN`</span> dans la Realtime Database (console Firebase), puis rechargez.
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
    return <div className="p-8 text-center">Chargement du panneau Admin…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des comptes (clients / avocats) et des rendez-vous.
          </p>
          <p className="text-xs text-slate-400 mt-1">UID: {currentUser.id}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 rounded-xl p-4">
          <p className="font-semibold">Erreur de chargement Admin</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-2 opacity-80">
            Vérifiez que vos règles Firebase sont déployées et que votre user a bien `role: "ADMIN"` dans `users/{currentUser.id}`.
          </p>
        </div>
      )}
      
      {/* Clients Section */}
      <section>
        <div className="flex justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-semibold">Clients ({clients.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher (nom, email, id)…"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {filteredClients.map(client => (
            <div key={client.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0">
              <div>
                <p className="font-bold">{client.name}</p>
                <p className="text-sm text-slate-500">{client.email}</p>
                <p className="text-xs text-slate-400 mt-1">id: {client.id}</p>
                {client.disabled && (
                  <p className="text-xs mt-1 text-red-600 dark:text-red-400 font-medium">Compte désactivé</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={client.disabled ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleToggleDisabled(client.id, !client.disabled)}
                >
                  {client.disabled ? <ShieldCheck className="h-4 w-4 mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
                  {client.disabled ? "Réactiver" : "Désactiver"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(client.id, "ce client")}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="p-6 text-sm text-slate-500">Aucun client trouvé.</div>
          )}
        </div>
      </section>

      {/* Lawyer Accounts Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Avocats ({lawyerAccounts.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher (nom, email, id)…"
              value={lawyerSearch}
              onChange={(e) => {
                setLawyerSearch(e.target.value);
              }}
              className="pl-10 pr-4 py-2 w-72 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {filteredLawyers.map(lawyer => (
            <div key={lawyer.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0">
              <div>
                <p className="font-bold">{lawyer.name}</p>
                <p className="text-sm text-slate-500">{lawyer.email}</p>
                <p className="text-xs text-slate-400 mt-1">id: {lawyer.id}</p>
                {lawyer.disabled && (
                  <p className="text-xs mt-1 text-red-600 dark:text-red-400 font-medium">Compte désactivé</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={lawyer.disabled ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleToggleDisabled(lawyer.id, !lawyer.disabled)}
                >
                  {lawyer.disabled ? <ShieldCheck className="h-4 w-4 mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
                  {lawyer.disabled ? "Réactiver" : "Désactiver"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(lawyer.id, "cet avocat")}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
          {filteredLawyers.length === 0 && (
            <div className="p-6 text-sm text-slate-500">Aucun avocat trouvé.</div>
          )}
        </div>
      </section>

      {/* Appointments Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Rendez-vous ({appointments.length})</h2>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {appointments.map(appt => (
            <div key={appt.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0">
              <div>
                <p className="font-bold">RDV le {new Date(appt.date).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500">
                  Client: {appt.clientId.substring(0,8)}… | Avocat: {appt.lawyerId.substring(0,8)}… | Statut: {appt.status}
                </p>
              </div>
               <Button variant="destructive" size="sm" onClick={() => handleDeleteAppointment(appt.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="p-6 text-sm text-slate-500">Aucun rendez-vous.</div>
          )}
        </div>
      </section>
    </div>
  );
};

