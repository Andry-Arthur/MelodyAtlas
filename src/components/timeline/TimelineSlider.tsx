import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Play, Pause } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function TimelineSlider() {
  const { pins, setFilteredPins, dateRange, setDateRange } = useAppStore()
  const [playing, setPlaying] = useState(false)
  const playRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const [sliderValues, setSliderValues] = useState<[number, number]>([0, 100])

  const range = useMemo(() => {
    if (pins.length === 0) return null
    const dates = pins
      .map((p) => new Date(p.pin_date).getTime())
      .sort((a, b) => a - b)
    const min = dates[0]
    const max = dates[dates.length - 1]
    if (min === max) return null
    return { min, max }
  }, [pins])

  useEffect(() => {
    if (range) {
      setDateRange([new Date(range.min), new Date(range.max)])
      setSliderValues([0, 100])
    }
  }, [range, setDateRange])

  const filterPins = useCallback(
    (values: [number, number]) => {
      if (!range) return
      const startTs = range.min + (values[0] / 100) * (range.max - range.min)
      const endTs = range.min + (values[1] / 100) * (range.max - range.min)
      setDateRange([new Date(startTs), new Date(endTs)])
      const filtered = pins.filter((p) => {
        const t = new Date(p.pin_date).getTime()
        return t >= startTs && t <= endTs
      })
      setFilteredPins(filtered)
    },
    [pins, range, setDateRange, setFilteredPins]
  )

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value)
      const newValues: [number, number] = [
        Math.min(val, sliderValues[1] - 1),
        sliderValues[1],
      ]
      setSliderValues(newValues)
      filterPins(newValues)
    },
    [sliderValues, filterPins]
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value)
      const newValues: [number, number] = [
        sliderValues[0],
        Math.max(val, sliderValues[0] + 1),
      ]
      setSliderValues(newValues)
      filterPins(newValues)
    },
    [sliderValues, filterPins]
  )

  const togglePlay = useCallback(() => {
    if (playing) {
      clearInterval(playRef.current)
      setPlaying(false)
    } else {
      setPlaying(true)
      setSliderValues([0, 5])
      filterPins([0, 5])

      playRef.current = setInterval(() => {
        setSliderValues((prev) => {
          const next: [number, number] = [0, Math.min(prev[1] + 1, 100)]
          filterPins(next)
          if (next[1] >= 100) {
            clearInterval(playRef.current)
            setPlaying(false)
          }
          return next
        })
      }, 150)
    }
  }, [playing, filterPins])

  useEffect(() => {
    return () => clearInterval(playRef.current)
  }, [])

  if (!range || pins.length < 2) return null

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(90vw,640px)]">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            {playing ? (
              <Pause size={14} className="text-white" />
            ) : (
              <Play size={14} className="text-white ml-0.5" />
            )}
          </button>

          <div className="flex-1">
            <div className="relative h-6 flex items-center">
              <div className="absolute w-full h-1 bg-white/10 rounded-full" />
              <div
                className="absolute h-1 bg-emerald-500/60 rounded-full"
                style={{
                  left: `${sliderValues[0]}%`,
                  width: `${sliderValues[1] - sliderValues[0]}%`,
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={sliderValues[0]}
                onChange={handleMinChange}
                className="absolute w-full appearance-none bg-transparent pointer-events-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={sliderValues[1]}
                onChange={handleMaxChange}
                className="absolute w-full appearance-none bg-transparent pointer-events-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/40 mt-0.5">
              <span>
                {dateRange
                  ? format(dateRange[0], 'MMM yyyy')
                  : format(new Date(range.min), 'MMM yyyy')}
              </span>
              <span>
                {dateRange
                  ? format(dateRange[1], 'MMM yyyy')
                  : format(new Date(range.max), 'MMM yyyy')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
