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
  message: z.string().describe('The natural language request from the patient for medication.'),
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

const checkPrescription = ai.defineTool(
  {
    name: 'check_prescription',
    description: 'Checks if a prescription is required for a medicine.',
    inputSchema: z.object({ medicine_id: z.string() }),
    outputSchema: z.object({ prescription_required: z.boolean() }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    return { prescription_required: med?.prescription_required || false };
  }
);

const checkInventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: 'Checks stock for a medicine.',
    inputSchema: z.object({ medicine_id: z.string() }),
    outputSchema: z.object({ stock_qty: z.number(), available: z.boolean() }),
  },
  async (input) => {
    const med = db.getMedicine(input.medicine_id);
    const stock_qty = med?.stock_qty || 0;
    return { stock_qty, available: stock_qty > 0 };
  }
);

const createOrder = ai.defineTool(
  {
    name: 'create_order',
    description: 'Creates a new order.',
    inputSchema: z.object({ patient_id: z.string(), medicine_id: z.string(), qty: z.number(), trace_id: z.string() }),
    outputSchema: z.object({ order_id: z.string(), status: z.string() }),
  },
  async (input) => {
    const orderId = `ORD-${Date.now()}`;
    db.addOrder({
      id: orderId,
      patient_id: input.patient_id,
      medicine_id: input.medicine_id,
      qty: input.qty,
      date: new Date().toISOString(),
      status: 'pending',
      trace_id: input.trace_id
    });
    return { order_id: orderId, status: 'created' };
  }
);

const updateInventory = ai.defineTool(
  {
    name: 'update_inventory',
    description: 'Updates stock after order.',
    inputSchema: z.object({ medicine_id: z.string(), qty_to_reduce: z.number() }),
    outputSchema: z.object({ new_stock_qty: z.number() }),
  },
  async (input) => {
    const newQty = db.updateStock(input.medicine_id, input.qty_to_reduce);
    return { new_stock_qty: newQty || 0 };
  }
);

// --- Prompt Definition ---
const autonomousPharmacistPrompt = ai.definePrompt({
  name: 'autonomousPharmacistPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AutomatedPrescriptionOrderingInputSchema },
  output: { schema: AutonomousPharmacistOutputSchema },
  tools: [getUserHistory, extractMedicineDetails, checkPrescription, checkInventory, createOrder, updateInventory],
  system: `You are an autonomous AI pharmacist. Process medication requests from patients.
  
  Workflow:
  1. Retrieve patient history using get_user_history to understand context.
  2. Extract details from message.
  3. Check prescription requirement.
  4. Check inventory.
  5. Create order if valid.
  6. Update inventory.

  If a prescription is required but not provided in history or current message, ask for it.
  If out of stock, inform the user.
  Provide a final response as JSON matching the schema, including the detected_entities you found.`,
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
      return output || { response: "I processed your request, but I couldn't generate a clear confirmation. Please check your order history." };
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
