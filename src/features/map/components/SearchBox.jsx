import { useState, useRef, useEffect } from 'react'
import { suggestAddresses, findAddress } from '../../../lib/arcgis'

const Icons = {
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

export default function SearchBox({ onResult }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
        <span className="search-icon">{Icons.search}</span>
        <input
          className="search-inp"
          placeholder="Пошук адреси або місця..."
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && clear()}
        />
        {loading && <div className="search-spinner" />}
        {query && !loading && (
          <button className="search-clear" onClick={clear}>{Icons.close}</button>
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