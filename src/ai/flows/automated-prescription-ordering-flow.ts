
'use server';
/**
 * @fileOverview This file implements the Genkit flow for automated prescription ordering.
 * It orchestrates tools via an AI agent to fulfill patient medication requests.
 *
 * - automatedPrescriptionOrdering - The wrapper function for the flow.
 * - AutomatedPrescriptionOrderingInput - The input type for the flow.
 * - AutonomousPharmacistOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/app/lib/db';

// Input Schema for the main flow
const AutomatedPrescriptionOrderingInputSchema = z.object({
  patient_id: z.string().describe('The ID of the patient making the request.'),
  message: z.string().describe('The natural language request from the patient for medication or symptoms.'),
  trace_id: z.string().describe('A unique identifier for the current trace/session.'),
});
export type AutomatedPrescriptionOrderingInput = z.infer<typeof AutomatedPrescriptionOrderingInputSchema>;

// Output Schema for the main flow
const AutonomousPharmacistOutputSchema = z.object({
  response: z.string().describe('The AI pharmacist\'s response to the patient.'),
  order_id: z.string().optional().describe('The ID of the created order, if successful.'),
  detected_entities: z.object({
    medicineName: z.string().optional(),
    dosage: z.string().optional(),
    qty: z.string().optional(),
    duration: z.string().optional(),
  }).optional(),
});
export type AutonomousPharmacistOutput = z.infer<typeof AutonomousPharmacistOutputSchema>;

// --- Tool Definitions ---

const searchMedicine = ai.defineTool(
  {
    name: 'search_medicine',
    description: 'Searches for medicines in the inventory based on symptoms, category, or name.',
    inputSchema: z.object({ query: z.string().describe('Symptoms or keywords to search for.') }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      price: z.number(),
      stock: z.number(),
      prescription_required: z.boolean(),
      description: z.string(),
      dosage: z.string(),
    })),
  },
  async (input) => {
    const results = db.searchMedicines(input.query);
    return results.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      price: m.unit_price,
      stock: m.stock_qty,
      prescription_required: m.prescription_required,
      description: m.description,
      dosage: m.dosage
    }));
  }
);

const getUserHistory = ai.defineTool(
  {
    name: 'get_user_history',
    description: 'Retrieves the medication history and clinical background for a specific patient.',
    inputSchema: z.object({ patient_id: z.string() }),
    outputSchema: z.object({
      name: z.string(),
      history: z.array(z.string()),
      past_orders: z.array(z.any()),
    }),
  },
  async (input) => {
    const patient = db.getPatient(input.patient_id);
    const history = db.getPatientHistory(input.patient_id);
    return {
      name: patient?.name || 'Unknown',
      history: patient?.history || [],
      past_orders: history || [],
    };
  }
);

const extractMedicineDetails = ai.defineTool(
  {
    name: 'extract_medicine_details',
    description: 'Extracts medicine name, ID, quantity, and dosage from a natural language request.',
    inputSchema: z.object({ raw_text: z.string() }),
    outputSchema: z.object({
      medicine_name: z.string().optional(),
      medicine_id: z.string().optional(),
      qty: z.number().int().positive().optional(),
      dosage: z.string().optional(),
    }),
  },
  async (input) => {
    const lowerText = input.raw_text.toLowerCase();
    const medicines = db.getMedicines();
    
    let medicine_name = '';
    let medicine_id = '';
    let dosage = '';

    for (const med of medicines) {
      if (lowerText.includes(med.name.toLowerCase())) {
        medicine_name = med.name;
        medicine_id = med.id;
        dosage = med.dosage;
        break;
      }
    }

    const qtyMatch = lowerText.match(/(\d+)\s*(pill|tablet|capsule|item|unit)s?/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : undefined;

    return { medicine_name: medicine_name || undefined, medicine_id: medicine_id || undefined, qty, dosage: dosage || undefined };
  }
);

const checkInventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: 'Checks stock and prescription requirements for a medicine.',
    inputSchema: z.object({ medicine_id: z.string() }),
    outputSchema: z.object({ 
      stock_qty: z.number(), 
      available: z.boolean(), 
      prescription_required: z.boolean(),
      price: z.number()
    }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    return { 
      stock_qty: med?.stock_qty || 0, 
      available: (med?.stock_qty || 0) > 0,
      prescription_required: med?.prescription_required || false,
      price: med?.unit_price || 0
    };
  }
);

const createOrder = ai.defineTool(
  {
    name: 'create_order',
    description: 'Creates a new order in the pharmacy system.',
    inputSchema: z.object({ patient_id: z.string(), medicine_id: z.string(), qty: z.number(), trace_id: z.string() }),
    outputSchema: z.object({ 
      order_id: z.string(), 
      status: z.string(), 
      total_price: z.number(),
      medicine_name: z.string(),
      quantity: z.number(),
      estimated_delivery: z.string()
    }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const totalPrice = (med?.unit_price || 0) * input.qty;
    
    db.addOrder({
      id: orderId,
      patient_id: input.patient_id,
      medicine_id: input.medicine_id,
      qty: input.qty,
      date: new Date().toISOString(),
      status: 'processing',
      trace_id: input.trace_id,
      total_price: totalPrice
    });
    
    // Auto update stock
    db.updateStock(input.medicine_id, input.qty);

    return { 
      order_id: orderId, 
      status: 'Processing', 
      total_price: totalPrice,
      medicine_name: med?.name || 'Unknown',
      quantity: input.qty,
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  }
);

const triggerWarehouseWebhook = ai.defineTool(
  {
    name: 'trigger_warehouse_webhook',
    description: 'Notifies the external warehouse system to begin fulfillment of a created order.',
    inputSchema: z.object({ order_id: z.string(), priority: z.enum(['standard', 'urgent']) }),
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    console.log(`[AGENT] Triggering warehouse webhook for ${input.order_id}`);
    return { success: true, message: `Warehouse notified with ${input.priority} priority.` };
  }
);

const calculateRefillSchedule = ai.defineTool(
  {
    name: 'calculate_refill_schedule',
    description: 'Predicts the next refill date for a patient based on their current supply and dosage.',
    inputSchema: z.object({ patient_id: z.string(), medicine_id: z.string() }),
    outputSchema: z.object({ predicted_date: z.string(), days_remaining: z.number() }),
  },
  async (input) => {
    const alerts = db.calculateRefills(input.patient_id);
    const med = db.getMedicine(input.medicine_id);
    const alert = alerts.find(a => a.medicine_name.toLowerCase().includes((med?.name || '').toLowerCase()));
    return {
      predicted_date: alert?.exhaustion_date || 'Unknown',
      days_remaining: alert?.days_left || 0
    };
  }
);

// --- Prompt Definition ---
const autonomousPharmacistPrompt = ai.definePrompt({
  name: 'autonomousPharmacistPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AutomatedPrescriptionOrderingInputSchema },
  output: { schema: AutonomousPharmacistOutputSchema },
  tools: [
    getUserHistory, 
    searchMedicine,
    extractMedicineDetails, 
    checkInventory, 
    createOrder, 
    triggerWarehouseWebhook, 
    calculateRefillSchedule
  ],
  system: `You are CuraCare AI — an autonomous digital pharmacist. You must follow this MANDATORY CLINICAL WORKFLOW for every conversation.

━━━━━━━━━━━━━━━━━━━━━━
1. SYMPTOM UNDERSTANDING
━━━━━━━━━━━━━━━━━━━━━━
If the user describes symptoms (e.g., headache, cold, fever, stomach pain):
- Automatically call 'search_medicine' tool.
- Identify appropriate OTC medicines from inventory.
- Suggest 1–2 relevant options clearly.
- Display price and stock availability.
- Do NOT ask the user to name a medicine if they only describe symptoms.

━━━━━━━━━━━━━━━━━━━━━━
2. PRESCRIPTION CHECK
━━━━━━━━━━━━━━━━━━━━━━
Before placing any order:
- Always call 'check_inventory'.
- If prescription_required = true:
    - Inform user that this medicine requires a valid prescription.
    - Ask user to confirm prescription availability.
    - If not confirmed → DO NOT create order.

━━━━━━━━━━━━━━━━━━━━━━
3. ORDER CONFIRMATION FLOW
━━━━━━━━━━━━━━━━━━━━━━
If medicine is OTC or prescription confirmed:
- Ask: "How many units would you like?"
- Wait for user confirmation.
- Only after explicit confirmation (yes, confirm, order it):
    → Call 'create_order' tool.

━━━━━━━━━━━━━━━━━━━━━━
4. AFTER ORDER CREATION
━━━━━━━━━━━━━━━━━━━━━━
After successful 'create_order':
- Display:
    - Order ID
    - Medicine name
    - Quantity
    - Total price
    - Estimated delivery date (2-3 business days)
    - Shipping status (Processing / Shipped)
- Inform user that inventory has been updated.
- Call 'trigger_warehouse_webhook'.
- Call 'calculate_refill_schedule' and inform user when refill reminder will trigger.

━━━━━━━━━━━━━━━━━━━━━━
5. SAFETY RULES
━━━━━━━━━━━━━━━━━━━━━━
- NEVER create order without confirmation.
- NEVER bypass prescription check.
- NEVER assume dosage if not available.
- Always verify stock before confirming.

━━━━━━━━━━━━━━━━━━━━━━
6. RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━
- Be proactive.
- Act like a pharmacist.
- If symptom-based request: Suggest medicine first.
- Do not respond with generic system messages.
- You are not a chatbot. You are an autonomous pharmacy execution agent.`,
  prompt: `Patient ID: {{{patient_id}}}
User message: {{{message}}}
Trace ID: {{{trace_id}}}`,
});

// --- Main Flow Definition ---
const automatedPrescriptionOrderingFlow = ai.defineFlow(
  {
    name: 'automatedPrescriptionOrderingFlow',
    inputSchema: AutomatedPrescriptionOrderingInputSchema,
    outputSchema: AutonomousPharmacistOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await autonomousPharmacistPrompt(input);
      return output || { response: "I've analyzed your request but encountered an internal step issue. Please clarify your medication request." };
    } catch (e) {
      console.error('Flow Execution Error:', e);
      throw e;
    }
  }
);

export async function automatedPrescriptionOrdering(
  input: AutomatedPrescriptionOrderingInput
): Promise<AutonomousPharmacistOutput> {
  return automatedPrescriptionOrderingFlow(input);
}
