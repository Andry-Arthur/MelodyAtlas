import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './App'
import { SpotifyCallback } from '@/components/auth/SpotifyCallback'
import { UserProfilePage } from '@/components/profile/UserProfilePage'
import { AuthGuard } from '@/components/auth/AuthGuard'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/spotify-callback" element={<SpotifyCallback />} />
        <Route
          path="/u/:profileId"
          element={
            <AuthGuard>
              <UserProfilePage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
