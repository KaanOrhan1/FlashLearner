import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from 'components/ThemeToggle';
import '../styles/auth.css';

export function TermsPage() {
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
                Terms of Service
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
                    1. Agreement to Terms
                  </h2>
                  <p>By accessing and using FlashLearn, you accept and agree to be bound by the terms and provision of this agreement.</p>
                </section>

                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    2. Use License
                  </h2>
                  <p>Permission is granted to temporarily download one copy of the materials (information or software) from FlashLearn for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                  <ul>
                    <li>Modifying or copying the materials</li>
                    <li>Using the materials for any commercial purpose or for any public display</li>
                    <li>Attempting to decompile or reverse engineer any software contained on FlashLearn</li>
                    <li>Removing any copyright or other proprietary notations from the materials</li>
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
                    3. Disclaimer
                  </h2>
                  <p>The materials on FlashLearn's website are provided on an 'as is' basis. FlashLearn makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                </section>

                <section style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    4. Limitations
                  </h2>
                  <p>In no event shall FlashLearn or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on FlashLearn's website.</p>
                </section>

                <section>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    margin: '0 0 12px 0',
                  }}>
                    5. Contact Us
                  </h2>
                  <p>If you have any questions about these Terms of Service, please contact us through our website.</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
