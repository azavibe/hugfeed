'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input/Output schemas
const AICoachInputSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userMessage: z.string(),
  calendarContext: z.string().optional(),
});

const AICoachOutputSchema = z.object({
  response: z.string(),
  tasksToAdd: z.array(z.object({
    content: z.string(),
    completed: z.boolean().default(false)
  })).optional(),
});

export type AICoachInput = z.infer<typeof AICoachInputSchema>;
export type AICoachOutput = z.infer<typeof AICoachOutputSchema>;

// Define task creation tool
const createTasksTool = ai.defineTool(
  {
    name: 'createTasks',
    description: 'Create tasks for the user when they ask for planning or task suggestions',
    inputSchema: z.object({
      tasks: z.array(z.string()).describe('List of task descriptions to create'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      taskCount: z.number(),
    }),
  },
  async ({ tasks }) => {
    console.log('AI wants to create tasks:', tasks);
    return { success: true, taskCount: tasks.length };
  }
);

// Main AI coach flow
const aiCoachFlow = ai.defineFlow(
  {
    name: 'aiCoachFlow',
    inputSchema: AICoachInputSchema,
    outputSchema: AICoachOutputSchema,
  },
  async (input) => {
    const prompt = `You are a supportive AI wellness coach. 

User: ${input.userName}
Message: "${input.userMessage}"
${input.calendarContext ? `\nContext: ${input.calendarContext}` : ''}

If the user asks for planning, task creation, or says things like "plan my day", "help me organize", "create tasks", use the createTasks tool to generate specific, actionable tasks.

For every 2-3 work tasks, include a wellness break task like "Take a 5-minute walk" or "Practice deep breathing".

Otherwise, provide supportive conversation and wellness advice.`;

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt,
        tools: [createTasksTool],
      });

      let tasksToAdd: { content: string; completed: boolean }[] = [];
      
      // Check if AI used the task creation tool
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          if (toolCall.tool === 'createTasks') {
            const tasks = toolCall.input.tasks as string[];
            tasksToAdd = tasks.map(taskContent => ({
              content: taskContent,
              completed: false
            }));
            console.log('Tasks to add:', tasksToAdd);
          }
        }
        
        // Get final response after tool execution
        const finalResponse = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          prompt: [
            { role: 'user', content: [{ type: 'text', text: prompt }] },
            response.message,
            {
              role: 'tool',
              content: [{
                type: 'toolResponse',
                ref: response.toolCalls[0].ref,
                data: { output: { success: true, taskCount: tasksToAdd.length } }
              }]
            }
          ],
        });
        
        return {
          response: finalResponse.text,
          tasksToAdd: tasksToAdd.length > 0 ? tasksToAdd : undefined,
        };
      }
      
      return {
        response: response.text,
        tasksToAdd: undefined,
      };
      
    } catch (error) {
      console.error('AI Coach Error:', error);
      return {
        response: "I'm having trouble connecting right now. Please try again in a moment.",
        tasksToAdd: undefined,
      };
    }
  }
);

export async function aiCoachCalendarIntegration(input: AICoachInput): Promise<AICoachOutput> {
  return await aiCoachFlow(input);
}
