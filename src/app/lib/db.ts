
export type Medicine = {
  id: string;
  name: string;
  stock_qty: number;
  reorder_threshold: number;
  prescription_required: boolean;
  dosage: string;
  unit_price: number;
};

export type Order = {
  id: string;
  patient_id: string;
  medicine_id: string;
  qty: number;
  date: string;
  status: string;
  trace_id: string;
};

export type RefillAlert = {
  patient_id: string;
  medicine_name: string;
  days_left: number;
  exhaustion_date: string;
  alert: boolean;
};

// Global singleton for simulation
const globalStore = global as unknown as {
  medicines: Medicine[];
  orders: Order[];
  initialized: boolean;
};

if (!globalStore.initialized) {
  globalStore.medicines = [
    { id: 'MED001', name: 'Paracetamol', stock_qty: 150, reorder_threshold: 50, prescription_required: false, dosage: '500mg', unit_price: 5.50 },
    { id: 'MED002', name: 'Ibuprofen', stock_qty: 15, reorder_threshold: 30, prescription_required: false, dosage: '200mg', unit_price: 8.20 },
    { id: 'MED003', name: 'Amoxicillin', stock_qty: 45, reorder_threshold: 20, prescription_required: true, dosage: '250mg', unit_price: 15.00 },
    { id: 'MED004', name: 'Lisinopril', stock_qty: 120, reorder_threshold: 40, prescription_required: true, dosage: '10mg', unit_price: 12.00 },
    { id: 'MED005', name: 'Aspirin', stock_qty: 8, reorder_threshold: 25, prescription_required: false, dosage: '81mg', unit_price: 4.00 },
  ];
  globalStore.orders = [
    { id: 'ORD-001', patient_id: 'patient123', medicine_id: 'MED001', qty: 30, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'delivered', trace_id: 't-1' },
    { id: 'ORD-002', patient_id: 'patient123', medicine_id: 'MED004', qty: 60, date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), status: 'delivered', trace_id: 't-2' },
  ];
  globalStore.initialized = true;
}

export const db = {
  getMedicines: () => globalStore.medicines,
  getMedicine: (id: string) => globalStore.medicines.find(m => m.id === id),
  getOrders: () => globalStore.orders,
  getPatientHistory: (patientId: string) => globalStore.orders.filter(o => o.patient_id === patientId),
  updateStock: (medicineId: string, qtyToReduce: number) => {
    const med = globalStore.medicines.find(m => m.id === medicineId);
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
    const history = db.getPatientHistory(patientId);
    return history.map(order => {
      const med = db.getMedicine(order.medicine_id);
      if (!med) return null;
      
      // Simple logic: assume 1 unit per day if dosage not specified specifically
      const dosagePerDay = 1; 
      const daysCovered = order.qty / dosagePerDay;
      const purchaseDate = new Date(order.date);
      const exhaustionDate = new Date(purchaseDate.getTime() + daysCovered * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const diffTime = exhaustionDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        patient_id: patientId,
        medicine_name: med.name,
        days_left: daysLeft,
        exhaustion_date: exhaustionDate.toISOString(),
        alert: daysLeft <= 2
      };
    }).filter(Boolean) as RefillAlert[];
  }
};
