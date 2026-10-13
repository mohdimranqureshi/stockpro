import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { hsnApi } from '../../lib/api'

/**
 * Searchable HSN code dropdown.
 * Type a code prefix (e.g. "8528") or keyword (e.g. "television") —
 * fetches matching HSN records from the backend (up to 50).
 * Selecting an entry fires onSelect({ hsnCode, description }).
 */
export default function HsnDropdown({ value, onSelect, placeholder = 'Type HSN code or keyword...' }) {
  const [query, setQuery]     = useState(value || '')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const [selected, setSelected] = useState(null)
  const ref      = useRef(null)
  const debounce = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchOptions = useCallback((q) => {
    setLoading(true)
    hsnApi.search(q, 100)
      .then(r => setOptions(r.data.data || []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [])

  // Load initial results when dropdown opens
  useEffect(() => {
    if (open) fetchOptions(query)
  }, [open])

  const handleType = (e) => {
    const q = e.target.value
    setQuery(q)
    setSelected(null)
    onSelect(null)
    setOpen(true)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchOptions(q), 250)
  }

  const handlePick = (item) => {
    setSelected(item)
    setQuery(item.hsnCode)
    setOpen(false)
    onSelect(item)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    onSelect(null)
    fetchOptions('')
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className={`input pl-9 pr-9 w-full font-mono ${selected ? 'border-emerald-400 bg-emerald-50' : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={handleType}
          onFocus={() => setOpen(true)}
        />
        {(query || selected) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">Searching HSN codes...</div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">No HSN codes found</div>
          ) : (
            <>
              <div className="sticky top-0 bg-gray-50 border-b border-gray-100 px-4 py-1.5">
                <span className="text-xs text-gray-400 font-medium">
                  {options.length} result{options.length !== 1 ? 's' : ''} — type to filter
                </span>
              </div>
              {options.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                  onClick={() => handlePick(item)}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-blue-700 text-sm flex-shrink-0 w-20">
                      {item.hsnCode}
                    </span>
                    <span className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {item.description}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-emerald-700 text-sm">{selected.hsnCode}</span>
            <span className="text-xs text-emerald-600 leading-relaxed">{selected.description}</span>
          </div>
        </div>
      )}
    </div>
  )
}
