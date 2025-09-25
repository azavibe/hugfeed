'use server';

/**
 * @fileOverview A mood assessment AI agent.
 *
 * - assessMood - A function that handles the mood assessment process.
 * - MoodAssessmentInput - The input type for the assessMood function.
 * - MoodAssessmentOutput - The return type for the assessMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodAssessmentInputSchema = z.object({
  goals: z.string().describe('Your goals for the day.'),
  causes: z.string().describe('The causes affecting your mood.'),
  feelings: z.string().describe('Your current feelings.'),
  sleep: z.string().describe('Your sleep quality.'),
  happiness: z.string().describe('Your level of happiness.'),
});
export type MoodAssessmentInput = z.infer<typeof MoodAssessmentInputSchema>;

const MoodAssessmentOutputSchema = z.object({
  summary: z.string().describe('A summarized view of your current emotional state.'),
});
export type MoodAssessmentOutput = z.infer<typeof MoodAssessmentOutputSchema>;

export async function assessMood(input: MoodAssessmentInput): Promise<MoodAssessmentOutput> {
  return assessMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moodAssessmentPrompt',
  input: {schema: MoodAssessmentInputSchema},
  output: {schema: MoodAssessmentOutputSchema},
  prompt: `You are an AI assistant designed to analyze mood assessment questionnaires and provide a summarized view of the user's current emotional state.

  Analyze the following information provided by the user:

  Goals: {{{goals}}}
  Causes: {{{causes}}}
  Feelings: {{{feelings}}}
  Sleep: {{{sleep}}}
  Happiness: {{{happiness}}}

  Provide a concise summary of the user's current emotional state based on the provided information.
  `,
});

const assessMoodFlow = ai.defineFlow(
  {
    name: 'assessMoodFlow',
    inputSchema: MoodAssessmentInputSchema,
    outputSchema: MoodAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
