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
    { id: '993687', name: 'NORSAN Omega-3 Kapseln', category: 'Supplements', stock_qty: 60, reorder_threshold: 15, prescription_required: false, dosage: '120 st', unit_price: 29.00, unit: 'Capsules', description: 'Omega-3-Kapseln zur täglichen Nahrungsergänzung.' },
    { id: '1225428', name: 'Vividrin iso EDO Augentropfen', category: 'Eye Care', stock_qty: 45, reorder_threshold: 10, prescription_required: false, dosage: '30x0.5 ml', unit_price: 8.28, unit: 'Vials', description: 'Konservierungsmittelfreie Augentropfen zur Linderung allergischer Beschwerden.' },
    { id: '202796', name: 'Aqualibra 80mg/90mg/180mg', category: 'Urology', stock_qty: 55, reorder_threshold: 12, prescription_required: false, dosage: '60 st', unit_price: 27.82, unit: 'Tablets', description: 'Pflanzliches Arzneimittel zur Unterstützung der Blasenfunktion.' },
    { id: '1103035', name: 'Vitasprint Pro Energie', category: 'Vitamins', stock_qty: 110, reorder_threshold: 25, prescription_required: false, dosage: '8 st', unit_price: 15.95, unit: 'Vials', description: 'Nahrungsergänzungsmittel mit B-Vitaminen und Aminosäuren.' },
    { id: '27955', name: 'Cystinol akut', category: 'Urology', stock_qty: 38, reorder_threshold: 10, prescription_required: false, dosage: '60 st', unit_price: 26.50, unit: 'Tablets', description: 'Pflanzliches Arzneimittel zur Behandlung akuter Harnwegsinfektionen.' },
    { id: '30955', name: 'Cromo-ratiopharm Augentropfen', category: 'Eye Care', stock_qty: 70, reorder_threshold: 15, prescription_required: false, dosage: '20x0.5 ml', unit_price: 7.59, unit: 'Vials', description: 'Antiallergische Augentropfen zur Vorbeugung allergischer Reaktionen.' },
    { id: '1162261', name: 'Kijimea Reizdarm PRO', category: 'Gastrointestinal', stock_qty: 55, reorder_threshold: 15, prescription_required: false, dosage: '28 st', unit_price: 38.99, unit: 'Capsules', description: 'Medizinisches Produkt zur Linderung von Symptomen des Reizdarmsyndroms.' },
    { id: '1240782', name: 'Mucosolvan 1 mal täglich', category: 'Respiratory', stock_qty: 48, reorder_threshold: 10, prescription_required: false, dosage: '50 st', unit_price: 39.97, unit: 'Capsules', description: 'Langwirksames Arzneimittel zur Schleimlösung bei Husten.' },
    { id: '1210016', name: 'OMNI-BiOTiC SR-9', category: 'Probiotics', stock_qty: 24, reorder_threshold: 10, prescription_required: false, dosage: '28x3 g', unit_price: 44.50, unit: 'Sachets', description: 'Probiotikum mit B-Vitaminen zur Unterstützung der Darmflora.' },
    { id: '1245942', name: 'Osa Schorf Spray', category: 'Pediatric', stock_qty: 32, reorder_threshold: 8, prescription_required: false, dosage: '30 ml', unit_price: 15.45, unit: 'Spray', description: 'Pflegespray zur sanften Entfernung von Milchschorf bei Babys.' },
    { id: '1247528', name: 'Multivitamin Fruchtgummibärchen', category: 'Vitamins', stock_qty: 90, reorder_threshold: 20, prescription_required: false, dosage: '60 st', unit_price: 12.74, unit: 'Gummies', description: 'Vegane, zuckerfreie Multivitamin-Gummibärchen für die tägliche Versorgung.' },
    { id: '1273105', name: 'Iberogast Classic', category: 'Gastrointestinal', stock_qty: 48, reorder_threshold: 10, prescription_required: false, dosage: '50 ml', unit_price: 28.98, unit: 'Bottle', description: 'Pflanzliches Arzneimittel bei Magen-Darm-Beschwerden.' },
    { id: '1358905', name: 'COLPOFIX Vaginalgel', category: 'Women Health', stock_qty: 22, reorder_threshold: 5, prescription_required: false, dosage: '40 ml', unit_price: 49.60, unit: 'Gel', description: 'Vaginalgel zur Unterstützung der Gesundheit der Zervixschleimhaut.' },
    { id: '1293377', name: 'Augentropfen RedCare', category: 'Eye Care', stock_qty: 65, reorder_threshold: 12, prescription_required: false, dosage: '10 ml', unit_price: 12.69, unit: 'Bottle', description: 'Befeuchtende Augentropfen bei trockenen oder gereizten Augen.' },
    { id: '1313639', name: 'MULTILAC Darmsynbiotikum', category: 'Probiotics', stock_qty: 40, reorder_threshold: 10, prescription_required: false, dosage: '10 st', unit_price: 9.99, unit: 'Capsules', description: 'Kombination aus Pro- und Präbiotika zur Unterstützung der Verdauung.' },
    { id: '1319766', name: 'SAW PALMETO 350 mg', category: 'Men Health', stock_qty: 50, reorder_threshold: 10, prescription_required: false, dosage: '100 st', unit_price: 8.47, unit: 'Capsules', description: 'Pflanzliches Nahrungsergänzungsmittel zur Unterstützung der Prostatafunktion.' },
    { id: '1329121', name: 'Paracetamol apodiscounter 500 mg', category: 'Analgesic', stock_qty: 500, reorder_threshold: 50, prescription_required: false, dosage: '20 st', unit_price: 2.06, unit: 'Tablets', description: 'Schmerz- und fiebersenkendes Arzneimittel.' },
    { id: '1352774', name: 'Prostata Men Kapseln', category: 'Men Health', stock_qty: 35, reorder_threshold: 10, prescription_required: false, dosage: '60 st', unit_price: 19.99, unit: 'Capsules', description: 'Nahrungsergänzungsmittel zur Unterstützung der Prostatagesundheit.' },
    { id: '1357649', name: 'Natural Intimate Creme', category: 'Women Health', stock_qty: 28, reorder_threshold: 6, prescription_required: false, dosage: '50 ml', unit_price: 18.90, unit: 'Cream', description: 'Pflegecreme zur Befeuchtung und zum Schutz des sensiblen Intimbereichs.' },
    { id: '1358513', name: 'proBiO G Probiotik Kapseln', category: 'Probiotics', stock_qty: 30, reorder_threshold: 8, prescription_required: false, dosage: '30 st', unit_price: 34.90, unit: 'Capsules', description: 'Probiotische Kapseln zur Unterstützung einer gesunden Darmflora.' },
    { id: '1363580', name: 'Eucerin DERMOPURE Reinigungsgel', category: 'Skin Care', stock_qty: 52, reorder_threshold: 10, prescription_required: false, dosage: '150 ml', unit_price: 17.25, unit: 'Bottle', description: 'Reinigungsgel für unreine Haut, reduziert Unreinheiten.' },
    { id: '1381140', name: 'frida baby FlakeFixer', category: 'Pediatric', stock_qty: 15, reorder_threshold: 5, prescription_required: false, dosage: '1 st', unit_price: 14.99, unit: 'Set', description: 'Sanfte Pflege zur Entfernung von Milchschorf bei Babys.' },
    { id: '1383626', name: 'Vitasprint Duo Energie', category: 'Vitamins', stock_qty: 75, reorder_threshold: 15, prescription_required: false, dosage: '20 st', unit_price: 16.95, unit: 'Vials', description: 'Nahrungsergänzungsmittel mit Vitaminen und Mineralstoffen.' },
    { id: '11334', name: 'Bepanthen WUND- UND HEILSALBE', category: 'Skin Care', stock_qty: 140, reorder_threshold: 30, prescription_required: false, dosage: '20 g', unit_price: 7.69, unit: 'Tube', description: 'Salbe zur Unterstützung der Wundheilung und Pflege trockener Haut.' },
    { id: '1391185', name: 'V-Biotics Flora Complex', category: 'Probiotics', stock_qty: 36, reorder_threshold: 8, prescription_required: false, dosage: '19 g', unit_price: 19.90, unit: 'Box', description: 'Probiotisches Nahrungsergänzungsmittel zur Unterstützung von Darm und Immunsystem.' },
    { id: '1403860', name: 'Aveeno Skin Relief Lotion', category: 'Skin Care', stock_qty: 55, reorder_threshold: 10, prescription_required: false, dosage: '300 ml', unit_price: 14.99, unit: 'Bottle', description: 'Beruhigende Körperlotion für sehr trockene und juckende Haut.' },
    { id: '1434198', name: 'Centrum Vital + Mentale Leistung', category: 'Vitamins', stock_qty: 42, reorder_threshold: 10, prescription_required: false, dosage: '30 st', unit_price: 19.95, unit: 'Tablets', description: 'Multivitaminpräparat zur Unterstützung der geistigen Leistungsfähigkeit.' },
    { id: '1434864', name: 'Redcare Wundschutzcreme', category: 'Skin Care', stock_qty: 48, reorder_threshold: 10, prescription_required: false, dosage: '100 ml', unit_price: 14.39, unit: 'Tube', description: 'Schutzcreme für gereizte und empfindliche Haut.' },
    { id: '1435154', name: 'Cetaphil SA Reinigung', category: 'Skin Care', stock_qty: 50, reorder_threshold: 10, prescription_required: false, dosage: '236 ml', unit_price: 13.95, unit: 'Bottle', description: 'Sanfte Reinigung mit Salicylsäure für raue und unebene Haut.' },
    { id: '14176', name: 'Magnesium Verla N Dragées', category: 'Supplements', stock_qty: 200, reorder_threshold: 40, prescription_required: false, dosage: '50 st', unit_price: 6.40, unit: 'Dragées', description: 'Magnesiumpräparat zur Unterstützung von Muskeln und Nerven.' },
    { id: '704523', name: 'Livocab direkt Augentropfen', category: 'Eye Care', stock_qty: 58, reorder_threshold: 12, prescription_required: false, dosage: '4 ml', unit_price: 14.99, unit: 'Bottle', description: 'Schnell wirksame Augentropfen bei allergischen Augenbeschwerden.' },
    { id: '185422', name: 'Cetirizin HEXAL Tropfen', category: 'Analgesic', stock_qty: 85, reorder_threshold: 20, prescription_required: false, dosage: '10 ml', unit_price: 13.19, unit: 'Bottle', description: 'Antihistaminikum zur Linderung von Allergiesymptomen.' },
    { id: '198010', name: 'Loperamid akut 1 A Pharma', category: 'Gastrointestinal', stock_qty: 120, reorder_threshold: 25, prescription_required: false, dosage: '10 st', unit_price: 3.93, unit: 'Capsules', description: 'Arzneimittel zur Behandlung von akutem Durchfall.' },
    { id: '202006', name: 'Ramipril - 1 A Pharma 10 mg', category: 'Cardiovascular', stock_qty: 90, reorder_threshold: 20, prescription_required: true, dosage: '20 st', unit_price: 12.59, unit: 'Tablets', description: 'Verschreibungspflichtiges Arzneimittel bei Behandlung von Bluthochdruck.' },
    { id: '306595', name: 'GRANU FINK femina', category: 'Women Health', stock_qty: 45, reorder_threshold: 10, prescription_required: false, dosage: '30 st', unit_price: 20.29, unit: 'Capsules', description: 'Pflanzliches Arzneimittel zur Unterstützung der Blasengesundheit bei Frauen.' },
    { id: '324024', name: 'Vitasprint B12 Kapseln', category: 'Vitamins', stock_qty: 75, reorder_threshold: 15, prescription_required: false, dosage: '20 st', unit_price: 17.04, unit: 'Capsules', description: 'Vitamin-B12-Präparat zur Unterstützung von Energie und Nervenfunktion.' },
    { id: '332568', name: 'Sinupret Saft', category: 'Respiratory', stock_qty: 60, reorder_threshold: 12, prescription_required: false, dosage: '100 ml', unit_price: 13.30, unit: 'Bottle', description: 'Pflanzliches Arzneimittel bei Nasennebenhöhlenentzündungen.' },
    { id: '335765', name: 'Nurofen 200 mg Schmelztabletten', category: 'Analgesic', stock_qty: 60, reorder_threshold: 15, prescription_required: false, dosage: '12 st', unit_price: 10.98, unit: 'Tablets', description: 'Ibuprofen-Schmerzmittel in schnell löslicher Form.' },
    { id: '363715', name: 'Vitamin B-Komplex-ratiopharm', category: 'Vitamins', stock_qty: 85, reorder_threshold: 15, prescription_required: false, dosage: '60 st', unit_price: 24.97, unit: 'Capsules', description: 'Kombination verschiedener B-Vitamine zur Unterstützung des Nervensystems.' },
    { id: '368333', name: 'Calmvalera Hevert Tropfen', category: 'Gastrointestinal', stock_qty: 42, reorder_threshold: 10, prescription_required: false, dosage: '100 ml', unit_price: 35.97, unit: 'Bottle', description: 'Homöopathisches Arzneimittel bei nervöser Unruhe und Schlafstörungen.' },
    { id: '1248085', name: 'femiloges 4 mg', category: 'Women Health', stock_qty: 35, reorder_threshold: 8, prescription_required: false, dosage: '30 st', unit_price: 20.44, unit: 'Tablets', description: 'Hormonfreies Arzneimittel zur Linderung von Wechseljahresbeschwerden.' },
    { id: '376212', name: 'Umckaloabo Saft für Kinder', category: 'Pediatric', stock_qty: 55, reorder_threshold: 12, prescription_required: false, dosage: '120 ml', unit_price: 13.15, unit: 'Bottle', description: 'Pflanzlicher Saft zur Behandlung von Atemwegsinfektionen bei Kindern.' },
    { id: '368367', name: 'Dulcolax Dragées', category: 'Gastrointestinal', stock_qty: 110, reorder_threshold: 20, prescription_required: false, dosage: '100 st', unit_price: 22.90, unit: 'Dragées', description: 'Abführmittel zur kurzfristigen Behandlung von Verstopfung.' },
    { id: '717525', name: 'Diclo-ratiopharm Schmerzgel', category: 'Skin Care', stock_qty: 140, reorder_threshold: 30, prescription_required: false, dosage: '50 g', unit_price: 8.89, unit: 'Tube', description: 'Schmerzgel zur äußeren Anwendung bei Muskel- und Gelenkschmerzen.' },
    { id: '772646', name: 'Minoxidil BIO-H-TIN-Pharma', category: 'Skin Care', stock_qty: 48, reorder_threshold: 10, prescription_required: false, dosage: '60 ml', unit_price: 22.50, unit: 'Bottle', description: 'Lösung zur Anwendung auf der Kopfhaut bei erblich bedingtem Haarausfall.' },
    { id: '790415', name: 'Hyaluron-ratiopharm Augentropfen', category: 'Eye Care', stock_qty: 75, reorder_threshold: 15, prescription_required: false, dosage: '10 ml', unit_price: 13.74, unit: 'Bottle', description: 'Befeuchtende Augentropfen mit Hyaluronsäure bei trockenen Augen.' },
    { id: '790661', name: 'FeniHydrocort Creme 0.25 %', category: 'Skin Care', stock_qty: 60, reorder_threshold: 15, prescription_required: false, dosage: '20 g', unit_price: 8.59, unit: 'Tube', description: 'Kortisonhaltige Creme zur Behandlung leichter Hautentzündungen.' },
    { id: '879236', name: 'Eucerin UreaRepair Plus Lotion', category: 'Skin Care', stock_qty: 40, reorder_threshold: 10, prescription_required: false, dosage: '400 ml', unit_price: 27.75, unit: 'Bottle', description: 'Intensiv pflegende Lotion für sehr trockene und raue Haut.' },
    { id: '899231', name: 'Vigantolvit 2000 I.E. Vitamin D3', category: 'Vitamins', stock_qty: 200, reorder_threshold: 40, prescription_required: false, dosage: '120 st', unit_price: 17.99, unit: 'Tablets', description: 'Vitamin-D-Präparat zur Unterstützung von Knochen und Immunsystem.' }
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
