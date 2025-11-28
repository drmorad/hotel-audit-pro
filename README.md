# Hotel Audit Pro 🏨

**Hotel Audit Pro** is a specialized Quality & Hygiene Management System designed for hotel operations. It streamlines the workflow of Hygiene Directors and Quality Managers by digitizing audits, incident reporting, and staff training.

Built with **React**, **TypeScript**, and **Tailwind CSS**.

## 🚀 Key Features

### 📊 Executive Dashboard
*   Real-time overview of "Daily Hygiene Scores," pending audits, and critical incidents.
*   Interactive charts visualizing cleanliness trends over the week.
*   Role-based views (Admin vs. Staff).

### ✅ Digital Audits & Inspections
*   Customizable checklists for different departments (Kitchen, Housekeeping, Front Office).
*   **Photo Evidence:** Capture and attach photos to inspection items.
*   **Team Assignment:** Assign specific checklist items to individual team members.
*   **Scoring:** Automated pass/fail calculations.

### ⚠️ Incident Ticketing System
*   **Emergency vs. Daily Logs:** Distinguish between critical safety issues and routine maintenance.
*   **Workflow:** Track status from Open -> In Progress -> Resolved -> Verified.
*   **Audit Trail:** Complete history log of every action taken on an incident.

### 📚 SOP Library & Collections
*   Digital repository for Standard Operating Procedures.
*   **Collections:** Bundle specific SOPs and Audit Templates into "Packs" (e.g., "Kitchen Hygiene Pack").
*   **File Support:** Attach PDFs and images to training modules.

### 🛠️ Admin Control Panel
*   **User Management:** Add, edit, and manage permissions for staff and managers.
*   **Template Builder:** Create reusable audit templates or convert SOPs directly into checklists.
*   **Department Management:** Dynamically add/remove hotel departments.

### 📄 Reporting
*   **PDF Export:** Generate professional, high-quality PDF reports for Audits and Incidents using `jspdf`.
*   **Archive:** Searchable history of all completed audits and resolved incidents.

## 🛠️ Technical Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Charts:** Recharts
*   **PDF Generation:** jsPDF, jspdf-autotable
*   **Icons:** Heroicons (SVG)
*   **State Management:** React Hooks + LocalStorage Persistence (MVP)

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/hotel-audit-pro.git
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## 🗺️ Roadmap & Future Improvements

*   **Backend Integration:** Migrate from LocalStorage to Firebase/Supabase for real-time multi-device sync.
*   **Authentication:** Implement secure email/password login.
*   **Image Storage:** Integrate AWS S3 or Firebase Storage for handling high-resolution photo evidence.
*   **PWA Support:** Add Service Workers for full offline capability in low-signal areas (basements/freezers).
*   **Signature Pad:** Add digital signatures for audit sign-offs.

## 📄 License

This project is licensed under the MIT License.
