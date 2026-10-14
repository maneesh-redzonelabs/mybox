import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { isValidMobile } from '../lib/validators';
import OtpInputs from '../components/OtpInputs.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!isValidMobile(mobile)) {
      setMobileError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setMobileError('');
    setBusy(true);
    try {
      await api.sendOtp(mobile);
      setOtp('');
      setOtpError('');
      setStep('otp');
    } catch (err) {
      setMobileError(err.message || 'Could not send OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.verifyOtp(mobile, otp);
      if (result.exists) {
        login(result.token, result.user);
        navigate('/', { replace: true });
      } else {
        sessionStorage.setItem('mybox_verification_token', result.verificationToken);
        sessionStorage.setItem('mybox_pending_mobile', mobile);
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setOtpError(err.message || 'Incorrect OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function backToMobileStep() {
    setStep('mobile');
    setOtpError('');
  }

  return (
    <div className="center-screen">
      <div className="auth-card">
        <h1>Welcome to MyBox</h1>
        <p className="subtitle">Log in with your mobile number</p>

        {step === 'mobile' && (
          <form onSubmit={handleSendOtp}>
            <div className="field">
              <label htmlFor="login-mobile">Mobile Number</label>
              <input
                type="tel"
                id="login-mobile"
                placeholder="e.g. 9876543210"
                maxLength={10}
                autoComplete="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <button className="btn" type="submit" disabled={busy}>Send OTP</button>
            <div className="error-msg">{mobileError}</div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <p className="hint">OTP sent to +91 {mobile}</p>
            <div className="field">
              <label>Enter OTP</label>
              <OtpInputs value={otp} onChange={setOtp} />
              <p className="hint">Prototype hint: OTP is <strong>123456</strong></p>
            </div>
            <button className="btn" type="submit" disabled={busy}>Verify &amp; Continue</button>
            <div className="error-msg">{otpError}</div>
            <button type="button" className="btn-link" onClick={backToMobileStep}>
              &larr; Change mobile number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
