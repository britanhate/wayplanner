import { useState, useRef, useEffect } from 'react'
import { suggestAddresses, findAddress } from '../../../lib/arcgis'
import CalciteIcon from '../../../shared/ui/CalciteIcon'

export default function SearchBox({ onResult, shouldFocus = false }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
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

  const handleInput = (val) => {
    setQuery(val)
    clearTimeout(timerRef.current)
    if (val.length < 2) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await suggestAddresses(val)
        setSuggestions(res)
        setOpen(true)
      } catch { setSuggestions([]) }
      setLoading(false)
    }, 350)
  }

  const handleSelect = async (s) => {
    setOpen(false)
    setQuery(s.text)
    setLoading(true)
    try {
      const result = await findAddress(s.text, s.magicKey)
      onResult(result)
    } catch (e) { alert(e.message) }
    setLoading(false)
  }

  const clear = () => { setQuery(''); setSuggestions([]); setOpen(false) }

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
          onKeyDown={e => e.key === 'Escape' && clear()}
        />
        {loading && <div className="search-spinner" />}
        {query && !loading && (
          <button className="search-clear btn btn-icon btn-ghost" onClick={clear} aria-label="Clear search"><CalciteIcon name="x" size={16} /></button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="search-results">
          {suggestions.map((s, i) => {
            const parts = s.text.split(',')
            return (
              <div key={i} className="search-result-item" onClick={() => handleSelect(s)}>
                <div className="sr-name">{parts[0]}</div>
                {parts.length > 1 && (
                  <div className="sr-addr">{parts.slice(1).join(',').trim()}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
