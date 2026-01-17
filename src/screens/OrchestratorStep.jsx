/**
 * OrchestratorStep
 * One-sentence generation mode - AI handles everything
 */

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../constants';

const orchestratorStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    padding: '40px 20px',
    textAlign: 'center'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '40px',
    maxWidth: '500px'
  },
  inputContainer: {
    width: '100%',
    maxWidth: '700px',
    marginBottom: '24px'
  },
  input: {
    width: '100%',
    padding: '20px 24px',
    fontSize: '1.2rem',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  inputFocused: {
    borderColor: '#667eea',
    boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
  },
  blinkButton: {
    padding: '18px 60px',
    fontSize: '1.3rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
  },
  blinkButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  backButton: {
    marginTop: '24px',
    padding: '10px 24px',
    fontSize: '0.9rem',
    color: '#666',
    background: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  progressContainer: {
    marginTop: '32px',
    padding: '24px',
    background: '#f8fafc',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%'
  },
  progressText: {
    fontSize: '1.1rem',
    color: '#333',
    marginBottom: '16px'
  },
  decisionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    textAlign: 'left'
  },
  decisionItem: {
    padding: '12px 16px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  decisionLabel: {
    fontSize: '0.75rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px'
  },
  decisionValue: {
    fontSize: '0.95rem',
    color: '#1a1a2e',
    fontWeight: '500'
  },
  error: {
    marginTop: '16px',
    padding: '12px 20px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '0.95rem'
  },
  colorPalette: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px'
  },
  colorSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: '1px solid rgba(0,0,0,0.1)'
  }
};

// Tool display names mapping
const toolDisplayNames = {
  'invoice-generator': 'Invoice Generator',
  'qr-generator': 'QR Code Generator',
  'calculator': 'Calculator',
  'countdown': 'Countdown Timer',
  'tip-calculator': 'Tip Calculator',
  'bmi-calculator': 'BMI Calculator',
  'unit-converter': 'Unit Converter',
  'password-generator': 'Password Generator',
};

// Business placeholders
const businessPlaceholders = [
  "Mario's Pizza in Brooklyn - authentic Italian since 1985",
  "Dr. Sarah Chen's Family Dental Practice in Austin",
  "Zen Flow Yoga Studio - modern wellness in downtown Seattle",
  "Thompson & Associates Law Firm specializing in business law",
  "Jake's Auto Repair - honest service in small town Ohio",
  "Sunrise Coffee Roasters - artisan coffee in Portland",
  "Elite CrossFit Gym - transform your fitness journey",
  "The Rustic Table Restaurant - farm to table dining"
];

// Tool placeholders
const toolPlaceholders = [
  "A tip calculator with bill splitting",
  "Pomodoro timer with customizable intervals",
  "BMI calculator with health recommendations",
  "Unit converter for cooking measurements",
  "Password generator with strength indicator",
  "Expense tracker with categories",
  "Color palette generator for designers",
  "Countdown timer for events"
];

