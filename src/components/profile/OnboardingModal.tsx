import { useState, useCallback, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { useProfile } from '@/hooks/useProfile'

export function OnboardingModal() {
  const { profile, fetchMyProfile, updateProfile } = useProfile()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncedId, setSyncedId] = useState<string | null>(null)

  useEffect(() => {
    fetchMyProfile()
  }, [fetchMyProfile])

  if (profile && syncedId !== profile.id) {
    setSyncedId(profile.id)
    if (!profile.date_of_birth) {
      setOpen(true)
      setUsername(profile.username ?? '')
    }
  }

  const handleSave = useCallback(async () => {
    if (!dateOfBirth) return
    setSaving(true)

    await updateProfile({
      username: username.trim() || undefined,
      date_of_birth: dateOfBirth,
      bio: bio.trim() || undefined,
    })

    setSaving(false)
    setOpen(false)
  }, [username, dateOfBirth, bio, updateProfile])

  if (!open) return null

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Welcome to MelodyAtlas">
      <div className="space-y-5">
        <p className="text-sm text-white/60">
          Set up your profile to get started. Your birthday anchors
          your personal timeline.
        </p>

        <Input
          label="Display Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name"
        />

        <Input
          label="Birthday"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
        />

        <TextArea
          label="Bio (optional)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Skip
          </Button>
          <Button onClick={handleSave} disabled={saving || !dateOfBirth}>
            {saving ? 'Saving...' : 'Get Started'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
