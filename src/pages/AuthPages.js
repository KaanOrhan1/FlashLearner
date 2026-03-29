import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from 'context/AuthContext';
import { ThemeToggle } from 'components/ThemeToggle';
import flashLearnLogo from '../assets/flashlearn-logo.png';
import '../styles/auth.css';

const ConfigWarning = () => (
  <div className="config-warning">
    <AlertTriangle size={16} />
    <div className="warning-content">
      <div className="warning-title">Firebase Not Configured</div>
      <div className="warning-description">Please add your Firebase credentials to the .env file.</div>
    </div>
  </div>
);

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, configError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggle />
      <div className="auth-wrapper">
        {/* Branding Section */}
        <div className="auth-branding">
          <div className="branding-logo">
            <img src={flashLearnLogo} alt="FlashLearn Logo" className="branding-logo-image" />
          </div>
          <h2 className="branding-title">Smarter learning starts here</h2>
          <p className="branding-message">Organise your flashcards, review with structure, and retain more over time.</p>
        </div>

        {/* Login Card */}
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo-wrapper">
                <BookOpen size={32} />
              </div>
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">FlashLearn - Smarter Learning</p>
              <p className="auth-description">Continue your learning with FlashLearn.</p>
            </div>

            {configError && <ConfigWarning />}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={16} className="form-label-icon" />
                  Email Address
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <Lock size={16} className="form-label-icon" />
                  Password
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one free</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, configError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!consent) {
      toast.error('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    
    setLoading(true);
    try {
      await register(email, password, displayName);
      toast.success('Success!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggle />
      <div className="auth-wrapper">
        {/* Branding Section */}
        <div className="auth-branding">
          <div className="branding-logo">
            <img src={flashLearnLogo} alt="FlashLearn Logo" className="branding-logo-image" />
          </div>
          <h2 className="branding-title">Smarter learning starts here</h2>
          <p className="branding-message">Organise your flashcards, review with structure, and retain more over time.</p>
        </div>

        {/* Register Card */}
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo-wrapper">
                <BookOpen size={32} />
              </div>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join FlashLearn Today</p>
              <p className="auth-description">Start learning with intelligent spaced repetition</p>
            </div>

            {configError && <ConfigWarning />}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">
                  <User size={16} className="form-label-icon" />
                  Full Name
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="displayName"
                    type="text"
                    className="form-input"
                    placeholder="Your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={16} className="form-label-icon" />
                  Email Address
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <Lock size={16} className="form-label-icon" />
                  Password
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: "8px",
                marginBottom: "16px",
              }}>
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{
                    marginTop: "2px",
                    cursor: "pointer",
                    width: "18px",
                    height: "18px",
                    minWidth: "18px",
                    accentColor: "var(--primary-color)",
                  }}
                />
                <label htmlFor="consent" style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.4",
                  cursor: "pointer",
                  flexGrow: 1,
                }}>
                  I agree to the{' '}
                  <a href="/terms" style={{
                    color: "var(--primary-color)",
                    textDecoration: "none",
                    fontWeight: "600",
                    transition: "opacity 0.2s",
                  }}
                    onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.target.style.opacity = "1"}
                  >
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" style={{
                    color: "var(--primary-color)",
                    textDecoration: "none",
                    fontWeight: "600",
                    transition: "opacity 0.2s",
                  }}
                    onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.target.style.opacity = "1"}
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button type="submit" className="auth-button" disabled={loading || !consent}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};