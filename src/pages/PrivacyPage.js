import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from 'components/ThemeToggle';
import '../styles/auth.css';

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <ThemeToggle />
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-card">
            <button
              onClick={() => navigate('/login')}
              style={{
                marginBottom: '24px',
                padding: '8px 16px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              ← Back
            </button>

            <div style={{
              backgroundColor: 'var(--card-color)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '32px',
            }}>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '24px',
                margin: '0 0 24px 0',
              }}>
                Privacy Policy
              </h1>

              <div style={{
                fontSize: '14px',
                lineHeight: '1.8',
                color: 'var(--text-primary)',
              }}>
                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    1. Information We Collect
                  </h2>
                  <p>We collect information you provide directly, such as when you create an account. This includes your name, email address, and password. We also collect information about how you use FlashLearn, including the decks you create, cards you study, and your learning progress.</p>
                </section>

                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    2. How We Use Your Information
                  </h2>
                  <p>We use the information we collect to:</p>
                  <ul>
                    <li>Provide, maintain, and improve FlashLearn</li>
                    <li>Create and manage your account</li>
                    <li>Track your learning progress and provide personalized recommendations</li>
                    <li>Respond to your inquiries and provide support</li>
                  </ul>
                </section>

                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    3. Data Security
                  </h2>
                  <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.</p>
                </section>

                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    4. Third-Party Services
                  </h2>
                  <p>FlashLearn uses Firebase for hosting and authentication. Google's Privacy Policy governs their handling of your data. We do not share your personal information with other third parties without your consent.</p>
                </section>

                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    5. Your Rights
                  </h2>
                  <p>You have the right to access, update, or delete your personal information at any time. You can manage your account settings through FlashLearn or contact us for assistance.</p>
                </section>

                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    6. Changes to This Policy
                  </h2>
                  <p>We may update this Privacy Policy from time to time. We will notify you of any changes by updating the date at the top of this page.</p>
                </section>

                <section>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    7. Contact Us
                  </h2>
                  <p>If you have any questions about this Privacy Policy, please contact us through our website.</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
