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
});
export type AutonomousPharmacistOutput = z.infer<typeof AutonomousPharmacistOutputSchema>;

// --- Tool Definitions (Mock Implementations) ---

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
    let medicine_name = '';
    let medicine_id = '';
    let qty: number | undefined;
    let dosage = '';

    if (lowerText.includes('paracetamol') || lowerText.includes('tylenol')) {
      medicine_name = 'Paracetamol';
      medicine_id = 'MED001';
      dosage = '500mg';
    } else if (lowerText.includes('ibuprofen')) {
      medicine_name = 'Ibuprofen';
      medicine_id = 'MED002';
      dosage = '200mg';
    } else if (lowerText.includes('amoxicillin')) {
      medicine_name = 'Amoxicillin';
      medicine_id = 'MED003';
      dosage = '250mg';
    } else if (lowerText.includes('lisinopril')) {
      medicine_name = 'Lisinopril';
      medicine_id = 'MED004';
      dosage = '10mg';
    }

    const qtyMatch = lowerText.match(/(\d+)\s*(pill|tablet|capsule|item|unit)s?/);
    if (qtyMatch && qtyMatch[1]) {
      qty = parseInt(qtyMatch[1], 10);
    } else if (lowerText.includes('one') || lowerText.includes('a ')) {
      qty = 1;
    }

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
  async (input) => ({ prescription_required: input.medicine_id === 'MED003' || input.medicine_id === 'MED004' })
);

const checkInventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: 'Checks stock for a medicine.',
    inputSchema: z.object({ medicine_id: z.string() }),
    outputSchema: z.object({ stock_qty: z.number(), available: z.boolean() }),
  },
  async (input) => {
    let stock_qty = 50;
    if (input.medicine_id === 'MED002') stock_qty = 5;
    if (input.medicine_id === 'MED004') stock_qty = 0;
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
  async (input) => ({ order_id: `ORD-${Date.now()}`, status: 'created' })
);

const updateInventory = ai.defineTool(
  {
    name: 'update_inventory',
    description: 'Updates stock after order.',
    inputSchema: z.object({ medicine_id: z.string(), qty_to_reduce: z.number() }),
    outputSchema: z.object({ new_stock_qty: z.number() }),
  },
  async (input) => ({ new_stock_qty: 10 })
);

const triggerWebhook = ai.defineTool(
  {
    name: 'trigger_webhook',
    description: 'Triggers warehouse dispatch.',
    inputSchema: z.object({ order_id: z.string(), medicine_id: z.string(), qty: z.number(), patient_id: z.string() }),
    outputSchema: z.object({ status: z.number(), msg: z.string() }),
  },
  async (input) => ({ status: 200, msg: 'dispatched' })
);

// --- Prompt Definition ---
const autonomousPharmacistPrompt = ai.definePrompt({
  name: 'autonomousPharmacistPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AutomatedPrescriptionOrderingInputSchema },
  output: { schema: AutonomousPharmacistOutputSchema },
  tools: [extractMedicineDetails, checkPrescription, checkInventory, createOrder, updateInventory, triggerWebhook],
  system: `You are an autonomous AI pharmacist. Process medication requests from patients.
  Always use the available tools to fulfill requests.
  
  Steps to follow:
  1. Extract details from message.
  2. Check prescription requirement.
  3. Check inventory.
  4. Create order if valid.
  5. Update inventory.
  6. Trigger warehouse dispatch.

  If a prescription is required but not provided, ask for it.
  If out of stock, inform the user.
  Provide a final response as JSON matching the schema.`,
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
    const { output } = await autonomousPharmacistPrompt(input);
    if (!output) {
      return { response: "I'm sorry, I couldn't complete your order request. Please try again or contact support." };
    }
    return output;
  }
);

export async function automatedPrescriptionOrdering(
  input: AutomatedPrescriptionOrderingInput
): Promise<AutonomousPharmacistOutput> {
  return automatedPrescriptionOrderingFlow(input);
}
