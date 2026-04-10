import { useCallback, useEffect } from 'react'
import { Users } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useAuth } from '@/hooks/useAuth'
import { useFriends } from '@/hooks/useFriends'
import { supabase } from '@/lib/supabase'
import type { Pin } from '@/types'

export function FriendOverlayToggle() {
  const { friends, showFriendPins, toggleFriendPins, setFriendPins, setFriends } =
    useAppStore()
  const { user } = useAuth()
  const { fetchFriends, friends: friendships } = useFriends()

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  useEffect(() => {
    const profiles = friendships.map((f) =>
      f.requester_id === user?.id ? f.addressee! : f.requester!
    )
    setFriends(profiles)
  }, [friendships, user?.id, setFriends])

  const loadFriendPins = useCallback(async () => {
    if (friends.length === 0) {
      setFriendPins([])
      return
    }

    const friendIds = friends.map((f) => f.id)
    const { data } = await supabase
      .from('pins')
      .select('*, images:pin_images(*), songs:pin_songs(*), profile:profiles(*)')
      .in('user_id', friendIds)
      .order('pin_date', { ascending: false })

    if (data) setFriendPins(data as Pin[])
  }, [friends, setFriendPins])

  useEffect(() => {
    if (showFriendPins) loadFriendPins()
    else setFriendPins([])
  }, [showFriendPins, loadFriendPins, setFriendPins])

  if (friends.length === 0) return null

  return (
    <button
      onClick={toggleFriendPins}
      className={`w-9 h-9 rounded-lg backdrop-blur border flex items-center justify-center
        transition-all cursor-pointer ${
          showFriendPins
            ? 'bg-blue-500/20 border-blue-400/40 text-blue-400'
            : 'bg-zinc-900/80 border-white/10 text-white/70 hover:text-white hover:bg-zinc-800'
        }`}
      title={showFriendPins ? 'Hide friend pins' : 'Show friend pins'}
    >
      <Users size={16} />
    </button>
  )
}
