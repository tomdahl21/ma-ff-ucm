import { CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import { CoordinatorPage } from '@/features/coordinator/CoordinatorPage'
import { ManagerLayout } from '@/features/manager/ManagerLayout'
import { createUcmTheme } from '@/theme/theme'
import { GlobalStyles } from '@/theme/GlobalStyles'
import { ToastProvider } from '@/ui/toast'
import type { RoleKey } from '@/theme/tokens'
import { Launcher } from '@/features/launcher/Launcher'
import { ComingSoon } from '@/features/ComingSoon'

/* One theme per role, built once. The role only swaps palette.primary —
   maroon stays maroon wherever it means "this orchestration layer". */
const THEMES: Record<RoleKey, ReturnType<typeof createUcmTheme>> = {
  coordinator: createUcmTheme('coordinator'),
  manager: createUcmTheme('manager'),
  executive: createUcmTheme('executive'),
}

function Role({ role, children }: { role: RoleKey; children: ReactNode }) {
  return (
    <ThemeProvider theme={THEMES[role]}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  )
}

export function App() {
  return (
    <ThemeProvider theme={THEMES.coordinator}>
      <CssBaseline />
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Launcher />} />
          <Route
            path="/coordinator"
            element={
              <Role role="coordinator">
                <CoordinatorPage />
              </Role>
            }
          />
          <Route
            path="/manager/*"
            element={
              <Role role="manager">
                <ManagerLayout />
              </Role>
            }
          />
          <Route
            path="/executive"
            element={
              <Role role="executive">
                <ComingSoon
                  title="Executive Overview"
                  phase="Phase 3"
                  legacyHref="/legacy/executive.html"
                />
              </Role>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
