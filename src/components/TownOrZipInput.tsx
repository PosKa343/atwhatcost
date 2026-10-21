import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CITIES, findCityById } from "@/lib/city-data";
import { Switch } from "@/components/ui/switch";

export type TownOrZipValue =
  | { mode: "town"; cityId: string; cityName: string }
  | { mode: "zip"; zip: string }
  | null;

interface Props {
  value: TownOrZipValue;
  onChange: (v: TownOrZipValue) => void;
}

const TOWN_REGEX = /^[A-Za-z ]*$/;

const TownOrZipInput = ({ value, onChange }: Props) => {
  const [useZip, setUseZip] = useState(value?.mode === "zip");
  const [townQuery, setTownQuery] = useState(
    value?.mode === "town" ? value.cityName : ""
  );
  const [zip, setZip] = useState(value?.mode === "zip" ? value.zip : "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // If parent provided a cityId without a name (e.g. from URL), resolve it
  useEffect(() => {
    if (value?.mode === "town" && !value.cityName) {
      const match = findCityById(value.cityId);
      if (match) {
        setTownQuery(match.name);
        onChange({ mode: "town", cityId: match.id, cityName: match.name });
      }
    }
  }, [value, onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapRef.current &&
        !wrapRef.current.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const matches = useMemo(() => {
    const q = townQuery.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter((c) => c.name.toLowerCase().startsWith(q)).slice(0, 8);
  }, [townQuery]);

  useLayoutEffect(() => {
    if (!open || matches.length === 0) return;

    const updatePosition = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownRect({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, matches.length]);

  const handleToggle = (next: boolean) => {
    setUseZip(next);
    onChange(null);
    setOpen(false);
  };

  const handleTownChange = (raw: string) => {
    if (!TOWN_REGEX.test(raw)) return;
    const next = raw.slice(0, 32);
    setTownQuery(next);
    setOpen(true);
    setHighlight(0);
    // Invalidate selected cityId if user is editing
    if (value?.mode === "town" && value.cityName !== next) onChange(null);
  };

  const selectCity = (c: { id: string; name: string }) => {
    setTownQuery(c.name);
    setOpen(false);
    onChange({ mode: "town", cityId: c.id, cityName: c.name });
  };

  const handleZipChange = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, 5);
    setZip(next);
    onChange(next.length === 5 ? { mode: "zip", zip: next } : null);
  };

  const dropdown =
    open && matches.length > 0
      ? createPortal(
          <ul
            ref={dropdownRef}
            className="fixed max-h-64 overflow-auto border border-border rounded-sm shadow-lg isolate"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 2147483647,
              backgroundColor: "hsl(var(--card))",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            }}
          >
            {matches.map((c, i) => (
              <li
                key={c.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCity(c);
                }}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  backgroundColor:
                    i === highlight
                      ? "hsl(var(--fig-olive) / 0.22)"
                      : "hsl(var(--card))",
                }}
                className="px-4 py-2 text-sm font-body cursor-pointer text-foreground"
              >
                {c.name}
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-body">
          {useZip ? "Your NJ Zip Code" : "Your NJ Town"}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-muted-foreground">
            Search by zip
          </span>
          <Switch checked={useZip} onCheckedChange={handleToggle} />
        </div>
      </div>

      {useZip ? (
        <input
          type="text"
          inputMode="numeric"
          value={zip}
          onChange={(e) => handleZipChange(e.target.value)}
          placeholder="07960"
          className="w-full px-4 py-3 bg-card border border-border rounded-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : (
        <div className="relative" ref={wrapRef}>
          <input
            type="text"
            value={townQuery}
            maxLength={32}
            onChange={(e) => handleTownChange(e.target.value)}
            onFocus={() => townQuery && setOpen(true)}
            onKeyDown={(e) => {
              if (!open || matches.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => (h + 1) % matches.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => (h - 1 + matches.length) % matches.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                selectCity(matches[highlight]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Morristown"
            className="w-full px-4 py-3 bg-card border border-border rounded-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {dropdown}
        </div>
      )}
    </div>
  );
};

export default TownOrZipInput;