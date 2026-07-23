import React, { useState, useRef } from 'react';
import './InputShowcase.css';

// ─── DigitInput – only digits, no letters, no wheel ──────────────
interface DigitInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const DigitInput: React.FC<DigitInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter digits only',
  maxLength,
  disabled = false,
  className = '',
  label = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    if (maxLength && digits.length > maxLength) return;
    onChange(digits);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const digits = pasted.replace(/\D/g, '');
    if (maxLength && digits.length > maxLength) return;
    onChange(digits);
    e.preventDefault();
  };

  return (
    <div className={`digit-input-wrapper ${className}`}>
      {label && <label className="digit-label">{label}</label>}
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onWheel={handleWheel}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className="digit-input"
      />
    </div>
  );
};

// ─── NumericInput (wheel‑safe, with buttons) ──────────────────────
interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  unit?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  placeholder = 'Enter amount',
  disabled = false,
  className = '',
  label = '',
  unit = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (
      key === 'Backspace' || key === 'Delete' || key === 'Tab' ||
      key === 'Escape' || key === 'Enter' || key === 'ArrowLeft' ||
      key === 'ArrowRight' || key === 'Home' || key === 'End' ||
      key === 'Control' || key === 'Meta' || key === 'Shift' || key === 'Alt'
    ) {
      return;
    }
    if (!/^[0-9.\-]$/.test(key)) {
      e.preventDefault();
    }
    if (key === '.' && (e.target as HTMLInputElement).value.includes('.')) {
      e.preventDefault();
    }
    if (key === '-' && (e.target as HTMLInputElement).selectionStart !== 0) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min !== -Infinity ? min : 0);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      const clamped = Math.min(Math.max(num, min), max);
      onChange(clamped);
    }
  };

  const increment = () => {
    if (disabled) return;
    const newVal = Math.min(value + step, max);
    onChange(newVal);
  };

  const decrement = () => {
    if (disabled) return;
    const newVal = Math.max(value - step, min);
    onChange(newVal);
  };

  return (
    <div className={`numeric-input-wrapper ${className}`}>
      {label && <label className="numeric-label">{label}</label>}
      <div className="numeric-input-container">
        <button
          type="button"
          className="numeric-btn"
          onClick={decrement}
          disabled={disabled || value <= min}
          aria-label="Decrease value"
        >
          −
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          placeholder={placeholder}
          disabled={disabled}
          className="numeric-input"
        />
        <button
          type="button"
          className="numeric-btn"
          onClick={increment}
          disabled={disabled || value >= max}
          aria-label="Increase value"
        >
          +
        </button>
        {unit && <span className="numeric-unit">{unit}</span>}
      </div>
      <div className="numeric-hint">
        Min: {min !== -Infinity ? min : '∞'} · Max: {max !== Infinity ? max : '∞'} · Step: {step}
      </div>
    </div>
  );
};

