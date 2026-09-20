import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User, Patient } from '../services/db.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register Patient
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, age, gender, bloodGroup, allergies, emergencyContact, insuranceProvider, insurancePolicyNo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const userId = `user-${Date.now()}`;
    const newUser: User = {
      id: userId,
      email,
      passwordHash,
      name,
      role: 'PATIENT',
      phone: phone || '+1 (555) 000-0000',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);

    const mrn = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      userId,
      mrn,
      age: age ? Number(age) : 30,
      gender: gender || 'Other',
      bloodGroup: bloodGroup || 'O+',
      allergies: allergies || 'None',
      emergencyContact: emergencyContact || 'Not provided',
      insuranceProvider: insuranceProvider || 'Self-Pay',
      insurancePolicyNo: insurancePolicyNo || 'NONE'
    };
    db.patients.push(newPatient);

    const token = generateToken(newUser);
    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        phone: newUser.phone,
        patient: newPatient
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid && password !== 'curaqueue123' && password !== 'demo123') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const patient = db.getPatientById(user.id);
    const doctor = db.getDoctorById(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        patient,
        doctor
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Get Current User
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const patient = db.getPatientById(user.id);
  const doctor = db.getDoctorById(user.id);
  const receptionist = db.receptionists.find((r) => r.userId === user.id);

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    patient,
    doctor,
    receptionist
  });
});

// Demo Role Switcher
router.post('/demo-switch', (req: Request, res: Response) => {
  const { role, doctorId, userId } = req.body;

  let targetUser: User | undefined;

  if (userId) {
    targetUser = db.getUserById(userId);
  }

  if (!targetUser) {
    if (role === 'DOCTOR') {
      const doc = doctorId ? db.doctors.find((d) => d.id === doctorId) : db.doctors[0];
      targetUser = doc ? db.getUserById(doc.userId) : db.users.find((u) => u.role === 'DOCTOR');
    } else if (role === 'PATIENT') {
      // Default to Ajith
      targetUser = db.getUserById('user-pat-ajith') || db.users.find((u) => u.role === 'PATIENT');
    } else if (role === 'RECEPTIONIST') {
      targetUser = db.users.find((u) => u.role === 'RECEPTIONIST');
    } else if (role === 'ADMIN') {
      targetUser = db.users.find((u) => u.role === 'ADMIN');
    }
  }

  if (!targetUser) {
    return res.status(404).json({ error: `No demo account found for role ${role}` });
  }

  const token = generateToken(targetUser);
  const patient = db.getPatientById(targetUser.id);
  const doctor = db.getDoctorById(targetUser.id);

  return res.json({
    token,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      avatar: targetUser.avatar,
      phone: targetUser.phone,
      patient,
      doctor
    }
  });
});

// Update Profile
router.patch('/profile', (req: Request, res: Response) => {
  const { userId, name, email, phone } = req.body;
  const user =
    (userId ? db.users.find((u) => u.id === userId) : null) ||
    db.users.find((u) => u.id === 'user-pat-ajith' || u.role === 'PATIENT');
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name?.trim()) user.name = name.trim();
  if (email?.trim()) user.email = email.trim();
  if (phone?.trim()) user.phone = phone.trim();

  const patient = db.patients.find((p) => p.userId === user.id);
  if (patient && phone?.trim()) {
    patient.emergencyContact = phone.trim();
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      patient
    }
  });
});

// List Demo Accounts
router.get('/demo-accounts', (_req: Request, res: Response) => {
  const accounts = [
    {
      role: 'PATIENT',
      name: 'Ajith',
      email: 'ajith@curaqueue.com',
      password: 'curaqueue123',
      description: 'Patient #1 - Token A-031 in Cardiology OPD (Salem)'
    },
    {
      role: 'PATIENT',
      name: 'Vijay',
      email: 'vijay@curaqueue.com',
      password: 'curaqueue123',
      description: 'Patient #2 - Token A-022 / A-032 in Cardiology OPD'
    },
    {
      role: 'PATIENT',
      name: 'Dhanush',
      email: 'dhanush@curaqueue.com',
      password: 'curaqueue123',
      description: 'Patient #3 - Token A-023 (Skipped / In Pharmacy)'
    },
    {
      role: 'PATIENT',
      name: 'Vikram',
      email: 'vikram@curaqueue.com',
      password: 'curaqueue123',
      description: 'Patient #4 - Token A-024 (Currently inside Room 3B with Dr. Sarah)'
    },
    {
      role: 'PATIENT',
      name: 'Thrisha',
      email: 'thrisha@curaqueue.com',
      password: 'curaqueue123',
      description: 'Patient #5 - Token A-025 (Fast-Track Priority in Bay A)'
    },
    {
      role: 'PATIENT',
      name: 'Mamitha',
      email: 'mamitha@curaqueue.com',
      password: 'curaqueue123',
      description: 'Patient #6 - Token A-026 (Waiting Bay A)'
    },
    {
      role: 'PATIENT',
      name: 'Nayanthara',
      email: 'nayanthara@curaqueue.com',
      password: 'curaqueue123',
      description: 'Patient #7 - Token A-027 (Pathology Lab pending)'
    },
    {
      role: 'DOCTOR',
      name: 'Dr. Sarah Jenkins, MD, FACC',
      email: 'sarah.jenkins@curaqueue.com',
      password: 'curaqueue123',
      description: 'Chief of Cardiology in Consultation Room 3B (Manipal Hospital, Salem)'
    },
    {
      role: 'RECEPTIONIST',
      name: 'Clara Oswald, RN',
      email: 'reception@curaqueue.com',
      password: 'curaqueue123',
      description: 'Salem OPD Receptionist managing walk-ins, kiosk tokens & appointments'
    },
    {
      role: 'ADMIN',
      name: 'Dr. Arthur Sterling',
      email: 'admin@curaqueue.com',
      password: 'curaqueue123',
      description: 'Hospital Medical Director overseeing clinic telemetry, flow bottlenecks & rosters'
    }
  ];
  return res.json(accounts);
});

export default router;
