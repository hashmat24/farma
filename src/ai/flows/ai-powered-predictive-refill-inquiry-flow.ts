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
    // In a production environment, this would call a backend service (e.g., database, API).
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
        // Return all medicines for the patient if no specific medicine is requested
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
    return []; // No data for other patients or if medicine not found
  }
);

/**
 * Defines the prompt for the AI Pharmacist to handle refill inquiries.
 * It makes the `calculateRefillTool` available for the LLM to use.
 */
const refillInquiryPrompt = ai.definePrompt({
  name: 'refillInquiryPrompt',
  input: {schema: PredictiveRefillInquiryInputSchema},
  output: {schema: PredictiveRefillInquiryOutputSchema},
  tools: [calculateRefillTool], // Make the tool available to the prompt
  system: `You are an AI Pharmacist. Your primary goal is to assist patients with refill inquiries.

To do this, you must use the 'calculateRefill' tool.
When the user asks about refills for a specific patient and optionally a specific medicine, call the 'calculateRefill' tool with the provided patient ID and medicine details (medicine name or ID, if any).

Then, summarize the results from the tool in a clear, concise, and empathetic manner.

If there are multiple medicines, list them clearly with their status. If only one medicine is inquired about, provide a specific answer for that medicine.

If no refill information is found, or if the tool returns an empty list, politely inform the user that you could not find information for their request at this time. Encourage them to verify the medicine name or contact support if needed.

Format exhaustion dates in a human-readable format (e.g., "January 1, 2024").
If an alert is triggered (daysLeft <= 2), emphasize this and suggest ordering soon or now.

Example response for multiple medicines:
"Hello! Here's your refill status:
- Ibuprofen: You have about 1 day left. Your estimated exhaustion date is January 1, 2024. Please order soon!
- Lisinopril: You have about 7 days left. Your estimated exhaustion date is January 7, 2024. You have plenty of time.
- Amoxicillin: You are out of this medicine. Your estimated exhaustion date was December 31, 2023. Please order a refill now!"

Example response for a single medicine with alert:
"Hello! For Ibuprofen, you have about 1 day left. Your estimated exhaustion date is January 1, 2024. Please order soon!"

Example response for no medicines:
"Hello! I couldn't find any refill information for the requested medicine or for your account at this time. Please ensure the medicine name is correct or contact support."
  `,
  prompt: `Patient ID: {{{patientId}}}
{{#if medicineName}}Medicine Name: {{{medicineName}}}{{/if}}
{{#if medicineId}}Medicine ID: {{{medicineId}}}{{/if}}
`,
});

/**
 * Defines the Genkit flow for predictive refill inquiries.
 * It orchestrates the call to the AI Pharmacist prompt.
 */
const aiPoweredPredictiveRefillInquiryFlow = ai.defineFlow(
  {
    name: 'aiPoweredPredictiveRefillInquiryFlow',
    inputSchema: PredictiveRefillInquiryInputSchema,
    outputSchema: PredictiveRefillInquiryOutputSchema,
  },
  async input => {
    const {output} = await refillInquiryPrompt(input);
    return output!;
  }
);

/**
 * Wrapper function to call the AI-powered predictive refill inquiry flow.
 * @param input The patient ID and optional medicine details.
 * @returns A promise that resolves to a natural language response regarding refill status.
 */
export async function aiPoweredPredictiveRefillInquiry(
  input: PredictiveRefillInquiryInput
): Promise<PredictiveRefillInquiryOutput> {
  return aiPoweredPredictiveRefillInquiryFlow(input);
}
