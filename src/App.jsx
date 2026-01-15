/**
 * Module Assembler UI - WordPress-Style Simplicity
 * 
 * 3 Paths → 1 Customizer → Generate
 * So simple a 5-year-old could use it.
 */

import React, { useState, useEffect } from 'react';
import { INDUSTRY_LAYOUTS, getLayoutConfig, buildLayoutPromptContext } from '../config/industry-layouts.js';

const API_BASE = 'http://localhost:3001';

// ============================================
// ROTATING TAGLINES
// ============================================
const TAGLINES = [
  "From thought to business. Just blink.",
  "Level the playing field. Just blink.",
  "Ideas deserve a chance. Just blink.",
  "Zero to launch. Just blink.",
  "Dream it. Build it. Just blink.",
  "Everyone can be first. Just blink.",
];

// ============================================
// PASSWORD GATE (Main Entry)
// ============================================
function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % TAGLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValidating) return;

    setIsValidating(true);
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        localStorage.setItem('blink_access', 'granted');
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div style={gateStyles.container}>
      <div style={gateStyles.content}>
        <div style={gateStyles.logoContainer}>
          <img src="/blink-logo.webp" alt="Blink" style={gateStyles.logoImage} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <h1 style={gateStyles.title}>BLINK</h1>
        <p style={gateStyles.tagline} key={taglineIndex}>{TAGLINES[taglineIndex]}</p>
        <form onSubmit={handleSubmit} style={gateStyles.form}>
          <div style={{ ...gateStyles.inputWrapper, ...(shake ? { animation: 'shake 0.5s' } : {}), ...(error ? { borderColor: 'rgba(239, 68, 68, 0.5)' } : {}) }}>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="Enter access code" style={gateStyles.input} autoFocus />
          </div>
          {error && <p style={gateStyles.errorText}>Invalid access code</p>}
          <button type="submit" style={gateStyles.submitBtn}><span>Enter</span><span style={gateStyles.btnArrow}>→</span></button>
        </form>
        <p style={gateStyles.hint}>Private beta access only</p>
      </div>
      <div style={gateStyles.bgGlow1}></div>
      <div style={gateStyles.bgGlow2}></div>
    </div>
  );
}

