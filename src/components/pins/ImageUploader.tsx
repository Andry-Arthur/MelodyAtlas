import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface ImageUploaderProps {
  images: File[]
  onChange: (images: File[]) => void
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const newImages = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      )
      onChange([...images, ...newImages])
    },
    [images, onChange]
  )

  const removeImage = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index))
    },
    [images, onChange]
  )

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/70">Photos</label>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
          ${dragActive ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:border-white/20'}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          id="image-upload"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <Upload
            size={24}
            className="mx-auto mb-2 text-white/30"
          />
          <p className="text-sm text-white/40">
            Drop images here or click to browse
          </p>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((file, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
