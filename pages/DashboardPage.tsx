import React from 'react';
import { useApp } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, FileText, Settings, Bell } from 'lucide-react';
import { Button } from '../components/Button';

export const DashboardPage: React.FC = () => {
  const { currentUser, appointments, lawyers, logout, t } = useApp();
  const navigate = useNavigate();

  if (!currentUser) {
    // Simple redirect protection
    setTimeout(() => navigate('/login'), 0);
    return null;
  }

  // Filter appointments for this user
  const myAppointments = appointments.filter(a => a.clientId === currentUser.id);

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
            <p className="text-sm text-slate-500 capitalize">{currentUser.role.toLowerCase()}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={logout}>{t.nav.signout}</Button>
          </div>

          <nav className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <a href="#" className="flex items-center px-6 py-4 text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-700 dark:border-primary-500 font-medium">
              <Calendar className="h-5 w-5 mr-3" /> {t.dashboard.appointments}
            </a>
            <a href="#" className="flex items-center px-6 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <MessageSquare className="h-5 w-5 mr-3" /> {t.dashboard.messages}
            </a>
            <a href="#" className="flex items-center px-6 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <FileText className="h-5 w-5 mr-3" /> {t.dashboard.documents}
            </a>
             <a href="#" className="flex items-center px-6 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Settings className="h-5 w-5 mr-3" /> {t.dashboard.settings}
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-grow space-y-8">
           {/* Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-primary-800 to-primary-950 rounded-xl p-6 text-white shadow-lg">
                 <h3 className="text-lg font-medium opacity-90">{t.dashboard.upcoming}</h3>
                 <p className="text-3xl font-bold mt-2">{myAppointments.filter(a => a.status === 'CONFIRMED').length}</p>
                 <p className="text-sm opacity-75 mt-1">{t.dashboard.appointments}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-medium text-slate-500">{t.dashboard.unread}</h3>
                 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">0</p>
                 <p className="text-sm text-slate-400 mt-1">{t.dashboard.inboxClear}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-medium text-slate-500">{t.dashboard.documents}</h3>
                 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">3</p>
                 <p className="text-sm text-slate-400 mt-1">{t.dashboard.sharedFiles}</p>
              </div>
           </div>

           {/* Appointments List */}
           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-lg">{t.dashboard.myAppointments}</h3>
                 <Button variant="ghost" size="sm">{t.dashboard.viewAll}</Button>
              </div>
              
              {myAppointments.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {myAppointments.map(appt => {
                    const lawyer = lawyers.find(l => l.id === appt.lawyerId);
                    return (
                      <div key={appt.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-lg text-center min-w-[60px]">
                            <span className="block text-xs uppercase font-bold">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="block text-xl font-bold">{new Date(appt.date).getDate()}</span>
                         </div>
                         <div className="flex-grow">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100">{lawyer?.name || 'Unknown Lawyer'}</h4>
                            <p className="text-sm text-slate-500">{lawyer?.specialty} • {appt.type}</p>
                         </div>
                         <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold
                              ${appt.status === 'CONFIRMED' 
                                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' 
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
                            `}>
                              {appt.status}
                            </span>
                         </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                   <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                   <p>{t.dashboard.noAppts}</p>
                   <Button className="mt-4" onClick={() => navigate('/search')}>{t.dashboard.findLawyer}</Button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};