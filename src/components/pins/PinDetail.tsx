import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '@/store/appStore'
import { usePins } from '@/hooks/usePins'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { getEmbedHeight, getPlatformLabel } from '@/lib/platforms'
import type { PinSong } from '@/types'

function SongEmbed({ song }: { song: PinSong }) {
  const platform = song.platform ?? 'spotify'

  const embedSrc =
    song.embed_url ??
    (song.spotify_track_id
      ? `https://open.spotify.com/embed/track/${song.spotify_track_id}?theme=0`
      : null)

  if (!embedSrc) return null

  const height = getEmbedHeight(platform)

  return (
    <div className="rounded-xl overflow-hidden">
      <iframe
        src={embedSrc}
        width="100%"
        height={height}
        allow="encrypted-media; autoplay; clipboard-write"
        loading="lazy"
        className="rounded-xl"
        style={{ border: 'none' }}
        title={`${getPlatformLabel(platform)} - ${song.track_name}`}
      />
    </div>
  )
}

export function PinDetail() {
  const { selectedPin, setSelectedPin } = useAppStore()
  const { deletePin } = usePins()
  const { user } = useAuth()
  const [imageIndex, setImageIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  if (!selectedPin) return null

  const images = selectedPin.images ?? []
  const songs = selectedPin.songs ?? []
  const isOwner = user?.id === selectedPin.user_id

  const handleDelete = async () => {
    setDeleting(true)
    await deletePin(selectedPin)
    setSelectedPin(null)
    setDeleting(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        className="absolute top-4 right-16 z-20 w-80 bg-zinc-900/95 backdrop-blur-xl
          border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {images.length > 0 && (
          <div className="relative aspect-video">
            <img
              src={images[imageIndex]?.url}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightbox(true)}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setImageIndex((i) => (i - 1 + images.length) % images.length)
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft size={14} className="text-white" />
                </button>
                <button
                  onClick={() =>
                    setImageIndex((i) => (i + 1) % images.length)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight size={14} className="text-white" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === imageIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white text-lg leading-tight">
                {selectedPin.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-white/40 text-xs">
                <Calendar size={12} />
                <span>
                  {format(parseISO(selectedPin.pin_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} className="text-white/50" />
            </button>
          </div>

          {selectedPin.description && (
            <p className="text-sm text-white/60 leading-relaxed">
              {selectedPin.description}
            </p>
          )}

          {songs.length > 0 && (
            <div className="space-y-2">
              {songs.map((song) => (
                <SongEmbed key={song.id} song={song} />
              ))}
            </div>
          )}

          {isOwner && (
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={handleDelete}
              disabled={deleting}
            >
              <span className="flex items-center justify-center gap-2">
                <Trash2 size={14} />
                {deleting ? 'Deleting...' : 'Delete Memory'}
              </span>
            </Button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {lightbox && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightbox(false)}
          >
            <img
              src={images[imageIndex]?.url}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"
            >
              <X size={20} className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
