import { useState, useRef, useEffect } from 'react'
import { suggestAddresses, findAddress } from '../../../lib/arcgis'
import CalciteIcon from '../../../shared/ui/CalciteIcon'

export default function SearchBox({ onResult, shouldFocus = false }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [errorMessage, setErrorMessage] = useState('')
  const timerRef = useRef(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!shouldFocus) return
    const timer = setTimeout(() => {
      const input = inputRef.current
      if (!input) return
      if (input.offsetParent === null) return
      input.focus()
      input.select()
    }, 0)
    return () => clearTimeout(timer)
  }, [shouldFocus])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const handleInput = (val) => {
    setQuery(val)
    setErrorMessage('')
    setActiveIndex(-1)
    clearTimeout(timerRef.current)

    if (val.length < 2) {
      requestIdRef.current += 1
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }

    timerRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current
      setLoading(true)
      try {
        const res = await suggestAddresses(val)
        if (requestId !== requestIdRef.current) return
        setSuggestions(res)
        setOpen(res.length > 0)
      } catch {
        if (requestId !== requestIdRef.current) return
        setSuggestions([])
        setOpen(false)
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    }, 350)
  }

  const handleSelect = async (s) => {
    setOpen(false)
    setActiveIndex(-1)
    setQuery(s.text)
    setLoading(true)
    setErrorMessage('')
    try {
      const result = await findAddress(s.text, s.magicKey)
      onResult(result)
    } catch (e) {
      setErrorMessage(e?.message || 'Не вдалося знайти адресу')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      clear()
      return
    }

    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
    }

    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    }
  }

  const clear = () => {
    requestIdRef.current += 1
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
    setErrorMessage('')
    setLoading(false)
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-wrap">
        <span className="search-icon"><CalciteIcon name="search" size={16} /></span>
        <input
          ref={inputRef}
          className="search-inp"
          placeholder="Пошук адреси або місця..."
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Пошук адреси"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && <div className="search-spinner" />}
        {query && !loading && (
          <button className="search-clear btn btn-icon btn-ghost" onClick={clear} aria-label="Очистити пошук"><CalciteIcon name="x" size={16} /></button>
        )}
      </div>
      {!!errorMessage && <div className="search-error-message">{errorMessage}</div>}
      {open && suggestions.length > 0 && (
        <div className="search-results" role="listbox">
          {suggestions.map((s, i) => {
            const parts = s.text.split(',')
            return (
              <button
                key={`${s.text}-${i}`}
                type="button"
                className={`search-result-item ${activeIndex === i ? 'is-active' : ''}`}
                onClick={() => handleSelect(s)}
                role="option"
                aria-selected={activeIndex === i}
              >
                <div className="sr-name">{parts[0]}</div>
                {parts.length > 1 && (
                  <div className="sr-addr">{parts.slice(1).join(',').trim()}</div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
