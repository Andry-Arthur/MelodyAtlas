import { useState, useCallback, useRef } from 'react'
import { Camera } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/appStore'

export function EditProfileModal() {
  const { editProfileOpen, setEditProfileOpen } = useAppStore()
  const { user } = useAuth()
  const { profile, fetchMyProfile, updateProfile, uploadAvatar } = useProfile()

  const [username, setUsername] = useState('')
  const [profileId, setProfileId] = useState('')
  const [bio, setBio] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingFile = useRef<File | null>(null)
  const [syncedId, setSyncedId] = useState<string | null>(null)
  const [wasOpen, setWasOpen] = useState(false)

  if (editProfileOpen && !wasOpen) {
    setWasOpen(true)
    setSyncedId(null)
    fetchMyProfile()
  } else if (!editProfileOpen && wasOpen) {
    setWasOpen(false)
  }

  if (profile && syncedId !== profile.id) {
    setSyncedId(profile.id)
    setUsername(profile.username ?? '')
    setProfileId(profile.profile_id ?? '')
    setBio(profile.bio ?? '')
    setDateOfBirth(profile.date_of_birth ?? '')
    setAvatarPreview(profile.avatar_url)
  }

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      pendingFile.current = file
      setAvatarPreview(URL.createObjectURL(file))
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!profileId.trim()) {
      setError('Profile ID is required')
      return
    }
    if (!/^[a-z0-9_]+$/.test(profileId.trim())) {
      setError('Profile ID can only contain lowercase letters, numbers, and underscores')
      return
    }

    setSaving(true)
    setError('')

    if (pendingFile.current) {
      const { error: uploadErr } = await uploadAvatar(pendingFile.current)
      if (uploadErr) {
        setError('Failed to upload avatar')
        setSaving(false)
        return
      }
      pendingFile.current = null
    }

    const { error: updateErr } = await updateProfile({
      username: username.trim() || undefined,
      profile_id: profileId.trim(),
      bio: bio.trim() || undefined,
      date_of_birth: dateOfBirth || undefined,
    })

    if (updateErr) {
      if (updateErr.message?.includes('unique') || updateErr.message?.includes('duplicate')) {
        setError('This profile ID is already taken')
      } else {
        setError(updateErr.message ?? 'Failed to save')
      }
    } else {
      setEditProfileOpen(false)
    }

    setSaving(false)
  }, [username, profileId, bio, dateOfBirth, uploadAvatar, updateProfile, setEditProfileOpen])

  const initials =
    profile?.username?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    '?'

  return (
    <Modal
      open={editProfileOpen}
      onClose={() => setEditProfileOpen(false)}
      title="Edit Profile"
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20
              hover:border-emerald-400 transition-colors cursor-pointer group"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-white/50">
                  {initials}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <Input
          label="Display Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name"
        />

        <div>
          <Input
            label="Profile ID"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value.toLowerCase())}
            placeholder="yourname42"
          />
          <p className="text-xs text-white/30 mt-1">
            Others can find you with this ID. Lowercase letters, numbers, and
            underscores only.
          </p>
        </div>

        <TextArea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the world about yourself..."
          rows={3}
        />

        <Input
          label="Birthday"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => setEditProfileOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
