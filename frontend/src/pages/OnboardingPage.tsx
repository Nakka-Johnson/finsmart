/**
 * Onboarding Wizard - Sprint-1
 * 
 * Multi-step wizard for new users with demo data option
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import './OnboardingPage.css';

// ============================================================================
// Types
// ============================================================================

type OnboardingStep = 'welcome' | 'account-setup' | 'demo-data' | 'complete';

interface Account {
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [accounts, setAccounts] = useState<Account[]>([
    { name: 'My Checking', type: 'checking', balance: '0.00' },
  ]);
  const [useDemoData, setUseDemoData] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // Step Navigation
  // ============================================================================

  function nextStep() {
    if (step === 'welcome') setStep('account-setup');
    else if (step === 'account-setup') setStep('demo-data');
    else if (step === 'demo-data') handleFinish();
  }

  function prevStep() {
    if (step === 'account-setup') setStep('welcome');
    else if (step === 'demo-data') setStep('account-setup');
  }

  function skipToEnd() {
    setStep('complete');
    setTimeout(() => navigate('/dashboard'), 2000);
  }

  // ============================================================================
  // Account Management
  // ============================================================================

  function addAccount() {
    setAccounts([
      ...accounts,
      { name: `Account ${accounts.length + 1}`, type: 'checking', balance: '0.00' },
    ]);
  }

  function updateAccount(index: number, field: keyof Account, value: string) {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value };
    setAccounts(updated);
  }

  function removeAccount(index: number) {
    if (accounts.length === 1) {
      showToast('You must have at least one account', 'error');
      return;
    }
    setAccounts(accounts.filter((_, i) => i !== index));
  }

  // ============================================================================
  // Finish Setup
  // ============================================================================

  async function handleFinish() {
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const token = useAuthStore.getState().token;

      // Create accounts
      for (const account of accounts) {
        const res = await fetch(`${apiBase}/api/accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: account.name,
            type: account.type.toUpperCase(),
            balance: parseFloat(account.balance) || 0,
          }),
        });

        if (!res.ok) throw new Error('Failed to create account');
      }

      // Load demo data if selected
      if (useDemoData) {
        const demoRes = await fetch(`${apiBase}/api/admin/demo-data`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!demoRes.ok) {
          console.warn('Demo data endpoint not available');
        }
      }

      setStep('complete');
      showToast('Setup complete! Welcome to FinSmart!', 'success');
      
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Error during setup:', err);
      showToast('Setup failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <FeatureGate feature="demo">
      <div className="onboarding-page">
        <div className="onboarding-container">
          {/* Progress Bar */}
          <div className="onboarding-progress">
            <div
              className="progress-bar"
              style={{
                width:
                  step === 'welcome'
                    ? '25%'
                    : step === 'account-setup'
                    ? '50%'
                    : step === 'demo-data'
                    ? '75%'
                    : '100%',
              }}
            />
          </div>

          {/* Content */}
          <div className="onboarding-content">
            {step === 'welcome' && (
              <WelcomeStep
                userName={user?.fullName || user?.email || 'there'}
                onNext={nextStep}
                onSkip={skipToEnd}
              />
            )}

            {step === 'account-setup' && (
              <AccountSetupStep
                accounts={accounts}
                onAddAccount={addAccount}
                onUpdateAccount={updateAccount}
                onRemoveAccount={removeAccount}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {step === 'demo-data' && (
              <DemoDataStep
                useDemoData={useDemoData}
                onToggleDemoData={() => setUseDemoData(!useDemoData)}
                onFinish={nextStep}
                onBack={prevStep}
                loading={loading}
              />
            )}

            {step === 'complete' && <CompleteStep />}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

// ============================================================================
// Welcome Step
// ============================================================================

interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
  onSkip: () => void;
}

function WelcomeStep({ userName, onNext, onSkip }: WelcomeStepProps) {
  return (
    <div className="step-content welcome-step">
      <div className="welcome-icon">👋</div>
      <h1>Welcome to FinSmart, {userName}!</h1>
      <p className="welcome-subtitle">
        Let's get you set up in just a few steps
      </p>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Track Your Money</h3>
          <p>Monitor all your accounts in one place</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Smart Budgets</h3>
          <p>Set goals and stay on track</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>AI Insights</h3>
          <p>Get intelligent spending analysis</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>Visualize Trends</h3>
          <p>See where your money goes</p>
        </div>
      </div>

      <div className="step-actions">
        <button onClick={onSkip} className="btn-text">
          Skip Setup
        </button>
        <button onClick={onNext} className="btn-primary btn-large">
          Get Started
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Account Setup Step
// ============================================================================

interface AccountSetupStepProps {
  accounts: Account[];
  onAddAccount: () => void;
  onUpdateAccount: (index: number, field: keyof Account, value: string) => void;
  onRemoveAccount: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function AccountSetupStep({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onRemoveAccount,
  onNext,
  onBack,
}: AccountSetupStepProps) {
  const isValid = accounts.every(
    (acc) => acc.name.trim() && acc.balance !== ''
  );

  return (
    <div className="step-content account-setup-step">
      <h1>Set Up Your Accounts</h1>
      <p className="step-subtitle">
        Add your bank accounts, credit cards, or other financial accounts
      </p>

      <div className="accounts-list">
        {accounts.map((account, index) => (
          <div key={index} className="account-row">
            <div className="account-fields">
              <div className="field-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={account.name}
                  onChange={(e) =>
                    onUpdateAccount(index, 'name', e.target.value)
                  }
                  placeholder="e.g., Chase Checking"
                  className="input-field"
                />
              </div>

              <div className="field-group">
                <label>Type</label>
                <select
                  value={account.type}
                  onChange={(e) =>
                    onUpdateAccount(
                      index,
                      'type',
                      e.target.value as 'checking' | 'savings' | 'credit'
                    )
                  }
                  className="select-field"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div className="field-group">
                <label>Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={account.balance}
                  onChange={(e) =>
                    onUpdateAccount(index, 'balance', e.target.value)
                  }
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
            </div>

            {accounts.length > 1 && (
              <button
                onClick={() => onRemoveAccount(index)}
                className="btn-remove"
                title="Remove account"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={onAddAccount} className="btn-add">
        + Add Another Account
      </button>

      <div className="step-actions">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="btn-primary btn-large"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Demo Data Step
// ============================================================================

interface DemoDataStepProps {
  useDemoData: boolean;
  onToggleDemoData: () => void;
  onFinish: () => void;
  onBack: () => void;
  loading: boolean;
}

function DemoDataStep({
  useDemoData,
  onToggleDemoData,
  onFinish,
  onBack,
  loading,
}: DemoDataStepProps) {
  return (
    <div className="step-content demo-data-step">
      <h1>Try Demo Data</h1>
      <p className="step-subtitle">
        Want to explore FinSmart with sample data?
      </p>

      <div className="demo-option-card">
        <div className="demo-option">
          <div className="demo-toggle">
            <input
              type="checkbox"
              id="demo-toggle"
              checked={useDemoData}
              onChange={onToggleDemoData}
              className="toggle-checkbox"
            />
            <label htmlFor="demo-toggle" className="toggle-label">
              <span className="toggle-switch" />
            </label>
          </div>
          <div className="demo-info">
            <h3>Load Sample Transactions</h3>
            <p>
              We'll add realistic sample data so you can try out all features
              immediately
            </p>
          </div>
        </div>

        {useDemoData && (
          <div className="demo-preview">
            <h4>What you'll get:</h4>
            <ul>
              <li>
                <span className="preview-icon">💳</span>
                <span>3 months of sample transactions</span>
              </li>
              <li>
                <span className="preview-icon">🏷️</span>
                <span>Auto-categorized expenses</span>
              </li>
              <li>
                <span className="preview-icon">📊</span>
                <span>Pre-configured budgets</span>
              </li>
              <li>
                <span className="preview-icon">🔍</span>
                <span>AI insights ready to explore</span>
              </li>
            </ul>
            <p className="demo-note">
              💡 You can delete all demo data anytime from Settings
            </p>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button onClick={onBack} disabled={loading} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={loading}
          className="btn-primary btn-large"
        >
          {loading ? (
            <>
              <span className="spinner-small" />
              Setting up...
            </>
          ) : (
            'Finish Setup'
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Complete Step
// ============================================================================

function CompleteStep() {
  return (
    <div className="step-content complete-step">
      <div className="success-animation">
        <div className="checkmark-circle">
          <div className="checkmark">✓</div>
        </div>
      </div>
      <h1>You're All Set!</h1>
      <p className="complete-subtitle">
        Redirecting you to your dashboard...
      </p>
      <div className="loading-dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
    </div>
  );
}