export function OrchestratorStep({ onComplete, onBack, isToolMode = false, preselectedTool = null, onSuggestTools, onAmbiguousInput, onToolRecommendations, skipIntentDetection = false, pendingInput = null, onPendingInputUsed }) {
  const [input, setInput] = useState(pendingInput || '');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [aiDecisions, setAiDecisions] = useState(null);
  const [error, setError] = useState(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const [showSuggestInput, setShowSuggestInput] = useState(false);
  const [suggestInput, setSuggestInput] = useState('');
  const [detectingIntent, setDetectingIntent] = useState(false);
  const [pendingTriggered, setPendingTriggered] = useState(false);

  const placeholders = isToolMode ? toolPlaceholders : businessPlaceholders;

  const [placeholder] = useState(() =>
    placeholders[Math.floor(Math.random() * placeholders.length)]
  );

  // Auto-trigger if there's a pending input from choice screen
  useEffect(() => {
    if (pendingInput && !pendingTriggered && !generating) {
      setPendingTriggered(true);
      if (onPendingInputUsed) onPendingInputUsed();
      // Auto-trigger with skip intent detection since user already chose
      setTimeout(() => {
        handleBlinkWithInput(pendingInput, true); // Pass true to skip intent
      }, 300);
    }
  }, [pendingInput, pendingTriggered, generating]);

  // Auto-generate for preselected tools
  useEffect(() => {
    if (preselectedTool && !autoStarted) {
      setAutoStarted(true);
      const toolName = toolDisplayNames[preselectedTool] || preselectedTool;
      setInput(`Create a ${toolName.toLowerCase()}`);
      // Auto-trigger generation after a brief delay
      setTimeout(() => {
        handleBlinkWithInput(`Create a ${toolName.toLowerCase()}`);
      }, 500);
    }
  }, [preselectedTool, autoStarted]);

  const handleBlinkWithInput = async (customInput, forceSkipIntent = false) => {
    const inputToUse = customInput || input.trim();
    if (!inputToUse) {
      setError(isToolMode ? 'Please describe the tool you want to create' : 'Please describe your business');
      return;
    }

    // First, detect intent (unless we're skipping it or in explicit tool mode)
    if (!skipIntentDetection && !forceSkipIntent && !isToolMode && !preselectedTool) {
      setDetectingIntent(true);
      setError(null);

      try {
        const intentResponse = await fetch(`${API_BASE}/api/orchestrate/detect-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: inputToUse })
        });

        const intentData = await intentResponse.json();

        if (intentData.success) {
          // Handle based on intent type
          if (intentData.type === 'ambiguous' && onAmbiguousInput) {
            setDetectingIntent(false);
            onAmbiguousInput(intentData);
            return;
          }

          if (intentData.type === 'recommendations' && onToolRecommendations) {
            setDetectingIntent(false);
            onToolRecommendations(intentData.detectedIndustry);
            return;
          }
        }

        setDetectingIntent(false);
      } catch (intentError) {
        console.warn('Intent detection failed, proceeding with generation:', intentError);
        setDetectingIntent(false);
      }
    }

    setGenerating(true);
    setError(null);
    setProgress(isToolMode ? '🛠️ Building your tool...' : '🤖 AI is analyzing your request...');

    try {
      const response = await fetch(`${API_BASE}/api/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputToUse })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Show AI decisions (different for tools vs business)
      if (data.type === 'tool') {
        setAiDecisions({
          toolName: data.tool?.template,
          category: data.tool?.category,
          features: data.tool?.features?.join(', ')
        });
      } else {
        setAiDecisions(data.orchestrator?.decisions);
      }
      setProgress('✅ Complete!');

      // Wait a moment to show the decisions, then complete
      setTimeout(() => {
        onComplete(data);
      }, 2000);

    } catch (err) {
      setError(err.message || 'Something went wrong');
      setGenerating(false);
      setProgress(null);
    }
  };

  const handleBlink = () => handleBlinkWithInput(input.trim());

  return (
    <div style={orchestratorStyles.container}>
      <h1 style={orchestratorStyles.title}>
        {isToolMode ? '🛠️ Tool Builder' : '🧠 Orchestrator Mode'}
      </h1>
      <p style={orchestratorStyles.subtitle}>
        {isToolMode
          ? (preselectedTool
              ? `Creating your ${toolDisplayNames[preselectedTool] || preselectedTool}...`
              : 'Describe the tool you want to create. AI builds it instantly.')
          : 'Describe your business in one sentence. AI handles everything else.'
        }
      </p>

      {!generating && !preselectedTool && (
        <>
          <div style={orchestratorStyles.inputContainer}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isToolMode ? "Describe the tool you want to create..." : placeholder}
              style={orchestratorStyles.input}
              onKeyDown={(e) => e.key === 'Enter' && !detectingIntent && handleBlink()}
              autoFocus
              disabled={detectingIntent}
            />
          </div>

          <button
            style={{
              ...orchestratorStyles.blinkButton,
              ...(input.trim().length < 3 || detectingIntent ? orchestratorStyles.blinkButtonDisabled : {})
            }}
            onClick={handleBlink}
            disabled={input.trim().length < 3 || detectingIntent}
          >
            {detectingIntent ? '🔍 Analyzing...' : isToolMode ? '🛠️ BUILD TOOL' : '⚡ BLINK'}
          </button>

          {/* Suggest Tools Button (only in tool mode) */}
          {isToolMode && onSuggestTools && (
            <>
              {!showSuggestInput ? (
                <button
                  style={{
                    ...orchestratorStyles.backButton,
                    marginTop: '16px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1px solid #f59e0b',
                    color: '#92400e'
                  }}
                  onClick={() => setShowSuggestInput(true)}
                >
                  💡 Not sure? Get tool suggestions for your industry
                </button>
              ) : (
                <div style={{
                  marginTop: '16px',
                  padding: '20px',
                  background: '#fffbeb',
                  borderRadius: '12px',
                  border: '1px solid #fde68a',
                  width: '100%',
                  maxWidth: '500px'
                }}>
                  <p style={{ fontSize: '0.9rem', color: '#92400e', marginBottom: '12px' }}>
                    What's your profession or industry?
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={suggestInput}
                      onChange={(e) => setSuggestInput(e.target.value)}
                      placeholder="e.g., freelancer, restaurant, plumber..."
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '2px solid #fde68a',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && suggestInput.trim()) {
                          onSuggestTools(suggestInput.trim());
                        }
                      }}
                      autoFocus
                    />
                    <button
                      style={{
                        padding: '12px 20px',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: suggestInput.trim() ? 'pointer' : 'not-allowed',
                        opacity: suggestInput.trim() ? 1 : 0.5
                      }}
                      onClick={() => suggestInput.trim() && onSuggestTools(suggestInput.trim())}
                      disabled={!suggestInput.trim()}
                    >
                      Get Suggestions
                    </button>
                  </div>
                  <button
                    style={{
                      marginTop: '12px',
                      padding: '6px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#92400e',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    onClick={() => {
                      setShowSuggestInput(false);
                      setSuggestInput('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          <button style={orchestratorStyles.backButton} onClick={onBack}>
            ← Back to options
          </button>

          {error && (
            <div style={orchestratorStyles.error}>{error}</div>
          )}
        </>
      )}

      {generating && (
        <div style={orchestratorStyles.progressContainer}>
          <div style={orchestratorStyles.progressText}>{progress}</div>

          {aiDecisions && (
            <div style={orchestratorStyles.decisionsGrid}>
              {/* Tool-specific decisions */}
              {aiDecisions.toolName && (
                <>
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Tool Type</div>
                    <div style={orchestratorStyles.decisionValue}>{aiDecisions.toolName}</div>
                  </div>
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Category</div>
                    <div style={orchestratorStyles.decisionValue}>{aiDecisions.category}</div>
                  </div>
                  {aiDecisions.features && (
                    <div style={{...orchestratorStyles.decisionItem, gridColumn: '1 / -1'}}>
                      <div style={orchestratorStyles.decisionLabel}>Features</div>
                      <div style={orchestratorStyles.decisionValue}>{aiDecisions.features}</div>
                    </div>
                  )}
                </>
              )}

              {/* Business-specific decisions */}
              {aiDecisions.businessName && (
                <>
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Business Name</div>
                    <div style={orchestratorStyles.decisionValue}>{aiDecisions.businessName}</div>
                  </div>
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Industry</div>
                    <div style={orchestratorStyles.decisionValue}>{aiDecisions.industryName}</div>
                  </div>
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Location</div>
                    <div style={orchestratorStyles.decisionValue}>{aiDecisions.location || 'Not specified'}</div>
                  </div>
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Pages</div>
                    <div style={orchestratorStyles.decisionValue}>{aiDecisions.pages?.length || 0} pages</div>
                  </div>
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Modules</div>
                    <div style={orchestratorStyles.decisionValue}>{aiDecisions.modules?.length || 0} modules</div>
                  </div>
                  {aiDecisions.adminTier && (
                    <div style={orchestratorStyles.decisionItem}>
                      <div style={orchestratorStyles.decisionLabel}>Admin Dashboard</div>
                      <div style={orchestratorStyles.decisionValue}>
                        {aiDecisions.adminTier.charAt(0).toUpperCase() + aiDecisions.adminTier.slice(1)}
                        {aiDecisions.adminModuleCount ? ` (${aiDecisions.adminModuleCount} modules)` : ''}
                      </div>
                    </div>
                  )}
                  {aiDecisions.colors && (
                    <div style={orchestratorStyles.decisionItem}>
                      <div style={orchestratorStyles.decisionLabel}>Colors</div>
                      <div style={orchestratorStyles.colorPalette}>
                        <div style={{...orchestratorStyles.colorSwatch, background: aiDecisions.colors.primary}} title="Primary" />
                        <div style={{...orchestratorStyles.colorSwatch, background: aiDecisions.colors.accent}} title="Accent" />
                      </div>
                    </div>
                  )}
                  {aiDecisions.tagline && (
                    <div style={{...orchestratorStyles.decisionItem, gridColumn: '1 / -1'}}>
                      <div style={orchestratorStyles.decisionLabel}>Tagline</div>
                      <div style={orchestratorStyles.decisionValue}>"{aiDecisions.tagline}"</div>
                    </div>
                  )}
                  <div style={orchestratorStyles.decisionItem}>
                    <div style={orchestratorStyles.decisionLabel}>Confidence</div>
                    <div style={orchestratorStyles.decisionValue}>
                      {aiDecisions.confidence === 'high' ? '🟢 High' :
                       aiDecisions.confidence === 'medium' ? '🟡 Medium' : '🟠 Low'}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
