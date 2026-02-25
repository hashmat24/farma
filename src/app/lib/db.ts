
export type Medicine = {
  id: string;
  name: string;
  category: string;
  stock_qty: number;
  reorder_threshold: number;
  prescription_required: boolean;
  dosage: string;
  unit_price: number;
  unit: string;
};

export type Order = {
  id: string;
  patient_id: string;
  medicine_id: string;
  qty: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trace_id: string;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  member_id: string;
  history: string[];
  email: string;
};

export type RefillAlert = {
  patient_id: string;
  patient_name: string;
  medicine_name: string;
  days_left: number;
  exhaustion_date: string;
  alert: boolean;
};

// Global singleton to simulate an existing dataset
const globalStore = global as any;

if (!globalStore.medicines) {
  globalStore.medicines = [
    { id: 'MED001', name: 'Paracetamol', category: 'Analgesic', stock_qty: 150, reorder_threshold: 50, prescription_required: false, dosage: '500mg', unit_price: 5.50, unit: 'Tablets' },
    { id: 'MED002', name: 'Ibuprofen', category: 'NSAID', stock_qty: 15, reorder_threshold: 30, prescription_required: false, dosage: '200mg', unit_price: 8.20, unit: 'Capsules' },
    { id: 'MED003', name: 'Amoxicillin', category: 'Antibiotic', stock_qty: 45, reorder_threshold: 20, prescription_required: true, dosage: '250mg', unit_price: 15.00, unit: 'Capsules' },
    { id: 'MED004', name: 'Lisinopril', category: 'ACE Inhibitor', stock_qty: 120, reorder_threshold: 40, prescription_required: true, dosage: '10mg', unit_price: 12.00, unit: 'Tablets' },
    { id: 'MED005', name: 'Aspirin', category: 'Analgesic', stock_qty: 8, reorder_threshold: 25, prescription_required: false, dosage: '81mg', unit_price: 4.00, unit: 'Tablets' },
  ];
}

if (!globalStore.orders) {
  globalStore.orders = [
    { id: 'ORD-001', patient_id: 'patient123', medicine_id: 'MED001', qty: 30, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'delivered', trace_id: 't-1' },
    { id: 'ORD-002', patient_id: 'patient123', medicine_id: 'MED004', qty: 60, date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), status: 'delivered', trace_id: 't-2' },
    { id: 'ORD-003', patient_id: 'patient456', medicine_id: 'MED003', qty: 10, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'shipped', trace_id: 't-3' },
  ];
}

if (!globalStore.patients) {
  globalStore.patients = [
    { 
      id: 'patient123', 
      name: 'John Doe', 
      age: 45, 
      member_id: 'CC-9988-AA', 
      email: 'john.doe@example.com',
      history: ['Hypertension', 'Seasonal Allergies', 'Lower Back Pain'] 
    },
    { 
      id: 'patient456', 
      name: 'Sarah Smith', 
      age: 32, 
      member_id: 'CC-1122-BB', 
      email: 'sarah.s@example.com',
      history: ['Asthma', 'Chronic Sinusitis'] 
    }
  ];
}

export const db = {
  getMedicines: () => globalStore.medicines || [],
  getMedicine: (id: string) => (globalStore.medicines || []).find((m: any) => m.id === id),
  getOrders: () => globalStore.orders || [],
  getPatient: (id: string) => (globalStore.patients || []).find((p: any) => p.id === id),
  getPatientHistory: (patientId: string) => (globalStore.orders || []).filter((o: any) => o.patient_id === patientId),
  updateStock: (medicineId: string, qtyToReduce: number) => {
    const med = (globalStore.medicines || []).find((m: any) => m.id === medicineId);
    if (med) {
      med.stock_qty = Math.max(0, med.stock_qty - qtyToReduce);
      return med.stock_qty;
    }
    return null;
  },
  addOrder: (order: Order) => {
    globalStore.orders.push(order);
    return order;
  },
  calculateRefills: (patientId: string): RefillAlert[] => {
    const patient = db.getPatient(patientId);
    if (!patient) return [];
    const history = db.getPatientHistory(patientId);
    return history.map(order => {
      const med = db.getMedicine(order.medicine_id);
      if (!med) return null;
      
      const dosagePerDay = 1; 
      const daysCovered = order.qty / dosagePerDay;
      const purchaseDate = new Date(order.date);
      const exhaustionDate = new Date(purchaseDate.getTime() + daysCovered * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const diffTime = exhaustionDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        patient_id: patientId,
        patient_name: patient.name,
        medicine_name: med.name,
        days_left: daysLeft,
        exhaustion_date: exhaustionDate.toISOString(),
        alert: daysLeft <= 2
      };
    }).filter(Boolean) as RefillAlert[];
  }
};
