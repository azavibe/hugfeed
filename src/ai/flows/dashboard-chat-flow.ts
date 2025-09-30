
'use server';

/**
 * @fileOverview AI flow for the main dashboard chat interface.
 * This flow can understand user messages, plan tasks, and suggest wellness breaks.
 *
 * - dashboardChat - The primary function to interact with the dashboard AI.
 * - DashboardChatInput - Input schema for the flow.
 * - DashboardChatOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define a tool for adding tasks to the user's calendar
const addTaskTool = ai.defineTool(
    {
        name: 'addTask',
        description: 'Adds a list of tasks and wellness breaks to the user\'s calendar for the day. Use this when the user asks to plan something.',
        inputSchema: z.object({
            tasks: z.array(z.string()).describe("A list of task descriptions to be added."),
        }),
        outputSchema: z.void(),
    },
    async () => {
        // This is a client-side tool. The implementation is handled by the component
        // that calls the flow. Genkit uses this definition for prompting.
    }
);


const DashboardChatInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  userName: z.string().describe("The user's name."),
  message: z.string().describe('The user\'s message.'),
  preferredActivities: z.array(z.string()).describe("A list of the user's preferred wellness activities."),
});
export type DashboardChatInput = z.infer<typeof DashboardChatInputSchema>;

const DashboardChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s conversational response to the user.'),
  tasks: z.array(z.string()).optional().describe('A list of tasks to be added to the calendar, if any were generated.'),
});
export type DashboardChatOutput = z.infer<typeof DashboardChatOutputSchema>;


export async function dashboardChat(input: DashboardChatInput): Promise<DashboardChatOutput> {
  return dashboardChatFlow(input);
}


const dashboardChatFlow = ai.defineFlow(
    {
        name: 'dashboardChatFlow',
        inputSchema: DashboardChatInputSchema,
        outputSchema: DashboardChatOutputSchema,
        experimental: {
            tools: [addTaskTool]
        }
    },
    async (input) => {
        const llmResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            tools: [addTaskTool],
            prompt: `You are a friendly and proactive AI wellness assistant in an app called Hugfeed.
            The user's name is ${input.userName}.
            The user's preferred wellness activities are: ${input.preferredActivities.join(', ') || 'not specified'}.

            Your primary jobs are:
            1.  **Be a conversational partner**: If the user is just chatting, respond in a friendly, supportive, and brief manner.
            2.  **Be a task planner**: If the user asks you to plan something, create a list of tasks for them.
                -   Break down large requests into smaller, specific tasks. (e.g., "work on my project" becomes "1. Research project topic", "2. Create outline").
                -   **CRUCIAL**: For every 2-3 tasks you create, you MUST add a short wellness break. Choose a break from the user's preferred activities. If none are specified, suggest a generic one like "Take a 5-minute stretch break" or "Practice mindful breathing for 2 minutes."
                -   Use the 'addTask' tool to send the list of generated tasks and breaks to the user's calendar.
            3.  **Provide a summary response**: After using the tool (or if you don't need to), give a brief, friendly confirmation message to the user, like "I've added those tasks to your calendar for today!" or "Sounds good, let me know if you need anything else!".

            User's message: "${input.message}"
            `,
        });

        const toolCalls = llmResponse.toolCalls();
        let generatedTasks: string[] = [];
        if (toolCalls.length > 0) {
            for (const call of toolCalls) {
                if (call.tool === 'addTask') {
                    generatedTasks.push(...call.input.tasks);
                }
            }
        }
        
        return {
            response: llmResponse.text(),
            tasks: generatedTasks,
        };
    }
);
