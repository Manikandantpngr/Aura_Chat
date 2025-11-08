# AuraChat

This is a production-grade, full-stack application that provides a modern, ChatGPT-like interface to powerful cloud-based AI models. It features a React/Next.js frontend hosted on Firebase and uses Genkit to connect to Google's AI services.

This project provides a complete starting point for your own GenAI-powered chat application.

## Core Features

- **Cloud-Powered AI**: Natively integrated with Google's Gemini family of models via Genkit for state-of-the-art chat capabilities.
- **Secure Authentication**: Integrated with Firebase Authentication, supporting Google Sign-In and Email/Password.
- **ChatGPT-like UI**: A modern, responsive chat interface with real-time message streaming, conversation history, and a futuristic, animated design.
- **Model Selection**: An intuitive settings panel allows users to switch between different Gemini models, such as Flash and Pro.
- **Persistent Conversations**: Chat history is automatically saved to Cloud Firestore for authenticated users.

## Tech Stack

- **Frontend**: Next.js (App Router) & React
- **Styling**: Tailwind CSS with shadcn/ui components
- **Generative AI**: Genkit with Google Gemini Models
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore (for chat history)
- **Deployment**: Firebase App Hosting

## Getting Started

1.  **Clone the repository.**
2.  **Configure Firebase**: Add your Firebase project configuration to a new `.env.local` file. Your AI assistant will handle this, but if you're setting it up manually, you can find your configuration in the Firebase Console under **Project Settings > General > Your apps > Web app**.
3.  **Install dependencies**: `npm install`
4.  **Run the development server**: `npm run dev`
5.  Open [http://localhost:9002](http://localhost:9002) in your browser.

The application is now fully self-contained and does not require any separate backend server to be run.
