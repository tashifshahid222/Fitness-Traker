import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

function normalize(options) {
  return (options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

function Select({ id, value, onChange, options, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const list = normalize(options);
  const selected = list.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`select-wrap ${className}`.trim()} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className="select select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="select-value">{selected ? selected.label : 'Select…'}</span>
        <FiChevronDown className="select-caret" size={14} aria-hidden="true" />
      </button>

      {open && (
        <ul className="select-menu" role="listbox" aria-label={ariaLabel}>
          {list.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`select-option ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span>{o.label}</span>
                  {active && <FiCheck size={14} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
