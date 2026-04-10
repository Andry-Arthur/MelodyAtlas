import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User, Users, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useAppStore } from '@/store/appStore'

export function ProfileMenu() {
  const { user, signOut } = useAuth()
  const { profile, fetchMyProfile } = useProfile()
  const { setFriendsPanelOpen, setEditProfileOpen } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMyProfile()
  }, [fetchMyProfile])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials =
    profile?.username?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    '?'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-emerald-400
          transition-colors cursor-pointer flex items-center justify-center bg-zinc-800"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-white/70">{initials}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/10
              rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white truncate">
                {profile?.username ?? user?.email}
              </p>
              {profile?.profile_id && (
                <p className="text-xs text-white/40 truncate">
                  @{profile.profile_id}
                </p>
              )}
            </div>

            <div className="py-1">
              <MenuButton
                icon={<Settings size={14} />}
                label="Edit Profile"
                onClick={() => {
                  setEditProfileOpen(true)
                  setOpen(false)
                }}
              />
              <MenuButton
                icon={<Users size={14} />}
                label="Friends"
                onClick={() => {
                  setFriendsPanelOpen(true)
                  setOpen(false)
                }}
              />
              <MenuButton
                icon={<User size={14} />}
                label="My Profile"
                onClick={() => {
                  if (profile?.profile_id) {
                    window.location.href = `/u/${profile.profile_id}`
                  }
                  setOpen(false)
                }}
              />
            </div>

            <div className="border-t border-white/10 py-1">
              <MenuButton
                icon={<LogOut size={14} />}
                label="Sign Out"
                onClick={signOut}
                danger
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors cursor-pointer
        ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      {label}
    </button>
  )
}