// ─── Main Showcase ──────────────────────────────────────────────────
const InputShowcase: React.FC = () => {
  // --- State for each input ---
  const [text, setText] = useState('');
  const [textarea, setTextarea] = useState('');
  const [number, setNumber] = useState<number>(0);
  const [safeNumber, setSafeNumber] = useState<number>(0);
  const [digitValue, setDigitValue] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [datetime, setDatetime] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [range, setRange] = useState(50);
  const [select, setSelect] = useState('option2');
  const [multiSelect, setMultiSelect] = useState<string[]>(['option1']);
  const [radio, setRadio] = useState('radio1');
  const [checkboxSingle, setCheckboxSingle] = useState(false);
  const [checkboxGroup, setCheckboxGroup] = useState<string[]>(['cb1']);
  const [toggle, setToggle] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [tel, setTel] = useState('');
  const [url, setUrl] = useState('');

  // --- Handlers ---
  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setMultiSelect(selected);
  };

  const handleCheckboxGroup = (value: string) => {
    setCheckboxGroup(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      text,
      textarea,
      number,
      safeNumber,
      digitValue,
      email,
      password,
      date,
      time,
      datetime,
      color,
      range,
      select,
      multiSelect,
      radio,
      checkboxSingle,
      checkboxGroup,
      toggle,
      file: file ? file.name : null,
      search,
      tel,
      url,
    };
    console.log('Form Data:', formData);
    alert('Check the console for form data!');
  };

  return (
    <div className="showcase-container">
      <h1>🧪 Input Showcase – All Types</h1>
      <form onSubmit={handleSubmit} className="showcase-form">

        {/* ---------- Text ---------- */}
        <div className="input-group">
          <label>Text Input</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text..."
          />
          <span className="hint">Standard single‑line text</span>
        </div>

        {/* ---------- Textarea ---------- */}
        <div className="input-group">
          <label>Textarea</label>
          <textarea
            value={textarea}
            onChange={(e) => setTextarea(e.target.value)}
            placeholder="Write a message..."
            rows={3}
          />
        </div>

        {/* ---------- Number (native) ---------- */}
        <div className="input-group">
          <label>Number (native)</label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            min={0}
            max={100}
            step={1}
          />
          <span className="hint">Min: 0, Max: 100, step: 1 – mouse wheel changes value</span>
        </div>

        {/* ---------- NumericInput (custom, wheel‑safe) ---------- */}
        <div className="input-group">
          <NumericInput
            label="Numeric (wheel‑safe)"
            value={safeNumber}
            onChange={setSafeNumber}
            min={0}
            max={100}
            step={1}
            unit="%"
            placeholder="0"
          />
          <span className="hint">Mouse wheel disabled · use +/‑ buttons only</span>
        </div>

        {/* ---------- DigitInput (only digits, no letters) ---------- */}
        <div className="input-group">
          <DigitInput
            label="Digits only (no letters)"
            value={digitValue}
            onChange={setDigitValue}
            placeholder="e.g. 12345"
            maxLength={10}
          />
          <span className="hint">Only numbers allowed · wheel disabled</span>
        </div>

        {/* ---------- Email ---------- */}
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {/* ---------- Password ---------- */}
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {/* ---------- Date ---------- */}
        <div className="input-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* ---------- Time ---------- */}
        <div className="input-group">
          <label>Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {/* ---------- Datetime-local ---------- */}
        <div className="input-group">
          <label>Datetime‑local</label>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </div>

        {/* ---------- Color ---------- */}
        <div className="input-group">
          <label>Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <span className="hint">Selected: {color}</span>
        </div>

        {/* ---------- Range ---------- */}
        <div className="input-group">
          <label>Range slider</label>
          <input
            type="range"
            min={0}
            max={100}
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          />
          <span className="hint">Value: {range}</span>
        </div>

        {/* ---------- Select (single) ---------- */}
        <div className="input-group">
          <label>Select (single)</label>
          <select value={select} onChange={(e) => setSelect(e.target.value)}>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        </div>

        {/* ---------- Multi-select ---------- */}
        <div className="input-group">
          <label>Multi‑select (hold Ctrl/Cmd)</label>
          <select multiple value={multiSelect} onChange={handleMultiSelect}>
            <option value="option1">Option A</option>
            <option value="option2">Option B</option>
            <option value="option3">Option C</option>
          </select>
          <span className="hint">Selected: {multiSelect.join(', ')}</span>
        </div>

        {/* ---------- Radio buttons ---------- */}
        <div className="input-group">
          <label>Radio group</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="radioGroup"
                value="radio1"
                checked={radio === 'radio1'}
                onChange={(e) => setRadio(e.target.value)}
              />
              Radio 1
            </label>
            <label>
              <input
                type="radio"
                name="radioGroup"
                value="radio2"
                checked={radio === 'radio2'}
                onChange={(e) => setRadio(e.target.value)}
              />
              Radio 2
            </label>
            <label>
              <input
                type="radio"
                name="radioGroup"
                value="radio3"
                checked={radio === 'radio3'}
                onChange={(e) => setRadio(e.target.value)}
              />
              Radio 3
            </label>
          </div>
        </div>

        {/* ---------- Checkbox (single) ---------- */}
        <div className="input-group">
          <label>Checkbox (single)</label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={checkboxSingle}
              onChange={(e) => setCheckboxSingle(e.target.checked)}
            />
            Accept terms
          </label>
        </div>

        {/* ---------- Checkbox group ---------- */}
        <div className="input-group">
          <label>Checkbox group</label>
          <div className="checkbox-group">
            {['cb1', 'cb2', 'cb3'].map((val) => (
              <label key={val}>
                <input
                  type="checkbox"
                  checked={checkboxGroup.includes(val)}
                  onChange={() => handleCheckboxGroup(val)}
                />
                {val.toUpperCase()}
              </label>
            ))}
          </div>
          <span className="hint">Selected: {checkboxGroup.join(', ')}</span>
        </div>

        {/* ---------- Toggle (custom) ---------- */}
        <div className="input-group">
          <label>Toggle switch</label>
          <div className="toggle-wrapper">
            <div
              className={`toggle-track ${toggle ? 'toggle-on' : 'toggle-off'}`}
              onClick={() => setToggle(!toggle)}
            >
              <div className="toggle-thumb" />
            </div>
            <span className="hint">{toggle ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* ---------- File upload ---------- */}
        <div className="input-group">
          <label>File upload</label>
          <input type="file" onChange={handleFileChange} />
          {file && <span className="hint">Selected: {file.name}</span>}
        </div>

        {/* ---------- Search ---------- */}
        <div className="input-group">
          <label>Search</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </div>

        {/* ---------- Tel ---------- */}
        <div className="input-group">
          <label>Telephone</label>
          <input
            type="tel"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            placeholder="+1 234 567 890"
          />
        </div>

        {/* ---------- URL ---------- */}
        <div className="input-group">
          <label>URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        {/* ---------- Submit ---------- */}
        <button type="submit" className="submit-btn">Submit & Log</button>
      </form>
    </div>
  );
};

export default InputShowcase;