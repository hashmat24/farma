'use server';
/**
 * @fileOverview This file implements the Genkit flow for the CuraCare AI autonomous digital pharmacist.
 * It orchestrates a suite of clinical tools via an AI agent to fulfill patient medication requests
 * according to a strict 8-point operational workflow.
 *
 * - automatedPrescriptionOrdering - The main entry point for chat interactions.
 * - AutomatedPrescriptionOrderingInput - User message and patient context.
 * - AutonomousPharmacistOutput - Structured AI response and order metadata.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/app/lib/db';

// --- Schema Definitions ---

const AutomatedPrescriptionOrderingInputSchema = z.object({
  patient_id: z.string().describe('The ID of the patient making the request.'),
  message: z.string().describe('The natural language request (symptoms or medication).'),
  trace_id: z.string().describe('A unique identifier for the current trace/session.'),
});
export type AutomatedPrescriptionOrderingInput = z.infer<typeof AutomatedPrescriptionOrderingInputSchema>;

const AutonomousPharmacistOutputSchema = z.object({
  response: z.string().describe('The AI pharmacist\'s professional response.'),
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
    description: 'Searches for medicines in the inventory based on symptoms, category, or keywords.',
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
    description: 'Retrieves the clinical background and previous orders for a specific patient.',
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
    description: 'Extracts specific medicine names, IDs, quantities, and dosages from text.',
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

    const qtyMatch = lowerText.match(/(\d+)\s*(pill|tablet|capsule|item|unit|pack)s?/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : undefined;

    return { 
      medicine_name: medicine_name || undefined, 
      medicine_id: medicine_id || undefined, 
      qty, 
      dosage: dosage || undefined 
    };
  }
);

const checkInventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: 'Checks real-time stock and prescription status for a specific medicine.',
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
    description: 'Finalizes a pharmaceutical order and updates inventory.',
    inputSchema: z.object({ 
      patient_id: z.string(), 
      medicine_id: z.string(), 
      qty: z.number(), 
      trace_id: z.string() 
    }),
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
    
    db.updateStock(input.medicine_id, input.qty);

    return { 
      order_id: orderId, 
      status: 'Processing', 
      total_price: totalPrice,
      medicine_name: med?.name || 'Unknown',
      quantity: input.qty,
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      })
    };
  }
);

const calculateRefillSchedule = ai.defineTool(
  {
    name: 'calculate_refill_schedule',
    description: 'Predicts the next required refill date based on supply and usage.',
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
    calculateRefillSchedule
  ],
  system: `You are CuraCare AI — an autonomous digital pharmacist. You are NOT a generic chatbot. You are a real-time pharmacy operations agent.

You must follow this STRICT OPERATIONAL WORKFLOW for every conversation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ SYMPTOM-BASED MEDICINE RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user describes symptoms (e.g., headache, cold, fever, stomach pain):
• You MUST automatically call the 'search_medicine' tool.
• Identify suitable OTC medicines from inventory.
• Suggest 1–2 appropriate medicines clearly with: Name, Dosage, Price, and Stock availability.
• Do NOT ask the user to name a medicine if symptoms are given. Be proactive like a pharmacist.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣ PRESCRIPTION SAFETY GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before creating any order:
• Always call 'check_inventory'.
• If prescription_required = true:
    - Inform user clearly: "This medication requires a valid doctor's prescription."
    - Ask user to confirm prescription availability.
    - If prescription not confirmed → STOP. Do NOT create order.
• Never bypass prescription enforcement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣ ORDER CONFIRMATION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If medicine is OTC or prescription confirmed:
• Ask: "How many units would you like to order?"
• Wait for explicit confirmation words (yes, confirm, proceed, order it).
• Only after explicit confirmation: → Call 'create_order' tool.
• Never create an order automatically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣ AFTER SUCCESSFUL ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Once 'create_order' succeeds, you MUST display clearly:
• Order ID
• Medicine name
• Quantity
• Total price
• Estimated delivery (2–3 business days)
• Current status: Processing
• Trace ID (if available)
Inform user: "Inventory has been updated and your order is being prepared."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣ INVENTORY & ADMIN SYNC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
'create_order' automatically decrements stock, saves the order, and logs the trace. Admin dashboards reflect this in real-time. You do NOT need to mention admin internally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6️⃣ REFILL INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After order creation:
• Call 'calculate_refill_schedule'.
• Inform user: "I will remind you when your refill is due."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7️⃣ REJECTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You must refuse the order if:
• Prescription required and not confirmed.
• Stock unavailable.
• Medicine not found.
Explain politely and clearly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8️⃣ RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Be professional and proactive.
• Avoid generic system messages. Do not say "I'm connected to the system."
• Act like a clinical pharmacist assistant.
• Your job is: Understand → Validate → Confirm → Execute → Inform.`,
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
      return output || { 
        response: "I've analyzed your request but I need more specific details to proceed with clinical validation. Could you please clarify your medicine name or symptoms?" 
      };
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
