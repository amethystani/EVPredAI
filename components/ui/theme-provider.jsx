'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function useTheme() {
  return {
    theme: 'light', // You can implement actual theme logic here
    setTheme: (theme) => console.log(`Theme set to ${theme}`), // Placeholder function
  }
}