const gateStyles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', position: 'relative', overflow: 'hidden' },
  content: { textAlign: 'center', zIndex: 10, padding: '40px' },
  logoContainer: { marginBottom: '24px' },
  logoImage: { height: '100px', width: 'auto', objectFit: 'contain' },
  title: { fontSize: '56px', fontWeight: '800', letterSpacing: '12px', background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' },
  tagline: { fontSize: '18px', color: '#22c55e', marginBottom: '48px', fontWeight: '500', minHeight: '27px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px', margin: '0 auto' },
  inputWrapper: { position: 'relative' },
  input: { width: '100%', padding: '18px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '16px', textAlign: 'center', letterSpacing: '4px', outline: 'none' },
  errorText: { color: '#ef4444', fontSize: '14px', margin: '0' },
  submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px 32px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  btnArrow: { fontSize: '18px' },
  hint: { marginTop: '32px', fontSize: '13px', color: '#444' },
  bgGlow1: { position: 'absolute', top: '-200px', right: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)', borderRadius: '50%' },
  bgGlow2: { position: 'absolute', bottom: '-200px', left: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', borderRadius: '50%' },
};

// ============================================
// DEVELOPER PASSWORD MODAL
// ============================================
function DevPasswordModal({ onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValidating) return;

    setIsValidating(true);
    try {
      const response = await fetch('/api/auth/validate-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        localStorage.setItem('blink_dev_access', 'granted');
        onSuccess();
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Dev auth error:', err);
      setError(true);
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>🔒 Developer Access</h2>
        <p style={modalStyles.subtitle}>This feature is in development mode</p>
        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="Developer password" style={{ ...modalStyles.input, ...(error ? { borderColor: '#ef4444' } : {}) }} autoFocus />
          {error && <p style={modalStyles.error}>Invalid password</p>}
          <div style={modalStyles.buttons}>
            <button type="button" onClick={onCancel} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" style={modalStyles.submitBtn}>Unlock</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1a1a1f', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', border: '1px solid rgba(255,255,255,0.1)' },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '8px', textAlign: 'center' },
  subtitle: { color: '#888', fontSize: '14px', marginBottom: '24px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', textAlign: 'center' },
  error: { color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0 },
  buttons: { display: 'flex', gap: '12px' },
  cancelBtn: { flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#888', fontSize: '15px', cursor: 'pointer' },
  submitBtn: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

// ============================================
// MAIN APP
// ============================================
export default function App() {
  // Auth state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [pendingDevPath, setPendingDevPath] = useState(null);
  const [taglineIndex, setTaglineIndex] = useState(0);
  
  // Flow state
  const [step, setStep] = useState('choose-path'); // choose-path, rebuild, quick, reference, upload-assets, customize, generating, complete, deploying, deploy-complete, deploy-error, error
  
  // Deploy state
  const [deployStatus, setDeployStatus] = useState(null);
  const [deployResult, setDeployResult] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [path, setPath] = useState(null); // 'rebuild', 'quick', 'reference'
  
  // Data collected from any path
  const [projectData, setProjectData] = useState({
    // From any path
    businessName: '',
    tagline: '',
    industry: null,
    industryKey: null,
    layoutKey: null, // Selected layout within industry

    // NEW: Business basics
    location: '',

    // NEW: Target audience (multi-select)
    targetAudience: [],

    // NEW: Primary CTA goal
    primaryCTA: 'contact', // 'book', 'call', 'quote', 'buy', 'visit', 'contact'

    // NEW: Tone (0 = professional, 100 = friendly)
    tone: 50,

    // Colors
    colorMode: 'preset', // 'preset', 'custom', 'from-site'
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#f59e0b',
      text: '#1a1a2e',
      background: '#ffffff'
    },
    selectedPreset: null,

    // Style
    effects: [],

    // Pages
    selectedPages: ['home', 'about', 'contact'],

    // References (for reference path)
    referenceSites: [],

    // Existing site (for rebuild path)
    existingSite: null,

    // Uploaded assets (logo, photos, menu)
    uploadedAssets: {
      logo: null,
      photos: [],
      menu: null
    },

    // Image/style description
    imageDescription: '',

    // Extra details for AI customization
    extraDetails: ''
  });

  // NEW: Generation state with real steps
  const [generationSteps, setGenerationSteps] = useState([]);
  const [currentGenerationStep, setCurrentGenerationStep] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [abortController, setAbortController] = useState(null);
  
  // Server data
  const [industries, setIndustries] = useState({});
  const [layouts, setLayouts] = useState({});
  const [effects, setEffects] = useState({});
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [finalBlinkCount, setFinalBlinkCount] = useState(0);

  // Check if already unlocked
  useEffect(() => {
    const access = localStorage.getItem('blink_access');
    if (access === 'granted') setIsUnlocked(true);
    const devAccess = localStorage.getItem('blink_dev_access');
    if (devAccess === 'granted') setIsDevUnlocked(true);
  }, []);
  
  // Rotate taglines in header
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % TAGLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  // Load configs on mount
  useEffect(() => {
    if (!isUnlocked) return;
    const loadConfigs = async () => {
      try {
        const [indRes, layRes, effRes] = await Promise.all([
          fetch(`${API_BASE}/api/industries`),
          fetch(`${API_BASE}/api/layouts`),
          fetch(`${API_BASE}/api/effects`)
        ]);
        const [indData, layData, effData] = await Promise.all([
          indRes.json(), layRes.json(), effRes.json()
        ]);
        if (indData.success) setIndustries(indData.industries);
        if (layData.success) setLayouts(layData.layouts);
        if (effData.success) setEffects(effData.effects);
      } catch (err) {
        console.error('Failed to load configs:', err);
      }
    };
    loadConfigs();
  }, [isUnlocked]);

  // Update project data helper
  const updateProject = (updates) => {
    setProjectData(prev => {
      const newData = { ...prev, ...updates };
      // Ensure colors always have all keys defined to prevent uncontrolled input warnings
      if (updates.colors) {
        newData.colors = {
          primary: '#3b82f6',
          secondary: '#1e40af',
          accent: '#f59e0b',
          text: '#1a1a2e',
          background: '#ffffff',
          ...prev.colors,
          ...updates.colors
        };
      }
      return newData;
    });
  };

  // Handle path selection
  const selectPath = (selectedPath) => {
    if ((selectedPath === 'rebuild' || selectedPath === 'reference') && !isDevUnlocked) {
      setPendingDevPath(selectedPath);
      setShowDevModal(true);
      return;
    }
    setPath(selectedPath);
    if (selectedPath === 'rebuild') setStep('rebuild');
    else if (selectedPath === 'quick') setStep('quick');
    else if (selectedPath === 'reference') setStep('reference');
  };
  
  const handleDevUnlock = () => {
    setIsDevUnlocked(true);
    setShowDevModal(false);
    if (pendingDevPath) {
      const p = pendingDevPath;
      setPendingDevPath(null);
      setPath(p);
      if (p === 'rebuild') setStep('rebuild');
      else if (p === 'reference') setStep('reference');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('blink_access');
    setIsUnlocked(false);
  };

  // Go to upload assets step
  const goToUploadAssets = () => {
    setStep('upload-assets');
  };
  
  // Go to customizer
  const goToCustomize = () => {
    setStep('customize');
  };

  // Generate the project with real step tracking
  const handleGenerate = async () => {
    if (!projectData.businessName.trim()) {
      setError({ title: 'Missing Business Name', message: 'Please enter a business name to continue.' });
      return;
    }

    // Initialize generation with real steps
    const steps = [
      { id: 'analyzing', label: 'Analyzing your business', icon: '🔍' },
      { id: 'selecting', label: 'Selecting components', icon: '📦' },
      ...projectData.selectedPages.map(page => ({
        id: `page-${page}`,
        label: `Generating ${page.charAt(0).toUpperCase() + page.slice(1)} page`,
        icon: '📄'
      })),
      { id: 'wiring', label: 'Wiring up backend', icon: '⚙️' },
      { id: 'finalizing', label: 'Finalizing project', icon: '✨' }
    ];

    setGenerationSteps(steps);
    setCurrentGenerationStep(0);
    setGenerationStartTime(Date.now());
    setStep('generating');
    setGenerating(true);
    setProgress(0);
    setError(null);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Simulate step progress while waiting for server
      const stepInterval = setInterval(() => {
        setCurrentGenerationStep(prev => {
          const next = Math.min(prev + 1, steps.length - 1);
          setProgress((next / steps.length) * 90);
          return next;
        });
      }, 2000);

      // Build the payload with new fields
      const toneLabel = projectData.tone < 33 ? 'professional and formal' :
                        projectData.tone > 66 ? 'friendly and casual' : 'balanced';

      const payload = {
        name: projectData.businessName.replace(/[^a-zA-Z0-9]/g, '-'),
        industry: projectData.industryKey,
        references: projectData.referenceSites,
        theme: {
          colors: projectData.colors,
          preset: projectData.selectedPreset
        },
        description: {
          text: projectData.tagline || `${projectData.businessName} - ${projectData.industry?.name || 'Professional Business'}`,
          pages: projectData.selectedPages,
          industryKey: projectData.industryKey,
          layoutKey: projectData.layoutKey,
          effects: projectData.effects,
          existingSite: projectData.existingSite,
          extraDetails: projectData.extraDetails,
          uploadedAssets: projectData.uploadedAssets,
          imageDescription: projectData.imageDescription,
          // NEW fields for better AI prompts
          location: projectData.location,
          targetAudience: projectData.targetAudience,
          primaryCTA: projectData.primaryCTA,
          tone: toneLabel
        }
      };

      const response = await fetch(`${API_BASE}/api/assemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCurrentGenerationStep(steps.length);
        setProgress(100);
        setResult(data.project);
        setStep('complete');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled - go back to customize
        setStep('customize');
      } else {
        setError({
          title: 'Generation Failed',
          message: err.message,
          hint: 'This could be a network issue or server problem. Try again in a moment.'
        });
        setStep('error');
      }
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
  };

  // Cancel generation
  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  // Deploy state with cancel support
  const [deployAbortController, setDeployAbortController] = useState(null);
  const [deployStartTime, setDeployStartTime] = useState(null);

  // Deploy the generated project
  const handleDeploy = async () => {
    if (!result?.path || !result?.name) {
      setDeployError({ title: 'No Project', message: 'No project to deploy. Please generate a project first.' });
      setStep('deploy-error');
      return;
    }

    setStep('deploying');
    setDeployStatus('Starting deployment...');
    setDeployError(null);
    setDeployStartTime(Date.now());

    // Create abort controller for cancellation
    const controller = new AbortController();
    setDeployAbortController(controller);

    try {
      // Status updates for user feedback
      const statusUpdates = [
        { status: 'Creating GitHub repository...', icon: '📦' },
        { status: 'Pushing code to GitHub...', icon: '📤' },
        { status: 'Creating Railway project...', icon: '🚂' },
        { status: 'Provisioning PostgreSQL database...', icon: '🗄️' },
        { status: 'Deploying backend service...', icon: '⚙️' },
        { status: 'Deploying frontend service...', icon: '🌐' },
        { status: 'Configuring custom domains...', icon: '🔗' },
        { status: 'Setting up DNS records...', icon: '📡' },
        { status: 'Finalizing deployment...', icon: '✨' }
      ];

      let statusIndex = 0;
      const statusInterval = setInterval(() => {
        if (statusIndex < statusUpdates.length) {
          setDeployStatus(statusUpdates[statusIndex]);
          statusIndex++;
        }
      }, 3000);

      const response = await fetch(`${API_BASE}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: result.path,
          projectName: result.name || projectData.businessName.replace(/[^a-zA-Z0-9]/g, '-'),
          adminEmail: 'admin@be1st.io'
        }),
        signal: controller.signal
      });

      clearInterval(statusInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setDeployResult(data);
        setStep('deploy-complete');
      } else {
        throw new Error(data.error || 'Deployment failed');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled - go back to complete
        setStep('complete');
      } else {
        setDeployError({
          title: 'Deployment Failed',
          message: err.message,
          hint: 'Your project was generated successfully. You can try deploying again or deploy manually.'
        });
        setStep('deploy-error');
      }
    } finally {
      setDeployAbortController(null);
    }
  };

  // Cancel deployment
  const handleCancelDeploy = () => {
    if (deployAbortController) {
      deployAbortController.abort();
    }
  };

  // Reset everything
  const handleReset = () => {
    setStep('choose-path');
    setPath(null);
    setProjectData({
      businessName: '',
      tagline: '',
      industry: null,
      industryKey: null,
      location: '',
      targetAudience: [],
      primaryCTA: 'contact',
      tone: 50,
      colorMode: 'preset',
      colors: { primary: '#3b82f6', secondary: '#1e40af', accent: '#f59e0b', text: '#1a1a2e', background: '#ffffff' },
      selectedPreset: null,
      layoutKey: null,
      effects: [],
      selectedPages: ['home', 'about', 'contact'],
      referenceSites: [],
      existingSite: null,
      uploadedAssets: { logo: null, photos: [], menu: null },
      imageDescription: '',
      extraDetails: ''
    });
    setResult(null);
    setError(null);
    setProgress(0);
    setGenerationSteps([]);
    setCurrentGenerationStep(0);
    setGenerationStartTime(null);
    setDeployResult(null);
    setDeployError(null);
    setDeployStartTime(null);
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isUnlocked) {
    return <PasswordGate onUnlock={() => setIsUnlocked(true)} />;
  }
  
  return (
    <div style={styles.container}>
      {showDevModal && (
        <DevPasswordModal 
          onSuccess={handleDevUnlock}
          onCancel={() => { setShowDevModal(false); setPendingDevPath(null); }}
        />
      )}
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <img src="/blink-logo.webp" alt="Blink" style={styles.logoImage} onError={(e) => { e.target.style.display = 'none'; }} />
          <span style={styles.logoText}>BLINK</span>
        </div>
        <div style={styles.headerRight}>
          <p style={styles.headerTagline} key={taglineIndex}>{TAGLINES[taglineIndex]}</p>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {step === 'choose-path' && (
          <ChoosePathStep onSelect={selectPath} isDevUnlocked={isDevUnlocked} />
        )}
        
        {step === 'rebuild' && (
          <RebuildStep
            projectData={projectData}
            updateProject={updateProject}
            onContinue={goToUploadAssets}
            onBack={() => setStep('choose-path')}
          />
        )}
        
        {step === 'quick' && (
          <QuickStep
            industries={industries}
            projectData={projectData}
            updateProject={updateProject}
            onContinue={goToUploadAssets}
            onBack={() => setStep('choose-path')}
          />
        )}
        
        {step === 'reference' && (
          <ReferenceStep
            projectData={projectData}
            updateProject={updateProject}
            onContinue={goToUploadAssets}
            onBack={() => setStep('choose-path')}
          />
        )}
        
        {step === 'upload-assets' && (
          <UploadAssetsStep
            projectData={projectData}
            updateProject={updateProject}
            onContinue={goToCustomize}
            onSkip={goToCustomize}
            onBack={() => setStep(path)}
          />
        )}
        
        {step === 'customize' && (
          <CustomizeStep
            projectData={projectData}
            updateProject={updateProject}
            industries={industries}
            layouts={layouts}
            effects={effects}
            onGenerate={handleGenerate}
            onBack={() => setStep(path)}
          />
        )}
        
        {step === 'generating' && (
          <GeneratingStep
            steps={generationSteps}
            currentStep={currentGenerationStep}
            startTime={generationStartTime}
            projectName={projectData.businessName}
            onCancel={handleCancelGeneration}
          />
        )}
        
        {step === 'complete' && (
          <CompleteStep 
            result={result} 
            projectData={projectData} 
            onReset={handleReset} 
            blinkCount={finalBlinkCount}
            onDeploy={handleDeploy}
            deployReady={true}
          />
        )}
        
        {step === 'error' && (
          <ErrorStep error={error} onRetry={handleGenerate} onReset={handleReset} />
        )}
        
        {step === 'deploying' && (
          <DeployingStep
            status={deployStatus}
            projectName={projectData.businessName}
            startTime={deployStartTime}
            onCancel={handleCancelDeploy}
          />
        )}
        
        {step === 'deploy-complete' && (
          <DeployCompleteStep result={deployResult} onReset={handleReset} />
        )}
        
        {step === 'deploy-error' && (
          <DeployErrorStep error={deployError} onRetry={handleDeploy} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>BLINK by BE1st</span>
        <span>•</span>
        <span>{Object.keys(industries).length} Industries</span>
        <span>•</span>
        <span>{Object.keys(layouts).length} Layouts</span>
      </footer>
    </div>
  );
}

// ============================================
// STEP 1: CHOOSE YOUR PATH
// ============================================
function ChoosePathStep({ onSelect, isDevUnlocked }) {
  return (
    <div style={styles.stepContainer}>
      <h1 style={styles.heroTitle}>How do you want to build?</h1>
      <p style={styles.heroSubtitle}>Pick your path - they all lead to something beautiful</p>
      
      <div style={styles.pathGrid}>
        {/* Rebuild Path - Dev Locked */}
        <button style={{...styles.pathCard, ...(!isDevUnlocked ? styles.pathCardLocked : {})}} onClick={() => onSelect('rebuild')}>
          {!isDevUnlocked && <div style={styles.lockedBadge}>🔒 DEV</div>}
          <div style={styles.pathIcon}>🔄</div>
          <h2 style={styles.pathTitle}>REBUILD</h2>
          <p style={styles.pathDesc}>I have a website already</p>
          <p style={styles.pathDetails}>
            Paste your URL and we'll extract your content, colors, and create a modern upgrade.
          </p>
          <div style={styles.pathArrow}>→</div>
        </button>

        {/* Quick Path - Featured & Open */}
        <button style={{...styles.pathCard, ...styles.pathCardFeatured}} onClick={() => onSelect('quick')}>
          <div style={styles.featuredBadge}>FASTEST</div>
          <div style={styles.pathIcon}>⚡</div>
          <h2 style={styles.pathTitle}>QUICK START</h2>
          <p style={styles.pathDesc}>Tell me what you're building</p>
          <p style={styles.pathDetails}>
            Just describe your business. AI picks the perfect template and you customize.
          </p>
          <div style={styles.pathArrow}>→</div>
        </button>

        {/* Reference Path - Dev Locked */}
        <button style={{...styles.pathCard, ...(!isDevUnlocked ? styles.pathCardLocked : {})}} onClick={() => onSelect('reference')}>
          {!isDevUnlocked && <div style={styles.lockedBadge}>🔒 DEV</div>}
          <div style={styles.pathIcon}>🎨</div>
          <h2 style={styles.pathTitle}>INSPIRED</h2>
          <p style={styles.pathDesc}>Show me sites I like</p>
          <p style={styles.pathDetails}>
            Add websites you love. AI extracts the best parts and builds something unique.
          </p>
          <div style={styles.pathArrow}>→</div>
        </button>
      </div>
      
      <p style={styles.bottomHint}>
        💡 All paths take under 2 minutes and create a complete, working website.
      </p>
    </div>
  );
}

// ============================================
// REBUILD PATH: Import Existing Site
// ============================================
function RebuildStep({ projectData, updateProject, onContinue, onBack }) {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // What they DON'T like about current site
  const [dislikes, setDislikes] = useState([]);
  // What they LIKE about current site (want to preserve)
  const [likes, setLikes] = useState([]);
  const [notes, setNotes] = useState('');

  // Keep/Change decisions
  const [keepLogo, setKeepLogo] = useState(true);
  const [keepColors, setKeepColors] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [selectedHeadlines, setSelectedHeadlines] = useState(new Set());

  // Optional reference sites for inspiration
  const [showReferences, setShowReferences] = useState(false);
  const [references, setReferences] = useState([{ url: '', likes: [], notes: '' }]);

  // Expanded sections
  const [showImages, setShowImages] = useState(true);
  const [showHeadlines, setShowHeadlines] = useState(true);

  const dislikeOptions = [
    { id: 'outdated', label: 'Looks outdated', icon: '📅' },
    { id: 'slow', label: 'Too slow', icon: '🐌' },
    { id: 'mobile', label: 'Bad on mobile', icon: '📱' },
    { id: 'colors', label: 'Don\'t like colors', icon: '🎨' },
    { id: 'layout', label: 'Poor layout', icon: '📐' },
    { id: 'fonts', label: 'Bad typography', icon: '🔤' },
    { id: 'images', label: 'Weak images', icon: '🖼️' },
    { id: 'navigation', label: 'Hard to navigate', icon: '🧭' },
    { id: 'content', label: 'Content needs work', icon: '📝' },
    { id: 'trust', label: 'Doesn\'t build trust', icon: '🤝' },
  ];

  const likeOptions = [
    { id: 'brand', label: 'Brand identity', icon: '🏷️' },
    { id: 'tone', label: 'Business tone', icon: '💬' },
    { id: 'structure', label: 'Page structure', icon: '📐' },
    { id: 'content', label: 'Written content', icon: '📝' },
    { id: 'images', label: 'Current photos', icon: '🖼️' },
    { id: 'contact', label: 'Contact info', icon: '📞' },
  ];

  const toggleDislike = (id) => {
    setDislikes(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleLike = (id) => {
    setLikes(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleImage = (imgSrc) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imgSrc)) {
        newSet.delete(imgSrc);
      } else {
        newSet.add(imgSrc);
      }
      return newSet;
    });
  };

  const toggleHeadline = (headline) => {
    setSelectedHeadlines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headline)) {
        newSet.delete(headline);
      } else {
        newSet.add(headline);
      }
      return newSet;
    });
  };

  const selectAllImages = () => {
    const allImages = analysis?.designSystem?.images || [];
    setSelectedImages(new Set(allImages.map(img => img.src)));
  };

  const deselectAllImages = () => {
    setSelectedImages(new Set());
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setAnalyzing(true);
    setError(null);

    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const response = await fetch(`${API_BASE}/api/analyze-existing-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);

        // Auto-select logo and hero images by default
        const autoSelected = new Set();
        const catImages = data.analysis.designSystem?.categorizedImages;
        if (catImages?.logo) catImages.logo.forEach(img => autoSelected.add(img.src));
        if (catImages?.hero) catImages.hero.slice(0, 2).forEach(img => autoSelected.add(img.src));
        if (catImages?.product) catImages.product.slice(0, 4).forEach(img => autoSelected.add(img.src));
        setSelectedImages(autoSelected);

        // Auto-select first few headlines
        const headlines = data.analysis.pageContent?.headlines || [];
        setSelectedHeadlines(new Set(headlines.slice(0, 3)));

        // Auto-fill project data from analysis
        updateProject({
          businessName: data.analysis.businessName || '',
          tagline: data.analysis.description || '',
          industryKey: data.analysis.industry || 'saas',
          selectedPages: data.analysis.recommendations?.pages || ['home', 'about', 'services', 'contact'],
        });
      } else {
        setError(data.error || 'Failed to analyze site');
      }
    } catch (err) {
      setError('Failed to analyze site. Please check the URL.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = () => {
    // Build the complete existingSite object with all selections
    const selectedImagesArray = analysis?.designSystem?.images?.filter(img => selectedImages.has(img.src)) || [];
    const selectedHeadlinesArray = Array.from(selectedHeadlines);

    updateProject({
      existingSite: {
        ...analysis,
        dislikes,
        likes,
        userNotes: notes,
        keepLogo,
        keepColors,
        selectedImages: selectedImagesArray,
        selectedHeadlines: selectedHeadlinesArray,
        referenceInspiration: references.filter(r => r.url.trim())
      },
      colors: keepColors && analysis?.designSystem?.colors?.length > 0
        ? {
            primary: analysis.designSystem.colors[0] || projectData.colors.primary,
            secondary: analysis.designSystem.colors[1] || projectData.colors.secondary,
            accent: analysis.designSystem.colors[2] || projectData.colors.accent,
            text: projectData.colors.text,
            background: projectData.colors.background
          }
        : projectData.colors
    });
    onContinue();
  };

  // Get categorized images for display
  const getImagesByCategory = () => {
    const cat = analysis?.designSystem?.categorizedImages;
    if (!cat) return [];

    const categories = [];
    if (cat.logo?.length > 0) categories.push({ name: 'Logo', icon: '🏷️', images: cat.logo });
    if (cat.hero?.length > 0) categories.push({ name: 'Hero/Banner', icon: '🦸', images: cat.hero });
    if (cat.team?.length > 0) categories.push({ name: 'Team', icon: '👥', images: cat.team });
    if (cat.product?.length > 0) categories.push({ name: 'Products/Services', icon: '📦', images: cat.product });
    if (cat.gallery?.length > 0) categories.push({ name: 'Gallery', icon: '🖼️', images: cat.gallery });
    if (cat.general?.length > 0) categories.push({ name: 'Other', icon: '📷', images: cat.general.slice(0, 6) });

    return categories;
  };

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>

      <h1 style={styles.stepTitle}>🔄 Rebuild Your Website</h1>
      <p style={styles.stepSubtitle}>We'll analyze your site and create a modern upgrade</p>

      <div style={styles.inputRow}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="yourwebsite.com"
          style={styles.bigInput}
          autoFocus
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !url.trim()}
          style={{...styles.primaryBtn, opacity: analyzing || !url.trim() ? 0.5 : 1}}
        >
          {analyzing ? '⏳ Analyzing...' : '🔍 Analyze'}
        </button>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      {/* Analysis Results */}
      {analysis && (
        <div style={rebuildStyles.resultsContainer}>
          {/* Success Header */}
          <div style={rebuildStyles.successHeader}>
            <span style={rebuildStyles.checkIcon}>✅</span>
            <div>
              <div style={rebuildStyles.successTitle}>Site Analyzed: {analysis.businessName || 'Your Business'}</div>
              <div style={rebuildStyles.successSubtitle}>
                {analysis.industry} • {analysis.designSystem?.images?.length || 0} images • {analysis.pageContent?.headlines?.length || 0} headlines
              </div>
            </div>
          </div>

          {/* SECTION: Extracted Images */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader} onClick={() => setShowImages(!showImages)}>
              <span style={rebuildStyles.sectionIcon}>🖼️</span>
              <span style={rebuildStyles.sectionTitle}>Images Found ({selectedImages.size} selected)</span>
              <span style={rebuildStyles.expandIcon}>{showImages ? '▼' : '▶'}</span>
            </div>

            {showImages && (
              <div style={rebuildStyles.sectionContent}>
                <div style={rebuildStyles.selectAllRow}>
                  <button style={rebuildStyles.selectAllBtn} onClick={selectAllImages}>Select All</button>
                  <button style={rebuildStyles.selectAllBtn} onClick={deselectAllImages}>Deselect All</button>
                  <span style={rebuildStyles.selectHint}>Click images to keep them in your new site</span>
                </div>

                {getImagesByCategory().map(category => (
                  <div key={category.name} style={rebuildStyles.imageCategory}>
                    <div style={rebuildStyles.categoryLabel}>{category.icon} {category.name}</div>
                    <div style={rebuildStyles.imageGrid}>
                      {category.images.slice(0, 8).map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            ...rebuildStyles.imageThumb,
                            ...(selectedImages.has(img.src) ? rebuildStyles.imageThumbSelected : {})
                          }}
                          onClick={() => toggleImage(img.src)}
                        >
                          <img
                            src={img.src}
                            alt={img.alt || ''}
                            style={rebuildStyles.imageImg}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          {selectedImages.has(img.src) && (
                            <div style={rebuildStyles.imageCheck}>✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: Headlines */}
          {analysis.pageContent?.headlines?.length > 0 && (
            <div style={rebuildStyles.section}>
              <div style={rebuildStyles.sectionHeader} onClick={() => setShowHeadlines(!showHeadlines)}>
                <span style={rebuildStyles.sectionIcon}>📝</span>
                <span style={rebuildStyles.sectionTitle}>Headlines Found ({selectedHeadlines.size} selected)</span>
                <span style={rebuildStyles.expandIcon}>{showHeadlines ? '▼' : '▶'}</span>
              </div>

              {showHeadlines && (
                <div style={rebuildStyles.sectionContent}>
                  <p style={rebuildStyles.sectionHint}>Select headlines to preserve (we'll improve the wording)</p>
                  <div style={rebuildStyles.headlinesList}>
                    {analysis.pageContent.headlines.slice(0, 10).map((headline, idx) => (
                      <label
                        key={idx}
                        style={{
                          ...rebuildStyles.headlineItem,
                          ...(selectedHeadlines.has(headline) ? rebuildStyles.headlineItemSelected : {})
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHeadlines.has(headline)}
                          onChange={() => toggleHeadline(headline)}
                          style={rebuildStyles.headlineCheckbox}
                        />
                        <span style={rebuildStyles.headlineText}>"{headline}"</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION: Colors & Logo */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>🎨</span>
              <span style={rebuildStyles.sectionTitle}>Brand Elements</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <div style={rebuildStyles.brandRow}>
                {/* Logo Toggle */}
                <div style={rebuildStyles.brandOption}>
                  <span style={rebuildStyles.brandLabel}>Logo</span>
                  <div style={rebuildStyles.toggleRow}>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(keepLogo ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepLogo(true)}
                    >
                      Keep Current
                    </button>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(!keepLogo ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepLogo(false)}
                    >
                      Upload New
                    </button>
                  </div>
                </div>

                {/* Colors Toggle */}
                <div style={rebuildStyles.brandOption}>
                  <span style={rebuildStyles.brandLabel}>Colors</span>
                  {analysis.designSystem?.colors?.length > 0 && (
                    <div style={rebuildStyles.colorPreview}>
                      {analysis.designSystem.colors.slice(0, 5).map((color, idx) => (
                        <div key={idx} style={{...rebuildStyles.colorDot, background: color}} title={color} />
                      ))}
                    </div>
                  )}
                  <div style={rebuildStyles.toggleRow}>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(keepColors ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepColors(true)}
                    >
                      Keep These
                    </button>
                    <button
                      style={{
                        ...rebuildStyles.toggleBtn,
                        ...(!keepColors ? rebuildStyles.toggleBtnActive : {})
                      }}
                      onClick={() => setKeepColors(false)}
                    >
                      New Colors
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: What You LIKE */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>💚</span>
              <span style={rebuildStyles.sectionTitle}>What do you LIKE about your current site?</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <p style={rebuildStyles.sectionHint}>We'll preserve these aspects</p>
              <div style={rebuildStyles.chipGrid}>
                {likeOptions.map(opt => (
                  <button
                    key={opt.id}
                    style={{
                      ...rebuildStyles.likeChip,
                      ...(likes.includes(opt.id) ? rebuildStyles.likeChipActive : {})
                    }}
                    onClick={() => toggleLike(opt.id)}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: What Needs Improvement */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>🔧</span>
              <span style={rebuildStyles.sectionTitle}>What needs improvement?</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <p style={rebuildStyles.sectionHint}>Select all that apply</p>
              <div style={rebuildStyles.chipGrid}>
                {dislikeOptions.map(opt => (
                  <button
                    key={opt.id}
                    style={{
                      ...rebuildStyles.dislikeChip,
                      ...(dislikes.includes(opt.id) ? rebuildStyles.dislikeChipActive : {})
                    }}
                    onClick={() => toggleDislike(opt.id)}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: Notes & Vision */}
          <div style={rebuildStyles.section}>
            <div style={rebuildStyles.sectionHeader}>
              <span style={rebuildStyles.sectionIcon}>💭</span>
              <span style={rebuildStyles.sectionTitle}>Describe your ideal result</span>
            </div>
            <div style={rebuildStyles.sectionContent}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Make it feel more premium like a modern restaurant. Keep our family story but present it better. I want customers to trust us immediately..."
                style={rebuildStyles.notesTextarea}
                rows={3}
              />
            </div>
          </div>

          {/* SECTION: Inspiration Sites (Optional) */}
          <div style={rebuildStyles.section}>
            <div
              style={rebuildStyles.sectionHeader}
              onClick={() => setShowReferences(!showReferences)}
            >
              <span style={rebuildStyles.sectionIcon}>✨</span>
              <span style={rebuildStyles.sectionTitle}>Inspiration Sites (Optional)</span>
              <span style={rebuildStyles.expandIcon}>{showReferences ? '▼' : '▶'}</span>
            </div>

            {showReferences && (
              <div style={rebuildStyles.sectionContent}>
                <p style={rebuildStyles.sectionHint}>Show us sites you admire - we'll blend their best parts</p>
                {references.map((ref, idx) => (
                  <div key={idx} style={rebuildStyles.refSiteRow}>
                    <input
                      type="text"
                      value={ref.url}
                      onChange={(e) => {
                        const newRefs = [...references];
                        newRefs[idx].url = e.target.value;
                        setReferences(newRefs);
                      }}
                      placeholder="https://example.com"
                      style={rebuildStyles.refSiteInput}
                    />
                    {idx > 0 && (
                      <button
                        style={rebuildStyles.removeRefBtn}
                        onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {references.length < 3 && (
                  <button
                    style={rebuildStyles.addRefBtn}
                    onClick={() => setReferences([...references, { url: '', likes: [], notes: '' }])}
                  >
                    + Add another site
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button style={rebuildStyles.continueBtn} onClick={handleContinue}>
            Continue to Customize →
          </button>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !analyzing && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🌐</div>
          <p>Enter your website URL above</p>
          <p style={styles.emptyHint}>We'll extract your content, colors, images, and structure</p>
        </div>
      )}
    </div>
  );
}

// Rebuild Step Styles
const rebuildStyles = {
  resultsContainer: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  checkIcon: {
    fontSize: '32px'
  },
  successTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff'
  },
  successSubtitle: {
    fontSize: '14px',
    color: '#888',
    marginTop: '4px'
  },
  section: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  sectionIcon: {
    fontSize: '20px'
  },
  sectionTitle: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '600',
    color: '#e4e4e4'
  },
  expandIcon: {
    color: '#666',
    fontSize: '12px'
  },
  sectionContent: {
    padding: '16px 20px'
  },
  sectionHint: {
    color: '#888',
    fontSize: '13px',
    marginBottom: '12px'
  },
  selectAllRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  selectAllBtn: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer'
  },
  selectHint: {
    color: '#666',
    fontSize: '12px',
    marginLeft: 'auto'
  },
  imageCategory: {
    marginBottom: '16px'
  },
  categoryLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#888',
    marginBottom: '8px'
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '8px'
  },
  imageThumb: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(255,255,255,0.05)'
  },
  imageThumbSelected: {
    border: '2px solid #22c55e',
    boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)'
  },
  imageImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  imageCheck: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    background: '#22c55e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700'
  },
  headlinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  headlineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  headlineItemSelected: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  headlineCheckbox: {
    marginTop: '2px',
    accentColor: '#22c55e'
  },
  headlineText: {
    fontSize: '14px',
    color: '#e4e4e4',
    lineHeight: '1.4'
  },
  brandRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },
  brandOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  brandLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#e4e4e4'
  },
  colorPreview: {
    display: 'flex',
    gap: '6px',
    marginBottom: '4px'
  },
  colorDot: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  toggleRow: {
    display: 'flex',
    gap: '8px'
  },
  toggleBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  toggleBtnActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  likeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  likeChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  dislikeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dislikeChipActive: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#ef4444'
  },
  notesTextarea: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#e4e4e4',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none'
  },
  refSiteRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  refSiteInput: {
    flex: 1,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e4e4e4',
    fontSize: '14px',
    outline: 'none'
  },
  removeRefBtn: {
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    cursor: 'pointer'
  },
  addRefBtn: {
    padding: '10px 16px',
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%'
  },
  continueBtn: {
    padding: '18px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  }
};

// ============================================
// QUICK PATH: Just Describe It
// ============================================
function QuickStep({ industries, projectData, updateProject, onContinue, onBack }) {
  const [input, setInput] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null);

  const examples = [
    'Pizza restaurant in Brooklyn',
    'Dental clinic',
    'Sports card shop',
    'Yoga studio in Austin',
    'Law firm',
    'Coffee roastery'
  ];

  const handleDetect = async () => {
    if (!input.trim()) return;
    
    setDetecting(true);
    
    // Simple industry detection from input
    const inputLower = input.toLowerCase();
    let matchedIndustry = null;
    let matchedKey = null;
    
    // Match against industries
    for (const [key, ind] of Object.entries(industries)) {
      const name = ind.name?.toLowerCase() || '';
      const keywords = [name, ...(ind.keywords || [])].map(k => k.toLowerCase());
      
      if (keywords.some(k => inputLower.includes(k)) || inputLower.includes(key)) {
        matchedIndustry = ind;
        matchedKey = key;
        break;
      }
    }
    
    // Fallback detection - order matters (specific first)
    if (!matchedIndustry) {
      // Finance/Investment (BEFORE SaaS)
      if (inputLower.includes('investment') || inputLower.includes('wealth') || inputLower.includes('portfolio') || inputLower.includes('hedge fund') || inputLower.includes('private equity') || inputLower.includes('asset management') || inputLower.includes('capital') || inputLower.includes('securities') || inputLower.includes('brokerage') || inputLower.includes('financial advisor')) {
        matchedKey = 'finance';
        matchedIndustry = industries['finance'] || { name: 'Finance / Investment Firm', icon: '💹' };
      } else if (inputLower.includes('restaurant') || inputLower.includes('food') || inputLower.includes('pizza') || inputLower.includes('bbq') || inputLower.includes('cafe') || inputLower.includes('dining') || inputLower.includes('grill')) {
        matchedKey = 'restaurant';
        matchedIndustry = industries['restaurant'] || { name: 'Restaurant', icon: '🍽️' };
      } else if (inputLower.includes('dental') || inputLower.includes('dentist')) {
        matchedKey = 'dental';
        matchedIndustry = industries['dental'] || { name: 'Dental Practice', icon: '🦷' };
      } else if (inputLower.includes('doctor') || inputLower.includes('clinic') || inputLower.includes('medical') || inputLower.includes('healthcare') || inputLower.includes('physician')) {
        matchedKey = 'healthcare';
        matchedIndustry = industries['healthcare'] || { name: 'Healthcare', icon: '🏥' };
      } else if (inputLower.includes('card') || inputLower.includes('collect')) {
        matchedKey = 'collectibles';
        matchedIndustry = industries['collectibles'] || { name: 'Collectibles', icon: '🃏' };
      } else if (inputLower.includes('law') || inputLower.includes('attorney') || inputLower.includes('lawyer') || inputLower.includes('legal')) {
        matchedKey = 'law-firm';
        matchedIndustry = industries['law-firm'] || { name: 'Law Firm', icon: '⚖️' };
      } else if (inputLower.includes('yoga') || inputLower.includes('pilates') || inputLower.includes('meditation')) {
        matchedKey = 'yoga';
        matchedIndustry = industries['yoga'] || { name: 'Yoga Studio', icon: '🧘' };
      } else if (inputLower.includes('gym') || inputLower.includes('fitness') || inputLower.includes('crossfit')) {
        matchedKey = 'fitness';
        matchedIndustry = industries['fitness'] || { name: 'Fitness', icon: '🏋️' };
      } else if (inputLower.includes('spa') || inputLower.includes('salon') || inputLower.includes('beauty')) {
        matchedKey = 'spa-salon';
        matchedIndustry = industries['spa-salon'] || { name: 'Spa / Salon', icon: '💆' };
      } else if (inputLower.includes('coffee') || inputLower.includes('roaster')) {
        matchedKey = 'cafe';
        matchedIndustry = industries['cafe'] || { name: 'Coffee Shop', icon: '☕' };
      } else if (inputLower.includes('real estate') || inputLower.includes('realtor') || inputLower.includes('realty')) {
        matchedKey = 'real-estate';
        matchedIndustry = industries['real-estate'] || { name: 'Real Estate', icon: '🏠' };
      } else if (inputLower.includes('construction') || inputLower.includes('contractor') || inputLower.includes('builder')) {
        matchedKey = 'construction';
        matchedIndustry = industries['construction'] || { name: 'Construction', icon: '🔨' };
      } else if (inputLower.includes('plumb') || inputLower.includes('hvac')) {
        matchedKey = 'plumber';
        matchedIndustry = industries['plumber'] || { name: 'Plumber / HVAC', icon: '🔧' };
      } else if (inputLower.includes('electric')) {
        matchedKey = 'electrician';
        matchedIndustry = industries['electrician'] || { name: 'Electrician', icon: '⚡' };
      } else {
        matchedKey = 'saas';
        matchedIndustry = industries['saas'] || { name: 'Business', icon: '💼' };
      }
    }
    
    setTimeout(() => {
      setDetected({ industry: matchedIndustry, key: matchedKey });
      updateProject({
        businessName: input,
        industry: matchedIndustry,
        industryKey: matchedKey,
        layoutKey: matchedIndustry?.defaultLayout || null,
        effects: matchedIndustry?.effects || [],
        selectedPages: matchedIndustry?.defaultPages || ['home', 'about', 'services', 'contact']
      });
      setDetecting(false);
    }, 800);
  };

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      
      <h1 style={styles.stepTitle}>⚡ What are you building?</h1>
      <p style={styles.stepSubtitle}>Describe your business in a few words</p>

      <div style={styles.inputRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleDetect()}
          placeholder="e.g., BBQ restaurant in Dallas"
          style={styles.bigInput}
          autoFocus
        />
        <button 
          onClick={handleDetect} 
          disabled={detecting || !input.trim()}
          style={{...styles.primaryBtn, opacity: detecting || !input.trim() ? 0.5 : 1}}
        >
          {detecting ? '🔍 Detecting...' : 'Continue →'}
        </button>
      </div>

      {/* Example chips */}
      <div style={styles.examples}>
        <p style={styles.examplesLabel}>Try these:</p>
        <div style={styles.exampleChips}>
          {examples.map(ex => (
            <button key={ex} style={styles.exampleChip} onClick={() => setInput(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Detection result */}
      {detected && (
        <div style={styles.detectedCard}>
          <div style={styles.detectedIcon}>{detected.industry?.icon || '✨'}</div>
          <div style={styles.detectedContent}>
            <h3 style={styles.detectedTitle}>{detected.industry?.name || 'Business'} Detected!</h3>
            <p style={styles.detectedDesc}>Perfect template selected. Ready to customize.</p>
          </div>
          <button style={styles.continueBtn} onClick={onContinue}>
            Customize →
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// UPLOAD ASSETS STEP: Logo, Photos, Menu
// ============================================
function UploadAssetsStep({ projectData, updateProject, onContinue, onBack, onSkip }) {
  const [uploading, setUploading] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);
  
  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      
      updateProject({
        uploadedAssets: {
          ...projectData.uploadedAssets,
          logo: { file: file.name, base64, type: file.type }
        }
      });
      
      // Extract colors from logo using canvas
      setExtractingColors(true);
      try {
        const colors = await extractColorsFromImage(base64);
        if (colors) {
          updateProject({
            colors: {
              ...projectData.colors,
              primary: colors.primary || projectData.colors.primary,
              secondary: colors.secondary || projectData.colors.secondary,
              accent: colors.accent || projectData.colors.accent
            },
            colorMode: 'from-logo'
          });
        }
      } catch (err) {
        console.error('Color extraction failed:', err);
      }
      setExtractingColors(false);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle product/gallery photos upload
  const handlePhotosUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    if (files.length === 0) return;
    
    setUploading(true);
    
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({ file: file.name, base64: event.target.result, type: file.type });
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(promises).then(photos => {
      updateProject({
        uploadedAssets: {
          ...projectData.uploadedAssets,
          photos: [...(projectData.uploadedAssets?.photos || []), ...photos].slice(0, 10)
        }
      });
      setUploading(false);
    });
  };
  
  // Handle menu/pricing upload (image or PDF)
  const handleMenuUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      updateProject({
        uploadedAssets: {
          ...projectData.uploadedAssets,
          menu: { file: file.name, base64: event.target.result, type: file.type }
        }
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove uploaded item
  const removePhoto = (index) => {
    const photos = [...(projectData.uploadedAssets?.photos || [])];
    photos.splice(index, 1);
    updateProject({
      uploadedAssets: { ...projectData.uploadedAssets, photos }
    });
  };
  
  const removeLogo = () => {
    updateProject({
      uploadedAssets: { ...projectData.uploadedAssets, logo: null }
    });
  };
  
  const removeMenu = () => {
    updateProject({
      uploadedAssets: { ...projectData.uploadedAssets, menu: null }
    });
  };
  
  // Extract colors from image using canvas
  const extractColorsFromImage = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Sample colors from different regions
        const colors = [];
        const samplePoints = [
          { x: img.width * 0.25, y: img.height * 0.25 },
          { x: img.width * 0.5, y: img.height * 0.5 },
          { x: img.width * 0.75, y: img.height * 0.75 },
          { x: img.width * 0.1, y: img.height * 0.1 },
          { x: img.width * 0.9, y: img.height * 0.1 },
        ];
        
        samplePoints.forEach(point => {
          try {
            const data = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
            if (data[3] > 50) { // Only if not too transparent
              const hex = '#' + [data[0], data[1], data[2]].map(x => x.toString(16).padStart(2, '0')).join('');
              colors.push(hex);
            }
          } catch (e) {}
        });
        
        // Filter out whites, blacks, and grays
        const validColors = colors.filter(c => {
          const r = parseInt(c.slice(1, 3), 16);
          const g = parseInt(c.slice(3, 5), 16);
          const b = parseInt(c.slice(5, 7), 16);
          const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;
          const isTooLight = r > 240 && g > 240 && b > 240;
          const isTooDark = r < 15 && g < 15 && b < 15;
          return !isGray && !isTooLight && !isTooDark;
        });
        
        if (validColors.length >= 2) {
          resolve({
            primary: validColors[0],
            secondary: validColors[1],
            accent: validColors[2] || validColors[0]
          });
        } else if (validColors.length === 1) {
          resolve({
            primary: validColors[0],
            secondary: validColors[0],
            accent: validColors[0]
          });
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = base64;
    });
  };
  
  const assets = projectData.uploadedAssets || {};
  const hasAnyAssets = assets.logo || (assets.photos && assets.photos.length > 0) || assets.menu;

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      
      <h1 style={styles.stepTitle}>📸 Upload Your Assets</h1>
      <p style={styles.stepSubtitle}>Add your logo, photos, and menu for a personalized website</p>
      
      {/* Logo Upload */}
      <div style={styles.uploadSection}>
        <div style={styles.uploadHeader}>
          <span style={styles.uploadIcon}>🎨</span>
          <div>
            <h3 style={styles.uploadTitle}>Logo</h3>
            <p style={styles.uploadDesc}>We'll extract your brand colors automatically</p>
          </div>
        </div>
        
        {assets.logo ? (
          <div style={styles.uploadedItem}>
            <img src={assets.logo.base64} alt="Logo" style={styles.uploadedLogo} />
            <div style={styles.uploadedInfo}>
              <span>{assets.logo.file}</span>
              {extractingColors && <span style={styles.extractingText}>🎨 Extracting colors...</span>}
              {projectData.colorMode === 'from-logo' && (
                <div style={styles.extractedColorsPreview}>
                  <span>Extracted:</span>
                  <div style={{...styles.colorDotSmall, background: projectData.colors.primary}} />
                  <div style={{...styles.colorDotSmall, background: projectData.colors.secondary}} />
                  <div style={{...styles.colorDotSmall, background: projectData.colors.accent}} />
                </div>
              )}
            </div>
            <button style={styles.removeBtn} onClick={removeLogo}>✕</button>
          </div>
        ) : (
          <label style={styles.uploadDropzone}>
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            <span style={styles.dropzoneIcon}>📤</span>
            <span>Drop logo here or click to upload</span>
            <span style={styles.dropzoneHint}>PNG, JPG, SVG • Max 5MB</span>
          </label>
        )}
      </div>
      
      {/* Product Photos Upload */}
      <div style={styles.uploadSection}>
        <div style={styles.uploadHeader}>
          <span style={styles.uploadIcon}>🖼️</span>
          <div>
            <h3 style={styles.uploadTitle}>Product / Gallery Photos</h3>
            <p style={styles.uploadDesc}>Up to 10 photos for your gallery and product sections</p>
          </div>
        </div>
        
        <div style={styles.photoGrid}>
          {(assets.photos || []).map((photo, index) => (
            <div key={index} style={styles.photoItem}>
              <img src={photo.base64} alt={`Photo ${index + 1}`} style={styles.photoThumb} />
              <button style={styles.photoRemoveBtn} onClick={() => removePhoto(index)}>✕</button>
            </div>
          ))}
          
          {(!assets.photos || assets.photos.length < 10) && (
            <label style={styles.photoAddBtn}>
              <input type="file" accept="image/*" multiple onChange={handlePhotosUpload} style={{ display: 'none' }} />
              <span>+</span>
              <span style={styles.photoAddText}>Add Photos</span>
            </label>
          )}
        </div>
        
        {assets.photos && assets.photos.length > 0 && (
          <p style={styles.photoCount}>{assets.photos.length}/10 photos uploaded</p>
        )}
      </div>
      
      {/* Menu/Pricing Upload */}
      <div style={styles.uploadSection}>
        <div style={styles.uploadHeader}>
          <span style={styles.uploadIcon}>📋</span>
          <div>
            <h3 style={styles.uploadTitle}>Menu / Price List (Optional)</h3>
            <p style={styles.uploadDesc}>Upload your menu or pricing - AI will extract and use it</p>
          </div>
        </div>
        
        {assets.menu ? (
          <div style={styles.uploadedItem}>
            <div style={styles.menuPreview}>
              {assets.menu.type.includes('image') ? (
                <img src={assets.menu.base64} alt="Menu" style={styles.menuThumb} />
              ) : (
                <span style={styles.menuFileIcon}>📄</span>
              )}
            </div>
            <div style={styles.uploadedInfo}>
              <span>{assets.menu.file}</span>
              <span style={styles.menuTypeTag}>{assets.menu.type.includes('pdf') ? 'PDF' : 'Image'}</span>
            </div>
            <button style={styles.removeBtn} onClick={removeMenu}>✕</button>
          </div>
        ) : (
          <label style={styles.uploadDropzone}>
            <input type="file" accept="image/*,.pdf" onChange={handleMenuUpload} style={{ display: 'none' }} />
            <span style={styles.dropzoneIcon}>📤</span>
            <span>Drop menu/price list here or click to upload</span>
            <span style={styles.dropzoneHint}>PDF or Image • Max 10MB</span>
          </label>
        )}
      </div>
      
      {/* Image Description */}
      <div style={styles.uploadSection}>
        <div style={styles.uploadHeader}>
          <span style={styles.uploadIcon}>✍️</span>
          <div>
            <h3 style={styles.uploadTitle}>Describe Your Visual Style (Optional)</h3>
            <p style={styles.uploadDesc}>Tell AI what kind of images and vibe you want</p>
          </div>
        </div>
        
        <textarea
          value={projectData.imageDescription || ''}
          onChange={(e) => updateProject({ imageDescription: e.target.value })}
          placeholder="e.g., 'Warm, rustic wood backgrounds', 'Modern and minimal with lots of white space', 'Dark and moody with gold accents', 'Bright and colorful, family-friendly vibe'"
          style={styles.styleTextarea}
          rows={3}
        />
      </div>
      
      {/* Action Buttons */}
      <div style={styles.uploadActions}>
        <button style={styles.skipBtn} onClick={onSkip}>
          Skip for now →
        </button>
        <button 
          style={{...styles.continueBtn, opacity: uploading ? 0.5 : 1}}
          onClick={onContinue}
          disabled={uploading}
        >
          {hasAnyAssets ? 'Continue with Assets →' : 'Continue →'}
        </button>
      </div>
      
      <p style={styles.uploadHint}>
        💡 Uploaded assets will be used in your generated pages. You can always change them later.
      </p>
    </div>
  );
}

// ============================================
// REFERENCE PATH: Show Sites You Like
// ============================================
function ReferenceStep({ projectData, updateProject, onContinue, onBack }) {
  // Sites with enhanced structure
  const [sites, setSites] = useState([{
    url: '',
    notes: '',
    analysis: null,
    screenshotUrl: null,
    isPrimary: true,
    elements: [] // What elements to grab from this site
  }]);
  const [analyzing, setAnalyzing] = useState(null);
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Sub-step: 'input' | 'preview'
  const [subStep, setSubStep] = useState('input');

  // Element options - what can be grabbed from each site
  const elementOptions = [
    { id: 'colors', label: 'Color Scheme', icon: '🎨', description: 'Use this site\'s color palette' },
    { id: 'typography', label: 'Typography', icon: '🔤', description: 'Font choices and text styling' },
    { id: 'layout', label: 'Layout Structure', icon: '📐', description: 'How sections are arranged' },
    { id: 'hero', label: 'Hero Section', icon: '🦸', description: 'The main banner/header area' },
    { id: 'navigation', label: 'Navigation', icon: '🧭', description: 'Menu and nav bar style' },
    { id: 'cards', label: 'Card Design', icon: '🃏', description: 'How content cards look' },
    { id: 'spacing', label: 'Whitespace', icon: '📏', description: 'Breathing room between elements' },
    { id: 'cta', label: 'CTAs & Buttons', icon: '👆', description: 'Call-to-action button styles' },
    { id: 'footer', label: 'Footer', icon: '🦶', description: 'Bottom section design' },
    { id: 'overall', label: 'Overall Vibe', icon: '💫', description: 'General aesthetic and feeling' },
  ];

  // Industry-specific site suggestions
  const industrySuggestions = {
    'dental': [
      { name: 'Tend', url: 'hellotend.com', desc: 'Modern dental experience' },
      { name: 'Aspen Dental', url: 'aspendental.com', desc: 'Friendly, approachable' },
      { name: 'One Medical', url: 'onemedical.com', desc: 'Clean healthcare design' },
    ],
    'restaurant': [
      { name: 'Sweetgreen', url: 'sweetgreen.com', desc: 'Fresh, modern food brand' },
      { name: 'Chipotle', url: 'chipotle.com', desc: 'Bold, confident' },
      { name: 'Shake Shack', url: 'shakeshack.com', desc: 'Fun, approachable' },
    ],
    'saas': [
      { name: 'Stripe', url: 'stripe.com', desc: 'Premium tech aesthetic' },
      { name: 'Linear', url: 'linear.app', desc: 'Clean, minimal SaaS' },
      { name: 'Notion', url: 'notion.so', desc: 'Friendly, spacious' },
    ],
    'default': [
      { name: 'Stripe', url: 'stripe.com', desc: 'Premium, professional' },
      { name: 'Airbnb', url: 'airbnb.com', desc: 'Warm, trustworthy' },
      { name: 'Linear', url: 'linear.app', desc: 'Clean, modern' },
      { name: 'Vercel', url: 'vercel.com', desc: 'Bold, developer-focused' },
    ]
  };

  const getSuggestions = () => {
    const industry = projectData.industryKey || 'default';
    return industrySuggestions[industry] || industrySuggestions['default'];
  };

  const toggleElement = (siteIndex, elementId) => {
    const newSites = [...sites];
    const currentElements = newSites[siteIndex].elements || [];
    newSites[siteIndex].elements = currentElements.includes(elementId)
      ? currentElements.filter(e => e !== elementId)
      : [...currentElements, elementId];
    setSites(newSites);
  };

  const setPrimary = (index) => {
    const newSites = sites.map((site, i) => ({
      ...site,
      isPrimary: i === index
    }));
    setSites(newSites);
  };

  const addSite = () => {
    if (sites.length < 3) {
      setSites([...sites, {
        url: '',
        notes: '',
        analysis: null,
        screenshotUrl: null,
        isPrimary: false,
        elements: []
      }]);
    }
  };

  const updateSite = (index, field, value) => {
    const newSites = [...sites];
    newSites[index] = { ...newSites[index], [field]: value };
    setSites(newSites);
  };

  const removeSite = (index) => {
    if (sites.length > 1) {
      let newSites = sites.filter((_, i) => i !== index);
      // If we removed the primary, make first one primary
      if (sites[index].isPrimary && newSites.length > 0) {
        newSites[0].isPrimary = true;
      }
      setSites(newSites);
    }
  };

  const getScreenshotUrl = (url) => {
    if (!url) return null;
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
    return `https://image.thum.io/get/width/400/crop/300/png/${cleanUrl}`;
  };

  const analyzeSite = async (index) => {
    const site = sites[index];
    if (!site.url.trim()) return;

    setAnalyzing(index);

    try {
      let cleanUrl = site.url.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      // Set screenshot URL immediately
      const newSites = [...sites];
      newSites[index].screenshotUrl = getScreenshotUrl(cleanUrl);
      setSites(newSites);

      const response = await fetch(`${API_BASE}/api/analyze-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await response.json();

      if (data.success) {
        const updatedSites = [...sites];
        updatedSites[index] = {
          ...updatedSites[index],
          analysis: data.analysis,
          screenshotUrl: getScreenshotUrl(cleanUrl),
          // Auto-select some elements based on analysis
          elements: updatedSites[index].isPrimary
            ? ['colors', 'typography', 'overall']
            : ['cards', 'spacing']
        };
        setSites(updatedSites);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(null);
    }
  };

  const useSuggestion = (suggestion) => {
    const newSites = [...sites];
    const emptyIndex = newSites.findIndex(s => !s.url.trim());
    if (emptyIndex >= 0) {
      newSites[emptyIndex].url = suggestion.url;
      setSites(newSites);
    } else if (newSites.length < 3) {
      setSites([...newSites, {
        url: suggestion.url,
        notes: '',
        analysis: null,
        screenshotUrl: null,
        isPrimary: false,
        elements: []
      }]);
    }
  };

  const goToPreview = () => {
    setSubStep('preview');
  };

  const handleContinue = () => {
    // Find primary site for colors
    const primarySite = sites.find(s => s.isPrimary && s.analysis?.colors);

    if (primarySite?.analysis?.colors) {
      updateProject({
        colors: {
          primary: primarySite.analysis.colors.primary || projectData.colors.primary,
          secondary: primarySite.analysis.colors.secondary || projectData.colors.secondary,
          accent: primarySite.analysis.colors.accent || projectData.colors.accent,
          text: projectData.colors.text,
          background: projectData.colors.background
        },
        colorMode: 'from-site'
      });
    }

    // Build enhanced reference data
    const enhancedSites = sites.filter(s => s.url.trim()).map(s => ({
      url: s.url,
      notes: s.notes,
      isPrimary: s.isPrimary,
      elements: s.elements || [],
      elementLabels: (s.elements || []).map(id => elementOptions.find(o => o.id === id)?.label).filter(Boolean),
      analysis: s.analysis
    }));

    updateProject({
      referenceSites: enhancedSites,
      businessName: businessName || businessDescription || projectData.businessName,
      tagline: businessDescription || projectData.tagline
    });

    onContinue();
  };

  const validSites = sites.filter(s => s.url.trim()).length;
  const analyzedSites = sites.filter(s => s.analysis).length;

  // Get blend preview summary
  const getBlendSummary = () => {
    const primary = sites.find(s => s.isPrimary);
    const secondary = sites.filter(s => !s.isPrimary && s.url.trim());

    let summary = {
      colors: null,
      typography: null,
      style: null,
      elements: []
    };

    // Colors from primary or first analyzed
    if (primary?.analysis?.colors) {
      summary.colors = primary.analysis.colors;
    }

    // Style from primary
    if (primary?.analysis) {
      summary.style = primary.analysis.style;
      summary.typography = primary.analysis.fonts;
    }

    // Collect all selected elements
    sites.forEach((site, idx) => {
      (site.elements || []).forEach(el => {
        const opt = elementOptions.find(o => o.id === el);
        if (opt) {
          summary.elements.push({
            element: opt.label,
            icon: opt.icon,
            from: site.url.replace('https://', '').split('/')[0],
            isPrimary: site.isPrimary
          });
        }
      });
    });

    return summary;
  };

  // INPUT SUBSTEP
  if (subStep === 'input') {
    return (
      <div style={styles.stepContainer}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>

        <h1 style={styles.stepTitle}>🎨 Get Inspired</h1>
        <p style={styles.stepSubtitle}>Show us sites you love - we'll blend their best elements</p>

        {/* Business Info */}
        <div style={inspiredStyles.businessSection}>
          <div style={inspiredStyles.businessRow}>
            <div style={inspiredStyles.businessField}>
              <label style={inspiredStyles.fieldLabel}>Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your Business Name"
                style={inspiredStyles.fieldInput}
              />
            </div>
            <div style={inspiredStyles.businessField}>
              <label style={inspiredStyles.fieldLabel}>What do you do?</label>
              <input
                type="text"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="e.g., Modern dental clinic in Austin"
                style={inspiredStyles.fieldInput}
              />
            </div>
          </div>
        </div>

        {/* Quick Suggestions */}
        <div style={inspiredStyles.suggestionsSection}>
          <div style={inspiredStyles.suggestionsHeader}>
            <span style={inspiredStyles.suggestionsIcon}>💡</span>
            <span style={inspiredStyles.suggestionsTitle}>Popular Inspirations</span>
          </div>
          <div style={inspiredStyles.suggestionsList}>
            {getSuggestions().map(s => (
              <button
                key={s.url}
                style={inspiredStyles.suggestionChip}
                onClick={() => useSuggestion(s)}
              >
                <span style={inspiredStyles.suggestionName}>{s.name}</span>
                <span style={inspiredStyles.suggestionDesc}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sites Input */}
        <div style={inspiredStyles.sitesContainer}>
          {sites.map((site, index) => (
            <div
              key={index}
              style={{
                ...inspiredStyles.siteCard,
                ...(site.isPrimary ? inspiredStyles.siteCardPrimary : {})
              }}
            >
              {/* Site Header */}
              <div style={inspiredStyles.siteHeader}>
                <div style={inspiredStyles.siteHeaderLeft}>
                  <span style={inspiredStyles.siteNumber}>Site {index + 1}</span>
                  {site.isPrimary && <span style={inspiredStyles.primaryBadge}>Primary</span>}
                </div>
                <div style={inspiredStyles.siteHeaderRight}>
                  {site.analysis && <span style={inspiredStyles.analyzedBadge}>✓ Analyzed</span>}
                  {sites.length > 1 && (
                    <button style={inspiredStyles.removeSiteBtn} onClick={() => removeSite(index)}>✕</button>
                  )}
                </div>
              </div>

              {/* URL Input */}
              <div style={inspiredStyles.urlRow}>
                <input
                  type="text"
                  value={site.url}
                  onChange={(e) => updateSite(index, 'url', e.target.value)}
                  placeholder="stripe.com"
                  style={inspiredStyles.urlInput}
                />
                {site.url && !site.analysis && (
                  <button
                    onClick={() => analyzeSite(index)}
                    disabled={analyzing === index}
                    style={inspiredStyles.analyzeBtn}
                  >
                    {analyzing === index ? '⏳' : '🔍'} {analyzing === index ? 'Analyzing...' : 'Analyze'}
                  </button>
                )}
              </div>

              {/* Screenshot Preview */}
              {site.screenshotUrl && (
                <div style={inspiredStyles.screenshotContainer}>
                  <img
                    src={site.screenshotUrl}
                    alt="Site preview"
                    style={inspiredStyles.screenshot}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Analysis Results */}
              {site.analysis && (
                <div style={inspiredStyles.analysisResults}>
                  {/* Extracted Colors */}
                  {site.analysis.colors && (
                    <div style={inspiredStyles.colorsRow}>
                      <span style={inspiredStyles.colorsLabel}>Colors:</span>
                      <div style={{...inspiredStyles.colorDot, background: site.analysis.colors.primary}} />
                      <div style={{...inspiredStyles.colorDot, background: site.analysis.colors.secondary}} />
                      <div style={{...inspiredStyles.colorDot, background: site.analysis.colors.accent}} />
                      {site.analysis.style && (
                        <span style={inspiredStyles.styleLabel}>{site.analysis.style}</span>
                      )}
                    </div>
                  )}

                  {/* Primary/Secondary Toggle */}
                  <div style={inspiredStyles.priorityRow}>
                    <span style={inspiredStyles.priorityLabel}>Use as:</span>
                    <div style={inspiredStyles.priorityToggle}>
                      <button
                        style={{
                          ...inspiredStyles.priorityBtn,
                          ...(site.isPrimary ? inspiredStyles.priorityBtnActive : {})
                        }}
                        onClick={() => setPrimary(index)}
                      >
                        Primary Source
                      </button>
                      <button
                        style={{
                          ...inspiredStyles.priorityBtn,
                          ...(!site.isPrimary ? inspiredStyles.priorityBtnSecondary : {})
                        }}
                        onClick={() => {
                          if (site.isPrimary && sites.filter(s => s.url.trim()).length > 1) {
                            // Find another site to make primary
                            const otherIdx = sites.findIndex((s, i) => i !== index && s.url.trim());
                            if (otherIdx >= 0) setPrimary(otherIdx);
                          }
                        }}
                      >
                        Secondary
                      </button>
                    </div>
                  </div>

                  {/* Element Selection */}
                  <div style={inspiredStyles.elementsSection}>
                    <span style={inspiredStyles.elementsLabel}>
                      {site.isPrimary ? 'Primary elements (use most of this site\'s style):' : 'Pick specific elements from this site:'}
                    </span>
                    <div style={inspiredStyles.elementsGrid}>
                      {elementOptions.map(opt => (
                        <button
                          key={opt.id}
                          style={{
                            ...inspiredStyles.elementChip,
                            ...((site.elements || []).includes(opt.id) ? inspiredStyles.elementChipActive : {})
                          }}
                          onClick={() => toggleElement(index, opt.id)}
                          title={opt.description}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <textarea
                value={site.notes}
                onChange={(e) => updateSite(index, 'notes', e.target.value)}
                placeholder="Specific notes... e.g., 'Love the floating navbar' or 'The testimonials section is perfect'"
                style={inspiredStyles.notesInput}
                rows={2}
              />
            </div>
          ))}

          {sites.length < 3 && (
            <button style={inspiredStyles.addSiteBtn} onClick={addSite}>
              + Add Another Inspiration Site
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={inspiredStyles.footer}>
          <button
            style={{
              ...inspiredStyles.continueBtn,
              opacity: (validSites === 0 || !businessName.trim()) ? 0.5 : 1
            }}
            onClick={analyzedSites > 0 ? goToPreview : handleContinue}
            disabled={validSites === 0 || !businessName.trim()}
          >
            {analyzedSites > 0 ? 'Preview Your Blend →' : 'Continue →'}
          </button>
        </div>
      </div>
    );
  }

  // PREVIEW SUBSTEP (Blend Preview)
  const blendSummary = getBlendSummary();

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backBtn} onClick={() => setSubStep('input')}>← Back to Sites</button>

      <h1 style={styles.stepTitle}>✨ Your Design Blend</h1>
      <p style={styles.stepSubtitle}>Here's what we'll create based on your selections</p>

      <div style={inspiredStyles.previewContainer}>
        {/* Color Palette */}
        {blendSummary.colors && (
          <div style={inspiredStyles.previewSection}>
            <div style={inspiredStyles.previewSectionHeader}>
              <span style={inspiredStyles.previewIcon}>🎨</span>
              <span style={inspiredStyles.previewTitle}>Color Palette</span>
              <span style={inspiredStyles.previewSource}>
                from {sites.find(s => s.isPrimary)?.url?.replace('https://', '').split('/')[0] || 'primary'}
              </span>
            </div>
            <div style={inspiredStyles.colorPalette}>
              <div style={inspiredStyles.colorBlock}>
                <div style={{...inspiredStyles.colorSwatch, background: blendSummary.colors.primary}} />
                <span style={inspiredStyles.colorLabel}>Primary</span>
                <span style={inspiredStyles.colorValue}>{blendSummary.colors.primary}</span>
              </div>
              <div style={inspiredStyles.colorBlock}>
                <div style={{...inspiredStyles.colorSwatch, background: blendSummary.colors.secondary}} />
                <span style={inspiredStyles.colorLabel}>Secondary</span>
                <span style={inspiredStyles.colorValue}>{blendSummary.colors.secondary}</span>
              </div>
              <div style={inspiredStyles.colorBlock}>
                <div style={{...inspiredStyles.colorSwatch, background: blendSummary.colors.accent}} />
                <span style={inspiredStyles.colorLabel}>Accent</span>
                <span style={inspiredStyles.colorValue}>{blendSummary.colors.accent}</span>
              </div>
            </div>
          </div>
        )}

        {/* Style Direction */}
        <div style={inspiredStyles.previewSection}>
          <div style={inspiredStyles.previewSectionHeader}>
            <span style={inspiredStyles.previewIcon}>💫</span>
            <span style={inspiredStyles.previewTitle}>Style Direction</span>
          </div>
          <p style={inspiredStyles.styleDescription}>
            {blendSummary.style ? `${blendSummary.style.charAt(0).toUpperCase() + blendSummary.style.slice(1)} aesthetic` : 'Modern, professional design'} with elements carefully selected from your inspiration sites.
          </p>
        </div>

        {/* Elements Breakdown */}
        <div style={inspiredStyles.previewSection}>
          <div style={inspiredStyles.previewSectionHeader}>
            <span style={inspiredStyles.previewIcon}>🧩</span>
            <span style={inspiredStyles.previewTitle}>Elements We'll Use</span>
          </div>
          <div style={inspiredStyles.elementsBreakdown}>
            {blendSummary.elements.map((el, idx) => (
              <div key={idx} style={inspiredStyles.elementItem}>
                <span style={inspiredStyles.elementIcon}>{el.icon}</span>
                <span style={inspiredStyles.elementName}>{el.element}</span>
                <span style={inspiredStyles.elementFrom}>from {el.from}</span>
                {el.isPrimary && <span style={inspiredStyles.elementPrimaryTag}>primary</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Sites Used */}
        <div style={inspiredStyles.previewSection}>
          <div style={inspiredStyles.previewSectionHeader}>
            <span style={inspiredStyles.previewIcon}>🔗</span>
            <span style={inspiredStyles.previewTitle}>Inspiration Sources</span>
          </div>
          <div style={inspiredStyles.sourcesGrid}>
            {sites.filter(s => s.url.trim()).map((site, idx) => (
              <div key={idx} style={inspiredStyles.sourceCard}>
                {site.screenshotUrl && (
                  <img
                    src={site.screenshotUrl}
                    alt=""
                    style={inspiredStyles.sourceThumb}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={inspiredStyles.sourceInfo}>
                  <span style={inspiredStyles.sourceUrl}>{site.url.replace('https://', '').split('/')[0]}</span>
                  {site.isPrimary && <span style={inspiredStyles.sourcePrimary}>Primary</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={inspiredStyles.previewFooter}>
        <button style={inspiredStyles.backToEditBtn} onClick={() => setSubStep('input')}>
          ← Adjust Selections
        </button>
        <button style={inspiredStyles.continueBtn} onClick={handleContinue}>
          Looks Good! Continue →
        </button>
      </div>
    </div>
  );
}

// Inspiration Step Styles
const inspiredStyles = {
  businessSection: {
    marginBottom: '24px'
  },
  businessRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  businessField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#888'
  },
  fieldInput: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#e4e4e4',
    fontSize: '15px',
    outline: 'none'
  },
  suggestionsSection: {
    marginBottom: '24px',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  suggestionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  suggestionsIcon: {
    fontSize: '16px'
  },
  suggestionsTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888'
  },
  suggestionsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  suggestionChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  suggestionName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#e4e4e4'
  },
  suggestionDesc: {
    fontSize: '11px',
    color: '#666'
  },
  sitesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  siteCard: {
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  siteCardPrimary: {
    border: '1px solid rgba(34, 197, 94, 0.3)',
    background: 'rgba(34, 197, 94, 0.03)'
  },
  siteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  siteHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  siteNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4'
  },
  primaryBadge: {
    padding: '2px 8px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#22c55e'
  },
  siteHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  analyzedBadge: {
    padding: '2px 8px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#22c55e'
  },
  removeSiteBtn: {
    width: '24px',
    height: '24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '12px'
  },
  urlRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  urlInput: {
    flex: 1,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e4e4e4',
    fontSize: '14px',
    outline: 'none'
  },
  analyzeBtn: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  screenshotContainer: {
    marginBottom: '12px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.3)',
    maxHeight: '200px'
  },
  screenshot: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  analysisResults: {
    marginBottom: '12px'
  },
  colorsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  colorsLabel: {
    fontSize: '12px',
    color: '#888'
  },
  colorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  styleLabel: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#888',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px'
  },
  priorityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  priorityLabel: {
    fontSize: '13px',
    color: '#888'
  },
  priorityToggle: {
    display: 'flex',
    gap: '8px'
  },
  priorityBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer'
  },
  priorityBtnActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  priorityBtnSecondary: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6'
  },
  elementsSection: {
    marginBottom: '12px'
  },
  elementsLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px'
  },
  elementsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  elementChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    color: '#888',
    fontSize: '11px',
    cursor: 'pointer'
  },
  elementChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    color: '#22c55e'
  },
  notesInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#e4e4e4',
    fontSize: '13px',
    resize: 'none',
    outline: 'none'
  },
  addSiteBtn: {
    padding: '16px',
    background: 'transparent',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '12px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer'
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  continueBtn: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  // Preview styles
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  previewSection: {
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  previewSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  previewIcon: {
    fontSize: '20px'
  },
  previewTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e4e4e4'
  },
  previewSource: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#666'
  },
  colorPalette: {
    display: 'flex',
    gap: '16px'
  },
  colorBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  colorSwatch: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.1)'
  },
  colorLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#e4e4e4'
  },
  colorValue: {
    fontSize: '11px',
    color: '#666',
    fontFamily: 'monospace'
  },
  styleDescription: {
    color: '#888',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  elementsBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  elementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px'
  },
  elementIcon: {
    fontSize: '16px'
  },
  elementName: {
    flex: 1,
    fontSize: '14px',
    color: '#e4e4e4'
  },
  elementFrom: {
    fontSize: '12px',
    color: '#666'
  },
  elementPrimaryTag: {
    padding: '2px 6px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#22c55e'
  },
  sourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px'
  },
  sourceCard: {
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  sourceThumb: {
    width: '100%',
    height: '80px',
    objectFit: 'cover'
  },
  sourceInfo: {
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sourceUrl: {
    flex: 1,
    fontSize: '12px',
    color: '#e4e4e4'
  },
  sourcePrimary: {
    padding: '2px 6px',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#22c55e'
  },
  previewFooter: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backToEditBtn: {
    padding: '14px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

// ============================================
// P1 VISUAL COMPONENTS: Better Organization
// ============================================

// Wizard Progress Breadcrumb - Shows flow progress and allows jumping back
function WizardBreadcrumb({ currentPath, completedSteps, onJumpTo }) {
  const allSteps = [
    { id: 'choose-path', label: 'Start', icon: '🚀' },
    { id: 'path', label: currentPath === 'rebuild' ? 'Rebuild' : currentPath === 'quick' ? 'Quick Start' : 'Reference', icon: currentPath === 'rebuild' ? '🔄' : currentPath === 'quick' ? '⚡' : '🎨' },
    { id: 'upload-assets', label: 'Assets', icon: '📁' },
    { id: 'customize', label: 'Customize', icon: '✨' },
    { id: 'generate', label: 'Generate', icon: '🎯' }
  ];

  return (
    <div style={wizardStyles.breadcrumbContainer}>
      <div style={wizardStyles.breadcrumbTrack}>
        {allSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === 'customize';
          const isClickable = isCompleted && step.id !== 'customize';

          return (
            <div key={step.id} style={wizardStyles.breadcrumbStep}>
              <button
                style={{
                  ...wizardStyles.breadcrumbDot,
                  ...(isCompleted ? wizardStyles.breadcrumbDotCompleted : {}),
                  ...(isCurrent ? wizardStyles.breadcrumbDotCurrent : {}),
                  cursor: isClickable ? 'pointer' : 'default'
                }}
                onClick={() => isClickable && onJumpTo(step.id)}
                disabled={!isClickable}
                title={isClickable ? `Go back to ${step.label}` : step.label}
              >
                {isCompleted ? '✓' : step.icon}
              </button>
              <span style={{
                ...wizardStyles.breadcrumbLabel,
                ...(isCurrent ? wizardStyles.breadcrumbLabelCurrent : {}),
                ...(isCompleted ? wizardStyles.breadcrumbLabelCompleted : {})
              }}>
                {step.label}
              </span>
              {index < allSteps.length - 1 && (
                <div style={{
                  ...wizardStyles.breadcrumbConnector,
                  ...(isCompleted ? wizardStyles.breadcrumbConnectorCompleted : {})
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Collapsible Section - Reduces visual overwhelm
function CollapsibleSection({ title, icon, children, defaultOpen = true, badge, tooltip }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={collapsibleStyles.container}>
      <button
        style={collapsibleStyles.header}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={collapsibleStyles.headerLeft}>
          <span style={collapsibleStyles.icon}>{icon}</span>
          <span style={collapsibleStyles.title}>{title}</span>
          {badge && <span style={collapsibleStyles.badge}>{badge}</span>}
          {tooltip && (
            <span style={collapsibleStyles.tooltipTrigger} title={tooltip}>
              ⓘ
            </span>
          )}
        </div>
        <span style={{
          ...collapsibleStyles.chevron,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={collapsibleStyles.content}>
          {children}
        </div>
      )}
    </div>
  );
}

// Tooltip Component
function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={tooltipStyles.wrapper}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={tooltipStyles.tooltip}>
          {text}
          <span style={tooltipStyles.arrow} />
        </span>
      )}
    </span>
  );
}

// "What You'll Get" Preview Card
function WhatYouGetCard({ projectData }) {
  const pageCount = projectData.selectedPages.length;
  const hasAppPages = projectData.selectedPages.some(p =>
    ['dashboard', 'earn', 'rewards', 'wallet', 'profile', 'leaderboard'].includes(p)
  );

  return (
    <div style={whatYouGetStyles.container}>
      <h3 style={whatYouGetStyles.title}>✨ What You'll Get</h3>
      <div style={whatYouGetStyles.grid}>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>📄</span>
          <span style={whatYouGetStyles.itemLabel}>{pageCount} Complete Pages</span>
        </div>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>📱</span>
          <span style={whatYouGetStyles.itemLabel}>Mobile Responsive</span>
        </div>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>🎨</span>
          <span style={whatYouGetStyles.itemLabel}>Custom Colors</span>
        </div>
        {hasAppPages && (
          <div style={whatYouGetStyles.item}>
            <span style={whatYouGetStyles.itemIcon}>⚡</span>
            <span style={whatYouGetStyles.itemLabel}>Interactive App Features</span>
          </div>
        )}
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>📝</span>
          <span style={whatYouGetStyles.itemLabel}>AI-Written Content</span>
        </div>
        <div style={whatYouGetStyles.item}>
          <span style={whatYouGetStyles.itemIcon}>🚀</span>
          <span style={whatYouGetStyles.itemLabel}>Ready to Deploy</span>
        </div>
      </div>
      <div style={whatYouGetStyles.pageList}>
        <span style={whatYouGetStyles.pageListLabel}>Pages:</span>
        <div style={whatYouGetStyles.pageChips}>
          {projectData.selectedPages.map(page => (
            <span key={page} style={whatYouGetStyles.pageChip}>
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Industry Detection Banner with Change Option
function IndustryBanner({ industry, industryKey, onChangeClick, industries }) {
  if (!industry) return null;

  return (
    <div style={industryBannerStyles.container}>
      <div style={industryBannerStyles.left}>
        <span style={industryBannerStyles.icon}>{industry.icon || '✨'}</span>
        <div style={industryBannerStyles.info}>
          <span style={industryBannerStyles.detected}>Detected Industry</span>
          <span style={industryBannerStyles.name}>{industry.name}</span>
        </div>
      </div>
      <button style={industryBannerStyles.changeBtn} onClick={onChangeClick}>
        Change Industry
      </button>
    </div>
  );
}

// Styles for P1 Components
const wizardStyles = {
  breadcrumbContainer: {
    marginBottom: '24px',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  breadcrumbTrack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0'
  },
  breadcrumbStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  breadcrumbDot: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#666',
    transition: 'all 0.2s ease'
  },
  breadcrumbDotCompleted: {
    background: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  breadcrumbDotCurrent: {
    background: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
    color: '#3b82f6',
    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.15)'
  },
  breadcrumbLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    minWidth: '60px'
  },
  breadcrumbLabelCurrent: {
    color: '#3b82f6'
  },
  breadcrumbLabelCompleted: {
    color: '#22c55e'
  },
  breadcrumbConnector: {
    width: '30px',
    height: '2px',
    background: 'rgba(255,255,255,0.1)',
    marginLeft: '8px',
    marginRight: '8px'
  },
  breadcrumbConnectorCompleted: {
    background: '#22c55e'
  }
};

const collapsibleStyles = {
  container: {
    marginBottom: '16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  header: {
    width: '100%',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '18px'
  },
  title: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff'
  },
  badge: {
    padding: '3px 10px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#22c55e'
  },
  tooltipTrigger: {
    fontSize: '14px',
    color: '#666',
    cursor: 'help',
    marginLeft: '4px'
  },
  chevron: {
    fontSize: '10px',
    color: '#666',
    transition: 'transform 0.2s ease'
  },
  content: {
    padding: '0 20px 20px 20px'
  }
};

const tooltipStyles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center'
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 12px',
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#fff',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    marginBottom: '8px'
  },
  arrow: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid rgba(255,255,255,0.15)'
  }
};

const whatYouGetStyles = {
  container: {
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    marginBottom: '20px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '16px',
    margin: '0 0 16px 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#ccc'
  },
  itemIcon: {
    fontSize: '16px'
  },
  itemLabel: {
    color: '#fff'
  },
  pageList: {
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  pageListLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
    display: 'block'
  },
  pageChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  pageChip: {
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#fff'
  }
};

const industryBannerStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    marginBottom: '20px'
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '24px'
  },
  info: {
    display: 'flex',
    flexDirection: 'column'
  },
  detected: {
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  name: {
    fontSize: '15px',
    color: '#fff',
    fontWeight: '600'
  },
  changeBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

// ============================================
// CUSTOMIZE STEP: The WordPress-Style Editor
// ============================================
function CustomizeStep({ projectData, updateProject, industries, layouts, effects, onGenerate, onBack }) {
  // Section collapse state
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

  // Color presets
  const colorPresets = [
    { name: 'Ocean', colors: { primary: '#0ea5e9', secondary: '#0369a1', accent: '#38bdf8' } },
    { name: 'Forest', colors: { primary: '#22c55e', secondary: '#15803d', accent: '#86efac' } },
    { name: 'Sunset', colors: { primary: '#f97316', secondary: '#c2410c', accent: '#fdba74' } },
    { name: 'Royal', colors: { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#c4b5fd' } },
    { name: 'Crimson', colors: { primary: '#ef4444', secondary: '#b91c1c', accent: '#fca5a5' } },
    { name: 'Midnight', colors: { primary: '#1e3a5f', secondary: '#0f172a', accent: '#c9a962' } },
  ];
  
  const pageOptions = [
    { id: 'home', label: 'Home', icon: '🏠', default: true },
    { id: 'about', label: 'About', icon: '👥', default: true },
    { id: 'services', label: 'Services', icon: '⚙️', default: false },
    { id: 'contact', label: 'Contact', icon: '📞', default: true },
    { id: 'pricing', label: 'Pricing', icon: '💰', default: false },
    { id: 'gallery', label: 'Gallery', icon: '🖼️', default: false },
    { id: 'menu', label: 'Menu', icon: '🍽️', default: false },
    { id: 'booking', label: 'Booking', icon: '📅', default: false },
    { id: 'testimonials', label: 'Reviews', icon: '⭐', default: false },
    { id: 'faq', label: 'FAQ', icon: '❓', default: false },
    { id: 'blog', label: 'Blog', icon: '📝', default: false },
    { id: 'team', label: 'Team', icon: '👨‍👩‍👧‍👦', default: false },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', default: false, appPage: true },
    { id: 'earn', label: 'Earn', icon: '💵', default: false, appPage: true },
    { id: 'rewards', label: 'Rewards', icon: '🎁', default: false, appPage: true },
    { id: 'wallet', label: 'Wallet', icon: '💳', default: false, appPage: true },
    { id: 'profile', label: 'Profile', icon: '👤', default: false, appPage: true },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', default: false, appPage: true },
  ];

  const togglePage = (pageId) => {
    const current = projectData.selectedPages;
    if (current.includes(pageId)) {
      updateProject({ selectedPages: current.filter(p => p !== pageId) });
    } else {
      updateProject({ selectedPages: [...current, pageId] });
    }
  };

  const selectPreset = (preset) => {
    updateProject({
      colorMode: 'preset',
      selectedPreset: preset.name,
      colors: { ...projectData.colors, ...preset.colors }
    });
  };

  const updateCustomColor = (key, value) => {
    updateProject({
      colorMode: 'custom',
      selectedPreset: null,
      colors: { ...projectData.colors, [key]: value }
    });
  };

  // Completed steps for breadcrumb
  const completedSteps = ['choose-path', 'path', 'upload-assets'];

  return (
    <div style={styles.customizeContainer}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>

      <h1 style={styles.customizeTitle}>✨ Customize Your Site</h1>
      <p style={p1Styles.subtitle}>Configure every detail of your professional website</p>

      {/* Industry Detection Banner */}
      {projectData.industry && (
        <IndustryBanner
          industry={projectData.industry}
          industryKey={projectData.industryKey}
          industries={industries}
          onChangeClick={() => setShowIndustryPicker(true)}
        />
      )}

      {/* Industry Picker Modal */}
      {showIndustryPicker && (
        <div style={p1Styles.modalOverlay}>
          <div style={p1Styles.modalContent}>
            <h3 style={p1Styles.modalTitle}>Select Your Industry</h3>
            <p style={p1Styles.modalSubtitle}>This helps us optimize your website structure</p>
            <div style={p1Styles.industryGrid}>
              {Object.entries(industries).map(([key, ind]) => (
                <button
                  key={key}
                  style={{
                    ...p1Styles.industryOption,
                    ...(projectData.industryKey === key ? p1Styles.industryOptionActive : {})
                  }}
                  onClick={() => {
                    updateProject({
                      industryKey: key,
                      industry: ind,
                      layoutKey: null,
                      effects: ind?.effects || []
                    });
                    setShowIndustryPicker(false);
                  }}
                >
                  <span style={p1Styles.industryIcon}>{ind.icon}</span>
                  <span style={p1Styles.industryName}>{ind.name}</span>
                </button>
              ))}
            </div>
            <button style={p1Styles.modalClose} onClick={() => setShowIndustryPicker(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={styles.customizeGrid}>
        {/* LEFT: Form Controls - Now with Collapsible Sections */}
        <div style={styles.customizeForm}>

          {/* SECTION 1: Business Identity */}
          <CollapsibleSection
            title="Business Identity"
            icon="🏢"
            defaultOpen={true}
            tooltip="Basic information about your business"
          >
            {/* Business Name */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Business Name *
                <span style={p1Styles.requiredStar}>Required</span>
              </label>
              <input
                type="text"
                value={projectData.businessName}
                onChange={(e) => updateProject({ businessName: e.target.value })}
                placeholder="Your Business Name"
                style={styles.formInput}
              />
            </div>

            {/* Tagline */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Tagline</label>
              <input
                type="text"
                value={projectData.tagline}
                onChange={(e) => updateProject({ tagline: e.target.value })}
                placeholder="A short description of what you do"
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHint}>Appears in your hero section and browser title</p>
            </div>

            {/* Location */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Business Location</label>
              <input
                type="text"
                value={projectData.location || ''}
                onChange={(e) => updateProject({ location: e.target.value })}
                placeholder="e.g., San Francisco, CA or Online Only"
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHint}>Helps AI customize content for your area</p>
            </div>
          </CollapsibleSection>

          {/* SECTION 2: Target & Goals */}
          <CollapsibleSection
            title="Target Audience & Goals"
            icon="🎯"
            defaultOpen={true}
            tooltip="Define who you serve and what action you want them to take"
          >
            {/* Target Audience */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Who are your customers?</label>
              <p style={customizeStyles.fieldHint}>Select all that apply - helps AI write relevant content</p>
              <div style={customizeStyles.chipGrid}>
                {[
                  { id: 'individuals', label: 'Individuals', icon: '👤' },
                  { id: 'families', label: 'Families', icon: '👨‍👩‍👧' },
                  { id: 'small-business', label: 'Small Businesses', icon: '🏪' },
                  { id: 'enterprise', label: 'Enterprise', icon: '🏢' },
                  { id: 'startups', label: 'Startups', icon: '🚀' },
                  { id: 'professionals', label: 'Professionals', icon: '💼' },
                ].map(audience => (
                  <button
                    key={audience.id}
                    style={{
                      ...customizeStyles.chip,
                      ...(projectData.targetAudience?.includes(audience.id) ? customizeStyles.chipActive : {})
                    }}
                    onClick={() => {
                      const current = projectData.targetAudience || [];
                      if (current.includes(audience.id)) {
                        updateProject({ targetAudience: current.filter(a => a !== audience.id) });
                      } else {
                        updateProject({ targetAudience: [...current, audience.id] });
                      }
                    }}
                >
                  <span>{audience.icon}</span>
                  <span>{audience.label}</span>
                </button>
              ))}
            </div>
            </div>

            {/* Primary CTA - Call to Action */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Primary Call-to-Action
                <span style={p1Styles.tooltipIcon} title="The main action button visitors will see on your site">ⓘ</span>
              </label>
              <p style={customizeStyles.fieldHint}>What should visitors do when they land on your site?</p>
              <div style={customizeStyles.radioGrid}>
                {[
                  { id: 'contact', label: 'Contact Us', icon: '📧' },
                  { id: 'book', label: 'Book Appointment', icon: '📅' },
                  { id: 'call', label: 'Call Now', icon: '📞' },
                  { id: 'quote', label: 'Get a Quote', icon: '💬' },
                  { id: 'buy', label: 'Buy Now', icon: '🛒' },
                  { id: 'visit', label: 'Visit Location', icon: '📍' },
                ].map(cta => (
                  <label
                    key={cta.id}
                    style={{
                      ...customizeStyles.radioLabel,
                      ...(projectData.primaryCTA === cta.id ? customizeStyles.radioLabelActive : {})
                    }}
                  >
                    <input
                      type="radio"
                      name="primaryCTA"
                      value={cta.id}
                      checked={projectData.primaryCTA === cta.id}
                      onChange={(e) => updateProject({ primaryCTA: e.target.value })}
                      style={customizeStyles.radioInput}
                    />
                    <span>{cta.icon}</span>
                    <span>{cta.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Communication Tone */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Communication Style
                <span style={p1Styles.tooltipIcon} title="How formal or casual should your website copy sound?">ⓘ</span>
              </label>
              <p style={customizeStyles.fieldHint}>This affects how the AI writes your content</p>
              <div style={customizeStyles.sliderContainer}>
                <span style={customizeStyles.sliderLabel}>Professional</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={projectData.tone || 50}
                  onChange={(e) => updateProject({ tone: parseInt(e.target.value) })}
                  style={customizeStyles.slider}
                />
                <span style={customizeStyles.sliderLabel}>Friendly</span>
              </div>
              <p style={customizeStyles.toneHint}>
                {projectData.tone < 33 ? '👔 Formal, corporate language' :
                 projectData.tone > 66 ? '😊 Casual, conversational tone' : '🤝 Balanced professional tone'}
              </p>
            </div>
          </CollapsibleSection>

          {/* SECTION 3: Design & Colors */}
          <CollapsibleSection
            title="Design & Colors"
            icon="🎨"
            defaultOpen={true}
            badge={projectData.selectedPreset || 'Custom'}
            tooltip="Choose your color scheme and visual style"
          >
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Color Palette</label>
              <p style={customizeStyles.fieldHint}>Pick a preset or customize your own colors</p>
            
            {/* Presets */}
            <div style={styles.colorPresets}>
              {colorPresets.map(preset => (
                <button
                  key={preset.name}
                  style={{
                    ...styles.colorPreset,
                    ...(projectData.selectedPreset === preset.name ? styles.colorPresetActive : {})
                  }}
                  onClick={() => selectPreset(preset)}
                  title={preset.name}
                >
                  <div style={styles.presetSwatches}>
                    <div style={{...styles.presetSwatch, background: preset.colors.primary}} />
                    <div style={{...styles.presetSwatch, background: preset.colors.secondary}} />
                    <div style={{...styles.presetSwatch, background: preset.colors.accent}} />
                  </div>
                  <span style={styles.presetName}>{preset.name}</span>
                </button>
              ))}
            </div>
            
            {/* Custom color picker */}
            <div style={styles.customColors}>
              <div style={styles.colorPickerGroup}>
                <label>Primary</label>
                <input
                  type="color"
                  value={projectData.colors.primary}
                  onChange={(e) => updateCustomColor('primary', e.target.value)}
                  style={styles.colorPicker}
                />
              </div>
              <div style={styles.colorPickerGroup}>
                <label>Secondary</label>
                <input
                  type="color"
                  value={projectData.colors.secondary}
                  onChange={(e) => updateCustomColor('secondary', e.target.value)}
                  style={styles.colorPicker}
                />
              </div>
              <div style={styles.colorPickerGroup}>
                <label>Accent</label>
                <input
                  type="color"
                  value={projectData.colors.accent}
                  onChange={(e) => updateCustomColor('accent', e.target.value)}
                  style={styles.colorPicker}
                />
              </div>
            </div>
            </div>
          </CollapsibleSection>

          {/* SECTION 4: Pages */}
          <CollapsibleSection
            title="Website Pages"
            icon="📄"
            defaultOpen={true}
            badge={`${projectData.selectedPages.length} selected`}
            tooltip="Choose which pages to include in your website"
          >
            {/* Website Pages */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Standard Pages</label>
              <p style={customizeStyles.fieldHint}>Core pages for your website</p>
              <div style={styles.pageGrid}>
                {pageOptions.filter(p => !p.appPage).map(page => (
                  <button
                    key={page.id}
                    style={{
                      ...styles.pageChip,
                      ...(projectData.selectedPages.includes(page.id) ? styles.pageChipActive : {})
                    }}
                    onClick={() => togglePage(page.id)}
                  >
                    <span>{page.icon}</span>
                    <span>{page.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* App/Dashboard Pages */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                App & Dashboard Pages
                <span style={customizeStyles.optionalBadge}>Advanced</span>
              </label>
              <p style={customizeStyles.fieldHint}>Interactive features for member portals, dashboards, and user accounts</p>
              <div style={styles.pageGrid}>
                {pageOptions.filter(p => p.appPage).map(page => (
                  <button
                    key={page.id}
                    style={{
                      ...styles.pageChip,
                      ...(projectData.selectedPages.includes(page.id) ? styles.pageChipActive : {})
                    }}
                    onClick={() => togglePage(page.id)}
                  >
                    <span>{page.icon}</span>
                    <span>{page.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* SECTION 5: Industry & Layout */}
          <CollapsibleSection
            title="Industry & Layout"
            icon="⚙️"
            defaultOpen={false}
            badge={projectData.industry?.name || 'Auto-detect'}
            tooltip="Fine-tune your site structure based on your industry"
          >
            {/* Industry Selection */}
            {Object.keys(industries).length > 0 && (
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Industry Template
                  <span style={p1Styles.tooltipIcon} title="Industry templates include optimized page layouts and section ordering for your business type">ⓘ</span>
                </label>
                <p style={customizeStyles.fieldHint}>Select your industry for optimized page structure</p>
                <select
                  value={projectData.industryKey || ''}
                  onChange={(e) => {
                    const ind = industries[e.target.value];
                    updateProject({
                      industryKey: e.target.value,
                      industry: ind,
                      layoutKey: null,
                      effects: ind?.effects || []
                    });
                  }}
                  style={styles.formSelect}
                >
                  <option value="">Auto-detect from business name</option>
                  {Object.entries(industries).map(([key, ind]) => (
                    <option key={key} value={key}>{ind.icon} {ind.name}</option>
                  ))}
                </select>
              </div>
            )}

          {/* Layout Selection - Industry-Specific */}
          {projectData.industryKey && INDUSTRY_LAYOUTS[projectData.industryKey] && (
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Layout Style
                <span style={layoutStyles.detectedBadge}>
                  {INDUSTRY_LAYOUTS[projectData.industryKey]?.name}
                </span>
              </label>
              <p style={customizeStyles.fieldHint}>Choose how your site will be structured</p>
              <div style={layoutStyles.layoutGrid}>
                {Object.entries(INDUSTRY_LAYOUTS[projectData.industryKey].layouts).map(([layoutKey, layout]) => (
                  <button
                    key={layoutKey}
                    style={{
                      ...layoutStyles.layoutCard,
                      ...(projectData.layoutKey === layoutKey ? layoutStyles.layoutCardActive : {})
                    }}
                    onClick={() => updateProject({ layoutKey })}
                  >
                    <div style={layoutStyles.layoutIcon}>
                      {layoutKey === 'trust-builder' && '🏆'}
                      {layoutKey === 'lead-generator' && '🎯'}
                      {layoutKey === 'corporate-clean' && '✨'}
                      {layoutKey === 'appetizing-visual' && '📸'}
                      {layoutKey === 'menu-focused' && '📋'}
                      {layoutKey === 'story-driven' && '📖'}
                      {layoutKey === 'patient-first' && '💚'}
                      {layoutKey === 'credibility-focused' && '🎓'}
                      {layoutKey === 'booking-optimized' && '📅'}
                      {layoutKey === 'product-showcase' && '🛍️'}
                      {layoutKey === 'conversion-focused' && '💰'}
                      {layoutKey === 'brand-story' && '✨'}
                      {layoutKey === 'trust-and-call' && '📞'}
                      {layoutKey === 'quote-generator' && '💬'}
                      {layoutKey === 'portfolio-showcase' && '🖼️'}
                      {layoutKey === 'motivation-driven' && '💪'}
                      {layoutKey === 'class-scheduler' && '🗓️'}
                      {layoutKey === 'wellness-calm' && '🧘'}
                      {layoutKey === 'property-search' && '🏠'}
                      {layoutKey === 'agent-brand' && '👔'}
                      {layoutKey === 'luxury-focused' && '💎'}
                      {layoutKey === 'course-catalog' && '📚'}
                      {layoutKey === 'coach-personal' && '🎤'}
                      {layoutKey === 'results-focused' && '📈'}
                      {layoutKey === 'portfolio-first' && '🎨'}
                      {layoutKey === 'process-driven' && '⚙️'}
                      {layoutKey === 'brand-bold' && '🔥'}
                      {layoutKey === 'service-focused' && '🔧'}
                      {layoutKey === 'inventory-showcase' && '🚗'}
                      {layoutKey === 'premium-detail' && '✨'}
                      {!['trust-builder', 'lead-generator', 'corporate-clean', 'appetizing-visual', 'menu-focused', 'story-driven', 'patient-first', 'credibility-focused', 'booking-optimized', 'product-showcase', 'conversion-focused', 'brand-story', 'trust-and-call', 'quote-generator', 'portfolio-showcase', 'motivation-driven', 'class-scheduler', 'wellness-calm', 'property-search', 'agent-brand', 'luxury-focused', 'course-catalog', 'coach-personal', 'results-focused', 'portfolio-first', 'process-driven', 'brand-bold', 'service-focused', 'inventory-showcase', 'premium-detail'].includes(layoutKey) && '📐'}
                    </div>
                    <div style={layoutStyles.layoutInfo}>
                      <div style={layoutStyles.layoutName}>{layout.name}</div>
                      <div style={layoutStyles.layoutDesc}>{layout.description}</div>
                    </div>
                    {projectData.layoutKey === layoutKey && (
                      <div style={layoutStyles.layoutCheck}>✓</div>
                    )}
                  </button>
                ))}
              </div>

              {/* Section Preview for Selected Layout */}
              {projectData.layoutKey && INDUSTRY_LAYOUTS[projectData.industryKey].layouts[projectData.layoutKey] && (
                <div style={layoutStyles.sectionPreview}>
                  <div style={layoutStyles.sectionPreviewLabel}>Section Order:</div>
                  <div style={layoutStyles.sectionFlow}>
                    {INDUSTRY_LAYOUTS[projectData.industryKey].layouts[projectData.layoutKey].sectionOrder.map((section, idx) => (
                      <span key={idx} style={layoutStyles.sectionChip}>
                        {section.label || section.section}
                        {!section.required && <span style={layoutStyles.optionalTag}>opt</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </CollapsibleSection>

          {/* SECTION 6: Advanced - Extra Details */}
          <CollapsibleSection
            title="Advanced AI Instructions"
            icon="🤖"
            defaultOpen={false}
            tooltip="Give the AI specific instructions for customizing your site"
          >
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Extra Details for AI
                <span style={customizeStyles.optionalBadge}>Optional</span>
              </label>
              <p style={customizeStyles.fieldHint}>
                Add specific instructions, unique features, or context the AI should know about
              </p>
              <textarea
                value={projectData.extraDetails}
                onChange={(e) => updateProject({ extraDetails: e.target.value })}
                placeholder="Give AI more context... e.g., 'This is an NFT portfolio tracker. Replace eBay pricing with OpenSea floor prices. Use wallet connection instead of email login. Show ETH values and chain icons.'"
                style={styles.extraDetailsTextarea}
                rows={4}
              />
              <p style={styles.extraDetailsHint}>💡 The more detail you provide, the more customized your pages will be</p>
            </div>
          </CollapsibleSection>

        </div>

        {/* RIGHT: Live Preview */}
        <div style={styles.previewContainer}>
          <div style={styles.previewHeader}>
            <span>Live Preview</span>
            <div style={styles.previewDots}>
              <span style={styles.dot} />
              <span style={styles.dot} />
              <span style={styles.dot} />
            </div>
          </div>
          <div style={styles.previewFrame}>
            {/* Mini Website Preview */}
            <div style={{...styles.previewNav, background: projectData.colors.primary}}>
              <span style={styles.previewLogo}>{projectData.businessName || 'Your Brand'}</span>
              <div style={styles.previewNavLinks}>
                {projectData.selectedPages.slice(0, 4).map(p => (
                  <span key={p} style={styles.previewNavLink}>{p}</span>
                ))}
              </div>
            </div>
            <div style={{...styles.previewHero, background: `linear-gradient(135deg, ${projectData.colors.primary}, ${projectData.colors.secondary})`}}>
              <h2 style={styles.previewHeroTitle}>{projectData.businessName || 'Your Business'}</h2>
              <p style={styles.previewHeroSub}>{projectData.tagline || 'Your tagline goes here'}</p>
              <button style={{...styles.previewCta, background: '#fff', color: projectData.colors.primary}}>
                Get Started
              </button>
            </div>
            <div style={styles.previewContent}>
              <div style={styles.previewCards}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{...styles.previewCard, borderTop: `3px solid ${projectData.colors.accent}`}}>
                    <div style={{...styles.previewCardIcon, background: `${projectData.colors.primary}20`, color: projectData.colors.primary}}>✦</div>
                    <div style={styles.previewCardLines}>
                      <div style={styles.previewLine} />
                      <div style={{...styles.previewLine, width: '60%'}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Get Preview */}
      <WhatYouGetCard projectData={projectData} />

      {/* Generate Button Section */}
      <div style={styles.generateSection}>
        <div style={styles.generateSummary}>
          <span>{projectData.industry?.icon || '✨'} {projectData.industry?.name || 'Custom'}</span>
          <span style={p1Styles.summarySeparator}>•</span>
          <span>{projectData.selectedPages.length} pages</span>
          <span style={p1Styles.summarySeparator}>•</span>
          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <span style={{width: '10px', height: '10px', borderRadius: '50%', background: projectData.colors.primary}} />
            {projectData.selectedPreset || 'Custom'} theme
          </span>
        </div>
        {!projectData.businessName.trim() && (
          <p style={p1Styles.warningText}>⚠️ Please enter a business name to continue</p>
        )}
        <button
          style={{
            ...styles.generateBtn,
            opacity: projectData.businessName.trim() ? 1 : 0.5
          }}
          onClick={onGenerate}
          disabled={!projectData.businessName.trim()}
        >
          🚀 Generate My Website
        </button>
        <p style={p1Styles.generateHint}>Takes about 60 seconds • You can preview before deploying</p>
      </div>
    </div>
  );
}

const customizeStyles = {
  fieldHint: {
    color: '#666',
    fontSize: '12px',
    marginTop: '6px',
    marginBottom: 0
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  chipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  radioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  radioLabelActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  radioInput: {
    display: 'none'
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  slider: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255,255,255,0.1)',
    appearance: 'none',
    cursor: 'pointer'
  },
  sliderLabel: {
    color: '#666',
    fontSize: '12px',
    minWidth: '70px'
  },
  toneHint: {
    color: '#22c55e',
    fontSize: '12px',
    marginTop: '8px',
    textAlign: 'center'
  },
  optionalBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#666'
  }
};

// P1 Visual Improvement Styles
const p1Styles = {
  subtitle: {
    color: '#888',
    fontSize: '15px',
    textAlign: 'center',
    marginBottom: '24px',
    marginTop: '-8px'
  },
  requiredStar: {
    marginLeft: '8px',
    padding: '2px 8px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#ef4444',
    fontWeight: '500'
  },
  tooltipIcon: {
    marginLeft: '6px',
    fontSize: '14px',
    color: '#666',
    cursor: 'help'
  },
  summarySeparator: {
    color: '#444'
  },
  warningText: {
    color: '#f59e0b',
    fontSize: '13px',
    marginBottom: '12px',
    textAlign: 'center'
  },
  generateHint: {
    color: '#666',
    fontSize: '12px',
    marginTop: '12px',
    textAlign: 'center'
  },
  // Industry picker modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#1a1a1f',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
    textAlign: 'center',
    margin: '0 0 8px 0'
  },
  modalSubtitle: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '24px'
  },
  industryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  industryOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  industryOptionActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e'
  },
  industryIcon: {
    fontSize: '28px'
  },
  industryName: {
    fontSize: '12px',
    color: '#fff',
    textAlign: 'center'
  },
  modalClose: {
    width: '100%',
    padding: '14px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

// Layout Selection Styles
const layoutStyles = {
  detectedBadge: {
    marginLeft: '10px',
    padding: '3px 10px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: 'normal'
  },
  layoutGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px'
  },
  layoutCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
    position: 'relative'
  },
  layoutCardActive: {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.15)'
  },
  layoutIcon: {
    fontSize: '24px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    flexShrink: 0
  },
  layoutInfo: {
    flex: 1,
    minWidth: 0
  },
  layoutName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  layoutDesc: {
    color: '#888',
    fontSize: '12px',
    lineHeight: '1.4'
  },
  layoutCheck: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#22c55e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  sectionPreview: {
    marginTop: '16px',
    padding: '14px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  sectionPreviewLabel: {
    color: '#666',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px'
  },
  sectionFlow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  sectionChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '4px',
    color: '#22c55e',
    fontSize: '11px',
    textTransform: 'capitalize'
  },
  optionalTag: {
    padding: '1px 4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    fontSize: '9px',
    color: '#666',
    marginLeft: '4px'
  }
};

// ============================================
// GENERATING STEP
// ============================================
function GeneratingStep({ steps, currentStep, startTime, projectName, onCancel }) {
  const [elapsed, setElapsed] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Estimate: ~15 seconds per step
  const estimatedTotal = steps.length * 15;
  const remaining = Math.max(0, estimatedTotal - elapsed);
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div style={styles.generatingContainer}>
      <div style={styles.generatingIcon}>⚡</div>
      <h2 style={styles.generatingTitle}>Building {projectName}...</h2>

      {/* Step list */}
      <div style={genStepStyles.stepList}>
        {steps.map((step, idx) => (
          <div
            key={step.id}
            style={{
              ...genStepStyles.stepItem,
              opacity: idx <= currentStep ? 1 : 0.4,
              background: idx === currentStep ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              borderLeft: idx === currentStep ? '3px solid #22c55e' : '3px solid transparent'
            }}
          >
            <span style={genStepStyles.stepIcon}>
              {idx < currentStep ? '✓' : step.icon}
            </span>
            <span style={{
              ...genStepStyles.stepLabel,
              color: idx < currentStep ? '#22c55e' : idx === currentStep ? '#fff' : '#888'
            }}>
              {step.label}
            </span>
            {idx === currentStep && (
              <span style={genStepStyles.activeDot} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{...styles.progressFill, width: `${Math.min(progress, 100)}%`}} />
      </div>

      {/* Time display */}
      <div style={genStepStyles.timeRow}>
        <span style={genStepStyles.elapsed}>Elapsed: {formatTime(elapsed)}</span>
        <span style={genStepStyles.remaining}>~{formatTime(remaining)} remaining</span>
      </div>

      {/* Cancel button */}
      <button onClick={onCancel} style={genStepStyles.cancelBtn}>
        Cancel
      </button>
    </div>
  );
}

const genStepStyles = {
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '24px',
    maxWidth: '400px',
    width: '100%'
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  },
  stepIcon: {
    fontSize: '16px',
    width: '24px',
    textAlign: 'center'
  },
  stepLabel: {
    fontSize: '14px',
    flex: 1
  },
  activeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 1.5s infinite'
  },
  timeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '400px',
    marginTop: '12px',
    fontSize: '14px'
  },
  elapsed: {
    color: '#888'
  },
  remaining: {
    color: '#22c55e'
  },
  cancelBtn: {
    marginTop: '24px',
    padding: '12px 32px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

// ============================================
// COMPLETE STEP
// ============================================
function CompleteStep({ result, projectData, onReset, blinkCount, onDeploy, deployReady }) {
  const blinkMessage = blinkCount <= 1 
    ? "Less than a blink! ⚡" 
    : `Only ${blinkCount} blinks! 👁️`;
    
  const handleOpenFolder = async () => {
    try {
      await fetch(`${API_BASE}/api/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: result?.path })
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  const handleOpenVSCode = async () => {
    try {
      await fetch(`${API_BASE}/api/open-vscode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: result?.path })
      });
    } catch (err) {
      console.error('Failed to open VS Code:', err);
    }
  };

  return (
    <div style={styles.completeContainer}>
      <div style={styles.completeIcon}>✅</div>
      <h1 style={styles.completeTitle}>{projectData.businessName} is Ready!</h1>
      <p style={styles.completeSubtitle}>Your website + admin dashboard have been generated</p>
      
      <div style={styles.blinkResult}>
        {blinkMessage}
        <span style={styles.blinkSubtext}>That's roughly {((blinkCount || 1) * 4)} seconds</span>
      </div>
      
      <div style={styles.resultCard}>
        <div style={styles.resultRow}>
          <span>📁 Location</span>
          <span style={styles.resultPath}>{result?.path || 'generated-projects/'}</span>
        </div>
        <div style={styles.resultRow}>
          <span>📄 Pages</span>
          <span>{projectData.selectedPages.length} pages</span>
        </div>
        <div style={styles.resultRow}>
          <span>🎨 Style</span>
          <span>{projectData.industry?.name || 'Custom'}</span>
        </div>
        <div style={styles.resultRow}>
          <span>🎛️ Admin</span>
          <span style={{color: '#22c55e'}}>✓ Dashboard Included</span>
        </div>
        <div style={styles.resultRow}>
          <span>🧠 brain.json</span>
          <span style={{color: '#22c55e'}}>✓ Config Generated</span>
        </div>
      </div>

      <div style={styles.nextSteps}>
        <h3 style={{marginBottom: '16px'}}>🚀 Quick Start:</h3>
        
        <p style={{fontSize: '13px', color: '#888', marginBottom: '8px'}}>Backend API:</p>
        <div style={styles.codeBlock}>
          <code>cd "{result?.path || 'your-project'}/backend"</code>
          <code>npm install && cp .env.example .env && npm run dev</code>
        </div>
        
        <p style={{fontSize: '13px', color: '#888', marginBottom: '8px', marginTop: '16px'}}>Customer Website:</p>
        <div style={styles.codeBlock}>
          <code>cd "{result?.path || 'your-project'}/frontend"</code>
          <code>npm install && npm run dev</code>
        </div>
        
        <p style={{fontSize: '13px', color: '#888', marginBottom: '8px', marginTop: '16px'}}>Admin Dashboard:</p>
        <div style={styles.codeBlock}>
          <code>cd "{result?.path || 'your-project'}/admin"</code>
          <code>npm install && npm run dev</code>
        </div>
        
        <div style={{marginTop: '20px', padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)'}}>
          <p style={{fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>🔗 Endpoints (after starting):</p>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px'}}>
            <span style={{color: '#888'}}>Customer Site:</span>
            <span style={{color: '#22c55e'}}>http://localhost:5173</span>
            <span style={{color: '#888'}}>Admin Panel:</span>
            <span style={{color: '#22c55e'}}>http://localhost:5174</span>
            <span style={{color: '#888'}}>API Server:</span>
            <span style={{color: '#22c55e'}}>http://localhost:5000</span>
            <span style={{color: '#888'}}>Health Check:</span>
            <span style={{color: '#3b82f6'}}>http://localhost:5000/api/health</span>
            <span style={{color: '#888'}}>Brain Config:</span>
            <span style={{color: '#3b82f6'}}>http://localhost:5000/api/brain</span>
          </div>
        </div>
      </div>

      {/* Deploy Section */}
      {deployReady && (
        <div style={styles.deploySection}>
          <div style={styles.deployDivider}>
            <span style={styles.deployDividerText}>Ready to go live?</span>
          </div>
          <button style={styles.deployBtn} onClick={onDeploy}>
            🚀 Deploy to {projectData?.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'your-site'}.be1st.io
          </button>
          <p style={styles.deployHint}>One click. No terminal. Live in ~2 minutes.</p>
        </div>
      )}

      <div style={styles.completeActions}>
        <button style={styles.actionBtn} onClick={handleOpenFolder}>📂 Open Folder</button>
        <button style={styles.actionBtn} onClick={handleOpenVSCode}>💻 Open in VS Code</button>
        <button style={styles.actionBtnSecondary} onClick={onReset}>+ Create Another</button>
      </div>
    </div>
  );
}

// ============================================
// DEPLOYING STEP
// ============================================
function DeployingStep({ status, projectName, startTime, onCancel }) {
  const [dots, setDots] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Use startTime prop if available, otherwise count from 0
    const timeInterval = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      } else {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
    };
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Calculate remaining time (estimated 90 seconds total)
  const estimatedTotal = 90;
  const remaining = Math.max(0, estimatedTotal - elapsedTime);

  // Get current status display
  const statusDisplay = typeof status === 'object'
    ? `${status.icon} ${status.status}`
    : (status || 'Initializing...');

  return (
    <div style={styles.deployingContainer}>
      <div style={styles.deployingIcon}>🚀</div>
      <h2 style={styles.deployingTitle}>Deploying {projectName}{dots}</h2>
      <p style={styles.deployingSubtitle}>Your site is going live on the internet</p>

      <div style={styles.deployingStatusCard}>
        <div style={styles.deployingSpinner}></div>
        <span style={styles.deployingStatus}>{statusDisplay}</span>
      </div>

      <div style={styles.deployingTimeline}>
        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>⏱️</span>
          <span>Elapsed: {formatTime(elapsedTime)}</span>
        </div>
        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>🎯</span>
          <span>~{formatTime(remaining)} remaining</span>
        </div>
      </div>

      <div style={styles.deployingSteps}>
        <p style={styles.stepsTitle}>What's happening:</p>
        <div style={styles.stepsList}>
          <span>📦 GitHub repo</span>
          <span>→</span>
          <span>🚂 Railway project</span>
          <span>→</span>
          <span>🗄️ Database</span>
          <span>→</span>
          <span>🌐 DNS</span>
          <span>→</span>
          <span>✅ Live!</span>
        </div>
      </div>

      {/* Cancel button */}
      <button onClick={onCancel} style={deployStepStyles.cancelBtn}>
        Cancel Deployment
      </button>

      <div style={styles.deployingWarning}>
        <span style={styles.warningIcon}>⚠️</span>
        <span>Cancelling may leave partial resources created</span>
      </div>
    </div>
  );
}

const deployStepStyles = {
  cancelBtn: {
    marginTop: '24px',
    padding: '12px 32px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

// ============================================
// DEPLOY COMPLETE STEP
// ============================================
function DeployCompleteStep({ result, onReset }) {
  const [copied, setCopied] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const maskPassword = (pw) => {
    if (!pw) return '';
    return '*'.repeat(pw.length);
  };

  return (
    <div style={styles.deployCompleteContainer}>
      <div style={styles.deployCompleteIcon}>🎉</div>
      <h1 style={styles.deployCompleteTitle}>You're Live!</h1>
      <p style={styles.deployCompleteSubtitle}>Your site is now on the internet</p>

      {/* Main URL */}
      <div style={styles.liveUrlCard}>
        <span style={styles.liveUrlLabel}>Your Website</span>
        <a
          href={result?.urls?.frontend}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.liveUrlLink}
        >
          {result?.urls?.frontend || 'https://your-site.be1st.io'}
        </a>
        <button
          style={styles.visitBtn}
          onClick={() => window.open(result?.urls?.frontend, '_blank')}
        >
          Visit Site
        </button>
      </div>

      {/* All URLs */}
      <div style={styles.allUrlsCard}>
        <h3 style={styles.allUrlsTitle}>All Your URLs</h3>

        <div style={styles.urlRow}>
          <span style={styles.urlLabel}>Frontend:</span>
          <a href={result?.urls?.frontend} target="_blank" rel="noopener noreferrer" style={styles.urlValue}>
            {result?.urls?.frontend}
          </a>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(result?.urls?.frontend, 'frontend')}>
            {copied === 'frontend' ? '✓' : '📋'}
          </button>
        </div>

        <div style={styles.urlRow}>
          <span style={styles.urlLabel}>API:</span>
          <a href={result?.urls?.backend} target="_blank" rel="noopener noreferrer" style={styles.urlValue}>
            {result?.urls?.backend}
          </a>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(result?.urls?.backend, 'backend')}>
            {copied === 'backend' ? '✓' : '📋'}
          </button>
        </div>

        <div style={styles.urlRow}>
          <span style={styles.urlLabel}>Admin:</span>
          <a href={result?.urls?.admin} target="_blank" rel="noopener noreferrer" style={styles.urlValue}>
            {result?.urls?.admin}
          </a>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(result?.urls?.admin, 'admin')}>
            {copied === 'admin' ? '✓' : '📋'}
          </button>
        </div>

        <div style={styles.urlRow}>
          <span style={styles.urlLabel}>GitHub:</span>
          <a href={result?.urls?.github} target="_blank" rel="noopener noreferrer" style={styles.urlValue}>
            {result?.urls?.github}
          </a>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(result?.urls?.github, 'github')}>
            {copied === 'github' ? '✓' : '📋'}
          </button>
        </div>

        <div style={styles.urlRow}>
          <span style={styles.urlLabel}>Railway:</span>
          <a href={result?.urls?.railway} target="_blank" rel="noopener noreferrer" style={styles.urlValue}>
            {result?.urls?.railway}
          </a>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(result?.urls?.railway, 'railway')}>
            {copied === 'railway' ? '✓' : '📋'}
          </button>
        </div>
      </div>

      {/* Admin Credentials */}
      {result?.credentials && (
        <div style={styles.credentialsCard}>
          <h3 style={styles.credentialsTitle}>Admin Login</h3>
          <div style={styles.credentialRow}>
            <span style={styles.credentialLabel}>Email:</span>
            <span style={styles.credentialValue}>{result.credentials.adminEmail}</span>
            <button style={styles.copyBtn} onClick={() => copyToClipboard(result.credentials.adminEmail, 'email')}>
              {copied === 'email' ? '✓' : '📋'}
            </button>
          </div>
          <div style={styles.credentialRow}>
            <span style={styles.credentialLabel}>Password:</span>
            <span style={styles.credentialValue}>
              {showPassword ? result.credentials.adminPassword : maskPassword(result.credentials.adminPassword)}
            </span>
            <button
              style={deployCompleteStyles.toggleBtn}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button style={styles.copyBtn} onClick={() => copyToClipboard(result.credentials.adminPassword, 'password')}>
              {copied === 'password' ? '✓' : '📋'}
            </button>
          </div>
          <p style={styles.credentialHint}>Save these! You'll need them to access the admin dashboard.</p>
        </div>
      )}
      
      <div style={styles.deployCompleteActions}>
        <button style={styles.primaryBtn} onClick={() => window.open(result?.urls?.frontend, '_blank')}>
          🌐 View Live Site
        </button>
        <button style={styles.secondaryBtn} onClick={onReset}>
          + Create Another
        </button>
      </div>
      
      <p style={styles.dnsNote}>
        💡 If the site doesn't load immediately, wait 1-2 minutes for DNS propagation.
      </p>
    </div>
  );
}

const deployCompleteStyles = {
  toggleBtn: {
    padding: '4px 8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 0.7,
    transition: 'opacity 0.2s'
  }
};

// ============================================
// DEPLOY ERROR STEP
// ============================================
function DeployErrorStep({ error, onRetry, onReset }) {
  // Handle both string errors and structured { title, message, hint } objects
  const errorTitle = typeof error === 'object' ? error.title : 'Deployment Failed';
  const errorMessage = typeof error === 'object' ? error.message : error;
  const errorHint = typeof error === 'object' ? error.hint : 'This could be a temporary issue. Your project was generated successfully - you can try deploying again.';

  return (
    <div style={styles.errorContainer}>
      <div style={styles.errorIcon}>❌</div>
      <h2 style={styles.errorTitle}>{errorTitle}</h2>
      <p style={styles.errorMessage}>{errorMessage}</p>
      {errorHint && (
        <p style={errorStepStyles.hint}>{errorHint}</p>
      )}
      <div style={styles.errorActions}>
        <button style={styles.primaryBtn} onClick={onRetry}>Try Again</button>
        <button style={styles.secondaryBtn} onClick={onReset}>Start Over</button>
      </div>
    </div>
  );
}

// ============================================
// ERROR STEP
// ============================================
function ErrorStep({ error, onRetry, onReset }) {
  // Handle both string errors and structured { title, message, hint } objects
  const errorTitle = typeof error === 'object' ? error.title : 'Something went wrong';
  const errorMessage = typeof error === 'object' ? error.message : error;
  const errorHint = typeof error === 'object' ? error.hint : null;

  return (
    <div style={styles.errorContainer}>
      <div style={styles.errorIcon}>❌</div>
      <h2 style={styles.errorTitle}>{errorTitle}</h2>
      <p style={styles.errorMessage}>{errorMessage}</p>
      {errorHint && (
        <p style={errorStepStyles.hint}>{errorHint}</p>
      )}
      <div style={styles.errorActions}>
        <button style={styles.primaryBtn} onClick={onRetry}>Try Again</button>
        <button style={styles.secondaryBtn} onClick={onReset}>Start Over</button>
      </div>
    </div>
  );
}

const errorStepStyles = {
  hint: {
    color: '#888',
    fontSize: '14px',
    marginTop: '8px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    borderLeft: '3px solid #f59e0b'
  }
};

// ============================================
// STYLES
// ============================================
const styles = {
  // Container
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    color: '#e4e4e4',
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  
  // Header
  header: {
    padding: '20px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoImage: {
    height: '40px',
    width: 'auto',
    objectFit: 'contain',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '4px',
    background: 'linear-gradient(135deg, #fff, #888)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  headerTagline: {
    color: '#22c55e',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '280px',
    textAlign: 'right',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tagline: {
    color: '#888',
    fontSize: '14px',
    margin: 0,
  },
  
  // Main
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 32px',
  },
  
  // Footer
  footer: {
    padding: '16px 32px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    color: '#666',
    fontSize: '13px',
  },
  
  // Step container
  stepContainer: {
    width: '100%',
    maxWidth: '800px',
  },
  
  // Hero titles
  heroTitle: {
    fontSize: '42px',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #22c55e, #3b82f6, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '48px',
  },
  
  // Path selection
  pathGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  pathCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '28px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    position: 'relative',
  },
  pathCardFeatured: {
    background: 'rgba(34, 197, 94, 0.05)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  pathCardLocked: {
    opacity: 0.7,
  },
  lockedBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  featuredBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  pathIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  pathTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#fff',
  },
  pathDesc: {
    fontSize: '14px',
    color: '#22c55e',
    marginBottom: '12px',
  },
  pathDetails: {
    fontSize: '13px',
    color: '#888',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  pathArrow: {
    fontSize: '20px',
    color: '#22c55e',
  },
  bottomHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
  
  // Back button
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '24px',
    padding: '8px 0',
  },
  
  // Step titles
  stepTitle: {
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '8px',
  },
  stepSubtitle: {
    fontSize: '16px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '32px',
  },
  
  // Input row
  inputRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  bigInput: {
    flex: 1,
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '18px',
    outline: 'none',
  },
  primaryBtn: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    padding: '16px 32px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },
  
  // Examples
  examples: {
    textAlign: 'center',
  },
  examplesLabel: {
    color: '#666',
    fontSize: '13px',
    marginBottom: '12px',
  },
  exampleChips: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  exampleChip: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#aaa',
    fontSize: '13px',
    cursor: 'pointer',
  },
  
  // Error text
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: '16px',
  },
  
  // Analysis card
  analysisCard: {
    background: 'rgba(34, 197, 94, 0.05)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    marginTop: '24px',
  },
  analysisHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: '24px',
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  analysisItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  analysisLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
  },
  analysisValue: {
    fontSize: '15px',
    color: '#e4e4e4',
  },
  analysisDesc: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  continueBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyHint: {
    fontSize: '13px',
    color: '#555',
    marginTop: '8px',
  },
  
  // Feedback section (Rebuild)
  feedbackSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  feedbackLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '12px',
  },
  dislikeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  dislikeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dislikeChipActive: {
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
  },
  notesTextarea: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },
  toggleRefBtn: {
    background: 'transparent',
    border: 'none',
    color: '#3b82f6',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0',
  },
  refSitesContainer: {
    marginTop: '12px',
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
  },
  refHintText: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '12px',
  },
  refSiteRow: {
    marginBottom: '8px',
  },
  refSiteInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
  },
  addRefBtn: {
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: '#666',
    fontSize: '12px',
    padding: '8px 16px',
    cursor: 'pointer',
    width: '100%',
  },
  
  // Inspired mode enhancements
  inspiredBusinessSection: {
    marginBottom: '24px',
  },
  siteHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  removeSiteBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '4px',
    color: '#ef4444',
    fontSize: '12px',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likesSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  likesLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '10px',
  },
  likesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  likeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  likeChipActive: {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
  },
  
  // Detected card
  detectedCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'rgba(34, 197, 94, 0.05)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    marginTop: '32px',
  },
  detectedIcon: {
    fontSize: '48px',
  },
  detectedContent: {
    flex: 1,
  },
  detectedTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  detectedDesc: {
    color: '#888',
    fontSize: '14px',
  },
  
  // Reference sites
  sitesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  siteCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
  },
  siteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  siteNumber: {
    fontWeight: '600',
    color: '#e4e4e4',
  },
  analyzedBadge: {
    color: '#22c55e',
    fontSize: '13px',
  },
  siteInput: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
  },
  siteNotes: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },
  analyzeBtn: {
    padding: '10px 20px',
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    color: '#3b82f6',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
  },
  siteAnalysis: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  extractedColors: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#888',
  },
  colorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  extractedStyle: {
    fontSize: '13px',
    color: '#22c55e',
  },
  addSiteBtn: {
    padding: '16px',
    background: 'transparent',
    border: '2px dashed rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  refFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  refHint: {
    color: '#666',
    fontSize: '13px',
  },
  
  // Upload Assets Step
  uploadSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  uploadHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  uploadIcon: {
    fontSize: '24px',
  },
  uploadTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '4px',
  },
  uploadDesc: {
    fontSize: '13px',
    color: '#888',
  },
  uploadDropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px 20px',
    background: 'rgba(0,0,0,0.2)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#888',
    fontSize: '14px',
  },
  dropzoneIcon: {
    fontSize: '32px',
    marginBottom: '4px',
  },
  dropzoneHint: {
    fontSize: '12px',
    color: '#666',
  },
  uploadedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '10px',
  },
  uploadedLogo: {
    width: '60px',
    height: '60px',
    objectFit: 'contain',
    borderRadius: '8px',
    background: '#fff',
  },
  uploadedInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: '#e4e4e4',
  },
  extractingText: {
    fontSize: '12px',
    color: '#3b82f6',
  },
  extractedColorsPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#22c55e',
  },
  colorDotSmall: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  removeBtn: {
    width: '28px',
    height: '28px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#ef4444',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
  },
  photoItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddBtn: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#888',
    fontSize: '24px',
  },
  photoAddText: {
    fontSize: '10px',
  },
  photoCount: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#888',
  },
  menuPreview: {
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    borderRadius: '6px',
  },
  menuThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  menuFileIcon: {
    fontSize: '24px',
  },
  menuTypeTag: {
    fontSize: '11px',
    padding: '2px 6px',
    background: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '4px',
    color: '#3b82f6',
  },
  styleTextarea: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  uploadActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
  },
  skipBtn: {
    padding: '14px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '15px',
    cursor: 'pointer',
  },
  uploadHint: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '13px',
    color: '#666',
  },
  
  // Customize step
  customizeContainer: {
    width: '100%',
    maxWidth: '1200px',
  },
  customizeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '32px',
    textAlign: 'center',
  },
  customizeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginBottom: '32px',
  },
  customizeForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4',
  },
  formInput: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
  },
  formSelect: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    cursor: 'pointer',
  },
  extraDetailsTextarea: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  extraDetailsHint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
  },
  
  // Color presets
  colorPresets: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  colorPreset: {
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  colorPresetActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
  },
  presetSwatches: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
    justifyContent: 'center',
  },
  presetSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  presetName: {
    fontSize: '12px',
    color: '#aaa',
  },
  customColors: {
    display: 'flex',
    gap: '16px',
  },
  colorPickerGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
  },
  colorPicker: {
    width: '100%',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'transparent',
  },
  
  // Page grid
  pageGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  pageChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pageChipActive: {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
  },
  
  // Preview
  previewContainer: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: '13px',
    color: '#888',
  },
  previewDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
  },
  previewFrame: {
    background: '#fff',
    minHeight: '400px',
  },
  previewNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
  },
  previewLogo: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
  },
  previewNavLinks: {
    display: 'flex',
    gap: '16px',
  },
  previewNavLink: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px',
    textTransform: 'capitalize',
  },
  previewHero: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  previewHeroTitle: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  previewHeroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    marginBottom: '16px',
  },
  previewCta: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  previewContent: {
    padding: '24px 20px',
    background: '#f8f9fa',
  },
  previewCards: {
    display: 'flex',
    gap: '12px',
  },
  previewCard: {
    flex: 1,
    background: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  previewCardIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    fontSize: '14px',
  },
  previewCardLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  previewLine: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
  },
  
  // Generate section
  generateSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
  },
  generateSummary: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#888',
  },
  generateBtn: {
    padding: '18px 48px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
  },
  
  // Generating
  generatingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  blinkQuestion: {
    fontSize: '18px',
    color: '#22c55e',
    marginBottom: '32px',
    fontWeight: '600',
  },
  generatingIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    animation: 'pulse 1s infinite',
  },
  generatingTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '32px',
  },
  progressBar: {
    width: '100%',
    maxWidth: '400px',
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '0 auto 16px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e, #3b82f6)',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '24px',
  },
  progressText: {
    fontSize: '14px',
    color: '#888',
  },
  blinkCounter: {
    fontSize: '14px',
    color: '#3b82f6',
    fontWeight: '600',
  },
  generatingHint: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '24px',
  },
  activeIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#22c55e',
  },
  pulsingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 1s infinite',
  },
  
  // Complete
  completeContainer: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  completeIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  blinkResult: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '16px 24px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  blinkSubtext: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#888',
  },
  completeTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  completeSubtitle: {
    color: '#888',
    marginBottom: '32px',
  },
  resultCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: '14px',
  },
  resultPath: {
    color: '#22c55e',
    fontSize: '12px',
    wordBreak: 'break-all',
  },
  nextSteps: {
    textAlign: 'left',
    marginBottom: '24px',
  },
  codeBlock: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#22c55e',
  },
  completeActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    padding: '14px 24px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#e4e4e4',
    fontSize: '15px',
    cursor: 'pointer',
  },
  
  // Deploy section in CompleteStep
  deploySection: {
    marginTop: '32px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  deployDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  deployDividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
    position: 'relative',
  },
  deployBtn: {
    padding: '20px 48px',
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(139, 92, 246, 0.4)',
    transition: 'all 0.2s',
  },
  deployHint: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#888',
  },
  
  // Deploying step
  deployingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  deployingIcon: {
    fontSize: '72px',
    marginBottom: '24px',
    animation: 'bounce 1s infinite',
  },
  deployingTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  deployingSubtitle: {
    color: '#888',
    fontSize: '16px',
    marginBottom: '32px',
  },
  deployingStatusCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px 32px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  deployingSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(139, 92, 246, 0.2)',
    borderTop: '3px solid #8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  deployingStatus: {
    fontSize: '16px',
    color: '#e4e4e4',
    fontWeight: '500',
  },
  deployingTimeline: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '24px',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#888',
  },
  timelineIcon: {
    fontSize: '16px',
  },
  deployingWarning: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#f97316',
  },
  warningIcon: {
    fontSize: '16px',
  },
  deployingSteps: {
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
  },
  stepsTitle: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '12px',
  },
  stepsList: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#e4e4e4',
    flexWrap: 'wrap',
  },
  
  // Deploy complete
  deployCompleteContainer: {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  deployCompleteIcon: {
    fontSize: '80px',
    marginBottom: '16px',
  },
  deployCompleteTitle: {
    fontSize: '42px',
    fontWeight: '800',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #22c55e, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  deployCompleteSubtitle: {
    color: '#888',
    fontSize: '18px',
    marginBottom: '32px',
  },
  liveUrlCard: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
    border: '2px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  liveUrlLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  liveUrlLink: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#22c55e',
    textDecoration: 'none',
    marginBottom: '16px',
    wordBreak: 'break-all',
  },
  visitBtn: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  allUrlsCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  allUrlsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e4',
    marginBottom: '16px',
  },
  urlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  urlLabel: {
    width: '80px',
    fontSize: '13px',
    color: '#888',
  },
  urlValue: {
    flex: 1,
    fontSize: '13px',
    color: '#3b82f6',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  copyBtn: {
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
  },
  credentialsCard: {
    background: 'rgba(249, 115, 22, 0.05)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  credentialsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f97316',
    marginBottom: '16px',
  },
  credentialRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  credentialLabel: {
    width: '80px',
    fontSize: '13px',
    color: '#888',
  },
  credentialValue: {
    flex: 1,
    fontSize: '14px',
    color: '#e4e4e4',
    fontFamily: 'monospace',
  },
  credentialHint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '12px',
    fontStyle: 'italic',
  },
  deployCompleteActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  dnsNote: {
    fontSize: '13px',
    color: '#666',
  },

  // Error
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  errorTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: '12px',
  },
  errorMessage: {
    color: '#888',
    marginBottom: '32px',
  },
  errorActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
};

// Add keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Inter', -apple-system, sans-serif;
  }
  
  input::placeholder, textarea::placeholder {
    color: #666;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);