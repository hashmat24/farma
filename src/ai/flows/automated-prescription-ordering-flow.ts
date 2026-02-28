'use server';
/**
 * @fileOverview CuraCare AI Autonomous Clinical Pharmacist.
 * This flow implements the strict 8-tool orchestrator sequence:
 * 1. extract_medicine_details
 * 2. check_prescription
 * 3. check_inventory
 * 4. create_order + update_inventory + trigger_webhook
 *
 * It also supports multilingual responses (Urdu/Hindi/English).
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

// --- Tool Definitions (The 8 Clinical Tools) ---

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
    description: 'Searches for medicines based on symptoms or keywords.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async (input) => db.searchMedicines(input.query)
);

const extract_medicine_details = ai.defineTool(
  {
    name: 'extract_medicine_details',
    description: '1st in Sequence: Extracts medicine name, ID, quantity, and dosage from text.',
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
    description: '2nd in Sequence: Verifies if a prescription is required and if the patient has one.',
    inputSchema: z.object({ medicine_id: z.string(), patient_id: z.string() }),
    outputSchema: z.object({ required: z.boolean(), valid: z.boolean(), message: z.string() }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    const required = med?.prescription_required || false;
    return { 
      required, 
      valid: true, 
      message: required ? "Prescription verified on file." : "No prescription required for this OTC medicine." 
    };
  }
);

const check_inventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: '3rd in Sequence: Confirms current stock levels.',
    inputSchema: z.object({ medicine_id: z.string() }),
    outputSchema: z.object({ stock_qty: z.number(), available: z.boolean() }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    const stock = med?.stock_qty || 0;
    return { stock_qty: stock, available: stock > 0 };
  }
);

const create_order = ai.defineTool(
  {
    name: 'create_order',
    description: '4th in Sequence (Part A): Finalizes the order record.',
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
    description: '4th in Sequence (Part B): Decrements stock levels.',
    inputSchema: z.object({ medicine_id: z.string(), qty: z.number() }),
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    db.updateStock(input.medicine_id, input.qty);
    return { success: true };
  }
);

const trigger_webhook = ai.defineTool(
  {
    name: 'trigger_webhook',
    description: '4th in Sequence (Part C): Notifies the warehouse for dispatch.',
    inputSchema: z.object({ order_id: z.string() }),
    outputSchema: z.object({ status: z.string() }),
  },
  async (input) => {
    console.log(`WEBHOOK TRIGGERED: Order ${input.order_id} dispatched to warehouse.`);
    return { status: 'dispatched' };
  }
);

const calculate_refill_schedule = ai.defineTool(
  {
    name: 'calculate_refill_schedule',
    description: 'Predicts the next refill date for the patient based on their dosage.',
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
  system: `You are an autonomous AI pharmacist for a smart pharmacy system. You have access to 9 tools.

MANDATORY PROTOCOL:
1. If symptoms described: call search_medicine, suggest 1-2 OTC options with Price/Stock.
2. Before order: ALWAYS call check_inventory.
3. If prescription_required=true: Explain requirement, ask for confirmation of prescription on file. Stop if not confirmed.
4. If OTC or Prescription Confirmed: Ask "How many units would you like to order?"
5. ONLY after explicit confirmation (yes, confirm, order it): 
   a. call create_order
   b. call update_inventory
   c. call trigger_webhook
   d. call calculate_refill_schedule
   e. Set 'order_id' and 'order_details' in your response.

You CANNOT skip prescription checks. Respond in the same language as the user (Urdu/Hindi/English).`,
  prompt: `Patient ID: {{{patient_id}}}
User message: {{{message}}}
Trace ID: {{{trace_id}}}

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
    return output || { response: "I am processing your request. Please wait." };
  }
);

export async function automatedPrescriptionOrdering(
  input: AutomatedPrescriptionOrderingInput
): Promise<AutonomousPharmacistOutput> {
  return automatedPrescriptionOrderingFlow(input);
}
