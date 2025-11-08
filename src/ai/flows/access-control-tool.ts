'use server';

/**
 * @fileOverview A tool that filters inference requests to verify Firebase ID tokens,
 * implement rate limiting per user using Cloud Firestore quotas, log inference requests for auditing,
 * and enforce custom usage policies before answering.
 *
 * - accessControlTool - A function that handles the access control process.
 * - AccessControlInput - The input type for the accessControlTool function.
 * - AccessControlOutput - The return type for the accessControlTool function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getApps, initializeApp, App} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {firebaseConfig} from '@/firebase/config';

// Initialize Firebase Admin SDK
function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const AccessControlInputSchema = z.object({
  firebaseIdToken: z
    .string()
    .describe('The Firebase ID token of the user making the request.'),
  request: z
    .object({
      model: z.string().describe('The name of the model being requested.'),
      messages: z
        .array(
          z.object({
            role: z
              .string()
              .describe('The role of the message sender (user or assistant).'),
            content: z.string().describe('The content of the message.'),
          })
        )
        .describe('The messages in the conversation.'),
    })
    .describe('The inference request.'),
});
export type AccessControlInput = z.infer<typeof AccessControlInputSchema>;

const AccessControlOutputSchema = z.object({
  isAllowed: z
    .boolean()
    .describe('Whether the request is allowed to proceed.'),
  reason: z
    .string()
    .optional()
    .describe('The reason the request was denied, if applicable.'),
});
export type AccessControlOutput = z.infer<typeof AccessControlOutputSchema>;

export async function accessControlTool(
  input: AccessControlInput
): Promise<AccessControlOutput> {
  return accessControlFlow(input);
}

const accessControlFlow = ai.defineFlow(
  {
    name: 'accessControlFlow',
    inputSchema: AccessControlInputSchema,
    outputSchema: AccessControlOutputSchema,
  },
  async input => {
    // Verify Firebase ID token
    try {
      const adminApp = getFirebaseAdminApp();
      const adminAuth = getAuth(adminApp);
      await adminAuth.verifyIdToken(input.firebaseIdToken);
    } catch (error) {
      return {
        isAllowed: false,
        reason: 'Firebase ID token verification failed. The user is not authenticated.',
      };
    }

    // TODO: Implement rate limiting per user using Cloud Firestore quotas
    // TODO: Implement logging of inference requests for auditing
    // TODO: Enforce custom usage policies (e.g., check model, content safety)

    // If all checks pass:
    return {
      isAllowed: true,
    };
  }
);
