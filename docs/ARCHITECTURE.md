# CuraCare AI: Technical Architecture Document

## 1. SYSTEM OVERVIEW
CuraCare AI is an agentic healthcare system that leverages LLM-based orchestration to automate pharmaceutical inventory and patient order management. It uses a **Next.js 15** frontend and backend (Server Actions), with **Genkit 1.x** managing the AI's tool-calling logic and **Firestore** (simulated) as the data layer.

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
- Functions are exported with `'use server'` and called directly from Client Components.
- Each action initializes the Genkit environment and passes execution to a specific **Flow**.
- No separate REST/FastAPI server is required, reducing architectural complexity.

## 5. DATABASE DESIGN
- **Medicines**: Stores metadata, pricing, and stock levels.
- **Patients**: Stores history and membership data.
- **Orders**: Relational link between Patients and Medicines, including **Langfuse** audit traces.
- **Refill Logic**: Uses a simple `days_left = (qty / dosage) - elapsed_time` formula calculated in `db.ts`.

## 6. AI ORCHESTRATION LAYER (Firebase Genkit)
- **Model**: Gemini 1.5 Flash (via `@genkit-ai/google-genai`).
- **Tool Calling**: Genkit's `defineTool` manages the interface between the LLM and the TypeScript functions.
- **Execution Flow**:
  1. Prompt receives User Input.
  2. LLM emits a tool call (e.g., `check_inventory`).
  3. Genkit executes the TypeScript function.
  4. Genkit sends result back to LLM.
  5. LLM generates final response.

## 7. AGENTIC DESIGN PATTERN
- **Autonomy**: The agent determines the order of operations based on the clinical requirement defined in the system prompt.
- **Tool Augmentation**: The LLM doesn't "know" the inventory; it must query the `check_inventory` tool to be grounded in reality.
- **Safety Gates**: The LLM is instructed to never call `create_order` without first calling `check_prescription`.

## 8. OBSERVABILITY (Langfuse)
- Every AI interaction generates a `trace_id`.
- Order records store this `trace_id` for compliance.
- The UI provides deep-links to the Langfuse dashboard to audit the LLM's clinical reasoning.

## 9. SAFETY & VALIDATION
- **Zod Schemas**: Every tool and flow has strict input/output validation via Zod.
- **System Instructions**: The "MANDATORY PROTOCOL" in the system prompt ensures the AI follows clinical guidelines.

## 10. INTERVIEW / JUDGE-LEVEL QUESTIONS
1. **How is relational integrity maintained in the mock DB?**
   - Through explicit ID references and a centralized singleton store.
2. **What happens if the LLM hallucinates a medicine name?**
   - The `check_inventory` tool will return `available: false`, and the LLM will catch this in the next reasoning step.
3. **How do you handle Langfuse traces for auditability?**
   - Every order includes a `trace_id` generated at the request start, which links the database entry to the AI's internal logs.
4. **Why Next.js Server Actions over FastAPI?**
   - To keep the entire stack in TypeScript for better type safety and faster development speed.
5. **How does the refill logic handle changing dosages?**
   - Currently, it assumes 1 unit/day. Improvement: Pass `dosage` from patient history into the calculation tool.
