/**
 * Animated 3D OFF/ON toggle switch.
 *
 * Interactive: pass `onChange` and the switch handles its own click.
 *   <Switch checked={x} onChange={v => setX(v)} />
 *
 * Static / display-only: omit `onChange` so clicks fall through to a parent
 * element that owns the toggle action (e.g. a wrapping <button> or table cell).
 *   <button onClick={...}><Switch checked={x} /></button>
 *
 * `size` is the base font-size in px; the whole control scales from it.
 */
export default function Switch({ checked = false, onChange, size = 17, className = '' }) {
  const interactive = typeof onChange === 'function';
  return (
    <label
      className={`switch ${interactive ? '' : 'switch--static'} ${className}`}
      style={{ fontSize: `${size}px` }}
    >
      <input
        type="checkbox"
        className="cb"
        checked={checked}
        readOnly={!interactive}
        onChange={interactive ? (e) => onChange(e.target.checked) : undefined}
      />
      <div className="toggle">
        <div className="left">OFF</div>
        <div className="right">ON</div>
      </div>
    </label>
  );
}
