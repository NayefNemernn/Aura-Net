/**
 * Neumorphic round "dial" toggle showing a $ glyph — used for the Paid flag.
 * Lights up blue and pulses when checked.
 *
 * Interactive: pass `onChange` and the dial handles its own click.
 * Static / display-only: omit `onChange` so clicks fall through to a parent
 * element that owns the toggle action (e.g. a table cell or wrapping button).
 *
 * `size` is the diameter in px; everything scales from it.
 */
export default function PaidDial({ checked = false, onChange, size = 30, className = '' }) {
  const interactive = typeof onChange === 'function';
  return (
    <label
      className={`dial ${interactive ? '' : 'dial--static'} ${className}`}
      style={{ fontSize: `${size / 7}px` }}
    >
      <input
        type="checkbox"
        className="cb"
        checked={checked}
        readOnly={!interactive}
        onChange={interactive ? (e) => onChange(e.target.checked) : undefined}
      />
      <div className="button">
        <span className="icon">$</span>
      </div>
    </label>
  );
}
