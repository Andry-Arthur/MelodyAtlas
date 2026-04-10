import { useState, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { ImageUploader } from './ImageUploader'
import { MusicInput } from '@/components/music/MusicInput'
import { useAppStore } from '@/store/appStore'
import { usePins } from '@/hooks/usePins'
import type { SpotifyTrack, MusicLink } from '@/types'

export function AddPinModal() {
  const { pendingLocation, setPendingLocation, setIsAddingPin } = useAppStore()
  const { createPin } = usePins()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pinDate, setPinDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [images, setImages] = useState<File[]>([])
  const [spotifyTracks, setSpotifyTracks] = useState<SpotifyTrack[]>([])
  const [musicLinks, setMusicLinks] = useState<MusicLink[]>([])
  const [saving, setSaving] = useState(false)

  const isOpen = !!pendingLocation

  const handleClose = useCallback(() => {
    setPendingLocation(null)
    setIsAddingPin(false)
    setTitle('')
    setDescription('')
    setPinDate(new Date().toISOString().split('T')[0])
    setImages([])
    setSpotifyTracks([])
    setMusicLinks([])
  }, [setPendingLocation, setIsAddingPin])

  const handleSave = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'AddPinModal.tsx:handleSave',message:'handleSave entered',data:{hasPendingLoc:!!pendingLocation,title:title.trim(),pendingLocation},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    if (!pendingLocation || !title.trim()) return
    setSaving(true)

    // #region agent log
    fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'AddPinModal.tsx:beforeCreatePin',message:'about to call createPin',data:{lat:pendingLocation?.lat,lng:pendingLocation?.lng,title:title.trim()},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    try {
      const result = await createPin(
        {
          latitude: pendingLocation.lat,
          longitude: pendingLocation.lng,
          title: title.trim(),
          description: description.trim(),
          pin_date: pinDate,
        },
        images,
        spotifyTracks,
        musicLinks
      )
      // #region agent log
      fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'AddPinModal.tsx:afterCreatePin',message:'createPin returned',data:{result:result?.error?.message??'success',hasPin:!!result?.pin},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'AddPinModal.tsx:createPinError',message:'createPin threw',data:{error:err?.message??String(err)},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
    }

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
