import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { isValidEmail } from '../lib/validators';
import DateField from '../components/DateField.jsx';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mobile, setMobile] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const m = sessionStorage.getItem('mybox_pending_mobile');
    const t = sessionStorage.getItem('mybox_verification_token');
    if (!m || !t) {
      navigate('/login', { replace: true });
      return;
    }
    setMobile(m);
    setVerificationToken(t);
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await api.createProfile({ name: name.trim(), email: email.trim(), dateOfBirth: dob || null }, verificationToken);
      sessionStorage.removeItem('mybox_pending_mobile');
      sessionStorage.removeItem('mybox_verification_token');
      login(result.token, result.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not complete setup. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="auth-card">
        <h1>Create your profile</h1>
        <p className="subtitle">We didn't find this number. Let's get you set up.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="ob-name">Full Name</label>
            <input type="text" id="ob-name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ob-email">Email Address</label>
            <input type="email" id="ob-email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Date of Birth</label>
            <DateField value={dob} onChange={setDob} />
          </div>
          <div className="field">
            <label htmlFor="ob-mobile">Mobile Number</label>
            <input type="tel" id="ob-mobile" value={mobile} disabled />
          </div>
          <button className="btn" type="submit" disabled={busy}>Finish Setup</button>
          <div className="error-msg">{error}</div>
        </form>
      </div>
    </div>
  );
}
