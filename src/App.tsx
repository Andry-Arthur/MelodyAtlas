import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { MapView } from '@/components/map/MapView'
import { EmptyState } from '@/components/map/EmptyState'
import { Header } from '@/components/layout/Header'
import { AddPinModal } from '@/components/pins/AddPinModal'
import { PinDetail } from '@/components/pins/PinDetail'
import { TimelineSlider } from '@/components/timeline/TimelineSlider'
import { FriendsPanel } from '@/components/friends/FriendsPanel'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { OnboardingModal } from '@/components/profile/OnboardingModal'
import { useAppStore } from '@/store/appStore'
import { usePins } from '@/hooks/usePins'

function AppContent() {
  const { fetchPins } = usePins()
  const selectedPin = useAppStore((s) => s.selectedPin)

  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 relative">
      <Header />
      <MapView />
      <AnimatePresence>{selectedPin && <PinDetail />}</AnimatePresence>
      <EmptyState />
      <AddPinModal />
      <TimelineSlider />
      <FriendsPanel />
      <EditProfileModal />
      <OnboardingModal />
    </div>
  )
}

export default function App() {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  )
}
