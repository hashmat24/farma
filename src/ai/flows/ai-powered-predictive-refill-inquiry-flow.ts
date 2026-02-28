
'use server';
/**
 * @fileOverview A Genkit flow for handling patient refill inquiries. It uses a tool to calculate
 * predicted refill schedules and then summarizes the information for the user.
 *
 * - aiPoweredPredictiveRefillInquiry - The main function to call for refill inquiries.
 * - PredictiveRefillInquiryInput - The input type for the refill inquiry.
 * - PredictiveRefillInquiryOutput - The return type for the refill inquiry.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Zod schema for the input of the predictive refill inquiry flow.
 */
const PredictiveRefillInquiryInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient making the inquiry.'),
  medicineName: z.string().optional().describe('The name of the medicine for which to check refill status.'),
  medicineId: z.string().optional().describe('The ID of the medicine for which to check refill status.'),
  preferred_language: z.string().optional().describe('The preferred language for the response.'),
});

/**
 * TypeScript type for the input of the predictive refill inquiry flow.
 */
export type PredictiveRefillInquiryInput = z.infer<typeof PredictiveRefillInquiryInputSchema>;

/**
 * Zod schema for the output of the predictive refill inquiry flow.
 */
const PredictiveRefillInquiryOutputSchema = z
  .string()
  .describe('A natural language response regarding the patient\'s refill status for the requested medicine.');

/**
 * TypeScript type for the output of the predictive refill inquiry flow.
 */
export type PredictiveRefillInquiryOutput = z.infer<typeof PredictiveRefillInquiryOutputSchema>;

/**
 * Zod schema for the output of the calculateRefill tool.
 */
const CalculateRefillOutputSchema = z.array(
  z.object({
    medicine: z.string().describe('The name of the medicine.'),
    daysLeft: z.number().describe('Number of days left until the medicine is exhausted.'),
    alert: z.boolean().describe('True if a refill alert should be triggered (daysLeft <= 2).'),
    exhaustionDate: z
      .string()
      .datetime()
      .describe('The estimated date when the medicine will be exhausted (ISO 8601 format).'),
  })
);

/**
 * Defines a mock `calculateRefill` tool for demonstration purposes.
 * In a real application, this would interact with a backend service to fetch actual data.
 */
const calculateRefillTool = ai.defineTool(
  {
    name: 'calculateRefill',
    description:
      'Calculates the predicted refill schedule and exhaustion dates for a patient\'s medications based on their order history and dosage. Can filter by medicine name or ID.',
    inputSchema: z.object({
      patient_id: z.string().describe('The ID of the patient.'),
      medicine_name: z.string().optional().describe('Optional: Name of the specific medicine to check.'),
      medicine_id: z.string().optional().describe('Optional: ID of the specific medicine to check.'),
    }),
    outputSchema: CalculateRefillOutputSchema,
  },
  async input => {
    // Mock implementation for demonstration.
    console.log(`Calling mock calculateRefill tool for patient ${input.patient_id}`);

    if (input.patient_id === 'patient123') {
      if (input.medicine_name && input.medicine_name.toLowerCase().includes('ibuprofen')) {
        return [
          {
            medicine: 'Ibuprofen',
            daysLeft: 1,
            alert: true,
            exhaustionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
      } else if (input.medicine_name && input.medicine_name.toLowerCase().includes('lisinopril')) {
        return [
          {
            medicine: 'Lisinopril',
            daysLeft: 7,
            alert: false,
            exhaustionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
      } else if (input.medicine_id === 'med456') {
        return [
          {
            medicine: 'Specific Medicine 456',
            daysLeft: 3,
            alert: false,
            exhaustionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
      } else if (!input.medicine_name && !input.medicine_id) {
        return [
          {
            medicine: 'Ibuprofen',
            daysLeft: 1,
            alert: true,
            exhaustionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            medicine: 'Lisinopril',
            daysLeft: 7,
            alert: false,
            exhaustionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            medicine: 'Amoxicillin',
            daysLeft: 0,
            alert: true,
            exhaustionDate: new Date(Date.now()).toISOString(),
          },
        ];
      }
    }
    return [];
  }
);

/**
 * Defines the prompt for the AI Pharmacist to handle refill inquiries.
 */
const refillInquiryPrompt = ai.definePrompt({
  name: 'refillInquiryPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: PredictiveRefillInquiryInputSchema},
  output: {schema: PredictiveRefillInquiryOutputSchema},
  tools: [calculateRefillTool],
  system: `You are an AI Pharmacist. Your primary goal is to assist patients with refill inquiries.

To do this, you must use the 'calculateRefill' tool.
When the user asks about refills for a specific patient and optionally a specific medicine, call the 'calculateRefill' tool with the provided patient ID and medicine details.

Summarize the results clearly and empathetically.
Format exhaustion dates in a human-readable format (e.g., "January 1, 2024").
If an alert is triggered (daysLeft <= 2), emphasize this and suggest ordering soon.

Respond in the user's preferred language if provided.

If no information is found, politely inform the user and encourage them to verify the medicine name.`,
  prompt: `Patient ID: {{{patientId}}}
{{#if medicineName}}Medicine Name: {{{medicineName}}}{{/if}}
{{#if medicineId}}Medicine ID: {{{medicineId}}}{{/if}}
{{#if preferred_language}}Preferred Language: {{{preferred_language}}}{{/if}}
`,
});

/**
 * Defines the Genkit flow for predictive refill inquiries.
 */
const aiPoweredPredictiveRefillInquiryFlow = ai.defineFlow(
  {
    name: 'aiPoweredPredictiveRefillInquiryFlow',
    inputSchema: PredictiveRefillInquiryInputSchema,
    outputSchema: PredictiveRefillInquiryOutputSchema,
  },
  async input => {
    const {output} = await refillInquiryPrompt(input);
    return output || "I'm sorry, I couldn't process your refill inquiry at this moment.";
  }
);

export async function aiPoweredPredictiveRefillInquiry(
  input: PredictiveRefillInquiryInput
): Promise<PredictiveRefillInquiryOutput> {
  return aiPoweredPredictiveRefillInquiryFlow(input);
}
