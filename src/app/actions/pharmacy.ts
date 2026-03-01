
'use server';

import { db, Order } from '@/app/lib/db';
import { automatedPrescriptionOrdering } from '@/ai/flows/automated-prescription-ordering-flow';
import { aiPoweredPredictiveRefillInquiry } from '@/ai/flows/ai-powered-predictive-refill-inquiry-flow';
import { getTraceUrl } from '@/ai/langfuse';

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

export async function chatAction(
  patientId: string, 
  message: string, 
  history: any[] = [], 
  photoDataUri?: string,
  preferredLanguage?: string
) {
  const trace_id = `tr-${Date.now().toString().slice(-6)}`;
  const trace_url = getTraceUrl(trace_id);
  const lowerMsg = message.toLowerCase();
  
  try {
    if (!photoDataUri && lowerMsg.includes('when') && (lowerMsg.includes('due') || lowerMsg.includes('refill') || lowerMsg.includes('exhaust'))) {
      const response = await aiPoweredPredictiveRefillInquiry({
        patientId,
        medicineName: message,
        preferred_language: preferredLanguage
      });
      
      const medicines = db.getMedicines();
      const detectedMed = medicines.find(m => lowerMsg.includes(m.name.toLowerCase()));

      return {
        response,
        trace_url,
        entities: detectedMed ? { medicineName: detectedMed.name, dosage: detectedMed.dosage } : undefined
      };
    } 
    
    const result = await automatedPrescriptionOrdering({
      patient_id: patientId,
      message,
      history,
      trace_id,
      photoDataUri,
      preferred_language: preferredLanguage
    });

    return {
      response: result.response,
      trace_url,
      order_id: result.order_id,
      order_details: result.order_details,
      entities: result.detected_entities
    };

  } catch (error: any) {
    console.error('Chat Action Error:', error);
    return {
      response: "I am ready to assist you. Are you looking for a specific medication, or would you like me to recommend something based on your symptoms?",
      trace_url
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

export async function createManualOrderAction(patientId: string, medicineId: string, quantity: number, dosage: string) {
  const med = db.getMedicine(medicineId);
  if (!med) throw new Error('Medicine not found');
  if (med.stock_qty < quantity) throw new Error('Insufficient stock');

  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const order: Order = {
    id: orderId,
    patient_id: patientId,
    medicine_id: medicineId,
    qty: quantity,
    date: new Date().toISOString(),
    status: 'processing',
    trace_id: 'manual-order',
    total_price: med.unit_price * quantity
  };

  db.addOrder(order);
  db.updateStock(medicineId, quantity);

  return {
    order_id: orderId,
    order_details: {
      medicineName: med.name,
      qty: quantity,
      totalPrice: order.total_price,
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}
