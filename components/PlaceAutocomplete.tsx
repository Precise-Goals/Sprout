"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchPlaceSuggestions, PlaceSuggestion } from "@/lib/geocode";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
  onLocate?: () => void;
};

export default function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  onLocate,
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const q = value.trim();
    if (!q) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchPlaceSuggestions(q)
      .then((list) => {
        if (!active) return;
        setSuggestions(list);
        setOpen(true);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to fetch suggestions");
        setOpen(false);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [value]);

  return (
    <div className="relative flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search a place..."
        className="w-full rounded border p-2 text-sm"
        onFocus={() => value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {onLocate && (
        <button
          type="button"
          aria-label="Use my location"
          title="Use my location"
          className="rounded border p-2 text-xs hover:bg-gray-50"
          onClick={() => onLocate()}
        >
          📍
        </button>
      )}
      {open && (suggestions.length > 0 || loading || error) && (
        <div className="absolute left-0 top-full z-10 mt-1 w-full rounded border bg-white shadow">
          {loading && (
            <div className="p-2 text-xs text-gray-500">Loading...</div>
          )}
          {error && <div className="p-2 text-xs text-red-600">{error}</div>}
          {suggestions.map((s, idx) => (
            <button
              key={`${s.label}-${idx}`}
              className="block w-full cursor-pointer p-2 text-left text-sm hover:bg-gray-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
            >
              {s.label}
            </button>
          ))}
          {!loading && !error && suggestions.length === 0 && (
            <div className="p-2 text-xs text-gray-500">No results</div>
          )}
        </div>
      )}
    </div>
  );
}
