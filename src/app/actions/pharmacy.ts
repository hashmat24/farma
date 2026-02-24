
'use server';

import { db, Medicine, Order, RefillAlert } from '@/app/lib/db';
import { automatedPrescriptionOrdering } from '@/ai/flows/automated-prescription-ordering-flow';
import { aiPoweredPredictiveRefillInquiry } from '@/ai/flows/ai-powered-predictive-refill-inquiry-flow';

export async function getInventory() {
  return db.getMedicines();
}

export async function getMedicine(id: string) {
  return db.getMedicine(id);
}

export async function getUserHistory(patientId: string) {
  return db.getPatientHistory(patientId);
}

export async function getDashboardData() {
  const medicines = db.getMedicines();
  const lowStock = medicines.filter(m => m.stock_qty < m.reorder_threshold);
  const orders = db.getOrders();
  // Simplified refill alerts for all known patients in mock
  const patients = ['patient123']; 
  const refillAlerts = patients.flatMap(p => db.calculateRefills(p)).filter(a => a.alert);
  
  return {
    medicines,
    lowStock,
    refillAlerts,
    orders: orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };
}

export async function chatAction(patientId: string, message: string) {
  const trace_id = `tr-${Date.now()}`;
  
  // Decide which flow to use based on keywords for demo purposes
  // In a real app, one agent handles everything
  const lowerMsg = message.toLowerCase();
  
  let response;
  let order_id;

  if (lowerMsg.includes('refill') || lowerMsg.includes('when') || lowerMsg.includes('how many days')) {
    response = await aiPoweredPredictiveRefillInquiry({
      patientId,
      medicineName: message // simplified
    });
  } else {
    const result = await automatedPrescriptionOrdering({
      patient_id: patientId,
      message,
      trace_id
    });
    response = result.response;
    order_id = result.order_id;
  }

  return {
    response,
    trace_url: `https://cloud.langfuse.com/project/demo/traces/${trace_id}`, // Mock Langfuse URL
    order_id
  };
}

export async function updateInventory(medicineId: string, qtyToReduce: number) {
  const newQty = db.updateStock(medicineId, qtyToReduce);
  return { new_stock_qty: newQty };
}

export async function getRefillAlerts(patientId: string) {
  return db.calculateRefills(patientId).filter(a => a.alert);
}
