import { useState, useCallback, useEffect } from 'react'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { ImageUploader } from './ImageUploader'
import { MusicInput } from '@/components/music/MusicInput'
import { useAppStore } from '@/store/appStore'
import { usePins } from '@/hooks/usePins'
import { useFriends } from '@/hooks/useFriends'
import { useAuth } from '@/hooks/useAuth'
import type { SpotifyTrack, MusicLink, Profile } from '@/types'

export function AddPinModal() {
  const { pendingLocation, setPendingLocation, setIsAddingPin } = useAppStore()
  const { createPin } = usePins()
  const { user } = useAuth()
  const { friends, fetchFriends } = useFriends()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pinDate, setPinDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [images, setImages] = useState<File[]>([])
  const [spotifyTracks, setSpotifyTracks] = useState<SpotifyTrack[]>([])
  const [musicLinks, setMusicLinks] = useState<MusicLink[]>([])
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const isOpen = !!pendingLocation

  useEffect(() => {
    if (isOpen) fetchFriends()
  }, [isOpen, fetchFriends])

  const friendProfiles: Profile[] = friends.map((f) =>
    f.requester_id === user?.id
      ? (f.addressee as Profile)
      : (f.requester as Profile)
  )

  const toggleTag = useCallback((id: string) => {
    setTaggedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleClose = useCallback(() => {
    setPendingLocation(null)
    setIsAddingPin(false)
    setTitle('')
    setDescription('')
    setPinDate(new Date().toISOString().split('T')[0])
    setImages([])
    setSpotifyTracks([])
    setMusicLinks([])
    setTaggedIds(new Set())
  }, [setPendingLocation, setIsAddingPin])

  const handleSave = useCallback(async () => {
    if (!pendingLocation || !title.trim()) return
    setSaving(true)

    await createPin(
      {
        latitude: pendingLocation.lat,
        longitude: pendingLocation.lng,
        title: title.trim(),
        description: description.trim(),
        pin_date: pinDate,
      },
      images,
      spotifyTracks,
      musicLinks,
      [...taggedIds]
    )

    setSaving(false)
    handleClose()
  }, [
    pendingLocation,
    title,
    description,
    pinDate,
    images,
    spotifyTracks,
    musicLinks,
    taggedIds,
    createPin,
    handleClose,
  ])

  return (
    <Modal open={isOpen} onClose={handleClose} title="New Memory" wide>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A memorable moment..."
            required
          />
          <Input
            label="Date"
            type="date"
            value={pinDate}
            onChange={(e) => setPinDate(e.target.value)}
          />
        </div>

        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened here?"
          rows={3}
        />

        <ImageUploader images={images} onChange={setImages} />

        <MusicInput
          spotifyTracks={spotifyTracks}
          musicLinks={musicLinks}
          onSpotifyChange={setSpotifyTracks}
          onLinksChange={setMusicLinks}
        />

        {friendProfiles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Tag Friends
            </label>
            <div className="flex flex-wrap gap-2">
              {friendProfiles.map((p) => {
                const selected = taggedIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleTag(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer
                      ${selected
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                      }`}
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                        {p.username?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    )}
                    {p.username ?? p.profile_id}
                    {selected && <X size={12} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {pendingLocation && (
          <p className="text-xs text-white/30">
            Location: {pendingLocation.lat.toFixed(4)},{' '}
            {pendingLocation.lng.toFixed(4)}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            {saving ? 'Saving...' : 'Save Memory'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
