import { User, Doctor, Patient, Department, Appointment, Queue, QueueEntry, Consultation, NotificationItem, Hospital } from '../types.js';

const TOKEN_KEY = 'curaqueue_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthToken(data.token);
    return data;
  },

  async register(userData: any): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  async updateProfile(data: { userId?: string; name?: string; email?: string; phone?: string }): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async demoSwitch(role: string, doctorId?: string, userId?: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role, doctorId, userId })
    });
    setAuthToken(data.token);
    return data;
  },

  async getDemoAccounts(): Promise<any[]> {
    return request<any[]>('/api/auth/demo-accounts');
  },

  // Hospitals & Locations
  async getHospitals(location?: string, search?: string): Promise<Hospital[]> {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (search) params.append('search', search);
    return request<Hospital[]>(`/api/hospitals?${params.toString()}`);
  },

  async getHospital(id: string): Promise<Hospital> {
    return request<Hospital>(`/api/hospitals/${id}`);
  },

  async getLocations(): Promise<string[]> {
    return request<string[]>('/api/hospitals/locations');
  },

  async createHospital(data: Partial<Hospital>): Promise<Hospital> {
    return request<Hospital>('/api/hospitals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Doctors
  async getDoctors(departmentId?: string, search?: string, hospitalId?: string, location?: string): Promise<Doctor[]> {
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId);
    if (search) params.append('search', search);
    if (hospitalId) params.append('hospitalId', hospitalId);
    if (location) params.append('location', location);
    return request<Doctor[]>(`/api/doctors?${params.toString()}`);
  },

  async getDoctor(id: string): Promise<Doctor> {
    return request<Doctor>(`/api/doctors/${id}`);
  },

  async getDoctorAvailability(id: string, date?: string): Promise<any> {
    const q = date ? `?date=${date}` : '';
    return request<any>(`/api/doctors/${id}/availability${q}`);
  },

  async updateDoctorStatus(id: string, status: string): Promise<Doctor> {
    return request<Doctor>(`/api/doctors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Appointments
  async getAppointments(filters: { doctorId?: string; patientId?: string; date?: string; status?: string } = {}): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters.doctorId) params.append('doctorId', filters.doctorId);
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);
    return request<Appointment[]>(`/api/appointments?${params.toString()}`);
  },

  async bookAppointment(data: {
    patientId?: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    userId?: string;
    doctorId: string;
    departmentId?: string;
    hospitalId?: string;
    hospitalName?: string;
    hospitalAddress?: string;
    location?: string;
    date: string;
    startTime: string;
    reason: string;
    mode?: string;
  }): Promise<{ appointment: Appointment; tokenNumber: string; message: string; notification?: any }> {
    return request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async cancelAppointment(id: string): Promise<any> {
    return request(`/api/appointments/${id}`, { method: 'DELETE' });
  },

  // Queues
  async getQueue(doctorId: string, date?: string): Promise<Queue> {
    const q = date ? `?date=${date}` : '';
    return request<Queue>(`/api/queues/${doctorId}${q}`);
  },

  async getWaitEstimate(doctorId: string, tokenNumber: string): Promise<{ patientsAhead: number; avgConsultationTimeMin: number; estimatedWaitMinutes: number }> {
    return request(`/api/queues/${doctorId}/estimate/${tokenNumber}`);
  },

  async callNext(doctorId: string): Promise<{
    success: boolean;
    message: string;
    queue: Queue;
    calledEntry: QueueEntry | null;
    completedEntry: QueueEntry | null;
  }> {
    return request(`/api/queues/${doctorId}/next`, { method: 'POST' });
  },

  async completeConsultation(doctorId: string, clinicalData: any): Promise<any> {
    return request(`/api/queues/${doctorId}/complete`, {
      method: 'POST',
      body: JSON.stringify(clinicalData)
    });
  },

  async skipEntry(entryId: string, graceMinutes: number = 15): Promise<any> {
    return request(`/api/queues/entry/${entryId}/skip`, {
      method: 'POST',
      body: JSON.stringify({ graceMinutes })
    });
  },

  async restoreEntry(entryId: string): Promise<any> {
    return request(`/api/queues/entry/${entryId}/restore`, { method: 'POST' });
  },

  async delayToken(doctorId: string, tokenNumber: string, slotsBack: number = 2): Promise<any> {
    return request(`/api/queues/${doctorId}/delay`, {
      method: 'POST',
      body: JSON.stringify({ tokenNumber, slotsBack })
    });
  },

  async issueWalkInToken(doctorId: string, data: {
    patientName: string;
    phone?: string;
    mrn?: string;
    triageCategory?: string;
    chiefComplaint?: string;
  }): Promise<any> {
    return request(`/api/queues/${doctorId}/walkin`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    return request<Department[]>('/api/departments');
  },

  // Patients
  async getPatients(search?: string): Promise<Patient[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Patient[]>(`/api/patients${q}`);
  },

  async getPatient(id: string): Promise<Patient & { appointments: Appointment[]; consultations: Consultation[]; activeQueueEntries: QueueEntry[] }> {
    return request(`/api/patients/${id}`);
  },

  // Consultations
  async getConsultations(filters: { doctorId?: string; patientId?: string } = {}): Promise<Consultation[]> {
    const params = new URLSearchParams();
    if (filters.doctorId) params.append('doctorId', filters.doctorId);
    if (filters.patientId) params.append('patientId', filters.patientId);
    return request<Consultation[]>(`/api/consultations?${params.toString()}`);
  },

  // Admin Dashboard
  async getAdminDashboard(): Promise<any> {
    return request<any>('/api/admin/dashboard');
  },

  // Notifications
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    const q = userId ? `?userId=${userId}` : '';
    return request<NotificationItem[]>(`/api/notifications${q}`);
  },

  async markNotificationRead(id: string): Promise<any> {
    return request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead(userId?: string): Promise<any> {
    return request('/api/notifications/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }
};
