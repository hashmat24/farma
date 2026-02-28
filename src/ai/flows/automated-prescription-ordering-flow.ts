'use server';
/**
 * @fileOverview CuraCare AI Autonomous Clinical Pharmacist.
 * This flow implements the strict 8-tool orchestrator sequence:
 * 1. extract_medicine_details
 * 2. check_prescription
 * 3. check_inventory
 * 4. create_order + update_inventory + trigger_webhook
 *
 * It also supports multilingual responses (Urdu/Hindi/Marathi/English) and multimodal prescription analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/app/lib/db';

// --- Schema Definitions ---

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.string(),
});

const AutomatedPrescriptionOrderingInputSchema = z.object({
  patient_id: z.string().describe('The ID of the patient making the request.'),
  message: z.string().describe('The natural language request.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
  trace_id: z.string().describe('A unique identifier for the current trace/session.'),
  photoDataUri: z.string().optional().describe("A photo of a prescription, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AutomatedPrescriptionOrderingInput = z.infer<typeof AutomatedPrescriptionOrderingInputSchema>;

const AutonomousPharmacistOutputSchema = z.object({
  response: z.string().describe("The AI pharmacist's response."),
  order_id: z.string().optional().describe('The ID of the created order, if applicable.'),
  order_details: z.object({
    medicineName: z.string(),
    qty: z.number(),
    totalPrice: z.number(),
    deliveryDate: z.string(),
  }).optional(),
  detected_entities: z.object({
    medicineName: z.string().optional(),
    dosage: z.string().optional(),
    qty: z.string().optional(),
  }).optional(),
});
export type AutonomousPharmacistOutput = z.infer<typeof AutonomousPharmacistOutputSchema>;

// --- Tool Definitions (The Clinical Tools) ---

const get_user_history = ai.defineTool(
  {
    name: 'get_user_history',
    description: 'Retrieves the clinical background and previous orders for a patient.',
    inputSchema: z.object({ patient_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const patient = db.getPatient(input.patient_id);
    const history = db.getPatientHistory(input.patient_id);
    return { name: patient?.name, history: patient?.history, past_orders: history };
  }
);

const search_medicine = ai.defineTool(
  {
    name: 'search_medicine',
    description: 'Searches for medicines based on symptoms (e.g., headache, fever) or keywords.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async (input) => db.searchMedicines(input.query)
);

const extract_medicine_details = ai.defineTool(
  {
    name: 'extract_medicine_details',
    description: 'Step 1: Analyzes text and images to extract medicine name, ID, quantity, and dosage.',
    inputSchema: z.object({ raw_text: z.string() }),
    outputSchema: z.object({
      medicine_name: z.string().optional(),
      medicine_id: z.string().optional(),
      qty: z.number().optional(),
      dosage: z.string().optional(),
    }),
  },
  async (input) => {
    const lowerText = input.raw_text.toLowerCase();
    const medicines = db.getMedicines();
    const med = medicines.find(m => lowerText.includes(m.name.toLowerCase()));
    
    // Simple regex for quantity (looks for numbers)
    const qtyMatch = lowerText.match(/(\d+)/);
    
    return {
      medicine_name: med?.name,
      medicine_id: med?.id,
      qty: qtyMatch ? parseInt(qtyMatch[1], 10) : undefined,
      dosage: med?.dosage
    };
  }
);

const check_prescription = ai.defineTool(
  {
    name: 'check_prescription',
    description: 'Step 2: Verifies if a prescription is required for the medicine.',
    inputSchema: z.object({ medicine_id: z.string(), patient_id: z.string() }),
    outputSchema: z.object({ required: z.boolean(), valid: z.boolean(), message: z.string() }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    const required = med?.prescription_required || false;
    // For prototype, we assume the prescription on file is valid if they confirm it
    return { 
      required, 
      valid: true, 
      message: required ? "Prescription verified." : "No prescription required (OTC)." 
    };
  }
);

const check_inventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: 'Step 3: Confirms current stock levels for a specific medicine.',
    inputSchema: z.object({ medicine_id: z.string() }),
    outputSchema: z.object({ stock_qty: z.number(), available: z.boolean(), unit_price: z.number() }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    const stock = med?.stock_qty || 0;
    return { 
      stock_qty: stock, 
      available: stock > 0,
      unit_price: med?.unit_price || 0
    };
  }
);

const create_order = ai.defineTool(
  {
    name: 'create_order',
    description: 'Step 4a: Finalizes the order and creates a record in the system.',
    inputSchema: z.object({ patient_id: z.string(), medicine_id: z.string(), qty: z.number(), trace_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const order = {
      id: orderId,
      patient_id: input.patient_id,
      medicine_id: input.medicine_id,
      qty: input.qty,
      date: new Date().toISOString(),
      status: 'processing' as const,
      trace_id: input.trace_id,
      total_price: (med?.unit_price || 0) * input.qty
    };
    db.addOrder(order);
    return order;
  }
);

const update_inventory = ai.defineTool(
  {
    name: 'update_inventory',
    description: 'Step 4b: Decrements stock levels immediately after order creation.',
    inputSchema: z.object({ medicine_id: z.string(), qty: z.number() }),
    outputSchema: z.object({ success: z.boolean(), new_stock_qty: z.number() }),
  },
  async (input) => {
    const newQty = db.updateStock(input.medicine_id, input.qty);
    return { success: true, new_stock_qty: newQty || 0 };
  }
);

const trigger_webhook = ai.defineTool(
  {
    name: 'trigger_webhook',
    description: 'Step 4c: Notifies the warehouse logistics system for dispatch.',
    inputSchema: z.object({ order_id: z.string() }),
    outputSchema: z.object({ status: z.string(), dispatch_ref: z.string() }),
  },
  async (input) => {
    const dispatchRef = `WH-${Math.random().toString(36).substring(7).toUpperCase()}`;
    return { status: 'dispatched', dispatch_ref: dispatchRef };
  }
);

const calculate_refill_schedule = ai.defineTool(
  {
    name: 'calculate_refill_schedule',
    description: 'Predicts the next refill date based on current order quantity.',
    inputSchema: z.object({ patient_id: z.string(), medicine_id: z.string(), qty: z.number() }),
    outputSchema: z.object({ refill_date: z.string() }),
  },
  async (input) => {
    const dosagePerDay = 1;
    const daysCovered = input.qty / dosagePerDay;
    const refillDate = new Date(Date.now() + (daysCovered - 2) * 24 * 60 * 60 * 1000);
    return { refill_date: refillDate.toISOString() };
  }
);

// --- Prompt Definition ---

const autonomousPharmacistPrompt = ai.definePrompt({
  name: 'autonomousPharmacistPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AutomatedPrescriptionOrderingInputSchema },
  output: { schema: AutonomousPharmacistOutputSchema },
  tools: [
    get_user_history,
    search_medicine,
    extract_medicine_details,
    check_prescription,
    check_inventory,
    create_order,
    update_inventory,
    trigger_webhook,
    calculate_refill_schedule
  ],
  system: `You are CuraCare AI, a proactive autonomous clinical pharmacist assistant. 

OPERATIONAL STATE MACHINE:
1. GATHERING: If symptoms described or prescription photo provided, call search_medicine or extract_medicine_details and suggest options.
2. VALIDATION: Once a medicine is selected, call extract_medicine_details, then check_prescription, then check_inventory.
3. CONFIRMATION: Ask "You want to order [Qty] of [Medicine]. Should I proceed?"
4. EXECUTION: If user says "yes", "confirm", "proceed", or similar:
   - Call create_order
   - Call update_inventory
   - Call trigger_webhook
   - Call calculate_refill_schedule
   - Return the order_id and order_details in your final response.

MANDATORY RULES:
- Never skip Step 2 (Prescription Check).
- Never skip Step 3 (Inventory Check).
- Never create an order without explicit confirmation.
- Respond in the user's language (Urdu/Hindi/Marathi/English).
- If a photo is provided, use it to identify the medicine and dosage.

If the user confirms, you MUST execute all 4 execution tools in Step 4.`,
  prompt: `Patient ID: {{{patient_id}}}
User message: {{{message}}}
Trace ID: {{{trace_id}}}

{{#if photoDataUri}}Prescription Image: {{media url=photoDataUri}}{{/if}}

Conversation History:
{{#each history}}
{{role}}: {{content}}
{{/each}}`,
});

// --- Main Flow Definition ---

const automatedPrescriptionOrderingFlow = ai.defineFlow(
  {
    name: 'automatedPrescriptionOrderingFlow',
    inputSchema: AutomatedPrescriptionOrderingInputSchema,
    outputSchema: AutonomousPharmacistOutputSchema,
  },
  async (input) => {
    const { output } = await autonomousPharmacistPrompt(input);
    return output || { response: "I'm sorry, I'm having trouble processing your request. Please try again." };
  }
);

export async function automatedPrescriptionOrdering(
  input: AutomatedPrescriptionOrderingInput
): Promise<AutonomousPharmacistOutput> {
  return automatedPrescriptionOrderingFlow(input);
}
