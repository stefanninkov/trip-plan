import { useEffect, useRef, useState } from 'react'

type RecognitionResultEvent = Event & {
  resultIndex: number
  results: ArrayLike<
    ArrayLike<{ transcript: string; confidence: number }> & { isFinal?: boolean }
  >
}

/**
 * Thin wrapper around the browser SpeechRecognition API. Returns a
 * state machine: start/stop to control, transcript updates live,
 * `supported` reflects browser capability.
 */
export function useVoiceInput(langHint?: string): {
  supported: boolean
  listening: boolean
  transcript: string
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
} {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<unknown>(null)
  // Vendor-prefixed global on webkit browsers.
  const SR: unknown =
    typeof window !== 'undefined'
      ? (window as unknown as {
          SpeechRecognition?: unknown
          webkitSpeechRecognition?: unknown
        }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
      : undefined

  const supported = Boolean(SR)

  useEffect(() => {
    return () => {
      const r = recognitionRef.current as { stop?: () => void } | null
      if (r?.stop) r.stop()
    }
  }, [])

  const start = (): void => {
    if (!supported) {
      setError('Voice input not supported in this browser')
      return
    }
    setError(null)
    setTranscript('')
    type Ctor = new () => {
      lang: string
      continuous: boolean
      interimResults: boolean
      onresult: (e: RecognitionResultEvent) => void
      onerror: (e: Event & { error?: string }) => void
      onend: () => void
      start: () => void
      stop: () => void
    }
    const Rec = SR as Ctor
    const r = new Rec()
    r.lang = langHint === 'sr' ? 'sr-RS' : 'en-US'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e: RecognitionResultEvent) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      setTranscript(text)
    }
    r.onerror = (e) => {
      setError(e.error ?? 'Speech recognition failed')
      setListening(false)
    }
    r.onend = () => setListening(false)
    r.start()
    recognitionRef.current = r
    setListening(true)
  }

  const stop = (): void => {
    const r = recognitionRef.current as { stop?: () => void } | null
    if (r?.stop) r.stop()
    setListening(false)
  }

  const reset = (): void => {
    setTranscript('')
    setError(null)
  }

  return { supported, listening, transcript, error, start, stop, reset }
}
