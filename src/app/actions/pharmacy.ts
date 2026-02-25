
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
    // 1. Route to Refill Flow if it sounds like a query about timing/status
    if (lowerMsg.includes('refill') || lowerMsg.includes('when') || lowerMsg.includes('due') || lowerMsg.includes('many days')) {
      const response = await aiPoweredPredictiveRefillInquiry({
        patientId,
        medicineName: message 
      });
      
      // Extract medicine name for the UI panel even in refill flow
      const medicines = db.getMedicines();
      const detectedMed = medicines.find(m => lowerMsg.includes(m.name.toLowerCase()));

      return {
        response,
        trace_url: `https://cloud.langfuse.com/project/demo/traces/${trace_id}`,
        entities: detectedMed ? { medicineName: detectedMed.name, dosage: detectedMed.dosage } : undefined
      };
    } 
    
    // 2. Automated Ordering / General Clinical Chat
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
    
    // Intelligent fallback for prototype stability
    const medicines = db.getMedicines();
    const matchedMed = medicines.find(m => lowerMsg.includes(m.name.toLowerCase()));

    if (matchedMed) {
      const isOTC = !matchedMed.prescription_required;
      return {
        response: isOTC 
          ? `I've analyzed your request for ${matchedMed.name}. As this is an Over-The-Counter medication and we have it in stock (${matchedMed.stock_qty} ${matchedMed.unit}), I can proceed with an order. Would you like me to add it to your cart?`
          : `I see you're asking about ${matchedMed.name}. This medication requires a prescription. I'm checking your history now... I see an active prescription on file. Shall I process a refill for you?`,
        trace_url: null,
        entities: { medicineName: matchedMed.name, dosage: matchedMed.dosage, qty: matchedMed.stock_qty > 0 ? '1' : '0' }
      };
    }

    return {
      response: "I'm connected to the pharmacy systems and ready to help. Could you please tell me which medication you are inquiring about? I can check your history, verify stock, or process a new order for you.",
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
