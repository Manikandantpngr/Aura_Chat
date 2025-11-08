# **App Name**: LLM Edge Runner

## Core Features:

- Firebase Authentication: Secure user authentication using Firebase Authentication with Google Sign-In and Email/Password providers.
- Backend Configuration: Settings panel to configure the backend URL, model name, temperature, top_p, context_length, and GPU layer offloading. The panel can switch between local and cloud server modes and also display current backend status.
- Chat Interface: ChatGPT-like interface for real-time message streaming with typing effect, error handling, copy-to-clipboard functionality, and clear conversation history button. Message history persists in Firestore.
- Inference Requests: Constructs inference requests from user input, model and settings, and ID token, sends them to the backend server and processes the streaming response.
- Stream Parser: Parses the SSE data stream from the backend, extracts content, and updates the UI in real-time, also implements reconnection logic with exponential backoff and can extract tokens from OpenAI format: chunk.choices[0].delta.content
- Error Handling: Handles various errors, such as backend unreachable, authentication token expired, and network timeout. Also include retry mechanisms for failed requests.
- Access Control Tool: The app incorporates a tool powered by an LLM that filters inference requests to verify Firebase ID tokens, implement rate limiting per user using Cloud Firestore quotas, log inference requests for auditing, and use environment variables for sensitive configurations like model paths and API keys. The LLM is responsible for checking various usage policies before answering.

## Style Guidelines:

- Primary color: Dark Purple (#6200EE) to reflect the cutting-edge AI capabilities, without being cliché.
- Background color: Dark gray (#212121) to support a dark theme, with low saturation to not distract from the content.
- Accent color: Electric blue (#03DAC5) to provide contrast, guide the eye to calls to action, and enhance usability.
- Body text: 'Inter', sans-serif, for a modern, neutral look suitable for extended reading.
- Headline text: 'Space Grotesk', sans-serif, its computerized look contrasts with the body text and provides character in headers.
- Code font: 'Source Code Pro' for displaying code snippets.
- Icons: Flat design style with a line art aesthetic, using the electric blue accent color to maintain visual consistency.
- Use a responsive layout to adapt to different screen sizes. The chat interface should have a clean, intuitive design with clear separation between messages.
- Implement subtle animations for loading states, message delivery, and UI transitions to enhance the user experience without being distracting.