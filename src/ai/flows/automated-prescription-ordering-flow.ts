
'use server';
/**
 * @fileOverview CuraCare AI Autonomous Clinical Pharmacist with Mandatory Langfuse Observability.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/app/lib/db';
import { langfuse } from '@/ai/langfuse';
import { sendOrderEmail } from '@/app/lib/email-service';

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
  photoDataUri: z.string().optional().describe("A photo of a prescription, as a data URI."),
  preferred_language: z.string().optional().describe('The preferred language for the response.'),
});
export type AutomatedPrescriptionOrderingInput = z.infer<typeof AutomatedPrescriptionOrderingInputSchema>;

const AutonomousPharmacistOutputSchema = z.object({
  response: z.string().describe("The AI pharmacist's response."),
  order_id: z.string().optional().describe('The ID of the created order.'),
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

// --- Tool Definitions with Langfuse Span Instrumentation ---

const get_user_history = ai.defineTool(
  {
    name: 'get_user_history',
    description: 'Retrieves clinical background for a patient.',
    inputSchema: z.object({ patient_id: z.string(), trace_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const span = langfuse.span({ name: 'get_user_history', input, traceId: input.trace_id });
    const patient = db.getPatient(input.patient_id);
    const history = db.getPatientHistory(input.patient_id);
    const output = { name: patient?.name, history: patient?.history, past_orders: history, email: patient?.email };
    span.end({ output });
    return output;
  }
);

const check_prescription = ai.defineTool(
  {
    name: 'check_prescription',
    description: 'Verifies prescription requirements.',
    inputSchema: z.object({ medicine_id: z.string(), patient_id: z.string(), trace_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const span = langfuse.span({ name: 'check_prescription', input, traceId: input.trace_id });
    const med = db.getMedicine(input.medicine_id);
    const required = med?.prescription_required || false;
    const output = { required, valid: true, message: required ? "Prescription verified." : "No prescription required (OTC)." };
    span.end({ output });
    return output;
  }
);

const check_inventory = ai.defineTool(
  {
    name: 'check_inventory',
    description: 'Confirms current stock levels.',
    inputSchema: z.object({ medicine_id: z.string(), trace_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const span = langfuse.span({ name: 'check_inventory', input, traceId: input.trace_id });
    const med = db.getMedicine(input.medicine_id);
    const output = { stock_qty: med?.stock_qty || 0, available: (med?.stock_qty || 0) > 0, unit_price: med?.unit_price || 0 };
    span.end({ output });
    return output;
  }
);

const create_order = ai.defineTool(
  {
    name: 'create_order',
    description: 'Finalizes the clinical order record.',
    inputSchema: z.object({ patient_id: z.string(), medicine_id: z.string(), qty: z.number(), trace_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const span = langfuse.span({ name: 'create_order', input, traceId: input.trace_id });
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
    span.end({ output: order });
    return order;
  }
);

const update_inventory = ai.defineTool(
  {
    name: 'update_inventory',
    description: 'Decrements physical stock levels.',
    inputSchema: z.object({ medicine_id: z.string(), qty: z.number(), trace_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const span = langfuse.span({ name: 'update_inventory', input, traceId: input.trace_id });
    const newQty = db.updateStock(input.medicine_id, input.qty);
    const output = { success: true, new_stock_qty: newQty || 0 };
    span.end({ output });
    return output;
  }
);

const trigger_webhook = ai.defineTool(
  {
    name: 'trigger_webhook',
    description: 'Notifies the warehouse logistics system.',
    inputSchema: z.object({ order_id: z.string(), trace_id: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    const span = langfuse.span({ name: 'trigger_webhook', input, traceId: input.trace_id });
    const dispatchRef = `WH-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const output = { status: 'dispatched', dispatch_ref: dispatchRef };
    span.end({ output });
    return output;
  }
);

const send_confirmation_email = ai.defineTool(
  {
    name: 'send_confirmation_email',
    description: 'Sends a clinical order confirmation email to the patient.',
    inputSchema: z.object({ 
      patient_id: z.string(), 
      order_id: z.string(), 
      medicine_id: z.string(), 
      qty: z.number(),
      trace_id: z.string() 
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const span = langfuse.span({ name: 'send_confirmation_email', input, traceId: input.trace_id });
    const patient = db.getPatient(input.patient_id);
    const med = db.getMedicine(input.medicine_id);
    
    if (!patient?.email || !med) {
      span.end({ output: { success: false, message: 'Missing patient or medicine info' } });
      return { success: false };
    }

    const result = await sendOrderEmail({
      to: patient.email,
      patientName: patient.name,
      orderId: input.order_id,
      medicineName: med.name,
      dosage: med.dosage,
      quantity: input.qty,
      totalPrice: med.unit_price * input.qty
    });

    span.end({ output: result });
    return result;
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
    check_prescription,
    check_inventory,
    create_order,
    update_inventory,
    trigger_webhook,
    send_confirmation_email
  ],
  system: `You are CuraCare AI, a proactive autonomous clinical pharmacist assistant. 
Follow the 5-step sequence exactly:
1. Retrieve history & verify prescription.
2. Check inventory availability.
3. Confirm with user before creating order.
4. Execute mutations: create_order & update_inventory.
5. Trigger warehouse webhook AND send_confirmation_email immediately.

Always ensure you pass the provided 'trace_id' to every tool call for observability.`,
  prompt: `Patient ID: {{{patient_id}}}
User message: {{{message}}}
Trace ID: {{{trace_id}}}
{{#if preferred_language}}Language: {{{preferred_language}}}{{/if}}
{{#if photoDataUri}}Prescription Image: {{media url=photoDataUri}}{{/if}}`,
});

// --- Main Flow Definition with Langfuse Trace Management ---

const automatedPrescriptionOrderingFlow = ai.defineFlow(
  {
    name: 'automatedPrescriptionOrderingFlow',
    inputSchema: AutomatedPrescriptionOrderingInputSchema,
    outputSchema: AutonomousPharmacistOutputSchema,
  },
  async (input) => {
    // Initialize Langfuse Trace for project "Eyes"
    const trace = langfuse.trace({
      name: 'autonomousPharmacistFlow',
      id: input.trace_id,
      userId: input.patient_id,
      input: input.message,
      metadata: { language: input.preferred_language, hasPhoto: !!input.photoDataUri }
    });

    try {
      const { output } = await autonomousPharmacistPrompt(input);
      
      const finalOutput = output || { response: "I'm sorry, I'm having trouble processing your request." };
      trace.update({ output: finalOutput });
      return finalOutput;
    } catch (error: any) {
      trace.update({ output: { error: error.message } });
      throw error;
    } finally {
      // Ensure data is sent to Langfuse
      await langfuse.flush();
    }
  }
);

export async function automatedPrescriptionOrdering(
  input: AutomatedPrescriptionOrderingInput
): Promise<AutonomousPharmacistOutput> {
  return automatedPrescriptionOrderingFlow(input);
}
