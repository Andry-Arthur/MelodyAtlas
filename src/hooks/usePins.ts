import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { Pin, PinImage, PinSong, SpotifyTrack } from '@/types'

export function usePins() {
  const { setPins, addPin, updatePin, removePin } = useAppStore()

  const fetchPins = useCallback(async () => {
    const { data, error } = await supabase
      .from('pins')
      .select(`*, images:pin_images(*), songs:pin_songs(*), profile:profiles(*)`)
      .order('pin_date', { ascending: false })

    if (!error && data) {
      setPins(data as Pin[])
    }
    return { data, error }
  }, [setPins])

  const createPin = useCallback(
    async (
      pin: {
        latitude: number
        longitude: number
        title: string
        description: string
        pin_date: string
      },
      images: File[],
      songs: SpotifyTrack[]
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { data: newPin, error } = await supabase
        .from('pins')
        .insert({ ...pin, user_id: user.id })
        .select()
        .single()

      if (error || !newPin) return { error }

      const uploadedImages: PinImage[] = []
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${newPin.id}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('pin-images')
          .upload(path, file)

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('pin-images').getPublicUrl(path)

          const { data: imgRow } = await supabase
            .from('pin_images')
            .insert({
              pin_id: newPin.id,
              storage_path: path,
              url: publicUrl,
              order_index: i,
            })
            .select()
            .single()

          if (imgRow) uploadedImages.push(imgRow as PinImage)
        }
      }

      const insertedSongs: PinSong[] = []
      for (const track of songs) {
        const { data: songRow } = await supabase
          .from('pin_songs')
          .insert({
            pin_id: newPin.id,
            spotify_track_id: track.id,
            track_name: track.name,
            artist_name: track.artists.map((a) => a.name).join(', '),
            album_name: track.album.name,
            album_art_url: track.album.images[0]?.url ?? '',
            spotify_uri: track.uri,
          })
          .select()
          .single()

        if (songRow) insertedSongs.push(songRow as PinSong)
      }

      const fullPin: Pin = {
        ...newPin,
        images: uploadedImages,
        songs: insertedSongs,
      }
      addPin(fullPin)
      return { error: null, pin: fullPin }
    },
    [addPin]
  )

  const deletePin = useCallback(
    async (pin: Pin) => {
      if (pin.images) {
        const paths = pin.images.map((img) => img.storage_path)
        if (paths.length) {
          await supabase.storage.from('pin-images').remove(paths)
        }
      }

      await supabase.from('pin_images').delete().eq('pin_id', pin.id)
      await supabase.from('pin_songs').delete().eq('pin_id', pin.id)
      const { error } = await supabase.from('pins').delete().eq('id', pin.id)
      if (!error) removePin(pin.id)
      return { error }
    },
    [removePin]
  )

  return { fetchPins, createPin, deletePin, updatePin }
}
