'use server';
/**
 * @fileOverview This file implements the Genkit flow for automated prescription ordering.
 * It defines tools for extracting medicine details, checking prescription requirements,
 * verifying inventory, creating orders, updating inventory, and triggering dispatch webhooks.
 * The main flow orchestrates these tools via an AI agent to fulfill patient medication requests.
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

// --- Tool Schemas ---

const ExtractMedicineDetailsInputSchema = z.object({
  raw_text: z.string().describe('The raw text message from the user containing medicine request details.'),
});
const ExtractMedicineDetailsOutputSchema = z.object({
  medicine_name: z.string().optional().describe('The name of the medicine extracted from the text.'),
  medicine_id: z.string().optional().describe('The ID of the medicine extracted or inferred.'),
  qty: z.number().int().positive().optional().describe('The quantity of the medicine requested.'),
  dosage: z.string().optional().describe('The dosage of the medicine requested (e.g., "10mg", "once a day").'),
}).describe('Extracted medicine details from a natural language request. All fields are optional because extraction might fail.');

const CheckPrescriptionInputSchema = z.object({
  medicine_id: z.string().describe('The ID of the medicine to check prescription requirements for.'),
});
const CheckPrescriptionOutputSchema = z.object({
  prescription_required: z.boolean().describe('True if a prescription is required for the medicine, false otherwise.'),
});

const CheckInventoryInputSchema = z.object({
  medicine_id: z.string().describe('The ID of the medicine to check inventory for.'),
});
const CheckInventoryOutputSchema = z.object({
  stock_qty: z.number().int().positive().describe('The current stock quantity of the medicine.'),
  available: z.boolean().describe('True if the medicine is in stock, false otherwise.'),
});

const CreateOrderInputSchema = z.object({
  patient_id: z.string().describe('The ID of the patient placing the order.'),
  medicine_id: z.string().describe('The ID of the medicine being ordered.'),
  qty: z.number().int().positive().describe('The quantity of the medicine to order.'),
  trace_id: z.string().describe('The trace ID associated with this order request.'),
});
const CreateOrderOutputSchema = z.object({
  order_id: z.string().describe('The unique ID of the created order.'),
  status: z.string().describe('The status of the order (e.g., "created", "pending").'),
});

const UpdateInventoryInputSchema = z.object({
  medicine_id: z.string().describe('The ID of the medicine to update inventory for.'),
  qty_to_reduce: z.number().int().positive().describe('The quantity to reduce from the stock.'),
});
const UpdateInventoryOutputSchema = z.object({
  new_stock_qty: z.number().int().min(0).describe('The new stock quantity after reduction.'),
});

const TriggerWebhookInputSchema = z.object({
  order_id: z.string().describe('The ID of the order to dispatch.'),
  medicine_id: z.string().describe('The ID of the medicine in the order.'),
  qty: z.number().int().positive().describe('The quantity of the medicine in the order.'),
  patient_id: z.string().describe('The ID of the patient for whom the order is dispatched.'),
});
const TriggerWebhookOutputSchema = z.object({
  status: z.number().int().describe('The HTTP status code of the webhook response.'),
  msg: z.string().describe('A message from the webhook (e.g., "dispatched").'),
});

// --- Tool Definitions (Mock Implementations) ---

const extractMedicineDetails = ai.defineTool(
  {
    name: 'extract_medicine_details',
    description: 'Extracts medicine name, ID, quantity, and dosage from a natural language request. If a medicine ID is not explicitly mentioned, it should infer it from the name.',
    inputSchema: ExtractMedicineDetailsInputSchema,
    outputSchema: ExtractMedicineDetailsOutputSchema,
  },
  async (input) => {
    // In a real application, this would involve NLP to parse the raw_text
    // and potentially a database lookup to get medicine_id from medicine_name.
    // For now, we\'ll use a simple mock based on keywords.
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
    } else if (lowerText.includes('two')) {
      qty = 2;
    }


    return {
      medicine_name: medicine_name || undefined,
      medicine_id: medicine_id || undefined,
      qty,
      dosage: dosage || undefined,
    };
  }
);

const checkPrescription = ai.defineTool(
  {
    name: 'check_prescription',
    description: 'Checks if a prescription is required for a given medicine ID.',
    inputSchema: CheckPrescriptionInputSchema,
    outputSchema: CheckPrescriptionOutputSchema,
  },
  async (input) => {
    // In a real application, this would query a database for prescription requirements.
    // Mocking: MED003 (Amoxicillin) and MED004 (Lisinopril) require prescription, others don\'t.
    const prescription_required = input.medicine_id === 'MED003' || input.medicine_id === 'MED004';
    return { prescription_required };
  }
);

const checkInventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: 'Checks the current stock quantity and availability for a given medicine ID.',
    inputSchema: CheckInventoryInputSchema,
    outputSchema: CheckInventoryOutputSchema,
  },
  async (input) => {
    // In a real application, this would query the inventory database.
    // Mocking: Some medicines have low stock, some are plentiful.
    let stock_qty = 0;
    switch (input.medicine_id) {
      case 'MED001': // Paracetamol
        stock_qty = 50;
        break;
      case 'MED002': // Ibuprofen
        stock_qty = 5; // Low stock
        break;
      case 'MED003': // Amoxicillin
        stock_qty = 20;
        break;
      case 'MED004': // Lisinopril
        stock_qty = 0; // Out of stock
        break;
      default:
        stock_qty = 0;
    }
    const available = stock_qty > 0;
    return { stock_qty, available };
  }
);

const createOrder = ai.defineTool(
  {
    name: 'create_order',
    description: 'Creates a new order in the system for a patient.',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input) => {
    // In a real application, this would interact with an order management system.
    const order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const status = 'created';
    console.log(`Order created: ${order_id} for patient ${input.patient_id}, medicine ${input.medicine_id}, qty ${input.qty}`);
    return { order_id, status };
  }
);

const updateInventory = ai.defineTool(
  {
    name: 'update_inventory',
    description: 'Reduces the stock quantity of a medicine after an order is placed.',
    inputSchema: UpdateInventoryInputSchema,
    outputSchema: UpdateInventoryOutputSchema,
  },
  async (input) => {
    // In a real application, this would update the inventory database.
    // For mocking, we\'ll just return a calculated new quantity.
    // This mock doesn\'t persist state, so it\'s a simplification.
    let current_stock = 100; // Assume a generic starting stock for the mock
    switch (input.medicine_id) {
      case 'MED001': current_stock = 50; break;
      case 'MED002': current_stock = 5; break;
      case 'MED003': current_stock = 20; break;
      case 'MED004': current_stock = 0; break;
    }
    const new_stock_qty = Math.max(0, current_stock - input.qty_to_reduce);
    console.log(`Inventory updated for ${input.medicine_id}: reduced by ${input.qty_to_reduce}, new stock: ${new_stock_qty}`);
    return { new_stock_qty };
  }
);

const triggerWebhook = ai.defineTool(
  {
    name: 'trigger_webhook',
    description: 'Triggers a webhook to notify the warehouse for dispatch.',
    inputSchema: TriggerWebhookInputSchema,
    outputSchema: TriggerWebhookOutputSchema,
  },
  async (input) => {
    // In a real application, this would make an HTTP call to the warehouse webhook.
    console.log(`Webhook triggered for order ${input.order_id}, medicine ${input.medicine_id}, qty ${input.qty}, patient ${input.patient_id}`);
    return { status: 200, msg: 'dispatched' };
  }
);

// --- Prompt Definition ---
const autonomousPharmacistPrompt = ai.definePrompt({
  name: 'autonomousPharmacistPrompt',
  input: { schema: AutomatedPrescriptionOrderingInputSchema },
  output: { schema: AutonomousPharmacistOutputSchema },
  tools: [
    extractMedicineDetails,
    checkPrescription,
    checkInventory,
    createOrder,
    updateInventory,
    triggerWebhook,
  ],
  system: `You are an autonomous AI pharmacist. Your goal is to process medication requests from patients.
  Always run tools in the following strict order:
  1. \`extract_medicine_details\` from the user's message.
  2. \`check_prescription\` for the extracted medicine ID.
  3. \`check_inventory\` for the extracted medicine ID.
  4. \`create_order\` using the patient ID, medicine ID, quantity, and trace ID.
  5. \`update_inventory\` by reducing the stock for the ordered medicine ID and quantity.
  6. \`trigger_webhook\` to dispatch the order.

  Never skip the prescription check.
  If \`check_prescription\` returns \`prescription_required=true\` AND no prescription information was explicitly provided in the user's message (which you cannot check directly with current tools, so assume NO prescription is provided for required ones), you MUST reject the order and ask the user to upload a prescription.
  If \`check_inventory\` shows \`stock_qty < requested qty\`, you MUST reject the order and inform the user of the current available quantity.
  If \`extract_medicine_details\` cannot identify a medicine or quantity, you MUST ask the user to clarify.
  If multiple medicines are mentioned in one message, you should attempt to process each one sequentially.
  If any tool fails or returns an unexpected result, respond appropriately to the user, and if an order was partially processed, flag it for manual review (though you cannot set a flag here, just indicate it in the response).

  Respond in the user's language. Your final response should clearly state the outcome of the order.
  If the order is successfully placed, include the order ID.
  If the order fails, clearly state the reason for failure.`,
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
    // The LLM, guided by the system prompt and available tools, will orchestrate the tool calls.
    // The final output of ai.generate will be the LLM\'s natural language response.
    const { output } = await autonomousPharmacistPrompt(input);

    // The output from the prompt is of type AutonomousPharmacistOutputSchema.
    // The LLM is expected to format its final response accordingly, including order_id if successful.
    return output!;
  }
);

export async function automatedPrescriptionOrdering(
  input: AutomatedPrescriptionOrderingInput
): Promise<AutonomousPharmacistOutput> {
  return automatedPrescriptionOrderingFlow(input);
}
