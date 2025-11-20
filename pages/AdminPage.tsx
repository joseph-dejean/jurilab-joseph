import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/store';
import { User, Lawyer, Appointment, UserRole } from '../types';
import { getAllUsers, getAllAppointments, deleteUserData, deleteLawyerData, deleteAppointmentData } from '../services/firebaseService'; // We will create these
import { Button } from '../components/Button';
import { Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { currentUser, lawyers } = useApp();
  const navigate = useNavigate();

  const [clients, setClients] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lawyerSearch, setLawyerSearch] = useState('');
  const [lawyerPage, setLawyerPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (currentUser?.role !== UserRole.ADMIN) {
      navigate('/');
    } else {
      const fetchData = async () => {
        setIsLoading(true);
        const allUsers = await getAllUsers();
        setClients(allUsers.filter(u => u.role === UserRole.CLIENT));
        const allAppointments = await getAllAppointments();
        setAppointments(allAppointments);
        setIsLoading(false);
      };
      fetchData();
    }
  }, [currentUser, navigate]);

  const filteredLawyers = useMemo(() => {
    return lawyers.filter(lawyer => 
      lawyer.name.toLowerCase().includes(lawyerSearch.toLowerCase())
    );
  }, [lawyers, lawyerSearch]);

  const paginatedLawyers = useMemo(() => {
    const startIndex = (lawyerPage - 1) * itemsPerPage;
    return filteredLawyers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLawyers, lawyerPage, itemsPerPage]);

  const totalLawyerPages = Math.ceil(filteredLawyers.length / itemsPerPage);

  const handleDeleteClient = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await deleteUserData(userId);
        setClients(clients.filter(c => c.id !== userId));
        alert('Client deleted successfully.');
      } catch (error) {
        console.error("Error deleting client:", error);
        alert('Failed to delete client.');
      }
    }
  };

  const handleDeleteLawyer = async (lawyerId: string) => {
    if (window.confirm('Are you sure you want to delete this lawyer? This action cannot be undone.')) {
      try {
        await deleteLawyerData(lawyerId);
        // Note: lawyers are refreshed from the global app state, so we don't need a local state update here.
        alert('Lawyer deleted successfully. The list will refresh.');
      } catch (error) {
        console.error("Error deleting lawyer:", error);
        alert('Failed to delete lawyer.');
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointmentData(appointmentId);
        setAppointments(appointments.filter(a => a.id !== appointmentId));
        alert('Appointment deleted successfully.');
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert('Failed to delete appointment.');
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading Admin Panel...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      
      {/* Clients Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Clients</h2>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {clients.map(client => (
            <div key={client.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0">
              <div>
                <p className="font-bold">{client.name}</p>
                <p className="text-sm text-slate-500">{client.email}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteClient(client.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Lawyers Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Lawyers</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name..."
              value={lawyerSearch}
              onChange={(e) => {
                setLawyerSearch(e.target.value);
                setLawyerPage(1); // Reset to first page on new search
              }}
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {paginatedLawyers.map(lawyer => (
            <div key={lawyer.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0">
              <div>
                <p className="font-bold">{lawyer.name}</p>
                <p className="text-sm text-slate-500">{lawyer.email}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteLawyer(lawyer.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          ))}
        </div>
        {totalLawyerPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button onClick={() => setLawyerPage(p => Math.max(1, p - 1))} disabled={lawyerPage === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-500">
              Page {lawyerPage} of {totalLawyerPages}
            </span>
            <Button onClick={() => setLawyerPage(p => Math.min(totalLawyerPages, p + 1))} disabled={lawyerPage === totalLawyerPages}>
              Next
            </Button>
          </div>
        )}
      </section>

      {/* Appointments Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Appointments</h2>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {appointments.map(appt => (
            <div key={appt.id} className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 last:border-b-0">
              <div>
                <p className="font-bold">Appointment on {new Date(appt.date).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500">Client ID: {appt.clientId.substring(0,8)}... | Lawyer ID: {appt.lawyerId.substring(0,8)}...</p>
              </div>
               <Button variant="destructive" size="sm" onClick={() => handleDeleteAppointment(appt.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
