import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMyProfile = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) setProfile(data as Profile)
    setLoading(false)
    return data as Profile | null
  }, [])

  const fetchProfile = useCallback(async (profileId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single()

    if (error) return null
    return data as Profile
  }, [])

  const updateProfile = useCallback(
    async (updates: {
      profile_id?: string
      username?: string
      bio?: string
      avatar_url?: string
      date_of_birth?: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (!error && data) setProfile(data as Profile)
      return { data, error }
    },
    []
  )

  const uploadAvatar = useCallback(async (file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatar-images')
      .upload(path, file, { upsert: true })

    if (uploadError) return { error: uploadError }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatar-images').getPublicUrl(path)

    const url = `${publicUrl}?t=${Date.now()}`
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) setProfile(data as Profile)
    return { data, error }
  }, [])

  return { profile, loading, fetchMyProfile, fetchProfile, updateProfile, uploadAvatar }
}
