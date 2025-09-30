
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
  recentActivityHistory: z.string().describe('A summary of recently completed and incomplete tasks to identify patterns.'),
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
  prompt: `You are an AI emotional wellness coach. Your goal is to provide a single, short, and encouraging suggestion for the user's daily activity feed. Your suggestions should be adaptive based on what activities the user completes ("what sticks").

Analyze the user's profile, their activities for the day, and their recent completion history.

User Profile (Goals & Preferred Activities):
{{userProfile}}

Today's Data (Tasks, Journal):
{{dayData}}

Recent Activity History (What was completed or not):
{{recentActivityHistory}}

Based on this, generate one concise, actionable, and supportive suggestion.
- If the user is consistently completing a certain type of activity, encourage them to continue.
- If they are consistently failing to complete something, suggest a smaller, easier alternative. For example, if they miss '30-minute walk', suggest a '5-minute stretch break'.
- If they have a lot of tasks, suggest a specific, preferred wellness break.
- If their journal entry indicates stress, suggest a relevant preferred activity.
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
