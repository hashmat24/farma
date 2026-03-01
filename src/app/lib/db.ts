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
  description: string;
};

export type Order = {
  id: string;
  patient_id: string;
  medicine_id: string;
  qty: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trace_id: string;
  total_price: number;
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

const globalStore = global as any;

if (!globalStore.medicines) {
  globalStore.medicines = [
    { id: '16066', name: 'Panthenol Spray', category: 'Skin Care', stock_qty: 85, reorder_threshold: 20, prescription_required: false, dosage: '130 g', unit_price: 16.95, unit: 'Spray', description: 'Schaumspray zur Anwendung auf der Haut. Fördert die Regeneration gereizter oder geschädigter Haut.' },
    { id: '976308', name: 'NORSAN Omega-3 Total', category: 'Supplements', stock_qty: 42, reorder_threshold: 15, prescription_required: false, dosage: '200 ml', unit_price: 27.00, unit: 'Bottle', description: 'Flüssiges Omega-3 aus Fisch. Unterstützt Herz, Gehirn und Gelenke.' },
    { id: '977179', name: 'NORSAN Omega-3 Vegan', category: 'Supplements', stock_qty: 30, reorder_threshold: 10, prescription_required: false, dosage: '100 ml', unit_price: 29.00, unit: 'Bottle', description: 'Pflanzliches Omega-3 aus Algen. Geeignet für Vegetarier und Veganer.' },
    { id: '1103035', name: 'Vitasprint Pro Energie', category: 'Vitamins', stock_qty: 110, reorder_threshold: 25, prescription_required: false, dosage: '8 st', unit_price: 15.95, unit: 'Vials', description: 'Nahrungsergänzungsmittel mit B-Vitaminen und Aminosäuren zur Verringerung von Müdigkeit.' },
    { id: '1162261', name: 'Kijimea Reizdarm PRO', category: 'Gastrointestinal', stock_qty: 55, reorder_threshold: 15, prescription_required: false, dosage: '28 st', unit_price: 38.99, unit: 'Capsules', description: 'Medizinisches Produkt zur Linderung von Symptomen des Reizdarmsyndroms.' },
    { id: '1210016', name: 'OMNI-BiOTiC SR-9', category: 'Probiotics', stock_qty: 24, reorder_threshold: 10, prescription_required: false, dosage: '28x3 g', unit_price: 44.50, unit: 'Sachets', description: 'Probiotikum mit B-Vitaminen zur Unterstützung der Darmflora und des Energiestoffwechsels.' },
    { id: '1329121', name: 'Paracetamol apodiscounter 500 mg', category: 'Analgesic', stock_qty: 500, reorder_threshold: 50, prescription_required: false, dosage: '20 st', unit_price: 2.06, unit: 'Tablets', description: 'Schmerz- und fiebersenkendes Arzneimittel.' },
    { id: '202006', name: 'Ramipril - 1 A Pharma 10 mg', category: 'Cardiovascular', stock_qty: 90, reorder_threshold: 20, prescription_required: true, dosage: '20 st', unit_price: 12.59, unit: 'Tablets', description: 'Verschreibungspflichtiges Arzneimittel bei Behandlung von Bluthochdruck.' },
    { id: '324024', name: 'Vitasprint B12 Kapseln', category: 'Vitamins', stock_qty: 75, reorder_threshold: 15, prescription_required: false, dosage: '20 st', unit_price: 17.04, unit: 'Capsules', description: 'Vitamin-B12-Präparat zur Unterstützung von Energie und Nervenfunktion.' },
    { id: '335765', name: 'Nurofen 200 mg Schmelztabletten', category: 'Analgesic', stock_qty: 60, reorder_threshold: 15, prescription_required: false, dosage: '12 st', unit_price: 10.98, unit: 'Tablets', description: 'Ibuprofen-Schmerzmittel in schnell löslicher Form.' },
    { id: '717525', name: 'Diclo-ratiopharm Schmerzgel', category: 'Topical Analgesic', stock_qty: 140, reorder_threshold: 30, prescription_required: false, dosage: '50 g', unit_price: 8.89, unit: 'Tube', description: 'Schmerzgel zur äußeren Anwendung bei Muskel- und Gelenkschmerzen.' },
    { id: '1273105', name: 'Iberogast Classic', category: 'Gastrointestinal', stock_qty: 48, reorder_threshold: 10, prescription_required: false, dosage: '50 ml', unit_price: 28.98, unit: 'Bottle', description: 'Pflanzliches Arzneimittel bei Magen-Darm-Beschwerden.' },
    { id: '899231', name: 'Vigantolvit 2000 I.E. Vitamin D3', category: 'Vitamins', stock_qty: 200, reorder_threshold: 40, prescription_required: false, dosage: '120 st', unit_price: 17.99, unit: 'Tablets', description: 'Vitamin-D-Präparat zur Unterstützung von Knochen und Immunsystem.' },
    { id: '1352774', name: 'Prostata Men Kapseln', category: 'Men Health', stock_qty: 35, reorder_threshold: 10, prescription_required: false, dosage: '60 st', unit_price: 19.99, unit: 'Capsules', description: 'Nahrungsergänzungsmittel zur Unterstützung der Prostatagesundheit.' }
  ];
}

if (!globalStore.orders) {
  globalStore.orders = [
    { id: 'ORD-001', patient_id: 'patient123', medicine_id: '1329121', qty: 2, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'delivered', trace_id: 't-1', total_price: 4.12 },
    { id: 'ORD-002', patient_id: 'patient123', medicine_id: '202006', qty: 1, date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), status: 'delivered', trace_id: 't-2', total_price: 12.59 },
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
      history: ['Hypertension', 'Seasonal Allergies'] 
    }
  ];
}

export const db = {
  getMedicines: () => globalStore.medicines || [],
  getMedicine: (id: string) => (globalStore.medicines || []).find((m: any) => m.id === id),
  searchMedicines: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return (globalStore.medicines || []).filter((m: any) => 
      m.name.toLowerCase().includes(lowerQuery) || 
      m.category.toLowerCase().includes(lowerQuery) || 
      m.description.toLowerCase().includes(lowerQuery)
    );
  },
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