'use server';

/**
 * @fileOverview AI coach flow that integrates with the user's calendar data (mood, journal entries, tasks).
 *
 * - aiCoachCalendarIntegration - A function that orchestrates the AI coach interaction with calendar data to provide personalized suggestions.
 * - AICoachCalendarIntegrationInput - The input type for the aiCoachCalendarIntegration function.
 * - AICoachCalendarIntegrationOutput - The return type for the aiCoachCalendarIntegration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AICoachCalendarIntegrationInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  calendarData: z.string().describe('The calendar data of the user including mood, journal entries, and tasks.'),
  query: z.string().describe('The user query or request to the AI coach.'),
  imageUri: z
    .string()
    .optional()
    .describe(
      "An optional image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AICoachCalendarIntegrationInput = z.infer<typeof AICoachCalendarIntegrationInputSchema>;

const AICoachCalendarIntegrationOutputSchema = z.object({
  response: z.string().describe('The AI coach response to the user query, incorporating calendar data.'),
  suggestedTasks: z.array(z.string()).describe('A list of suggested tasks based on the calendar data.'),
});
export type AICoachCalendarIntegrationOutput = z.infer<typeof AICoachCalendarIntegrationOutputSchema>;

export async function aiCoachCalendarIntegration(input: AICoachCalendarIntegrationInput): Promise<AICoachCalendarIntegrationOutput> {
  return aiCoachCalendarIntegrationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachCalendarIntegrationPrompt',
  input: {schema: AICoachCalendarIntegrationInputSchema},
  output: {schema: AICoachCalendarIntegrationOutputSchema},
  prompt: `You are an AI emotional wellness coach.

You have access to the user's calendar data, which includes their mood, journal entries, and tasks. Use this information to provide personalized and relevant suggestions for rituals and tasks.

Calendar Data:
{{calendarData}}

User Query:
{{query}}

{{#if imageUri}}
The user has also uploaded an image.  Analyze it in relation to the calendar data and user query to provide a more insightful response. Photo: {{media url=imageUri}}
{{/if}}

Respond to the user query, incorporating insights from the calendar data. Also, suggest a few specific tasks that the user can add to their calendar to improve their well-being. Return the response and suggested tasks in the format specified by the output schema.
`,
});

const aiCoachCalendarIntegrationFlow = ai.defineFlow(
  {
    name: 'aiCoachCalendarIntegrationFlow',
    inputSchema: AICoachCalendarIntegrationInputSchema,
    outputSchema: AICoachCalendarIntegrationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
