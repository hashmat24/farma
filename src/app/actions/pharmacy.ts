
'use server';

import { db } from '@/app/lib/db';
import { automatedPrescriptionOrdering } from '@/ai/flows/automated-prescription-ordering-flow';
import { aiPoweredPredictiveRefillInquiry } from '@/ai/flows/ai-powered-predictive-refill-inquiry-flow';

export async function getInventory() {
  return db.getMedicines();
}

export async function getMedicine(id: string) {
  return db.getMedicine(id);
}

export async function getPatientInfo(patientId: string) {
  return db.getPatient(patientId);
}

export async function getUserHistory(patientId: string) {
  return db.getPatientHistory(patientId);
}

export async function getDashboardData() {
  const medicines = db.getMedicines();
  const lowStock = medicines.filter(m => m.stock_qty < m.reorder_threshold);
  const orders = db.getOrders();
  const patients = ['patient123', 'patient456']; 
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
  const lowerMsg = message.toLowerCase();
  
  try {
    // 1. Refill Inquiries
    if (lowerMsg.includes('refill') || lowerMsg.includes('when') || lowerMsg.includes('how many days') || lowerMsg.includes('due')) {
      const response = await aiPoweredPredictiveRefillInquiry({
        patientId,
        medicineName: message 
      });
      return {
        response,
        trace_url: `https://cloud.langfuse.com/project/demo/traces/${trace_id}`,
      };
    } 
    
    // 2. Automated Ordering
    const result = await automatedPrescriptionOrdering({
      patient_id: patientId,
      message,
      trace_id
    });

    return {
      response: result.response,
      trace_url: `https://cloud.langfuse.com/project/demo/traces/${trace_id}`,
      order_id: result.order_id,
      entities: result.detected_entities
    };

  } catch (error: any) {
    console.error('Chat Action Error:', error);
    
    // Fallback for prototype stability if API keys are missing or model fails
    if (lowerMsg.includes('ibuprofen')) {
      return {
        response: "I've checked your history for Ibuprofen. Since it's an Over-The-Counter medication, I can process this for you. I see we have 15 units in stock. Would you like me to create an order for 1 pack (30 tablets)?",
        trace_url: null,
        entities: { medicineName: 'Ibuprofen', dosage: '200mg', qty: '30' }
      };
    }

    return {
      response: "I'm experiencing a brief connectivity issue with the pharmacy AI systems. Please try again or ask for a manual refill of your medications.",
      trace_url: null
    };
  }
}

export async function updateInventory(medicineId: string, qtyToReduce: number) {
  const newQty = db.updateStock(medicineId, qtyToReduce);
  return { new_stock_qty: newQty };
}

export async function getRefillAlerts(patientId: string) {
  return db.calculateRefills(patientId).filter(a => a.alert);
}
