# **App Name**: CuraCare AI

## Core Features:

- Autonomous AI Pharmacist Tool: An AI agent leveraging a suite of tools to extract medicine details, check prescriptions, verify inventory, create orders, update stock, and trigger fulfillment webhooks.
- Dynamic Inventory Management: API endpoints for accessing medicine inventory (GET /inventory, GET /inventory/{id}), and a tool for updating stock levels (POST /update-inventory) linked to an SQLite database loaded from Excel.
- Personalized Predictive Refills: A system to retrieve patient order history (GET /user-history/{patient}) and a tool to calculate and identify refill alerts for patients whose medicine exhaustion date is within two days (GET /refill-alerts).
- Interactive AI Chat User Interface: A React + Tailwind frontend providing a message bubble-style chat experience for users to interact with the AI pharmacist, including voice input via Web Speech API and display of Langfuse trace links for each message.
- Operational Admin Dashboard: A dedicated admin interface at /admin displaying an inventory table with color-coded stock levels, low stock alerts, predictive refill alerts list, and an order log table.
- Integrated Observability (Langfuse): Comprehensive tracing of all AI tool calls as Langfuse spans and each /chat request as a Langfuse trace, with trace URLs returned in API responses and public sharing enabled.

## Style Guidelines:

- The visual design will use a light color scheme to convey clarity and professionalism. The primary color is a deep, professional blue (HSL: 210, 60%, 40%; Hex: #2966CC) evoking trust and care. The background will be a very light, desaturated blue-gray (HSL: 210, 15%, 95%; Hex: #ECF1F5) for an open, clean feel. A vibrant, analogous turquoise (HSL: 180, 80%, 60%; Hex: #33E6E6) will serve as the accent color for key highlights and interactive elements, providing a fresh contrast.
- Body and headline font: 'Inter', a neutral and objective sans-serif, chosen for its excellent readability and modern appearance across both conversational text and tabular data on the admin dashboard, reinforcing a professional and efficient tone.
- Utilize clean, minimalist line icons to maintain a modern aesthetic. Icons should be clear and immediately understandable for actions (e.g., send, search), status (e.g., checkmark, warning), and medicine-related items, ensuring consistency across the chat interface and admin dashboard.
- Employ a responsive, card-based layout with generous white space. The chat interface will feature a clean message bubble design with clear separation of user and AI messages. The admin dashboard will use well-structured tables for data display, incorporating visual cues like color-coded rows for quick status identification (e.g., low stock).
- Incorporate subtle, functional animations such as smooth transitions for chat message delivery, gentle loading indicators during AI processing, and Hover effects on interactive elements on the admin dashboard to provide user feedback without being distracting.