/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { PatientQueueView } from './components/PatientQueueView.js';
import { DoctorConsoleView } from './components/DoctorConsoleView.js';
import { BookingView } from './components/BookingView.js';
import { ReceptionView } from './components/ReceptionView.js';
import { AdminAnalyticsView } from './components/AdminAnalyticsView.js';
import { WaitingRoomDisplay } from './components/WaitingRoomDisplay.js';
import { NotificationsModal } from './components/NotificationsModal.js';
import { LoginView } from './components/LoginView.js';
import { User, Role, Queue, NotificationItem } from './types.js';
import { api, getAuthToken, clearAuthToken } from './utils/api.js';
import { getSocket, joinQueueRoom, leaveQueueRoom, joinUserRoom } from './utils/socket.js';
import { playHospitalChime } from './utils/audio.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('patient-queue');
  const [queue, setQueue] = useState<Queue | null>(null);
  const [activeDoctorId, setActiveDoctorId] = useState<string>('doc-sarah');
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize user & queue
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        // Default login as Patient (Jonathan) if no token
        const token = getAuthToken();
        let user: User;
        if (token) {
          try {
            user = await api.getMe();
          } catch {
            const res = await api.demoSwitch('PATIENT');
            user = res.user;
          }
        } else {
          const res = await api.demoSwitch('PATIENT');
          user = res.user;
        }
        setCurrentUser(user);

        // Load active queue for Cardiology
        const initialQueue = await api.getQueue('doc-sarah');
        setQueue(initialQueue);

        // Load notifications
        const notifs = await api.getNotifications(user.id);
        setNotifications(notifs);
      } catch (err) {
        console.error('Initialization error', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Socket.IO Real-time Synchronization
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setSocketConnected(true);
      joinQueueRoom(activeDoctorId);
      if (currentUser?.id) {
        joinUserRoom(currentUser.id);
      }
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    const onQueueUpdated = (updatedQueue: Queue) => {
      if (updatedQueue.doctorId === activeDoctorId) {
        setQueue(updatedQueue);
      }
    };

    const onTokenCalled = (data: { tokenNumber: string; room: string; patientName: string }) => {
      playHospitalChime();
    };

    const onNotification = (notif: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      playHospitalChime();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue:updated', onQueueUpdated);
    socket.on('token:called', onTokenCalled);
    socket.on('token:chime', () => playHospitalChime());
    socket.on('notification:new', onNotification);
    socket.on('notification:broadcast', onNotification);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:updated', onQueueUpdated);
      socket.off('token:called', onTokenCalled);
      socket.off('token:chime');
      socket.off('notification:new', onNotification);
      socket.off('notification:broadcast', onNotification);
      leaveQueueRoom(activeDoctorId);
    };
  }, [activeDoctorId, currentUser?.id]);

  // Join personal notification channel whenever user changes
  useEffect(() => {
    if (currentUser?.id) {
      joinUserRoom(currentUser.id);
      api.getNotifications(currentUser.id).then(setNotifications).catch(console.error);
    }
  }, [currentUser?.id]);

  // Refresh Queue from API
  const refreshQueue = async () => {
    try {
      const q = await api.getQueue(activeDoctorId);
      setQueue(q);
    } catch (err) {
      console.error(err);
    }
  };

  // Role Switcher
  const handleSwitchRole = async (role: Role, doctorId?: string) => {
    try {
      const res = await api.demoSwitch(role, doctorId);
      setCurrentUser(res.user);

      if (doctorId) {
        setActiveDoctorId(doctorId);
      }

      // Refresh notifications for new profile
      const notifs = await api.getNotifications(res.user.id);
      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    }
  };

  // Queue Operations
  const handleCallNext = async () => {
    try {
      const res = await api.callNext(activeDoctorId);
      setQueue(res.queue);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteConsultation = async (clinicalData: any) => {
    try {
      const res = await api.completeConsultation(activeDoctorId, clinicalData);
      setQueue(res.queue);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkipPatient = async (entryId: string) => {
    try {
      await api.skipEntry(entryId, 15);
      await refreshQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestorePatient = async (entryId: string) => {
    try {
      await api.restoreEntry(entryId);
      await refreshQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelayToken = async (tokenNumber: string) => {
    try {
      const res = await api.delayToken(activeDoctorId, tokenNumber, 2);
      setQueue(res.queue);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoctorStatusChange = async (status: string) => {
    try {
      await api.updateDoctorStatus(activeDoctorId, status);
      await refreshQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    if (currentUser?.id) {
      await api.markAllNotificationsRead(currentUser.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    if (user.id) {
      try {
        const notifs = await api.getNotifications(user.id);
        setNotifications(notifs);
        joinUserRoom(user.id);
      } catch (err) {
        console.error('Failed to load user notifications', err);
      }
    }
    // Route appropriately based on user role
    if (user.role === 'DOCTOR') {
      setCurrentView('doctor-console');
    } else if (user.role === 'RECEPTIONIST') {
      setCurrentView('reception');
    } else if (user.role === 'ADMIN') {
      setCurrentView('analytics');
    } else {
      setCurrentView('patient-queue');
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setCurrentView('login');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg animate-pulse mb-3">
          <span className="font-extrabold text-lg">CQ</span>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Booting CuraQueue Clinical OS...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {/* Universal Navigation & Telemetry Bar */}
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onSelectView={setCurrentView}
        onSwitchRole={handleSwitchRole}
        socketConnected={socketConnected}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onProfileUpdated={(updated) => setCurrentUser(updated)}
        onLogout={handleLogout}
      />

      {/* Main Screen Views */}
      <main className="flex-1 pb-16">
        {currentView === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setCurrentView('patient-queue')}
          />
        )}

        {currentView === 'patient-queue' && (
          <PatientQueueView
            queue={queue}
            currentUser={currentUser}
            onDelayToken={handleDelayToken}
            onBookClick={() => setCurrentView('booking')}
          />
        )}

        {currentView === 'doctor-console' && (
          <DoctorConsoleView
            queue={queue}
            onCallNext={handleCallNext}
            onCompleteConsultation={handleCompleteConsultation}
            onSkipPatient={handleSkipPatient}
            onRestorePatient={handleRestorePatient}
            onStatusChange={handleDoctorStatusChange}
          />
        )}

        {currentView === 'booking' && (
          <BookingView
            currentUser={currentUser}
            onAppointmentBooked={async () => {
              refreshQueue();
              playHospitalChime();
              if (currentUser?.id) {
                try {
                  const notifs = await api.getNotifications(currentUser.id);
                  setNotifications(notifs);
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            onNavigateToQueue={() => setCurrentView('patient-queue')}
          />
        )}

        {currentView === 'reception' && (
          <ReceptionView
            queue={queue}
            onQueueUpdated={refreshQueue}
          />
        )}

        {currentView === 'analytics' && <AdminAnalyticsView />}

        {currentView === 'tv-display' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <WaitingRoomDisplay queue={queue} />
          </div>
        )}
      </main>

      {/* Live Notifications Modal */}
      <NotificationsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
      />
    </div>
  );
}

