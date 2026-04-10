import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserPlus, UserCheck, Clock, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { useFriends } from '@/hooks/useFriends'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/appStore'
import { MapView } from '@/components/map/MapView'
import { PinDetail } from '@/components/pins/PinDetail'
import { Button } from '@/components/ui/Button'
import type { Pin, Profile } from '@/types'

const PIN_SELECT = `*, images:pin_images(*), songs:pin_songs(*), tags:pin_tags(*, profile:profiles(*)), profile:profiles(*)`

export function UserProfilePage() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fetchProfile } = useProfile()
  const { friends, fetchFriends, sendRequest } = useFriends()
  const selectedPin = useAppStore((s) => s.selectedPin)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [requestSent, setRequestSent] = useState(false)

  const isMe = profile?.id === user?.id
  const friendship = friends.find(
    (f) =>
      f.requester_id === profile?.id || f.addressee_id === profile?.id
  )
  const isFriend = !!friendship

  useEffect(() => {
    async function load() {
      if (!profileId) return
      setLoading(true)
      const p = await fetchProfile(profileId)
      setProfile(p)

      if (p) {
        const { data } = await supabase
          .from('pins')
          .select(PIN_SELECT)
          .eq('user_id', p.id)
          .order('pin_date', { ascending: false })

        if (data) setPins(data as Pin[])
      }
      setLoading(false)
    }
    load()
  }, [profileId, fetchProfile])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const handleAddFriend = useCallback(async () => {
    if (!profile) return
    const { error } = await sendRequest(profile.id)
    if (!error) setRequestSent(true)
  }, [profile, sendRequest])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-lg mb-4">User not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const initials = profile.username?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="h-screen w-screen bg-zinc-950 relative">
      <MapView pins={pins} />

      <AnimatePresence>{selectedPin && <PinDetail />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 z-20"
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 w-72">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer mt-0.5"
            >
              <ArrowLeft size={18} className="text-white/50" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 flex-shrink-0 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white/50">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-white font-semibold truncate">
                    {profile.username}
                  </h2>
                  <p className="text-white/40 text-xs truncate">
                    @{profile.profile_id}
                  </p>
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm text-white/50 mt-2 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-3 mt-3 text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {pins.length} {pins.length === 1 ? 'memory' : 'memories'}
                </span>
              </div>

              {!isMe && (
                <div className="mt-3">
                  {isFriend ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <UserCheck size={14} />
                      Friends
                    </div>
                  ) : requestSent ? (
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Clock size={14} />
                      Request sent
                    </div>
                  ) : (
                    <Button size="sm" onClick={handleAddFriend}>
                      <span className="flex items-center gap-1.5">
                        <UserPlus size={14} />
                        Add Friend
                      </span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
