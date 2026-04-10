import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Friendship, Profile } from '@/types'

export function useFriends() {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [requests, setRequests] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFriends = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)
    const { data } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    if (data) setFriends(data as Friendship[])
    setLoading(false)
  }, [])

  const fetchRequests = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
      .eq('status', 'pending')
      .eq('addressee_id', user.id)

    if (data) setRequests(data as Friendship[])
  }, [])

  const sendRequest = useCallback(async (addresseeId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
    })

    return { error }
  }, [])

  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)

      if (!error) {
        await fetchFriends()
        await fetchRequests()
      }
      return { error }
    },
    [fetchFriends, fetchRequests]
  )

  const declineRequest = useCallback(
    async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined' })
        .eq('id', friendshipId)

      if (!error) await fetchRequests()
      return { error }
    },
    [fetchRequests]
  )

  const removeFriend = useCallback(
    async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (!error) await fetchFriends()
      return { error }
    },
    [fetchFriends]
  )

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) return []

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('profile_id', `%${query.trim()}%`)
      .limit(10)

    return (data ?? []) as Profile[]
  }, [])

  return {
    friends,
    requests,
    loading,
    fetchFriends,
    fetchRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    searchUsers,
  }
}
