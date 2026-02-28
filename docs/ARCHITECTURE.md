# CuraCare AI: Technical Architecture Document

## 1. SYSTEM OVERVIEW
CuraCare AI is an agentic healthcare system that leverages LLM-based orchestration to automate pharmaceutical inventory and patient order management. It uses a **Next.js 15** frontend and backend (Server Actions), with **Genkit 1.x** managing the AI's tool-calling logic and **Firestore** as the primary data layer.

## 2. FOLDER STRUCTURE
- `src/ai/`: Contains Genkit configuration and AI flows. The "Brain" of the system.
- `src/app/actions/`: Server-side functions (Next.js Server Actions) that bridge the UI and AI flows.
- `src/app/lib/`: Database interface and shared business logic.
- `src/components/`: Reusable UI components (React).
- `src/firebase/`: Real-time listeners and Firebase SDK initialization.

## 3. FRONTEND ARCHITECTURE
- **React 19**: Utilizes concurrent rendering and server actions.
- **State Flow**: The UI captures user input -> Server Action -> AI Flow -> Result -> UI State Update.
- **Reasoning Panel**: A dedicated component that visualizes the simulated "Chain of Thought" by mapping tool executions to UI indicators.

## 4. BACKEND ARCHITECTURE (Next.js Server Actions)
- **No FastAPI**: We do not use FastAPI or any external Python backends.
- **Server Actions**: Functions are exported with `'use server'` and called directly from Client Components. This provides end-to-end TypeScript safety.
- **Execution Flow**: Each action initializes the Genkit environment and passes execution to a specific **Flow**.

## 5. DATABASE DESIGN
- **No SQLite**: We use **Firestore** for its real-time capabilities and seamless integration with Firebase Auth.
- **Medicines**: Stores metadata, pricing, and stock levels.
- **Patients**: Stores history and membership data.
- **Orders**: Relational link between Patients and Medicines.
- **Refill Logic**: Calculated in `db.ts` based on order timestamps and dosage.

## 6. AI ORCHESTRATION LAYER (Firebase Genkit)
- **Model**: Gemini 1.5 Flash (via `@genkit-ai/google-genai`).
- **Tool Calling**: Genkit's `ai.defineTool` manages the interface between the LLM and TypeScript functions.
- **Execution Flow**:
  1. Prompt receives User Input.
  2. LLM emits a tool call (e.g., `check_inventory`).
  3. Genkit executes the TypeScript function.
  4. Genkit sends result back to LLM.
  5. LLM generates final response.

## 7. AGENTIC DESIGN PATTERN
- **Autonomy**: The agent determines the order of operations based on clinical requirements.
- **Tool Augmentation**: The LLM must query the `check_inventory` tool to be grounded in reality.
- **Safety Gates**: The LLM is strictly forbidden from calling `create_order` without first calling `check_prescription`.

## 8. OBSERVABILITY (Langfuse)
- **Audit Trail**: Every AI interaction generates a `trace_id`.
- **Relational Traceability**: Order records store this `trace_id` for compliance and clinical auditing.
- **Integration**: The UI provides deep-links to the Langfuse dashboard to audit the LLM's clinical reasoning steps.

## 9. SAFETY & VALIDATION
- **Zod Schemas**: Every tool and flow has strict input/output validation via Zod.
- **System Instructions**: The "OPERATIONAL STATE MACHINE" in the system prompt ensures the AI follows mandatory clinical guidelines.

## 10. TECH STACK SUMMARY
- **Frontend/Backend**: Next.js 15 (App Router)
- **AI Framework**: Firebase Genkit 1.x
- **Database**: Firestore (Mocked for Prototype)
- **Styling**: Tailwind CSS + ShadCN UI
- **Observability**: Langfuse
