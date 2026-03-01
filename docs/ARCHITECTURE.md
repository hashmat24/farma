# CuraCare AI: Enterprise Technical Architecture

## 1. MISSION STATEMENT
CuraCare AI is an enterprise-grade agentic healthcare system. It automates pharmaceutical inventory and patient order management using a "Clinical Safety Gate" pattern, ensuring LLM-based decisions are grounded in real-time database state and medical compliance.

## 2. ENTERPRISE TECH STACK
- **Orchestration**: Next.js 15 (App Router) using Server Actions for end-to-end TypeScript safety.
- **AI Brain**: Firebase Genkit 1.x — manages tool-calling logic, schema validation, and multimodal processing.
- **Intelligence**: Google Gemini 1.5 Flash — utilized for high-speed clinical reasoning and large context processing.
- **Data Layer**: Cloud Firestore — provides real-time state synchronization between patients and the warehouse.
- **Observability**: Langfuse — provides a full audit trail (traces) for every pharmaceutical transaction.
- **Design System**: ShadCN UI & Tailwind CSS — ensures accessibility and responsive performance.

## 3. CORE ARCHITECTURAL PATTERNS

### A. The "Clinical Safety Gate"
The AI is strictly forbidden from executing mutations (`create_order`) without first passing through validation tools (`check_prescription`, `check_inventory`). This is enforced at the Genkit Flow level.

### B. API-Less Backend
We eliminate the overhead of FastAPI or external REST servers by using Next.js Server Actions. This allows the AI flows to call database functions directly with shared TypeScript interfaces.

### C. Observability & Auditability
Every order record contains a `trace_id`. This links the physical order to the specific LLM reasoning chain in Langfuse, satisfying healthcare requirements for decision transparency.

## 4. DATA MODEL (High Level)
- **Medicines**: Metadata, clinical descriptions, pricing, and stock levels.
- **Patients**: Medical history and membership data.
- **Orders**: Relational link between Patients and Medicines, including status and trace metadata.
- **Refills**: Predictive logic calculated from order frequency and unit dosage.

## 5. INFRASTRUCTURE
- **Hosting**: Firebase App Hosting.
- **Auth**: Firebase Authentication (Email/Pass & Anonymous).
- **Security**: Firestore Security Rules (Path-based ownership & Admin markers).
