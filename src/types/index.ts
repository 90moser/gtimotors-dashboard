export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'receptionist';
  avatar?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  ownerId: string;
  vin?: string;
}

export interface Appointment {
  id: string;
  vehicleId: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  clientName: string;
  amount: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  date: string;
}
