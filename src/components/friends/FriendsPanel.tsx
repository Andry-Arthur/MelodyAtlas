import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  UserPlus,
  Check,
  XIcon,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useAuth } from '@/hooks/useAuth'
import { useFriends } from '@/hooks/useFriends'
import type { Profile, Friendship } from '@/types'

export function FriendsPanel() {
  const { friendsPanelOpen, setFriendsPanelOpen } = useAppStore()
  const { user } = useAuth()
  const {
    friends,
    requests,
    fetchFriends,
    fetchRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    searchUsers,
  } = useFriends()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends')

  useEffect(() => {
    if (friendsPanelOpen) {
      fetchFriends()
      fetchRequests()
    }
  }, [friendsPanelOpen, fetchFriends, fetchRequests])

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    const data = await searchUsers(query)
    setResults(data.filter((p) => p.id !== user?.id))
    setSearching(false)
  }, [query, searchUsers, user?.id])

  useEffect(() => {
    if (tab !== 'search') return
    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [query, tab, handleSearch])

  const handleSend = useCallback(
    async (targetId: string) => {
      const { error } = await sendRequest(targetId)
      if (!error) setSentIds((prev) => new Set(prev).add(targetId))
    },
    [sendRequest]
  )

  const getFriendProfile = (f: Friendship): Profile => {
    return f.requester_id === user?.id
      ? (f.addressee as Profile)
      : (f.requester as Profile)
  }

  return (
    <AnimatePresence>
      {friendsPanelOpen && (
        <motion.div
          initial={{ opacity: 0, x: -320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -320 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-0 z-40 w-80 bg-zinc-900/95 backdrop-blur-xl
            border-r border-white/10 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Friends</h2>
            <button
              onClick={() => setFriendsPanelOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} className="text-white/50" />
            </button>
          </div>

          <div className="flex border-b border-white/10">
            {(['friends', 'requests', 'search'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors cursor-pointer
                  ${tab === t ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/60'}`}
              >
                {t === 'friends'
                  ? `Friends${friends.length ? ` (${friends.length})` : ''}`
                  : t === 'requests'
                    ? `Requests${requests.length ? ` (${requests.length})` : ''}`
                    : 'Search'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === 'search' && (
              <div className="p-3">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by profile ID..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white
                      placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {searching && (
                  <p className="text-xs text-white/30 text-center mt-4">
                    Searching...
                  </p>
                )}

                <div className="mt-3 space-y-1">
                  {results.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                    >
                      <Avatar profile={p} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {p.username}
                        </p>
                        <p className="text-xs text-white/40 truncate">
                          @{p.profile_id}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={`/u/${p.profile_id}`}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          title="View Map"
                        >
                          <ExternalLink size={14} />
                        </a>
                        {sentIds.has(p.id) ? (
                          <span className="text-xs text-emerald-400 px-2 py-1">
                            Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSend(p.id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                            title="Add Friend"
                          >
                            <UserPlus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!searching && query && results.length === 0 && (
                    <p className="text-xs text-white/30 text-center py-4">
                      No users found
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === 'requests' && (
              <div className="p-3 space-y-1">
                {requests.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-8">
                    No pending requests
                  </p>
                )}
                {requests.map((req) => {
                  const p = req.requester as Profile
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                    >
                      <Avatar profile={p} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {p.username}
                        </p>
                        <p className="text-xs text-white/40 truncate">
                          @{p.profile_id}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => acceptRequest(req.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                          title="Accept"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          title="Decline"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'friends' && (
              <div className="p-3 space-y-1">
                {friends.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-8">
                    No friends yet. Search for someone to add!
                  </p>
                )}
                {friends.map((f) => {
                  const p = getFriendProfile(f)
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                    >
                      <Avatar profile={p} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {p.username}
                        </p>
                        <p className="text-xs text-white/40 truncate">
                          @{p.profile_id}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={`/u/${p.profile_id}`}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          title="View Map"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => removeFriend(f.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Avatar({ profile }: { profile: Profile }) {
  const initials = profile.username?.charAt(0).toUpperCase() ?? '?'
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0 flex items-center justify-center">
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xs font-bold text-white/50">{initials}</span>
      )}
    </div>
  )
}
