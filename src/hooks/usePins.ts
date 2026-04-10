import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { Pin, PinImage, PinSong, PinTag, SpotifyTrack, MusicLink } from '@/types'

const PIN_SELECT = `*, images:pin_images(*), songs:pin_songs(*), tags:pin_tags(*, profile:profiles(*)), profile:profiles(*)`

export function usePins() {
  const { setPins, addPin, updatePin, removePin } = useAppStore()

  const fetchPins = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data: myPins, error: myErr } = await supabase
      .from('pins')
      .select(PIN_SELECT)
      .eq('user_id', user.id)
      .order('pin_date', { ascending: false })

    const { data: tagRows } = await supabase
      .from('pin_tags')
      .select('pin_id')
      .eq('tagged_user_id', user.id)

    let taggedPins: Pin[] = []
    if (tagRows && tagRows.length > 0) {
      const taggedIds = tagRows.map((t) => t.pin_id)
      const { data } = await supabase
        .from('pins')
        .select(PIN_SELECT)
        .in('id', taggedIds)
        .order('pin_date', { ascending: false })

      if (data) {
        taggedPins = (data as Pin[]).map((p) => ({ ...p, isTagged: true }))
      }
    }

    const ownPins = (myPins ?? []) as Pin[]
    const ownIds = new Set(ownPins.map((p) => p.id))
    const merged = [
      ...ownPins,
      ...taggedPins.filter((p) => !ownIds.has(p.id)),
    ]

    setPins(merged)
    return { data: merged, error: myErr }
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
      songs: SpotifyTrack[],
      musicLinks: MusicLink[] = [],
      taggedUserIds: string[] = []
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
            platform: 'spotify',
            platform_url: track.external_urls.spotify,
            embed_url: `https://open.spotify.com/embed/track/${track.id}?theme=0`,
          })
          .select()
          .single()

        if (songRow) insertedSongs.push(songRow as PinSong)
      }

      for (const link of musicLinks) {
        const { data: songRow } = await supabase
          .from('pin_songs')
          .insert({
            pin_id: newPin.id,
            spotify_track_id: null,
            track_name: link.title,
            artist_name: link.artist,
            album_name: '',
            album_art_url: link.thumbnail,
            spotify_uri: null,
            platform: link.platform,
            platform_url: link.platformUrl,
            embed_url: link.embedUrl,
          })
          .select()
          .single()

        if (songRow) insertedSongs.push(songRow as PinSong)
      }

      const insertedTags: PinTag[] = []
      for (const userId of taggedUserIds) {
        const { data: tagRow } = await supabase
          .from('pin_tags')
          .insert({ pin_id: newPin.id, tagged_user_id: userId })
          .select(`*, profile:profiles(*)`)
          .single()

        if (tagRow) insertedTags.push(tagRow as PinTag)
      }

      const fullPin: Pin = {
        ...newPin,
        images: uploadedImages,
        songs: insertedSongs,
        tags: insertedTags,
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

      await supabase.from('pin_tags').delete().eq('pin_id', pin.id)
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
