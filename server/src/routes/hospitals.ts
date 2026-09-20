import { Router, Request, Response } from 'express';
import { db, Hospital } from '../services/db.js';

const router = Router();

// GET all hospitals, with optional location and search filtering
router.get('/', (req: Request, res: Response) => {
  const { location, search } = req.query;
  let list = db.hospitals;

  if (location && typeof location === 'string' && location !== 'all') {
    const loc = location.toLowerCase();
    list = list.filter(
      (h) => h.location.toLowerCase().includes(loc) || h.city.toLowerCase().includes(loc)
    );
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q)
    );
  }

  return res.json(list);
});

// GET locations
router.get('/locations', (_req: Request, res: Response) => {
  const locations = Array.from(new Set(db.hospitals.map((h) => h.city))).filter(Boolean);
  return res.json(['Salem', ...locations.filter((l) => l !== 'Salem')]);
});

// GET single hospital by ID
router.get('/:id', (req: Request, res: Response) => {
  const hospital = db.getHospitalById(req.params.id);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  return res.json(hospital);
});

// POST add a new hospital (e.g. user adds another hospital in Salem)
router.post('/', (req: Request, res: Response) => {
  const { name, location, address, phone, emergencyPhone, type, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Hospital name is required' });
  }

  const city = location?.includes('Salem') ? 'Salem' : (location || 'Salem');
  const newHospital: Hospital = {
    id: `hosp-${Date.now()}`,
    name: name.trim(),
    location: location || 'Salem, Tamil Nadu',
    city,
    address: address || `${name.trim()}, Salem, Tamil Nadu`,
    phone: phone || '+91 427 200 0000',
    emergencyPhone: emergencyPhone || '108',
    rating: 4.8,
    totalBeds: 150,
    departmentsCount: 8,
    type: type || 'Multi-Specialty Hospital',
    accreditation: 'NABH Quality Certified',
    description: description || `Reputed healthcare facility located in ${city}.`,
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
    isPopular: false
  };

  db.hospitals.push(newHospital);
  return res.status(201).json(newHospital);
});

export default router;
