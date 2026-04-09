import { motion } from 'framer-motion'
import { MapPinPlus, Music, Image } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function EmptyState() {
  const { pins, isAddingPin } = useAppStore()

  if (pins.length > 0 || isAddingPin) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
    >
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 text-center max-w-sm shadow-2xl">
        <div className="flex justify-center gap-3 mb-4 text-white/20">
          <MapPinPlus size={24} />
          <Image size={24} />
          <Music size={24} />
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          Your map is empty. Click{' '}
          <span className="text-emerald-400 font-medium">Add Memory</span> in
          the top right, then click anywhere on the map to pin your first memory.
        </p>
      </div>
    </motion.div>
  )
}
