export const NEXT_PUBLIC_API_URL = process.env.NODE_ENV === 'production' 
  ? "https://d0e9-2401-4900-81e2-4630-9878-6fd7-2092-80b.ngrok-free.app"
  : "http://localhost:8000";  // Changed from "/api" to full URL