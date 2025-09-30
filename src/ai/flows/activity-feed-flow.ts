
'use server';

/**
 * @fileOverview AI flow to generate personalized suggestions for the user's activity feed.
 *
 * - activityFeedFlow - A function that orchestrates the AI interaction with user data to provide personalized suggestions.
 * - ActivityFeedInput - The input type for the activityFeedFlow function.
 * - ActivityFeedOutput - The return type for the activityFeedFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivityFeedInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  userProfile: z.string().describe('The user\'s profile data, including goals and wellness preferences.'),
  dayData: z.string().describe('Data for the selected day, including tasks and journal entries.'),
});
export type ActivityFeedInput = z.infer<typeof ActivityFeedInputSchema>;

const ActivityFeedOutputSchema = z.object({
  suggestion: z.string().describe('A single, concise suggestion or piece of encouragement for the user.'),
});
export type ActivityFeedOutput = z.infer<typeof ActivityFeedOutputSchema>;

export async function activityFeed(input: ActivityFeedInput): Promise<ActivityFeedOutput> {
  return activityFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'activityFeedPrompt',
  input: {schema: ActivityFeedInputSchema},
  output: {schema: ActivityFeedOutputSchema},
  prompt: `You are an AI emotional wellness coach. Your goal is to provide a single, short, and encouraging suggestion for the user's daily activity feed.

Based on the user's profile and their activities for the day, generate a relevant and supportive message. For example, if they have a lot of tasks, suggest a break. If they have a wellness activity planned, encourage them.

User Profile:
{{userProfile}}

Today's Data:
{{dayData}}

Generate one concise suggestion.
`,
});

const activityFeedFlow = ai.defineFlow(
  {
    name: 'activityFeedFlow',
    inputSchema: ActivityFeedInputSchema,
    outputSchema: ActivityFeedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
