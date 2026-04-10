import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { Pin, PinImage, PinSong, SpotifyTrack, MusicLink } from '@/types'

export function usePins() {
  const { setPins, addPin, updatePin, removePin } = useAppStore()

  const fetchPins = useCallback(async () => {
    const { data, error } = await supabase
      .from('pins')
      .select(`*, images:pin_images(*), songs:pin_songs(*), profile:profiles(*)`)
      .order('pin_date', { ascending: false })

    // #region agent log
    fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'usePins.ts:fetchPins',message:'fetchPins result',data:{pinCount:data?.length??0,error:error?.message??null},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
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
      songs: SpotifyTrack[],
      musicLinks: MusicLink[] = []
    ) => {
      // #region agent log
      fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'usePins.ts:createPin:entry',message:'createPin entered',data:{pin,songCount:songs.length,linkCount:musicLinks.length},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      const {
        data: { user },
      } = await supabase.auth.getUser()
      // #region agent log
      fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'usePins.ts:37',message:'auth user check',data:{hasUser:!!user,userId:user?.id?.slice(0,8)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      if (!user) return { error: new Error('Not authenticated') }

      const { data: newPin, error } = await supabase
        .from('pins')
        .insert({ ...pin, user_id: user.id })
        .select()
        .single()

      // #region agent log
      fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'usePins.ts:49',message:'pin insert result',data:{hasPin:!!newPin,pinId:newPin?.id,error:error?.message??null,pinLat:pin.latitude,pinLng:pin.longitude},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
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

      const fullPin: Pin = {
        ...newPin,
        images: uploadedImages,
        songs: insertedSongs,
      }
      // #region agent log
      fetch('http://127.0.0.1:7818/ingest/e9ae0393-a9de-4e9e-8a66-dbf8b99f5e12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d64d3'},body:JSON.stringify({sessionId:'4d64d3',location:'usePins.ts:133',message:'calling addPin with fullPin',data:{pinId:fullPin.id,lat:fullPin.latitude,lng:fullPin.longitude,title:fullPin.title,imgCount:uploadedImages.length,songCount:insertedSongs.length},timestamp:Date.now(),hypothesisId:'H1_H4'})}).catch(()=>{});
      // #endregion
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
