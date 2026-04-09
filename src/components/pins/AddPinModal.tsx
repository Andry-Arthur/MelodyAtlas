import { useState, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { ImageUploader } from './ImageUploader'
import { SpotifySearch } from '@/components/spotify/SpotifySearch'
import { useAppStore } from '@/store/appStore'
import { usePins } from '@/hooks/usePins'
import type { SpotifyTrack } from '@/types'

export function AddPinModal() {
  const { pendingLocation, setPendingLocation, setIsAddingPin } = useAppStore()
  const { createPin } = usePins()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pinDate, setPinDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [images, setImages] = useState<File[]>([])
  const [songs, setSongs] = useState<SpotifyTrack[]>([])
  const [saving, setSaving] = useState(false)

  const isOpen = !!pendingLocation

  const handleClose = useCallback(() => {
    setPendingLocation(null)
    setIsAddingPin(false)
    setTitle('')
    setDescription('')
    setPinDate(new Date().toISOString().split('T')[0])
    setImages([])
    setSongs([])
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
      songs
    )

    setSaving(false)
    handleClose()
  }, [
    pendingLocation,
    title,
    description,
    pinDate,
    images,
    songs,
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

        <SpotifySearch selected={songs} onSelect={setSongs} />

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
