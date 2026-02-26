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
- **Orders**: Relational link between Patients and Medicines, including Langfuse audit traces.
- **Refill Logic**: Uses a simple `days_left = (qty / dosage) - elapsed_time` formula calculated in `db.ts`.

## 6. AI ORCHESTRATION LAYER
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

## 8. REQUEST FLOW TRACE
`User Input -> ChatInterface -> chatAction() -> automatedPrescriptionOrderingFlow -> Tool(getUserHistory) -> Tool(extractDetails) -> Tool(checkPrescription) -> Tool(checkInventory) -> Tool(createOrder) -> Tool(updateInventory) -> Tool(triggerWebhook) -> Final Response -> UI Render`

## 9. SAFETY & VALIDATION
- **Zod Schemas**: Every tool and flow has strict input/output validation via Zod.
- **System Instructions**: The "MANDATORY PROTOCOL" in the system prompt ensures the AI follows clinical guidelines.

## 10. SCALABILITY & IMPROVEMENTS
- **Production Migration**: Migrate the singleton in `db.ts` to a live Firebase Firestore instance.
- **Langfuse Implementation**: Ensure all Genkit calls use the `traceId` for full observability.
- **Parallelization**: Future versions could parallelize `check_prescription` and `check_inventory`.

## 11. TECHNICAL WEAKNESSES
- **Statelessness**: Currently, only the immediate message is processed. Future: Implement a `message_history` parameter.
- **Single Point of Failure**: Dependency on the Google AI API. Mitigation: Implement a fallback model (e.g., Vertex AI).

## 12. INTERVIEW / JUDGE-LEVEL QUESTIONS
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
6. **How do you prevent unauthorized users from placing orders?**
   - In production, Firebase Auth UIDs are matched against the `{patientId}` path in Firestore security rules.
7. **Is the AI reasoning panel "real"?**
   - It's a simulation driven by the execution state of the Server Action, intended to show the user the "Chain of Thought."
8. **What is the primary bottleneck for LLM latency here?**
   - The multi-step tool-calling loop. Gemini 1.5 Flash is used specifically to mitigate this.
9. **How do you trigger external warehouse logistics?**
   - Via the `trigger_warehouse_webhook` tool which can perform authenticated POST requests.
10. **Can this system handle image-based prescriptions?**
    - Yes, by adding a multi-modal tool to Genkit that uses Gemini's vision capabilities.
