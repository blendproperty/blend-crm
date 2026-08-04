"use client";

import { useEffect, useRef, useState } from "react";

type PropertyOption = {
  id: string;
  reference: string;
  title: string;
  address: string | null;
};

const inputClass =
  "h-11 w-full rounded-lg border border-[#dce4e0] px-4 text-sm outline-none focus:border-[#159a70]";

export function PropertyPicker({
  reference,
  title,
  onChange,
}: {
  reference: string;
  title: string;
  onChange: (value: { reference: string; title: string }) => void;
}) {
  const [query, setQuery] = useState(title || reference);
  const [results, setResults] = useState<PropertyOption[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      fetch(`/api/properties?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { properties: [] }))
        .then((body) => setResults(body.properties ?? []))
        .catch(() => {});
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectProperty(property: PropertyOption) {
    setQuery(property.title);
    onChange({ reference: property.reference, title: property.title });
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative md:col-span-2">
      <input
        className={inputClass}
        placeholder="Search existing properties, or type a new reference below"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          onChange({ reference, title: event.target.value });
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-[#dce4e0] bg-white shadow-lg">
          {results.map((property) => (
            <button
              type="button"
              key={property.id}
              onClick={() => selectProperty(property)}
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#f4faf7]"
            >
              <span className="font-semibold">{property.title}</span>
              <span className="ml-2 text-xs text-[#87938e]">{property.reference}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Property reference"
          value={reference}
          onChange={(event) => onChange({ reference: event.target.value, title })}
        />
        <input
          className={inputClass}
          placeholder="Property title"
          value={title}
          onChange={(event) => onChange({ reference, title: event.target.value })}
        />
      </div>
    </div>
  );
}
