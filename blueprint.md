# **E-GovAwas Blueprint**

## **1. Overview**

E-GovAwas is a web application designed to streamline the management and booking of government accommodations. It provides a centralized platform for government employees and other users to apply for residential quarters and book guest houses. The system also includes dedicated dashboards for administrative officers to manage properties and applications.

**Core Capabilities:**
*   User authentication and role-based access control (Government Employee, Quarter Officer, Guest House Officer, General User).
*   Browse and apply for government residential quarters.
*   Browse and book rooms in government guest houses.
*   Secure online payments for bookings.
*   Dashboards for users to manage their applications and bookings.
*   Administrative dashboards for officers to manage properties, applications, and bookings.
*   Internationalization support (English and Hindi).

## **2. Project Outline & Current State**

This section documents the implemented styles, design, and features of the application.

### **Technology Stack**
*   **Frontend:** React (with Vite)
*   **UI Library:** Material-UI (MUI)
*   **Routing:** `react-router-dom`
*   **Backend/Database:** Firebase (Authentication, Firestore, Storage)
*   **Internationalization:** `react-i18next`
*   **Linting:** ESLint with React plugins

### **Design & Styling**
*   **Theming:** The application uses Material-UI's theming capabilities.
    *   A main theme is defined for the general application.
    *   A separate `officerTheme` is used for the administrative dashboards to provide a distinct visual identity.
    *   The design emphasizes a clean, modern aesthetic with a focus on usability.
*   **Layout:** Responsive layouts are used throughout the application to ensure a good experience on both desktop and mobile devices. Key components like `Container`, `Grid`, and `Stack` from MUI are used for this purpose.
*   **Visuals:**
    *   The homepage features a hero section with a background image and animated text.
    *   Interactive cards are used to showcase the main offerings (Quarters and Guest Houses).
    *   Icons from `@mui/icons-material` are used extensively to improve usability and visual communication.
    *   User avatars are displayed in dashboards.

### **Key Features Implemented**

#### **Authentication & User Management**
*   Users can sign up, log in, and log out.
*   Password reset functionality is available.
*   Role-based access is implemented, directing users to the appropriate dashboard upon login.
*   Users can edit their profile information, including their name and profile photo.
*   File uploads (profile photos, joining letters) are handled using Firebase Storage.

#### **Dashboards**
*   **Government Employee Dashboard:**
    *   View available Quarters and Guest Houses.
    *   View "My Applications" for quarters.
    *   View "My Bookings" for guest houses.
    *   Access a "Payments" section.
*   **Guest House Officer Dashboard:**
    *   View, add, edit, and delete guest houses within their assigned location.
    *   Manage booking requests for their guest houses.
    *   View guest house availability.
    *   Manage a waitlist for bookings.
    *   View a map of their guest houses.
    *   View payment history.
*   **Quarter Officer Dashboard:**
    *   View, add, edit, and delete quarters within their assigned location.
    *   Manage applications for quarters.
*   **General User Dashboard:**
    *   View and book Guest Houses.
    *   View "My Bookings".
    *   Access a "Payments" section.

#### **Core Functionality**
*   **Quarters:** Government employees can view and apply for different types of quarters. Officers can manage the quarters and applications.
*   **Guest Houses:** All users can view and book guest houses. Officers can manage the guest houses and booking requests.
*   **Help & Support Page:** A dedicated page provides users with FAQs, rules, and regulations regarding accommodation allotment and booking.
*   **Internationalization (i18n):** The application supports both English (`en`) and Hindi (`hi`). A language switcher is available in the main navigation bar.

## **3. Current Plan**

*   **Objective:** Improve code quality and maintainability without altering the application's core logic or functionality.
*   **Steps:**
    1.  **Create Custom Hooks:** I will create custom hooks, such as `useCollection` and `useDocument`, to encapsulate the data-fetching logic from Firestore. This will reduce code duplication, improve readability, and centralize data management.
    2.  **Implement Global Error Boundary:** I will create a global `ErrorBoundary` component to catch any unexpected JavaScript errors during rendering. This will prevent the application from crashing and will display a user-friendly fallback UI instead.
    3.  **Refactor Components:** I will refactor the existing components to use the new custom hooks for fetching data, which will clean up the component files and make them easier to maintain.
