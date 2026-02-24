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

export async function getUserHistory(patientId: string) {
  return db.getPatientHistory(patientId);
}

export async function getDashboardData() {
  const medicines = db.getMedicines();
  const lowStock = medicines.filter(m => m.stock_qty < m.reorder_threshold);
  const orders = db.getOrders();
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
  const lowerMsg = message.toLowerCase();
  
  try {
    if (lowerMsg.includes('refill') || lowerMsg.includes('when') || lowerMsg.includes('how many days') || lowerMsg.includes('due')) {
      const response = await aiPoweredPredictiveRefillInquiry({
        patientId,
        medicineName: message 
      });
      return {
        response,
        trace_url: `https://cloud.langfuse.com/project/demo/traces/${trace_id}`,
      };
    } else {
      const result = await automatedPrescriptionOrdering({
        patient_id: patientId,
        message,
        trace_id
      });
      return {
        response: result.response,
        trace_url: `https://cloud.langfuse.com/project/demo/traces/${trace_id}`,
        order_id: result.order_id
      };
    }
  } catch (error) {
    console.error('Chat Action Error:', error);
    return {
      response: "I'm having trouble connecting to my pharmacy systems right now. Please try again in a moment.",
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
