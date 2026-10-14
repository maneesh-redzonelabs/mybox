import { useRef } from 'react';

export default function OtpInputs({ value, onChange }) {
  const refs = useRef([]);

  function handleInput(idx, rawValue) {
    const digit = rawValue.replace(/[^0-9]/g, '').slice(-1);
    const chars = value.split('');
    chars[idx] = digit;
    const next = chars.join('').slice(0, 6);
    onChange(next);
    if (digit && idx < 5 && refs.current[idx + 1]) {
      refs.current[idx + 1].focus();
    }
  }

  return (
    <div className="otp-boxes">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          maxLength={1}
          className="otp-box"
          value={value[idx] || ''}
          onChange={(e) => handleInput(idx, e.target.value)}
        />
      ))}
    </div>
  );
}
