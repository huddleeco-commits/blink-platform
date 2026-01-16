/**
 * Module Assembler UI - WordPress-Style Simplicity
 * 
 * 3 Paths → 1 Customizer → Generate
 * So simple a 5-year-old could use it.
 */

import React, { useState, useEffect } from 'react';
import { INDUSTRY_LAYOUTS, getLayoutConfig, buildLayoutPromptContext } from '../config/industry-layouts.js';
import {
  API_BASE,
  BREAKPOINTS,
  TAGLINES,
  LAYOUT_OPTIONS,
  getLayoutsForIndustry,
  INDUSTRY_PAGES,
  PAGE_LABELS,
  COLOR_PRESETS,
  STYLE_OPTIONS,
  ADMIN_LEVELS
} from './constants';
import { useWindowSize } from './hooks';
import { getLayoutMode } from './utils';
import {
  PasswordGate,
  DevPasswordModal,
  Tooltip,
  CollapsibleSection,
  WizardBreadcrumb,
  WhatYouGetCard,
  IndustryBanner,
  wizardStyles,
  collapsibleStyles,
  tooltipStyles,
  whatYouGetStyles,
  industryBannerStyles
} from './components';

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
  const [step, setStep] = useState('choose-path'); // choose-path, rebuild, quick, reference, orchestrator, upload-assets, customize, generating, complete, deploying, deploy-complete, deploy-error, error
  
  // Deploy state
  const [deployStatus, setDeployStatus] = useState(null);
  const [deployResult, setDeployResult] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [path, setPath] = useState(null); // 'rebuild', 'quick', 'reference', 'orchestrator'

  // Orchestrator state
  const [orchestratorResult, setOrchestratorResult] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null); // For pre-selected tool type
  const [isToolMode, setIsToolMode] = useState(false); // Tool vs business mode

  // Tool recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationIndustry, setRecommendationIndustry] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Tool suite state
  const [selectedToolsForSuite, setSelectedToolsForSuite] = useState([]);
  const [suiteResult, setSuiteResult] = useState(null);

  // Choice screen state (for ambiguous inputs)
  const [choiceData, setChoiceData] = useState(null);
  const [pendingOrchestratorInput, setPendingOrchestratorInput] = useState(null);

  // Shared context state (persists across site/tools flows)
  const [sharedContext, setSharedContext] = useState({
    businessName: '',
    brandColor: '#3b82f6',
    location: '',
    industry: null,
    industryDisplay: null,
    style: 'modern', // modern, minimal, warm, professional
    logo: null,
    tagline: ''
  });

  // Site customization state
  const [siteCustomization, setSiteCustomization] = useState(null);

  // Tool customization state (for single tool flow)
  const [toolCustomization, setToolCustomization] = useState(null);
  const [selectedToolForCustomization, setSelectedToolForCustomization] = useState(null);

  // Data collected from any path
  const [projectData, setProjectData] = useState({
    // From any path
    businessName: '',
    tagline: '',
    industry: null,
    industryKey: null,
    layoutKey: null, // Selected layout within industry
    layoutStyleId: null, // Visual layout style selection (e.g., 'menu-hero', 'trust-authority')
    layoutStylePreview: null, // Preview config for the selected layout style

    // NEW: Business basics
    location: '',

    // NEW: High-impact questions
    teamSize: null, // 'solo', 'small', 'medium', 'large'
    priceRange: null, // 'budget', 'mid', 'premium', 'luxury'
    yearsEstablished: null, // 'new', 'growing', 'established', 'veteran'

    // NEW: Inferred from business name
    inferredDetails: null, // { location, style, industry }

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

    // Video hero background (auto-enabled for supported industries)
    enableVideoHero: null, // null = auto (based on industry), true/false = user override

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
  const selectPath = (selectedPath, toolId = null) => {
    if ((selectedPath === 'rebuild' || selectedPath === 'reference') && !isDevUnlocked) {
      setPendingDevPath(selectedPath);
      setShowDevModal(true);
      return;
    }
    setPath(selectedPath);

    // Handle tool selections
    if (selectedPath === 'tool' && toolId) {
      // Direct tool generation with pre-selected tool type
      setSelectedTool(toolId);
      setIsToolMode(true);
      setStep('orchestrator');
    } else if (selectedPath === 'tool-custom') {
      // Custom tool mode - opens orchestrator with tool placeholders
      setSelectedTool(null);
      setIsToolMode(true);
      setStep('orchestrator');
    } else if (selectedPath === 'orchestrator') {
      // Business orchestrator mode
      setSelectedTool(null);
      setIsToolMode(false);
      setStep('orchestrator');
    } else if (selectedPath === 'rebuild') {
      setIsToolMode(false);
      setStep('rebuild');
    } else if (selectedPath === 'quick') {
      setIsToolMode(false);
      setStep('quick');
    } else if (selectedPath === 'reference') {
      setIsToolMode(false);
      setStep('reference');
    }
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

      // Compute effective video hero setting
      const videoSupportedIndustries = ['tattoo', 'barbershop', 'barber', 'restaurant', 'pizza', 'pizzeria', 'fitness', 'gym', 'spa', 'salon', 'wellness'];
      const industryLower = (projectData.industryKey || '').toLowerCase();
      const industrySupportsVideo = videoSupportedIndustries.some(v => industryLower.includes(v));
      const effectiveEnableVideoHero = projectData.enableVideoHero !== null
        ? projectData.enableVideoHero
        : industrySupportsVideo;

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
          tone: toneLabel,
          // High-impact questions for better generation
          teamSize: projectData.teamSize,
          priceRange: projectData.priceRange,
          yearsEstablished: projectData.yearsEstablished,
          inferredDetails: projectData.inferredDetails,
          // Layout style selection
          layoutStyleId: projectData.layoutStyleId,
          layoutStylePreview: projectData.layoutStylePreview,
          // Video hero background
          enableVideoHero: effectiveEnableVideoHero
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
  // Railway services status state
  const [railwayServices, setRailwayServices] = useState(null);

  // Poll Railway for actual service deployment status
  const pollRailwayStatus = async (projectId, deployResultData) => {
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/deploy/railway-status/${projectId}`);
        const data = await response.json();

        if (data.success) {
          setRailwayServices(data.services);

          if (data.allDeployed) {
            // All services are online! Show success
            setDeployResult(deployResultData);
            setStep('deploy-complete');
            return;
          }

          if (data.hasFailure) {
            // A service failed
            throw new Error('One or more services failed to deploy. Check Railway dashboard.');
          }
        }

        // Keep polling if not complete
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Timeout - show as complete anyway with warning
          console.warn('Railway status polling timed out');
          setDeployResult(deployResultData);
          setStep('deploy-complete');
        }
      } catch (err) {
        console.error('Railway status poll error:', err);
        // On error, still show complete (deployment was triggered successfully)
        setDeployResult(deployResultData);
        setStep('deploy-complete');
      }
    };

    poll();
  };

  const handleDeploy = async () => {
    if (!result?.path || !result?.name) {
      setDeployError({ title: 'No Project', message: 'No project to deploy. Please generate a project first.' });
      setStep('deploy-error');
      return;
    }

    setStep('deploying');
    setDeployStatus({ status: 'Starting deployment...', icon: '🚀', progress: 0 });
    setDeployError(null);
    setDeployStartTime(Date.now());
    setRailwayServices(null); // Reset services status

    // Create abort controller for cancellation
    const controller = new AbortController();
    setDeployAbortController(controller);

    try {
      // Use streaming endpoint for real-time progress
      const response = await fetch(`${API_BASE}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: result.path,
          projectName: result.name || projectData.businessName.replace(/[^a-zA-Z0-9]/g, '-'),
          adminEmail: 'admin@be1st.io',
          stream: true
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Handle SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'complete') {
                // Initial deployment triggered - now poll for actual Railway status
                if (data.result?.success && data.result?.railwayProjectId) {
                  setDeployStatus({ status: 'Waiting for services to come online...', icon: '⏳', progress: 95 });
                  // Initialize service status display
                  setRailwayServices({
                    postgres: { status: 'INITIALIZING', isBuilding: true },
                    backend: { status: 'INITIALIZING', isBuilding: true },
                    frontend: { status: 'INITIALIZING', isBuilding: true },
                    admin: { status: 'INITIALIZING', isBuilding: true }
                  });
                  // Start polling Railway for actual service status
                  pollRailwayStatus(data.result.railwayProjectId, data.result);
                } else if (data.result?.success) {
                  // No railwayProjectId - just show complete
                  setDeployResult(data.result);
                  setStep('deploy-complete');
                } else {
                  throw new Error(data.result?.error || 'Deployment failed');
                }
              } else if (data.type === 'error') {
                throw new Error(data.error);
              } else {
                // Progress update
                setDeployStatus(data);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes('parse')) {
                throw parseErr; // Re-throw actual errors
              }
              console.warn('Failed to parse SSE data:', parseErr);
            }
          }
        }
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
      enableVideoHero: null, // Reset to auto (industry-based default)
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
        
        {step === 'orchestrator' && (
          <OrchestratorStep
            isToolMode={isToolMode}
            preselectedTool={selectedTool}
            pendingInput={pendingOrchestratorInput}
            onPendingInputUsed={() => setPendingOrchestratorInput(null)}
            onComplete={(result) => {
              setOrchestratorResult(result);
              // Extract project object to match what CompleteStep expects (path, name)
              setResult(result.project);
              updateProject({ businessName: result.orchestrator?.decisions?.businessName || result.tool?.template || result.project?.name });
              setStep('complete');
            }}
            onBack={() => {
              setSelectedTool(null);
              setIsToolMode(false);
              setStep('choose-path');
            }}
            onAmbiguousInput={(intentData) => {
              // Show choice screen when input is ambiguous
              setChoiceData(intentData);
              setStep('choice');
            }}
            onToolRecommendations={async (industry) => {
              // Go directly to tool recommendations
              setRecommendationsLoading(true);
              setStep('recommendations');
              try {
                const response = await fetch(`${API_BASE}/api/orchestrate/recommend`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ industry })
                });
                const data = await response.json();
                if (data.success) {
                  setRecommendations(data.recommendations || []);
                  setRecommendationIndustry(data.industry);
                }
              } catch (err) {
                console.error('Failed to get recommendations:', err);
                setStep('orchestrator');
              } finally {
                setRecommendationsLoading(false);
              }
            }}
            onSuggestTools={async (industryInput) => {
              setRecommendationsLoading(true);
              setStep('recommendations');
              try {
                const response = await fetch(`${API_BASE}/api/orchestrate/recommend`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ input: industryInput })
                });
                const data = await response.json();
                if (data.success) {
                  setRecommendations(data.recommendations || []);
                  setRecommendationIndustry(data.industry);
                }
              } catch (err) {
                console.error('Failed to get recommendations:', err);
                setStep('orchestrator');
              } finally {
                setRecommendationsLoading(false);
              }
            }}
          />
        )}

        {step === 'choice' && choiceData && (
          <ChoiceScreen
            detectedIndustry={choiceData.detectedIndustry}
            industryDisplay={choiceData.industryDisplay}
            industryIcon={choiceData.industryIcon}
            originalInput={choiceData.originalInput}
            onChooseSite={() => {
              // Update shared context with detected industry
              setSharedContext(prev => ({
                ...prev,
                industry: choiceData.detectedIndustry,
                industryDisplay: choiceData.industryDisplay
              }));
              // Store choice data for the customize screen
              setSiteCustomization({
                industry: choiceData.detectedIndustry,
                industryDisplay: choiceData.industryDisplay,
                industryIcon: choiceData.industryIcon
              });
              setChoiceData(null);
              setStep('site-customize');
            }}
            onChooseTools={async () => {
              // Update shared context with detected industry
              setSharedContext(prev => ({
                ...prev,
                industry: choiceData.detectedIndustry,
                industryDisplay: choiceData.industryDisplay
              }));
              // Go to tool recommendations for this industry
              setRecommendationsLoading(true);
              setStep('recommendations');
              try {
                const response = await fetch(`${API_BASE}/api/orchestrate/recommend`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ industry: choiceData.detectedIndustry })
                });
                const data = await response.json();
                if (data.success) {
                  setRecommendations(data.recommendations || []);
                  setRecommendationIndustry(data.industry);
                }
              } catch (err) {
                console.error('Failed to get recommendations:', err);
                setStep('orchestrator');
              } finally {
                setRecommendationsLoading(false);
                setChoiceData(null);
              }
            }}
            onBack={() => {
              setChoiceData(null);
              setStep('choose-path');
            }}
          />
        )}

        {step === 'site-customize' && siteCustomization && (
          <SiteCustomizationScreen
            industry={siteCustomization.industry}
            industryDisplay={siteCustomization.industryDisplay}
            industryIcon={siteCustomization.industryIcon}
            sharedContext={sharedContext}
            onUpdateContext={setSharedContext}
            onGenerate={async (config) => {
              // Update shared context with customization
              setSharedContext(prev => ({
                ...prev,
                businessName: config.businessName,
                brandColor: config.brandColor,
                location: config.location,
                style: config.style,
                logo: config.logo,
                tagline: config.tagline
              }));
              // Update projectData for generation
              updateProject({
                businessName: config.businessName,
                tagline: config.tagline,
                location: config.location,
                industry: { name: config.industryDisplay, key: config.industry },
                industryKey: config.industry,
                selectedPages: config.selectedPages,
                colors: {
                  ...projectData.colors,
                  primary: config.brandColor
                }
              });
              // Build input for orchestrator
              const inputDescription = `Build a ${config.industryDisplay} website for ${config.businessName}${config.location ? ` in ${config.location}` : ''}. ${config.tagline ? `Tagline: "${config.tagline}". ` : ''}Style: ${config.style}. Pages: ${config.selectedPages.join(', ')}. Admin level: ${config.adminLevel}.`;
              setPendingOrchestratorInput(inputDescription);
              setSiteCustomization(null);
              setStep('orchestrator');
            }}
            onBack={() => {
              setSiteCustomization(null);
              setStep('choice');
              // Restore choice data
              setChoiceData({
                detectedIndustry: siteCustomization.industry,
                industryDisplay: siteCustomization.industryDisplay,
                industryIcon: siteCustomization.industryIcon,
                originalInput: ''
              });
            }}
          />
        )}

        {step === 'tool-customize' && selectedToolForCustomization && (
          <ToolCustomizationScreen
            tool={selectedToolForCustomization.toolType}
            toolName={selectedToolForCustomization.name}
            toolIcon={selectedToolForCustomization.icon}
            sharedContext={sharedContext}
            onUpdateContext={setSharedContext}
            onGenerate={async (config) => {
              // Update shared context
              setSharedContext(prev => ({
                ...prev,
                businessName: config.businessName,
                brandColor: config.brandColor,
                style: config.style,
                logo: config.logo
              }));
              // Build the tool with customization
              setSelectedTool(selectedToolForCustomization.toolType);
              setIsToolMode(true);
              // Build input for orchestrator
              const inputDescription = `Build a ${selectedToolForCustomization.name}${config.businessName ? ` for ${config.businessName}` : ''}. Style: ${config.style}. Primary color: ${config.brandColor}.`;
              setPendingOrchestratorInput(inputDescription);
              setSelectedToolForCustomization(null);
              setStep('orchestrator');
            }}
            onBack={() => {
              setSelectedToolForCustomization(null);
              setStep('recommendations');
            }}
            onSkip={() => {
              // Skip customization and build directly
              setSelectedTool(selectedToolForCustomization.toolType);
              setIsToolMode(true);
              setSelectedToolForCustomization(null);
              setStep('orchestrator');
            }}
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
          orchestratorResult?.type === 'tool' ? (
            <ToolCompleteScreen
              toolResult={orchestratorResult}
              onReset={handleReset}
              onBuildAnother={() => {
                setOrchestratorResult(null);
                setSelectedTool(null);
                setIsToolMode(true);
                setStep('orchestrator');
              }}
              industry={sharedContext.industryDisplay || recommendationIndustry}
              onBuildSite={() => {
                // Go to site customization with current context
                setOrchestratorResult(null);
                setSelectedTool(null);
                setIsToolMode(false);
                setSiteCustomization({
                  industry: sharedContext.industry || recommendationIndustry,
                  industryDisplay: sharedContext.industryDisplay || recommendationIndustry,
                  industryIcon: '🌐'
                });
                setStep('site-customize');
              }}
            />
          ) : (
            <CompleteStep
              result={result}
              projectData={projectData}
              onReset={handleReset}
              blinkCount={finalBlinkCount}
              onDeploy={handleDeploy}
              deployReady={true}
              industry={sharedContext.industryDisplay || projectData.industry?.name}
              onAddTools={async () => {
                // Go to tool recommendations for same industry
                const industryKey = sharedContext.industry || projectData.industryKey;
                if (industryKey) {
                  setRecommendationsLoading(true);
                  setStep('recommendations');
                  try {
                    const response = await fetch(`${API_BASE}/api/orchestrate/recommend`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ industry: industryKey })
                    });
                    const data = await response.json();
                    if (data.success) {
                      setRecommendations(data.recommendations || []);
                      setRecommendationIndustry(data.industry);
                    }
                  } catch (err) {
                    console.error('Failed to get recommendations:', err);
                  } finally {
                    setRecommendationsLoading(false);
                  }
                }
              }}
            />
          )
        )}
        
        {step === 'recommendations' && (
          <RecommendedToolsScreen
            recommendations={recommendations}
            industry={recommendationIndustry}
            loading={recommendationsLoading}
            sharedContext={sharedContext}
            onSelectTool={(toolType, toolName) => {
              // Go to tool customization screen
              const tool = recommendations.find(r => r.toolType === toolType);
              setSelectedToolForCustomization({
                toolType,
                name: toolName || tool?.name || toolType,
                icon: tool?.icon || '🔧'
              });
              setStep('tool-customize');
            }}
            onSelectMultiple={async (toolTypes) => {
              // Go to suite builder with selected tools
              setSelectedToolsForSuite(toolTypes);
              setStep('suite-builder');
            }}
            onBack={() => {
              setRecommendations([]);
              setRecommendationIndustry(null);
              setStep('choose-path');
            }}
            onBuildSite={() => {
              // Go to site customization with current context
              setSiteCustomization({
                industry: sharedContext.industry || recommendationIndustry,
                industryDisplay: sharedContext.industryDisplay || recommendationIndustry,
                industryIcon: '🌐'
              });
              setStep('site-customize');
            }}
          />
        )}

        {step === 'suite-builder' && (
          <ToolSuiteBuilderScreen
            selectedTools={selectedToolsForSuite}
            recommendations={recommendations}
            industry={recommendationIndustry}
            onBuild={(result) => {
              setSuiteResult(result);
              setStep('suite-complete');
            }}
            onBack={() => {
              setStep('recommendations');
            }}
          />
        )}

        {step === 'suite-complete' && (
          <SuiteCompleteScreen
            suiteResult={suiteResult}
            onReset={() => {
              setSuiteResult(null);
              setSelectedToolsForSuite([]);
              setRecommendations([]);
              setRecommendationIndustry(null);
              setStep('choose-path');
            }}
            onBuildAnother={() => {
              setSuiteResult(null);
              setStep('recommendations');
            }}
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
            railwayServices={railwayServices}
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
  // Tool cards data
  const popularTools = [
    { id: 'invoice-generator', icon: '📄', name: 'Invoice Generator', desc: 'Create professional invoices' },
    { id: 'qr-generator', icon: '📱', name: 'QR Code Generator', desc: 'Generate QR codes instantly' },
    { id: 'calculator', icon: '🧮', name: 'Calculator', desc: 'Build custom calculators' },
    { id: 'countdown', icon: '⏱️', name: 'Countdown Timer', desc: 'Event countdowns & timers' },
  ];

  return (
    <div style={styles.stepContainer}>
      <h1 style={styles.heroTitle}>What do you want to create?</h1>
      <p style={styles.heroSubtitle}>Build a complete website or a quick utility tool</p>

      {/* Section 1: Build a Business */}
      <div style={styles.sectionContainer}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🏢</span> Build a Business Website
        </h2>
        <p style={styles.sectionSubtitle}>Multi-page websites with full functionality</p>

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

          {/* Orchestrator Path */}
          <button style={{...styles.pathCard, ...styles.pathCardOrchestrator}} onClick={() => onSelect('orchestrator')}>
            <div style={styles.newBadge}>AI</div>
            <div style={styles.pathIcon}>🧠</div>
            <h2 style={styles.pathTitle}>ORCHESTRATOR</h2>
            <p style={styles.pathDesc}>One sentence. Done.</p>
            <p style={styles.pathDetails}>
              Just describe your business in a single sentence. AI handles everything.
            </p>
            <div style={styles.pathArrow}>→</div>
          </button>
        </div>
      </div>

      {/* Section 2: Build a Tool */}
      <div style={styles.sectionContainer}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🛠️</span> Build a Tool
        </h2>
        <p style={styles.sectionSubtitle}>Single-page utilities and micro-tools</p>

        <div style={styles.toolGrid}>
          {/* Popular Tool Cards */}
          {popularTools.map(tool => (
            <button
              key={tool.id}
              style={styles.toolCard}
              onClick={() => onSelect('tool', tool.id)}
            >
              <div style={styles.toolIcon}>{tool.icon}</div>
              <h3 style={styles.toolName}>{tool.name}</h3>
              <p style={styles.toolDesc}>{tool.desc}</p>
            </button>
          ))}

          {/* Custom Tool Card */}
          <button
            style={{...styles.toolCard, ...styles.toolCardCustom}}
            onClick={() => onSelect('tool-custom')}
          >
            <div style={styles.toolIcon}>✨</div>
            <h3 style={styles.toolName}>Custom Tool</h3>
            <p style={styles.toolDesc}>Describe any tool you need</p>
            <div style={styles.customBadge}>AI-POWERED</div>
          </button>
        </div>
      </div>

      <p style={styles.bottomHint}>
        💡 All paths take under 2 minutes. Tools are single-page, websites are multi-page.
      </p>
    </div>
  );
}

// ============================================
// ORCHESTRATOR MODE: One Sentence, Done
// ============================================
function OrchestratorStep({ onComplete, onBack, isToolMode = false, preselectedTool = null, onSuggestTools, onAmbiguousInput, onToolRecommendations, skipIntentDetection = false, pendingInput = null, onPendingInputUsed }) {
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

  const placeholders = isToolMode ? toolPlaceholders : businessPlaceholders;

  const [placeholder] = useState(() =>
    placeholders[Math.floor(Math.random() * placeholders.length)]
  );

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
  const [uploadProgress, setUploadProgress] = useState({});
  const [extractingColors, setExtractingColors] = useState(false);
  const [detectedStyle, setDetectedStyle] = useState(null);
  const [dragOver, setDragOver] = useState({ logo: false, photos: false, menu: false });
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Responsive layout detection
  const { width } = useWindowSize();
  const layoutMode = getLayoutMode(width);
  const isMobile = layoutMode === 'mobile';
  const isDesktop = layoutMode === 'desktop' || layoutMode === 'largeDesktop';

  // Visual style options for auto-detection
  const visualStyles = [
    { id: 'modern', label: 'Modern & Clean', keywords: ['sharp', 'geometric', 'minimal'] },
    { id: 'warm', label: 'Warm & Inviting', keywords: ['wood', 'earth', 'cozy'] },
    { id: 'bold', label: 'Bold & Dynamic', keywords: ['contrast', 'vibrant', 'energetic'] },
    { id: 'elegant', label: 'Elegant & Premium', keywords: ['luxury', 'refined', 'sophisticated'] },
    { id: 'playful', label: 'Playful & Fun', keywords: ['colorful', 'friendly', 'approachable'] },
    { id: 'minimal', label: 'Minimalist', keywords: ['simple', 'whitespace', 'focused'] },
  ];

  // Handle logo upload with drag-drop support
  const handleLogoUpload = async (e) => {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress({ ...uploadProgress, logo: 0 });

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({ ...prev, logo: Math.min((prev.logo || 0) + 20, 90) }));
    }, 100);

    const reader = new FileReader();
    reader.onload = async (event) => {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, logo: 100 }));

      const base64 = event.target.result;

      updateProject({
        uploadedAssets: {
          ...projectData.uploadedAssets,
          logo: { file: file.name, base64, type: file.type }
        }
      });

      // Extract colors from logo
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

          // Auto-detect visual style based on colors
          detectVisualStyle(colors);
        }
      } catch (err) {
        console.error('Color extraction failed:', err);
      }
      setExtractingColors(false);
      setUploading(false);
      setTimeout(() => setUploadProgress(prev => ({ ...prev, logo: null })), 500);
    };
    reader.readAsDataURL(file);
  };

  // Detect visual style based on colors
  const detectVisualStyle = (colors) => {
    const primary = colors.primary;
    const r = parseInt(primary.slice(1, 3), 16);
    const g = parseInt(primary.slice(3, 5), 16);
    const b = parseInt(primary.slice(5, 7), 16);

    // Simple heuristics for style detection
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    let style = 'modern';
    if (saturation < 50 && brightness > 150) style = 'minimal';
    else if (r > 180 && g < 100) style = 'bold';
    else if (r > 150 && g > 100 && b < 100) style = 'warm';
    else if (saturation > 150) style = 'playful';
    else if (brightness < 80) style = 'elegant';

    setDetectedStyle(style);
    updateProject({ detectedVisualStyle: style });
  };

  // Handle photos upload with progress
  const handlePhotosUpload = async (e) => {
    const files = Array.from(e.target?.files || e.dataTransfer?.files || []).slice(0, 10);
    if (files.length === 0) return;

    setUploading(true);

    const promises = files.map((file, idx) => {
      return new Promise((resolve) => {
        setUploadProgress(prev => ({ ...prev, [`photo_${idx}`]: 0 }));

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [`photo_${idx}`]: Math.min((prev[`photo_${idx}`] || 0) + 15, 90)
          }));
        }, 50);

        const reader = new FileReader();
        reader.onload = (event) => {
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [`photo_${idx}`]: 100 }));
          resolve({ file: file.name, base64: event.target.result, type: file.type });
        };
        reader.readAsDataURL(file);
      });
    });

    const photos = await Promise.all(promises);
    updateProject({
      uploadedAssets: {
        ...projectData.uploadedAssets,
        photos: [...(projectData.uploadedAssets?.photos || []), ...photos].slice(0, 10)
      }
    });
    setUploading(false);
    setTimeout(() => setUploadProgress({}), 500);
  };

  // Handle menu upload
  const handleMenuUpload = (e) => {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress({ ...uploadProgress, menu: 0 });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({ ...prev, menu: Math.min((prev.menu || 0) + 25, 90) }));
    }, 100);

    const reader = new FileReader();
    reader.onload = (event) => {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, menu: 100 }));

      updateProject({
        uploadedAssets: {
          ...projectData.uploadedAssets,
          menu: { file: file.name, base64: event.target.result, type: file.type }
        }
      });
      setUploading(false);
      setTimeout(() => setUploadProgress(prev => ({ ...prev, menu: null })), 500);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e, zone) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(prev => ({ ...prev, [zone]: true }));
  };

  const handleDragLeave = (e, zone) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(prev => ({ ...prev, [zone]: false }));
  };

  const handleDrop = (e, zone, handler) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(prev => ({ ...prev, [zone]: false }));
    handler(e);
  };

  // Remove handlers
  const removePhoto = (index) => {
    const photos = [...(projectData.uploadedAssets?.photos || [])];
    photos.splice(index, 1);
    updateProject({ uploadedAssets: { ...projectData.uploadedAssets, photos } });
  };

  const removeLogo = () => {
    updateProject({
      uploadedAssets: { ...projectData.uploadedAssets, logo: null },
      colorMode: null
    });
    setDetectedStyle(null);
  };

  const removeMenu = () => {
    updateProject({ uploadedAssets: { ...projectData.uploadedAssets, menu: null } });
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
            if (data[3] > 50) {
              const hex = '#' + [data[0], data[1], data[2]].map(x => x.toString(16).padStart(2, '0')).join('');
              colors.push(hex);
            }
          } catch (e) {}
        });

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
          resolve({ primary: validColors[0], secondary: validColors[1], accent: validColors[2] || validColors[0] });
        } else if (validColors.length === 1) {
          resolve({ primary: validColors[0], secondary: validColors[0], accent: validColors[0] });
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

  // Responsive styles for upload step
  const uploadResponsiveStyles = {
    container: {
      maxWidth: isDesktop ? '1400px' : '100%',
      margin: '0 auto',
      padding: isMobile ? '16px' : '32px'
    },
    grid: {
      display: isDesktop ? 'grid' : 'flex',
      gridTemplateColumns: isDesktop ? '1fr 1fr' : undefined,
      flexDirection: isDesktop ? undefined : 'column',
      gap: isMobile ? '16px' : '24px'
    },
    fullWidth: {
      gridColumn: isDesktop ? 'span 2' : undefined
    }
  };

  return (
    <div style={{...styles.stepContainer, ...uploadResponsiveStyles.container}}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>

      <h1 style={{...styles.stepTitle, fontSize: isMobile ? '24px' : '32px'}}>
        📸 Upload Your Assets
      </h1>
      <p style={{...styles.stepSubtitle, maxWidth: '600px', margin: '0 auto 32px'}}>
        Your logo and photos will be used throughout your website. We'll automatically extract colors and detect your visual style.
      </p>

      {/* Smart Detection Banner - shown when style is detected */}
      {detectedStyle && (
        <div style={uploadStyles.detectionBanner}>
          <div style={uploadStyles.detectionIcon}>✨</div>
          <div style={uploadStyles.detectionContent}>
            <strong>Based on your uploads, we detected:</strong>
            <span style={uploadStyles.detectedStyle}>
              {visualStyles.find(s => s.id === detectedStyle)?.label || 'Modern & Clean'} Style
            </span>
          </div>
          <button
            style={uploadStyles.changeStyleBtn}
            onClick={() => setDetectedStyle(null)}
          >
            Change
          </button>
        </div>
      )}

      <div style={uploadResponsiveStyles.grid}>
        {/* LEFT COLUMN: Logo & Colors */}
        <div style={uploadStyles.column}>
          {/* Logo Upload */}
          <div style={uploadStyles.uploadCard}>
            <div style={uploadStyles.cardHeader}>
              <div style={uploadStyles.cardTitleRow}>
                <span style={uploadStyles.cardIcon}>🎨</span>
                <div>
                  <h3 style={uploadStyles.cardTitle}>Your Logo</h3>
                  <span style={uploadStyles.cardBadge}>Recommended</span>
                </div>
              </div>
              <div
                style={uploadStyles.tooltip}
                title="Your logo appears in the header, footer, and favicon. We'll also extract your brand colors from it."
              >
                ⓘ
              </div>
            </div>

            <p style={uploadStyles.cardDesc}>
              We'll extract brand colors and use it across your site header, footer, and favicon.
            </p>

            {assets.logo ? (
              <div style={uploadStyles.uploadedPreview}>
                <div style={uploadStyles.logoPreviewContainer}>
                  <img src={assets.logo.base64} alt="Logo" style={uploadStyles.logoPreview} />
                </div>
                <div style={uploadStyles.uploadedDetails}>
                  <span style={uploadStyles.fileName}>{assets.logo.file}</span>
                  {extractingColors && (
                    <div style={uploadStyles.extractingRow}>
                      <div style={uploadStyles.spinner} />
                      <span>Extracting colors...</span>
                    </div>
                  )}
                  {projectData.colorMode === 'from-logo' && !extractingColors && (
                    <div style={uploadStyles.extractedColors}>
                      <span style={uploadStyles.extractedLabel}>Extracted Colors:</span>
                      <div style={uploadStyles.colorSwatches}>
                        <div style={{...uploadStyles.colorSwatch, background: projectData.colors.primary}}>
                          <span style={uploadStyles.colorLabel}>Primary</span>
                        </div>
                        <div style={{...uploadStyles.colorSwatch, background: projectData.colors.secondary}}>
                          <span style={uploadStyles.colorLabel}>Secondary</span>
                        </div>
                        <div style={{...uploadStyles.colorSwatch, background: projectData.colors.accent}}>
                          <span style={uploadStyles.colorLabel}>Accent</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <button style={uploadStyles.removeButton} onClick={removeLogo}>
                    <span>✕</span> Remove & Re-upload
                  </button>
                </div>
              </div>
            ) : (
              <label
                style={{
                  ...uploadStyles.dropzone,
                  ...(dragOver.logo ? uploadStyles.dropzoneActive : {})
                }}
                onDragOver={(e) => handleDragOver(e, 'logo')}
                onDragLeave={(e) => handleDragLeave(e, 'logo')}
                onDrop={(e) => handleDrop(e, 'logo', handleLogoUpload)}
              >
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />

                {/* Example placeholder */}
                <div style={uploadStyles.exampleContainer}>
                  <div style={uploadStyles.exampleLogo}>
                    <span style={uploadStyles.exampleIcon}>🏢</span>
                  </div>
                  <span style={uploadStyles.exampleText}>Your logo here</span>
                </div>

                <div style={uploadStyles.dropzoneContent}>
                  <span style={uploadStyles.dropzoneMainIcon}>
                    {dragOver.logo ? '📥' : '📤'}
                  </span>
                  <span style={uploadStyles.dropzoneMainText}>
                    {dragOver.logo ? 'Drop your logo!' : 'Drag logo here or click to browse'}
                  </span>
                  <span style={uploadStyles.dropzoneHint}>
                    PNG, JPG, or SVG • Transparent background works best
                  </span>
                </div>

                {uploadProgress.logo !== undefined && uploadProgress.logo !== null && (
                  <div style={uploadStyles.progressBar}>
                    <div style={{...uploadStyles.progressFill, width: `${uploadProgress.logo}%`}} />
                  </div>
                )}
              </label>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Photos */}
        <div style={uploadStyles.column}>
          {/* Product Photos Upload */}
          <div style={uploadStyles.uploadCard}>
            <div style={uploadStyles.cardHeader}>
              <div style={uploadStyles.cardTitleRow}>
                <span style={uploadStyles.cardIcon}>🖼️</span>
                <div>
                  <h3 style={uploadStyles.cardTitle}>Product & Gallery Photos</h3>
                  <span style={uploadStyles.cardBadgeOptional}>Up to 10</span>
                </div>
              </div>
              <div
                style={uploadStyles.tooltip}
                title="These photos appear in your gallery, product sections, and as background images throughout the site."
              >
                ⓘ
              </div>
            </div>

            <p style={uploadStyles.cardDesc}>
              High-quality photos of your products, services, team, or location. These create the visual foundation of your site.
            </p>

            <div style={uploadStyles.photoGridContainer}>
              {/* Uploaded photos */}
              {(assets.photos || []).map((photo, index) => (
                <div key={index} style={uploadStyles.photoItem}>
                  <img src={photo.base64} alt={`Photo ${index + 1}`} style={uploadStyles.photoThumb} />
                  <div style={uploadStyles.photoOverlay}>
                    <button style={uploadStyles.photoRemove} onClick={() => removePhoto(index)}>✕</button>
                  </div>
                  <span style={uploadStyles.photoNumber}>{index + 1}</span>
                </div>
              ))}

              {/* Add more button */}
              {(!assets.photos || assets.photos.length < 10) && (
                <label
                  style={{
                    ...uploadStyles.photoAddZone,
                    ...(dragOver.photos ? uploadStyles.photoAddZoneActive : {})
                  }}
                  onDragOver={(e) => handleDragOver(e, 'photos')}
                  onDragLeave={(e) => handleDragLeave(e, 'photos')}
                  onDrop={(e) => handleDrop(e, 'photos', handlePhotosUpload)}
                >
                  <input type="file" accept="image/*" multiple onChange={handlePhotosUpload} style={{ display: 'none' }} />
                  <span style={uploadStyles.photoAddIcon}>+</span>
                  <span style={uploadStyles.photoAddText}>
                    {assets.photos?.length ? 'Add More' : 'Add Photos'}
                  </span>
                </label>
              )}
            </div>

            {assets.photos && assets.photos.length > 0 && (
              <div style={uploadStyles.photoCount}>
                <span>{assets.photos.length}/10 photos</span>
                <button style={uploadStyles.clearAllBtn} onClick={() => updateProject({ uploadedAssets: { ...assets, photos: [] }})}>
                  Clear all
                </button>
              </div>
            )}

            {/* AI Placeholder Generator */}
            {(!assets.photos || assets.photos.length === 0) && (
              <div style={uploadStyles.aiGeneratorSection}>
                <button
                  style={uploadStyles.aiGeneratorBtn}
                  onClick={() => setShowAIGenerator(!showAIGenerator)}
                >
                  <span>🤖</span>
                  <span>Don't have photos? Use AI placeholders</span>
                </button>

                {showAIGenerator && (
                  <div style={uploadStyles.aiGeneratorPanel}>
                    <p style={uploadStyles.aiGeneratorDesc}>
                      We'll generate professional placeholder images based on your business type.
                      You can replace them with real photos anytime.
                    </p>
                    <button
                      style={uploadStyles.generateBtn}
                      onClick={() => {
                        updateProject({ useAIPlaceholders: true });
                        setShowAIGenerator(false);
                      }}
                    >
                      ✨ Generate {projectData.industry?.name || 'Business'} Placeholders
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FULL WIDTH: Menu/Pricing */}
        <div style={{...uploadStyles.uploadCard, ...uploadResponsiveStyles.fullWidth}}>
          <div style={uploadStyles.cardHeader}>
            <div style={uploadStyles.cardTitleRow}>
              <span style={uploadStyles.cardIcon}>📋</span>
              <div>
                <h3 style={uploadStyles.cardTitle}>Menu or Price List</h3>
                <span style={uploadStyles.cardBadgeOptional}>Optional</span>
              </div>
            </div>
            <div
              style={uploadStyles.tooltip}
              title="If you have a menu, price list, or service catalog, upload it and our AI will extract the content for your website."
            >
              ⓘ
            </div>
          </div>

          {assets.menu ? (
            <div style={uploadStyles.menuUploaded}>
              <div style={uploadStyles.menuPreviewLarge}>
                {assets.menu.type.includes('image') ? (
                  <img src={assets.menu.base64} alt="Menu" style={uploadStyles.menuImage} />
                ) : (
                  <div style={uploadStyles.pdfPreview}>
                    <span style={uploadStyles.pdfIcon}>📄</span>
                    <span>PDF Document</span>
                  </div>
                )}
              </div>
              <div style={uploadStyles.menuDetails}>
                <span style={uploadStyles.fileName}>{assets.menu.file}</span>
                <span style={uploadStyles.menuType}>
                  {assets.menu.type.includes('pdf') ? 'PDF' : 'Image'}
                </span>
                <p style={uploadStyles.menuHint}>
                  ✨ AI will extract items and prices from this file
                </p>
                <button style={uploadStyles.removeButton} onClick={removeMenu}>
                  <span>✕</span> Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={uploadStyles.menuDropzoneRow}>
              <label
                style={{
                  ...uploadStyles.menuDropzone,
                  ...(dragOver.menu ? uploadStyles.dropzoneActive : {})
                }}
                onDragOver={(e) => handleDragOver(e, 'menu')}
                onDragLeave={(e) => handleDragLeave(e, 'menu')}
                onDrop={(e) => handleDrop(e, 'menu', handleMenuUpload)}
              >
                <input type="file" accept="image/*,.pdf" onChange={handleMenuUpload} style={{ display: 'none' }} />
                <span style={uploadStyles.menuDropzoneIcon}>📋</span>
                <span style={uploadStyles.menuDropzoneText}>Drop menu or price list</span>
                <span style={uploadStyles.dropzoneHint}>PDF or Image</span>
              </label>

              <div style={uploadStyles.menuExamples}>
                <span style={uploadStyles.menuExamplesTitle}>Works great for:</span>
                <ul style={uploadStyles.menuExamplesList}>
                  <li>🍽️ Restaurant menus</li>
                  <li>💇 Service price lists</li>
                  <li>🏋️ Class schedules</li>
                  <li>📦 Product catalogs</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* FULL WIDTH: Visual Style Description */}
        <div style={{...uploadStyles.uploadCard, ...uploadResponsiveStyles.fullWidth}}>
          <div style={uploadStyles.cardHeader}>
            <div style={uploadStyles.cardTitleRow}>
              <span style={uploadStyles.cardIcon}>✨</span>
              <div>
                <h3 style={uploadStyles.cardTitle}>Describe Your Visual Style</h3>
                <span style={uploadStyles.cardBadgeOptional}>Optional</span>
              </div>
            </div>
          </div>

          <p style={uploadStyles.cardDesc}>
            Tell our AI what kind of look and feel you want. Be as specific as you like!
          </p>

          {/* Quick style chips */}
          <div style={uploadStyles.styleChips}>
            {['Modern & minimal', 'Warm & cozy', 'Bold & vibrant', 'Elegant & premium', 'Fun & playful', 'Dark & moody'].map(style => (
              <button
                key={style}
                style={{
                  ...uploadStyles.styleChip,
                  ...(projectData.imageDescription?.includes(style) ? uploadStyles.styleChipActive : {})
                }}
                onClick={() => {
                  const current = projectData.imageDescription || '';
                  if (current.includes(style)) {
                    updateProject({ imageDescription: current.replace(style, '').trim() });
                  } else {
                    updateProject({ imageDescription: current ? `${current}, ${style}` : style });
                  }
                }}
              >
                {style}
              </button>
            ))}
          </div>

          <textarea
            value={projectData.imageDescription || ''}
            onChange={(e) => updateProject({ imageDescription: e.target.value })}
            placeholder="Example: 'I want a warm, rustic feel with wood textures and earth tones. Think artisan coffee shop meets modern design studio. Lots of natural light and friendly vibes.'"
            style={uploadStyles.styleTextarea}
            rows={3}
          />
        </div>
      </div>

      {/* Asset Summary */}
      {hasAnyAssets && (
        <div style={uploadStyles.assetSummary}>
          <span style={uploadStyles.summaryIcon}>✅</span>
          <span style={uploadStyles.summaryText}>
            {assets.logo && '1 logo'}
            {assets.logo && assets.photos?.length ? ', ' : ''}
            {assets.photos?.length ? `${assets.photos.length} photo${assets.photos.length > 1 ? 's' : ''}` : ''}
            {(assets.logo || assets.photos?.length) && assets.menu ? ', ' : ''}
            {assets.menu && '1 menu/price list'}
            {' ready to use'}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={uploadStyles.actions}>
        <button
          style={uploadStyles.skipButton}
          onClick={onSkip}
        >
          Skip for now
        </button>
        <button
          style={{...uploadStyles.continueButton, opacity: uploading ? 0.5 : 1}}
          onClick={onContinue}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div style={uploadStyles.buttonSpinner} />
              Uploading...
            </>
          ) : hasAnyAssets ? (
            'Continue with Assets →'
          ) : (
            'Continue →'
          )}
        </button>
      </div>
    </div>
  );
}

// Styles for improved Upload Assets Step
const uploadStyles = {
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  uploadCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardIcon: {
    fontSize: '28px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: 0
  },
  cardBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: '500',
    marginTop: '4px'
  },
  cardBadgeOptional: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#888',
    marginTop: '4px'
  },
  cardDesc: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  tooltip: {
    fontSize: '16px',
    color: '#666',
    cursor: 'help'
  },
  // Dropzone styles
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '32px 24px',
    background: 'rgba(0,0,0,0.2)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  dropzoneActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
    transform: 'scale(1.01)'
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  dropzoneMainIcon: {
    fontSize: '36px'
  },
  dropzoneMainText: {
    fontSize: '15px',
    color: '#e4e4e4',
    fontWeight: '500'
  },
  dropzoneHint: {
    fontSize: '12px',
    color: '#666'
  },
  // Example placeholder in dropzone
  exampleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    opacity: 0.5
  },
  exampleLogo: {
    width: '60px',
    height: '60px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed rgba(255,255,255,0.2)'
  },
  exampleIcon: {
    fontSize: '24px',
    opacity: 0.5
  },
  exampleText: {
    fontSize: '12px',
    color: '#666'
  },
  // Progress bar
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'rgba(255,255,255,0.1)'
  },
  progressFill: {
    height: '100%',
    background: '#22c55e',
    transition: 'width 0.2s ease'
  },
  // Uploaded preview
  uploadedPreview: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '12px'
  },
  logoPreviewContainer: {
    width: '100px',
    height: '100px',
    background: '#fff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    flexShrink: 0
  },
  logoPreview: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  },
  uploadedDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  fileName: {
    fontSize: '14px',
    color: '#e4e4e4',
    fontWeight: '500'
  },
  extractingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#3b82f6'
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  extractedColors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  extractedLabel: {
    fontSize: '12px',
    color: '#22c55e'
  },
  colorSwatches: {
    display: 'flex',
    gap: '8px'
  },
  colorSwatch: {
    width: '50px',
    height: '40px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '4px',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  colorLabel: {
    fontSize: '9px',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    fontWeight: '600'
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#ef4444',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '8px',
    width: 'fit-content'
  },
  // Photo grid
  photoGridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px'
  },
  photoItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#1a1a2e'
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  photoOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    ':hover': {
      background: 'rgba(0,0,0,0.5)'
    }
  },
  photoRemove: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '24px',
    height: '24px',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    transition: 'opacity 0.2s'
  },
  photoNumber: {
    position: 'absolute',
    bottom: '6px',
    left: '6px',
    width: '20px',
    height: '20px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoAddZone: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#888',
    transition: 'all 0.2s ease'
  },
  photoAddZoneActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e'
  },
  photoAddIcon: {
    fontSize: '28px'
  },
  photoAddText: {
    fontSize: '11px'
  },
  photoCount: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '13px',
    color: '#888'
  },
  clearAllBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  // AI Generator
  aiGeneratorSection: {
    marginTop: '16px'
  },
  aiGeneratorBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '8px',
    color: '#a78bfa',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  aiGeneratorPanel: {
    marginTop: '12px',
    padding: '16px',
    background: 'rgba(139, 92, 246, 0.05)',
    borderRadius: '8px'
  },
  aiGeneratorDesc: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  generateBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  // Menu section
  menuDropzoneRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'stretch'
  },
  menuDropzone: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '24px',
    background: 'rgba(0,0,0,0.2)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  menuDropzoneIcon: {
    fontSize: '32px'
  },
  menuDropzoneText: {
    fontSize: '14px',
    color: '#e4e4e4'
  },
  menuExamples: {
    flex: 1,
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px'
  },
  menuExamplesTitle: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '8px',
    display: 'block'
  },
  menuExamplesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#666'
  },
  menuUploaded: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '12px'
  },
  menuPreviewLarge: {
    width: '120px',
    height: '120px',
    background: '#fff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },
  menuImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  },
  pdfPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#666'
  },
  pdfIcon: {
    fontSize: '36px'
  },
  menuDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  menuType: {
    fontSize: '12px',
    color: '#888',
    background: 'rgba(255,255,255,0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
    width: 'fit-content'
  },
  menuHint: {
    fontSize: '13px',
    color: '#22c55e',
    margin: '8px 0'
  },
  // Style chips
  styleChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px'
  },
  styleChip: {
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  styleChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  styleTextarea: {
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
    lineHeight: '1.5'
  },
  // Detection banner
  detectionBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(34, 197, 94, 0.15))',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  detectionIcon: {
    fontSize: '24px'
  },
  detectionContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: '#e4e4e4'
  },
  detectedStyle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#a78bfa'
  },
  changeStyleBtn: {
    padding: '6px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer'
  },
  // Asset summary
  assetSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '10px',
    marginTop: '24px'
  },
  summaryIcon: {
    fontSize: '20px'
  },
  summaryText: {
    fontSize: '14px',
    color: '#22c55e'
  },
  // Actions
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '32px',
    gap: '16px'
  },
  skipButton: {
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

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
// LAYOUT STYLE SELECTOR - Visual Layout Previews
// ============================================

// Layout Style Selector Component with Visual Previews
function LayoutStyleSelector({ industryKey, selectedLayout, onSelectLayout, colors }) {
  const layouts = getLayoutsForIndustry(industryKey);

  return (
    <div style={layoutSelectorStyles.container}>
      <div style={layoutSelectorStyles.grid}>
        {layouts.map(layout => (
          <button
            key={layout.id}
            style={{
              ...layoutSelectorStyles.card,
              ...(selectedLayout === layout.id ? layoutSelectorStyles.cardActive : {})
            }}
            onClick={() => onSelectLayout(layout.id, layout.preview)}
          >
            {/* Mini Preview Thumbnail */}
            <div style={layoutSelectorStyles.thumbnailContainer}>
              <LayoutThumbnail
                layout={layout}
                colors={colors}
                isSelected={selectedLayout === layout.id}
              />
            </div>

            {/* Layout Info */}
            <div style={layoutSelectorStyles.info}>
              <div style={layoutSelectorStyles.name}>{layout.name}</div>
              <div style={layoutSelectorStyles.description}>{layout.description}</div>
            </div>

            {/* Selected Indicator */}
            {selectedLayout === layout.id && (
              <div style={layoutSelectorStyles.checkmark}>✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Mini Layout Thumbnail Component
function LayoutThumbnail({ layout, colors, isSelected }) {
  const preview = layout.preview;

  // Different thumbnail styles based on hero style
  const renderHero = () => {
    switch (preview.heroStyle) {
      case 'full':
      case 'dynamic':
      case 'elegant':
        return (
          <div style={{
            ...layoutThumbnailStyles.heroFull,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}>
            <div style={layoutThumbnailStyles.heroText} />
            <div style={layoutThumbnailStyles.heroCta} />
          </div>
        );
      case 'split':
      case 'clean':
        return (
          <div style={layoutThumbnailStyles.heroSplit}>
            <div style={layoutThumbnailStyles.heroSplitLeft}>
              <div style={layoutThumbnailStyles.heroText} />
              <div style={{...layoutThumbnailStyles.heroCta, background: colors.primary}} />
            </div>
            <div style={{
              ...layoutThumbnailStyles.heroSplitRight,
              background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
            }} />
          </div>
        );
      case 'minimal':
      case 'corporate':
      case 'professional':
        return (
          <div style={layoutThumbnailStyles.heroMinimal}>
            <div style={{...layoutThumbnailStyles.navBar, background: colors.primary}} />
            <div style={layoutThumbnailStyles.heroTextLarge} />
            <div style={{...layoutThumbnailStyles.heroCta, background: colors.primary}} />
          </div>
        );
      case 'gallery':
      case 'portfolio':
        return (
          <div style={layoutThumbnailStyles.heroGallery}>
            <div style={{...layoutThumbnailStyles.galleryItem, background: `${colors.primary}30`}} />
            <div style={{...layoutThumbnailStyles.galleryItem, background: `${colors.secondary}30`}} />
            <div style={{...layoutThumbnailStyles.galleryItem, background: `${colors.accent}30`}} />
          </div>
        );
      default:
        return (
          <div style={{
            ...layoutThumbnailStyles.heroFull,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}>
            <div style={layoutThumbnailStyles.heroText} />
            <div style={layoutThumbnailStyles.heroCta} />
          </div>
        );
    }
  };

  // Render content section
  const renderContent = () => {
    switch (preview.contentStyle) {
      case 'services':
      case 'features':
      case 'benefits':
        return (
          <div style={layoutThumbnailStyles.contentGrid}>
            <div style={{...layoutThumbnailStyles.contentCard, borderTop: `2px solid ${colors.accent}`}} />
            <div style={{...layoutThumbnailStyles.contentCard, borderTop: `2px solid ${colors.accent}`}} />
            <div style={{...layoutThumbnailStyles.contentCard, borderTop: `2px solid ${colors.accent}`}} />
          </div>
        );
      case 'testimonials':
      case 'trust':
        return (
          <div style={layoutThumbnailStyles.contentTestimonials}>
            <div style={layoutThumbnailStyles.testimonialCard}>
              <div style={layoutThumbnailStyles.testimonialQuote} />
            </div>
          </div>
        );
      default:
        return (
          <div style={layoutThumbnailStyles.contentDefault}>
            <div style={layoutThumbnailStyles.contentLine} />
            <div style={{...layoutThumbnailStyles.contentLine, width: '70%'}} />
          </div>
        );
    }
  };

  return (
    <div style={{
      ...layoutThumbnailStyles.container,
      ...(isSelected ? layoutThumbnailStyles.containerSelected : {})
    }}>
      {renderHero()}
      {renderContent()}
    </div>
  );
}

// Styles for Layout Selector - Prominent visual thumbnails
const layoutSelectorStyles = {
  container: {
    width: '100%'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  card: {
    position: 'relative',
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left'
  },
  cardActive: {
    borderColor: '#22c55e',
    background: 'rgba(34, 197, 94, 0.12)',
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
  },
  thumbnailContainer: {
    marginBottom: '14px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  info: {
    padding: '0 4px'
  },
  name: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '6px'
  },
  description: {
    fontSize: '12px',
    color: '#999',
    lineHeight: '1.4'
  },
  checkmark: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#22c55e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
  }
};

// Styles for Layout Thumbnails (mini previews) - Made larger for prominence
const layoutThumbnailStyles = {
  container: {
    width: '100%',
    height: '100px',
    background: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  containerSelected: {
    boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)'
  },
  // Hero styles - scaled up
  heroFull: {
    height: '55px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  heroSplit: {
    height: '55px',
    display: 'flex'
  },
  heroSplitLeft: {
    flex: 1,
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px'
  },
  heroSplitRight: {
    width: '40%'
  },
  heroMinimal: {
    height: '55px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  heroGallery: {
    height: '55px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3px',
    padding: '5px'
  },
  navBar: {
    height: '10px',
    borderRadius: '3px'
  },
  heroText: {
    width: '60%',
    height: '7px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '2px'
  },
  heroTextLarge: {
    width: '70%',
    height: '8px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px'
  },
  heroCta: {
    width: '35%',
    height: '7px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '2px'
  },
  galleryItem: {
    borderRadius: '3px'
  },
  // Content styles - scaled up
  contentGrid: {
    height: '45px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '5px',
    padding: '8px'
  },
  contentCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px'
  },
  contentTestimonials: {
    height: '45px',
    padding: '8px',
    display: 'flex',
    justifyContent: 'center'
  },
  testimonialCard: {
    width: '70%',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  testimonialQuote: {
    width: '80%',
    height: '4px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px'
  },
  contentDefault: {
    height: '35px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  contentLine: {
    width: '90%',
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px'
  }
};

// Live Preview Renderer - Shows different layouts in the main preview
function LivePreviewRenderer({ projectData, layoutPreview }) {
  const colors = projectData.colors;
  const heroStyle = layoutPreview?.heroStyle || 'standard';
  const contentStyle = layoutPreview?.contentStyle || 'balanced';

  // Render hero section based on style
  const renderHero = () => {
    switch (heroStyle) {
      case 'full':
      case 'dynamic':
      case 'elegant':
        // Full-width hero with centered content
        return (
          <div style={{
            ...livePreviewStyles.heroFull,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}>
            <h2 style={livePreviewStyles.heroTitle}>{projectData.businessName || 'Your Business'}</h2>
            <p style={livePreviewStyles.heroSub}>{projectData.tagline || 'Your tagline goes here'}</p>
            <button style={{...livePreviewStyles.heroCta, background: '#fff', color: colors.primary}}>
              {projectData.primaryCTA === 'book' ? 'Book Now' :
               projectData.primaryCTA === 'call' ? 'Call Us' :
               projectData.primaryCTA === 'buy' ? 'Shop Now' : 'Get Started'}
            </button>
          </div>
        );

      case 'split':
      case 'clean':
        // Split hero with image on right
        return (
          <div style={livePreviewStyles.heroSplit}>
            <div style={livePreviewStyles.heroSplitLeft}>
              <h2 style={{...livePreviewStyles.heroTitle, textAlign: 'left', fontSize: '16px'}}>{projectData.businessName || 'Your Business'}</h2>
              <p style={{...livePreviewStyles.heroSub, textAlign: 'left', fontSize: '10px'}}>{projectData.tagline || 'Your tagline'}</p>
              <button style={{...livePreviewStyles.heroCtaSmall, background: colors.primary}}>
                {projectData.primaryCTA === 'book' ? 'Book' : 'Learn More'}
              </button>
            </div>
            <div style={{
              ...livePreviewStyles.heroSplitRight,
              background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}60)`
            }}>
              <div style={livePreviewStyles.heroImagePlaceholder}>📷</div>
            </div>
          </div>
        );

      case 'minimal':
      case 'corporate':
      case 'professional':
        // Minimal hero with nav emphasis
        return (
          <div style={livePreviewStyles.heroMinimal}>
            <div style={{...livePreviewStyles.navBar, background: colors.primary}}>
              <span style={livePreviewStyles.navLogo}>{projectData.businessName || 'Brand'}</span>
              <div style={livePreviewStyles.navLinks}>
                {projectData.selectedPages.slice(0, 3).map(p => (
                  <span key={p} style={livePreviewStyles.navLink}>{p}</span>
                ))}
              </div>
            </div>
            <div style={livePreviewStyles.heroMinimalContent}>
              <h2 style={{...livePreviewStyles.heroTitle, fontSize: '14px'}}>{projectData.businessName || 'Your Business'}</h2>
              <p style={{...livePreviewStyles.heroSub, fontSize: '9px'}}>{projectData.tagline || 'Your tagline'}</p>
              <button style={{...livePreviewStyles.heroCtaSmall, background: colors.primary}}>Contact Us</button>
            </div>
          </div>
        );

      case 'gallery':
      case 'portfolio':
        // Gallery-style hero
        return (
          <div style={livePreviewStyles.heroGallery}>
            <div style={{...livePreviewStyles.navBarSimple, borderBottom: `2px solid ${colors.primary}`}}>
              <span style={{...livePreviewStyles.navLogo, color: colors.primary}}>{projectData.businessName || 'Brand'}</span>
            </div>
            <div style={livePreviewStyles.galleryGrid}>
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.primary}30`}} />
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.secondary}30`}} />
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.accent}30`}} />
              <div style={{...livePreviewStyles.galleryItem, background: `${colors.primary}20`}} />
            </div>
          </div>
        );

      default:
        // Standard hero (default)
        return (
          <>
            <div style={{...livePreviewStyles.navBarDefault, background: colors.primary}}>
              <span style={livePreviewStyles.navLogoSmall}>{projectData.businessName || 'Brand'}</span>
              <div style={livePreviewStyles.navLinksSmall}>
                {projectData.selectedPages.slice(0, 4).map(p => (
                  <span key={p} style={livePreviewStyles.navLinkSmall}>{p}</span>
                ))}
              </div>
            </div>
            <div style={{
              ...livePreviewStyles.heroDefault,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
            }}>
              <h2 style={livePreviewStyles.heroTitle}>{projectData.businessName || 'Your Business'}</h2>
              <p style={livePreviewStyles.heroSub}>{projectData.tagline || 'Your tagline goes here'}</p>
              <button style={{...livePreviewStyles.heroCta, background: '#fff', color: colors.primary}}>
                Get Started
              </button>
            </div>
          </>
        );
    }
  };

  // Render content section based on style
  const renderContent = () => {
    switch (contentStyle) {
      case 'services':
      case 'features':
      case 'benefits':
        return (
          <div style={livePreviewStyles.contentGrid}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{...livePreviewStyles.serviceCard, borderTop: `3px solid ${colors.accent}`}}>
                <div style={{...livePreviewStyles.cardIcon, background: `${colors.primary}20`, color: colors.primary}}>✦</div>
                <div style={livePreviewStyles.cardLines}>
                  <div style={livePreviewStyles.cardLine} />
                  <div style={{...livePreviewStyles.cardLine, width: '60%'}} />
                </div>
              </div>
            ))}
          </div>
        );

      case 'testimonials':
      case 'trust':
        return (
          <div style={livePreviewStyles.contentTestimonials}>
            <div style={livePreviewStyles.testimonialCard}>
              <div style={livePreviewStyles.testimonialQuote}>"</div>
              <div style={livePreviewStyles.testimonialLines}>
                <div style={livePreviewStyles.testimonialLine} />
                <div style={{...livePreviewStyles.testimonialLine, width: '80%'}} />
              </div>
              <div style={livePreviewStyles.testimonialAuthor}>
                <div style={{...livePreviewStyles.testimonialAvatar, background: colors.primary}} />
                <div style={livePreviewStyles.testimonialName} />
              </div>
            </div>
          </div>
        );

      case 'schedule':
      case 'menu':
        return (
          <div style={livePreviewStyles.contentList}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={livePreviewStyles.listItem}>
                <div style={{...livePreviewStyles.listDot, background: colors.accent}} />
                <div style={livePreviewStyles.listText} />
                <div style={{...livePreviewStyles.listPrice, color: colors.primary}}>$$</div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div style={livePreviewStyles.contentDefault}>
            <div style={livePreviewStyles.contentCards}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{...livePreviewStyles.defaultCard, borderTop: `3px solid ${colors.accent}`}}>
                  <div style={{...livePreviewStyles.cardIcon, background: `${colors.primary}20`, color: colors.primary}}>✦</div>
                  <div style={livePreviewStyles.cardLines}>
                    <div style={livePreviewStyles.cardLine} />
                    <div style={{...livePreviewStyles.cardLine, width: '60%'}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div style={livePreviewStyles.container}>
      {renderHero()}
      {renderContent()}
    </div>
  );
}

// Styles for Live Preview
const livePreviewStyles = {
  container: {
    width: '100%',
    height: '100%',
    background: '#fff',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  layoutBadge: {
    padding: '3px 8px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#22c55e',
    marginLeft: '8px'
  },
  // Hero Full
  heroFull: {
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px'
  },
  heroTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 4px 0',
    textAlign: 'center'
  },
  heroSub: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.8)',
    margin: '0 0 8px 0',
    textAlign: 'center'
  },
  heroCta: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '8px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  heroCtaSmall: {
    padding: '3px 8px',
    border: 'none',
    borderRadius: '3px',
    fontSize: '7px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer'
  },
  // Hero Split
  heroSplit: {
    height: '100px',
    display: 'flex'
  },
  heroSplitLeft: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: '#f8f9fa'
  },
  heroSplitRight: {
    width: '45%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroImagePlaceholder: {
    fontSize: '24px',
    opacity: 0.5
  },
  // Hero Minimal
  heroMinimal: {
    height: '100px'
  },
  navBar: {
    height: '24px',
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navBarSimple: {
    height: '24px',
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    background: '#fff'
  },
  navBarDefault: {
    height: '20px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navLogo: {
    fontSize: '8px',
    fontWeight: '700',
    color: '#fff'
  },
  navLogoSmall: {
    fontSize: '7px',
    fontWeight: '700',
    color: '#fff'
  },
  navLinks: {
    display: 'flex',
    gap: '8px'
  },
  navLinksSmall: {
    display: 'flex',
    gap: '6px'
  },
  navLink: {
    fontSize: '6px',
    color: 'rgba(255,255,255,0.8)'
  },
  navLinkSmall: {
    fontSize: '5px',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize'
  },
  heroMinimalContent: {
    height: '76px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fa'
  },
  // Hero Gallery
  heroGallery: {
    height: '100px'
  },
  galleryGrid: {
    height: '76px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2px',
    padding: '4px'
  },
  galleryItem: {
    borderRadius: '2px'
  },
  // Hero Default
  heroDefault: {
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px'
  },
  // Content sections
  contentGrid: {
    padding: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px'
  },
  serviceCard: {
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '4px'
  },
  cardIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    marginBottom: '4px'
  },
  cardLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  cardLine: {
    width: '100%',
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  // Testimonials
  contentTestimonials: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'center'
  },
  testimonialCard: {
    width: '80%',
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '4px',
    textAlign: 'center'
  },
  testimonialQuote: {
    fontSize: '14px',
    color: '#ccc',
    marginBottom: '4px'
  },
  testimonialLines: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    marginBottom: '6px'
  },
  testimonialLine: {
    width: '90%',
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  testimonialAuthor: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  testimonialAvatar: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  testimonialName: {
    width: '30px',
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  // List content
  contentList: {
    padding: '8px'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  listDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%'
  },
  listText: {
    flex: 1,
    height: '3px',
    background: '#e5e7eb',
    borderRadius: '1px'
  },
  listPrice: {
    fontSize: '6px',
    fontWeight: '600'
  },
  // Default content
  contentDefault: {
    padding: '8px'
  },
  contentCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px'
  },
  defaultCard: {
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '4px'
  }
};

// CUSTOMIZE STEP: The WordPress-Style Editor
// ============================================
function CustomizeStep({ projectData, updateProject, industries, layouts, effects, onGenerate, onBack }) {
  // Responsive layout detection
  const { width } = useWindowSize();
  const layoutMode = getLayoutMode(width);
  const isLargeScreen = layoutMode === 'desktop' || layoutMode === 'largeDesktop';
  const isMobile = layoutMode === 'mobile';
  const isTablet = layoutMode === 'tablet';

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

  // ==========================================
  // INDUSTRY-SPECIFIC PLACEHOLDERS
  // ==========================================
  const industryPlaceholders = {
    tattoo: {
      businessName: 'e.g., Midnight Ink Studio',
      tagline: "e.g., Your story, our art. Custom tattoos since 2015",
      location: 'e.g., Austin, TX'
    },
    barbershop: {
      businessName: 'e.g., Classic Cuts Barbershop',
      tagline: 'e.g., Where gentlemen get groomed',
      location: 'e.g., Brooklyn, NY'
    },
    restaurant: {
      businessName: "e.g., Mario's Pizzeria",
      tagline: 'e.g., Authentic Brooklyn-style pizza since 1985',
      location: 'e.g., New York, NY'
    },
    pizza: {
      businessName: "e.g., Tony's Famous Pizza",
      tagline: 'e.g., Real New York pizza, made with love',
      location: 'e.g., Chicago, IL'
    },
    dental: {
      businessName: 'e.g., Bright Smile Family Dentistry',
      tagline: 'e.g., Gentle care for the whole family',
      location: 'e.g., Los Angeles, CA'
    },
    law: {
      businessName: 'e.g., Smith & Associates',
      tagline: 'e.g., Fighting for your rights since 1995',
      location: 'e.g., Miami, FL'
    },
    fitness: {
      businessName: 'e.g., Iron Forge Fitness',
      tagline: 'e.g., Transform your body, transform your life',
      location: 'e.g., Denver, CO'
    },
    spa: {
      businessName: 'e.g., Serenity Day Spa',
      tagline: 'e.g., Your escape from the everyday',
      location: 'e.g., Scottsdale, AZ'
    },
    auto: {
      businessName: "e.g., Mike's Auto Repair",
      tagline: 'e.g., Honest work at honest prices since 1990',
      location: 'e.g., Houston, TX'
    },
    default: {
      businessName: 'e.g., Your Business Name',
      tagline: 'e.g., A short phrase that captures what makes you special',
      location: 'e.g., San Francisco, CA'
    }
  };

  // ==========================================
  // SMART DEFAULTS BY INDUSTRY
  // ==========================================
  const industryDefaults = {
    tattoo: {
      targetAudience: ['individuals', 'professionals'],
      primaryCTA: 'book',
      teamSize: 'small',
      priceRange: 'premium',
      yearsEstablished: 'established',
      tone: 40 // More edgy/professional
    },
    barbershop: {
      targetAudience: ['individuals'],
      primaryCTA: 'book',
      teamSize: 'small',
      priceRange: 'mid',
      yearsEstablished: 'established',
      tone: 60 // Friendly but professional
    },
    restaurant: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'book',
      teamSize: 'medium',
      priceRange: 'mid',
      yearsEstablished: 'established',
      tone: 70 // Warm and welcoming
    },
    pizza: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'buy', // Order online
      teamSize: 'small',
      priceRange: 'budget',
      yearsEstablished: 'established',
      tone: 80 // Very friendly
    },
    dental: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'book',
      teamSize: 'medium',
      priceRange: 'mid',
      yearsEstablished: 'established',
      tone: 50 // Balanced
    },
    law: {
      targetAudience: ['individuals', 'small-business'],
      primaryCTA: 'contact',
      teamSize: 'small',
      priceRange: 'premium',
      yearsEstablished: 'veteran',
      tone: 25 // Very professional
    },
    fitness: {
      targetAudience: ['individuals', 'professionals'],
      primaryCTA: 'book',
      teamSize: 'medium',
      priceRange: 'mid',
      yearsEstablished: 'growing',
      tone: 75 // Motivating and friendly
    },
    spa: {
      targetAudience: ['individuals', 'professionals'],
      primaryCTA: 'book',
      teamSize: 'small',
      priceRange: 'premium',
      yearsEstablished: 'established',
      tone: 55 // Calm and welcoming
    },
    auto: {
      targetAudience: ['individuals', 'families'],
      primaryCTA: 'call',
      teamSize: 'small',
      priceRange: 'mid',
      yearsEstablished: 'veteran',
      tone: 60 // Trustworthy and friendly
    }
  };

  // Get placeholders based on current industry
  const getPlaceholder = (field) => {
    const industryKey = projectData.industryKey?.toLowerCase() || '';
    for (const [key, placeholders] of Object.entries(industryPlaceholders)) {
      if (industryKey.includes(key)) {
        return placeholders[field] || industryPlaceholders.default[field];
      }
    }
    return industryPlaceholders.default[field];
  };

  // Apply smart defaults when industry changes
  const applyIndustryDefaults = (industryKey) => {
    const key = industryKey?.toLowerCase() || '';
    let defaults = null;

    for (const [indKey, indDefaults] of Object.entries(industryDefaults)) {
      if (key.includes(indKey)) {
        defaults = indDefaults;
        break;
      }
    }

    if (defaults) {
      updateProject({
        targetAudience: defaults.targetAudience,
        primaryCTA: defaults.primaryCTA,
        teamSize: defaults.teamSize,
        priceRange: defaults.priceRange,
        yearsEstablished: defaults.yearsEstablished,
        tone: defaults.tone
      });
    }
  };

  // ==========================================
  // BUSINESS NAME INTELLIGENCE
  // ==========================================
  const inferFromBusinessName = (name) => {
    if (!name || name.length < 3) return null;

    const lowerName = name.toLowerCase();
    const inferences = { location: null, style: null, industry: null };

    // Location detection
    const cities = {
      'brooklyn': 'Brooklyn, NY',
      'manhattan': 'Manhattan, NY',
      'austin': 'Austin, TX',
      'dallas': 'Dallas, TX',
      'houston': 'Houston, TX',
      'miami': 'Miami, FL',
      'chicago': 'Chicago, IL',
      'seattle': 'Seattle, WA',
      'denver': 'Denver, CO',
      'phoenix': 'Phoenix, AZ',
      'la': 'Los Angeles, CA',
      'sf': 'San Francisco, CA',
      'boston': 'Boston, MA',
      'atlanta': 'Atlanta, GA',
      'philly': 'Philadelphia, PA'
    };

    for (const [cityKey, cityName] of Object.entries(cities)) {
      if (lowerName.includes(cityKey)) {
        inferences.location = cityName;
        break;
      }
    }

    // Style/vibe detection
    if (lowerName.includes("'s ") || lowerName.includes("mama") || lowerName.includes("papa") || lowerName.includes("uncle") || lowerName.includes("auntie")) {
      inferences.style = 'Family-owned vibe';
    } else if (lowerName.includes('elite') || lowerName.includes('premium') || lowerName.includes('luxury') || lowerName.includes('exclusive')) {
      inferences.style = 'Luxury/Premium';
    } else if (lowerName.includes('& associates') || lowerName.includes('& partners') || lowerName.includes('group') || lowerName.includes('llc')) {
      inferences.style = 'Professional/Corporate';
    } else if (lowerName.includes('ink') || lowerName.includes('tattoo') || lowerName.includes('custom')) {
      inferences.style = 'Creative/Artistic';
    }

    // Industry hints
    const industryHints = {
      'pizza': 'Pizza/Italian',
      'ink': 'Tattoo Studio',
      'tattoo': 'Tattoo Studio',
      'cuts': 'Barbershop',
      'barber': 'Barbershop',
      'dental': 'Dental Practice',
      'smile': 'Dental Practice',
      'law': 'Law Firm',
      'legal': 'Law Firm',
      'attorney': 'Law Firm',
      'fitness': 'Fitness/Gym',
      'gym': 'Fitness/Gym',
      'iron': 'Fitness/Gym',
      'spa': 'Spa/Wellness',
      'auto': 'Auto Repair',
      'motor': 'Auto Repair',
      'grill': 'Restaurant',
      'kitchen': 'Restaurant',
      'cafe': 'Restaurant/Cafe',
      'bistro': 'Restaurant'
    };

    for (const [hint, industry] of Object.entries(industryHints)) {
      if (lowerName.includes(hint)) {
        inferences.industry = industry;
        break;
      }
    }

    // Only return if we found something
    if (inferences.location || inferences.style || inferences.industry) {
      return inferences;
    }
    return null;
  };

  // Update inferences when business name changes
  const handleBusinessNameChange = (name) => {
    const inferred = inferFromBusinessName(name);
    updateProject({
      businessName: name,
      inferredDetails: inferred
    });
  };

  // High-impact question options
  const teamSizeOptions = [
    { id: 'solo', label: 'Just Me', icon: '👤' },
    { id: 'small', label: '2-4 People', icon: '👥' },
    { id: 'medium', label: '5-10 People', icon: '👨‍👩‍👧‍👦' },
    { id: 'large', label: '10+ People', icon: '🏢' }
  ];

  const priceRangeOptions = [
    { id: 'budget', label: '$', description: 'Budget-friendly', icon: '💵' },
    { id: 'mid', label: '$$', description: 'Mid-range', icon: '💰' },
    { id: 'premium', label: '$$$', description: 'Premium', icon: '💎' },
    { id: 'luxury', label: '$$$$', description: 'Luxury', icon: '👑' }
  ];

  const yearsOptions = [
    { id: 'new', label: 'Just Starting', icon: '🌱' },
    { id: 'growing', label: '1-5 Years', icon: '📈' },
    { id: 'established', label: '5-15 Years', icon: '🏆' },
    { id: 'veteran', label: '15+ Years', icon: '⭐' }
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

  // Responsive styles based on screen size
  const responsiveStyles = {
    container: {
      width: '100%',
      maxWidth: layoutMode === 'largeDesktop' ? '1920px' :
                layoutMode === 'desktop' ? '1600px' :
                layoutMode === 'tablet' ? '100%' : '100%',
      padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
      margin: '0 auto'
    },
    grid: {
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      // Larger preview column on desktop
      gridTemplateColumns: isMobile ? '1fr' :
                          isTablet ? '1fr' :
                          layoutMode === 'desktop' ? '1fr 480px' :
                          '1fr 550px',
      gap: isMobile ? '20px' : isTablet ? '28px' : '40px',
      marginBottom: '32px',
      alignItems: 'start'
    },
    formContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '16px' : '20px'
    },
    // On large screens, show some sections side by side
    sectionsGrid: {
      display: isLargeScreen ? 'grid' : 'flex',
      gridTemplateColumns: isLargeScreen ? 'repeat(2, 1fr)' : undefined,
      flexDirection: isLargeScreen ? undefined : 'column',
      gap: isMobile ? '16px' : '20px'
    },
    // Full-width sections (like pages, layout style)
    fullWidthSection: {
      gridColumn: isLargeScreen ? 'span 2' : undefined
    },
    preview: {
      position: isMobile ? 'relative' : 'sticky',
      top: isMobile ? 'auto' : '24px',
      height: isMobile ? '350px' : 'fit-content',
      maxHeight: isMobile ? '350px' :
                 isTablet ? '500px' :
                 layoutMode === 'desktop' ? '600px' : '700px',
      minHeight: isMobile ? '300px' : '400px'
    }
  };

  return (
    <div style={{...styles.customizeContainer, ...responsiveStyles.container}}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>

      <h1 style={{
        ...styles.customizeTitle,
        fontSize: isMobile ? '22px' : isTablet ? '26px' : '28px'
      }}>✨ Customize Your Site</h1>
      <p style={{
        ...p1Styles.subtitle,
        marginBottom: isMobile ? '16px' : '24px'
      }}>Configure every detail of your professional website</p>

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
                    // Apply smart defaults for this industry
                    applyIndustryDefaults(key);
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

      <div style={{...styles.customizeGrid, ...responsiveStyles.grid}}>
        {/* LEFT: Form Controls - Now with Collapsible Sections */}
        <div style={{...styles.customizeForm, maxWidth: isMobile ? '100%' : 'none'}}>

          {/* Responsive Grid for Smaller Sections */}
          <div style={responsiveStyles.sectionsGrid}>

          {/* SECTION 1: Business Identity - Always Visible */}
          <CollapsibleSection
            title="Business Identity"
            icon="🏢"
            defaultOpen={true}
            tooltip="Basic information about your business"
          >
            {/* Business Name with Intelligence */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Business Name *
                <span style={p1Styles.requiredStar}>Required</span>
              </label>
              <input
                type="text"
                value={projectData.businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder={getPlaceholder('businessName')}
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHint}>This will appear in your header and throughout your site</p>

              {/* Business Name Intelligence Display */}
              {projectData.inferredDetails && (
                <div style={customizeStyles.inferenceBox}>
                  <span style={customizeStyles.inferenceLabel}>We detected:</span>
                  <div style={customizeStyles.inferenceChips}>
                    {projectData.inferredDetails.location && (
                      <span style={customizeStyles.inferenceChip}>📍 {projectData.inferredDetails.location}</span>
                    )}
                    {projectData.inferredDetails.industry && (
                      <span style={customizeStyles.inferenceChip}>🏪 {projectData.inferredDetails.industry}</span>
                    )}
                    {projectData.inferredDetails.style && (
                      <span style={customizeStyles.inferenceChip}>✨ {projectData.inferredDetails.style}</span>
                    )}
                  </div>
                  <p style={customizeStyles.inferenceHint}>Click fields below to adjust if we got it wrong</p>
                </div>
              )}
            </div>

            {/* Location */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Business Location *</label>
              <input
                type="text"
                value={projectData.location || ''}
                onChange={(e) => updateProject({ location: e.target.value })}
                placeholder={getPlaceholder('location')}
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHint}>Helps AI customize content for your area</p>
            </div>

            {/* Tagline - Optional with "We'll Handle It" */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Tagline
                <span style={customizeStyles.optionalBadge}>Optional</span>
              </label>
              <input
                type="text"
                value={projectData.tagline}
                onChange={(e) => updateProject({ tagline: e.target.value })}
                placeholder={getPlaceholder('tagline')}
                style={styles.formInput}
              />
              <p style={customizeStyles.fieldHintWithIcon}>
                <span style={customizeStyles.hintIcon}>💡</span>
                Skip this and we'll generate a tagline based on your industry
              </p>
            </div>
          </CollapsibleSection>

          {/* SECTION: Quick Impact Questions */}
          <CollapsibleSection
            title="Quick Details"
            icon="⚡"
            defaultOpen={true}
            tooltip="3 quick questions that dramatically improve your site"
          >
            <p style={customizeStyles.sectionIntro}>
              These quick selections help us generate better content. Takes 10 seconds!
            </p>

            {/* Team Size */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Team Size</label>
              <div style={customizeStyles.chipGrid}>
                {teamSizeOptions.map(option => (
                  <button
                    key={option.id}
                    style={{
                      ...customizeStyles.impactChip,
                      ...(projectData.teamSize === option.id ? customizeStyles.impactChipActive : {})
                    }}
                    onClick={() => updateProject({ teamSize: option.id })}
                  >
                    <span style={customizeStyles.impactChipIcon}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Price Range</label>
              <div style={customizeStyles.chipGrid}>
                {priceRangeOptions.map(option => (
                  <button
                    key={option.id}
                    style={{
                      ...customizeStyles.impactChip,
                      ...(projectData.priceRange === option.id ? customizeStyles.impactChipActive : {})
                    }}
                    onClick={() => updateProject({ priceRange: option.id })}
                  >
                    <span style={customizeStyles.impactChipIcon}>{option.icon}</span>
                    <span>{option.label}</span>
                    {option.description && <span style={customizeStyles.impactChipDesc}>{option.description}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Years Established */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>How Established?</label>
              <div style={customizeStyles.chipGrid}>
                {yearsOptions.map(option => (
                  <button
                    key={option.id}
                    style={{
                      ...customizeStyles.impactChip,
                      ...(projectData.yearsEstablished === option.id ? customizeStyles.impactChipActive : {})
                    }}
                    onClick={() => updateProject({ yearsEstablished: option.id })}
                  >
                    <span style={customizeStyles.impactChipIcon}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* SECTION 2: Target & Goals - Collapsed by default */}
          <CollapsibleSection
            title="Customize More"
            icon="✨"
            defaultOpen={false}
            tooltip="Optional - we'll use smart defaults if you skip"
            badge={projectData.targetAudience?.length > 0 ? `${projectData.targetAudience.length} selected` : 'Auto'}
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>💡</span>
              These are optional! We've pre-selected smart defaults based on your industry.
              The more you customize, the better your site will be - but even skipping this produces great results.
            </p>

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

          {/* SECTION 3: Design & Colors - Collapsed by default */}
          <CollapsibleSection
            title="Design & Colors"
            icon="🎨"
            defaultOpen={false}
            badge={projectData.selectedPreset || 'Auto'}
            tooltip="Optional - we'll pick colors that match your industry"
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>💡</span>
              Skip this and we'll choose a color palette that perfectly matches your industry vibe.
            </p>
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

          </div>{/* End of responsiveStyles.sectionsGrid */}

          {/* SECTION 3.5: Layout Style - Visual Layout Selection */}
          <CollapsibleSection
            title="Layout Style"
            icon="📐"
            defaultOpen={true}
            badge={projectData.layoutStyleId ? getLayoutsForIndustry(projectData.industryKey).find(l => l.id === projectData.layoutStyleId)?.name : 'Choose a style'}
            tooltip="Choose how your website sections are arranged"
            fullWidth={true}
          >
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Select a Layout
                <span style={p1Styles.tooltipIcon} title="Different layouts emphasize different content. Pick what works best for your business.">ⓘ</span>
              </label>
              <p style={customizeStyles.fieldHint}>
                {projectData.industryKey
                  ? `Layouts optimized for ${projectData.industry?.name || 'your industry'}`
                  : 'General layouts that work for any business'}
              </p>
              <LayoutStyleSelector
                industryKey={projectData.industryKey}
                selectedLayout={projectData.layoutStyleId}
                onSelectLayout={(layoutId, previewConfig) => {
                  updateProject({
                    layoutStyleId: layoutId,
                    layoutStylePreview: previewConfig
                  });
                }}
                colors={projectData.colors}
              />
            </div>
          </CollapsibleSection>

          {/* SECTION 4: Pages */}
          <CollapsibleSection
            title="Website Pages"
            icon="📄"
            defaultOpen={false}
            badge={`${projectData.selectedPages.length} selected`}
            tooltip="Choose which pages to include in your website"
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>💡</span>
              We've pre-selected the essential pages. Add more if needed, or generate now!
            </p>
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

            {/* Video Hero Background Toggle */}
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Hero Enhancements
                <span style={customizeStyles.premiumBadge}>Premium</span>
              </label>
              <div style={customizeStyles.videoToggleContainer}>
                <label style={customizeStyles.videoToggleLabel}>
                  <input
                    type="checkbox"
                    checked={(() => {
                      // If user explicitly set, use that
                      if (projectData.enableVideoHero !== null) return projectData.enableVideoHero;
                      // Otherwise, auto-enable for supported industries
                      const videoIndustries = ['tattoo', 'barbershop', 'barber', 'restaurant', 'pizza', 'pizzeria', 'fitness', 'gym', 'spa', 'salon', 'wellness'];
                      const industry = (projectData.industryKey || '').toLowerCase();
                      return videoIndustries.some(v => industry.includes(v));
                    })()}
                    onChange={(e) => updateProject({ enableVideoHero: e.target.checked })}
                    style={customizeStyles.videoCheckbox}
                  />
                  <span style={customizeStyles.videoToggleText}>
                    <span style={customizeStyles.videoIcon}>🎬</span>
                    Enable Video Hero Background
                  </span>
                </label>
                <p style={customizeStyles.videoToggleHint}>
                  {(() => {
                    const videoIndustries = ['tattoo', 'barbershop', 'barber', 'restaurant', 'pizza', 'pizzeria', 'fitness', 'gym', 'spa', 'salon', 'wellness'];
                    const industry = (projectData.industryKey || '').toLowerCase();
                    const isSupported = videoIndustries.some(v => industry.includes(v));
                    if (isSupported) {
                      return '✨ Your industry has a curated video available! Video auto-plays on desktop, shows image on mobile.';
                    }
                    return 'Video backgrounds create stunning first impressions. Currently available for restaurants, fitness, spas, barbershops, and tattoo studios.';
                  })()}
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* SECTION 5: Advanced - Extra Details */}
          <CollapsibleSection
            title="Advanced AI Instructions"
            icon="🤖"
            defaultOpen={false}
            tooltip="Power users only - give AI specific customization instructions"
          >
            <p style={customizeStyles.sectionIntro}>
              <span style={customizeStyles.hintIcon}>🔧</span>
              For power users: Add specific instructions if you have unique requirements.
              Skip this for a great result using smart defaults!
            </p>
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

        {/* RIGHT: Live Preview - Updates based on layout selection */}
        <div style={{...styles.previewContainer, ...responsiveStyles.preview}}>
          <div style={styles.previewHeader}>
            <span>Live Preview</span>
            {projectData.layoutStyleId && (
              <span style={livePreviewStyles.layoutBadge}>
                {getLayoutsForIndustry(projectData.industryKey).find(l => l.id === projectData.layoutStyleId)?.name}
              </span>
            )}
            <div style={styles.previewDots}>
              <span style={styles.dot} />
              <span style={styles.dot} />
              <span style={styles.dot} />
            </div>
          </div>
          <div style={styles.previewFrame}>
            {/* Dynamic Preview based on layout selection */}
            <LivePreviewRenderer
              projectData={projectData}
              layoutPreview={projectData.layoutStylePreview}
            />
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

        {/* Reassurance message */}
        {projectData.businessName.trim() && (
          <div style={customizeStyles.readyMessage}>
            <span style={customizeStyles.readyIcon}>✨</span>
            <div>
              <p style={customizeStyles.readyTitle}>Ready to generate!</p>
              <p style={customizeStyles.readySubtitle}>
                We'll use smart defaults for anything you skipped. The more details you provide, the better your site will be.
              </p>
            </div>
          </div>
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
  },
  // Business Name Intelligence Styles
  inferenceBox: {
    marginTop: '12px',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '10px'
  },
  inferenceLabel: {
    color: '#22c55e',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'block'
  },
  inferenceChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '6px'
  },
  inferenceChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500'
  },
  inferenceHint: {
    color: '#666',
    fontSize: '11px',
    margin: 0
  },
  // High-Impact Question Styles
  sectionIntro: {
    color: '#888',
    fontSize: '13px',
    marginBottom: '16px',
    lineHeight: 1.5
  },
  impactChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    flex: '1 1 auto'
  },
  impactChipActive: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  impactChipIcon: {
    fontSize: '20px'
  },
  impactChipDesc: {
    fontSize: '10px',
    color: '#666',
    marginTop: '2px'
  },
  // Field Hint with Icon
  fieldHintWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#666',
    fontSize: '12px',
    marginTop: '8px',
    marginBottom: 0
  },
  hintIcon: {
    fontSize: '14px'
  },
  // Ready to Generate Message
  readyMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '12px',
    marginBottom: '16px'
  },
  readyIcon: {
    fontSize: '24px',
    marginTop: '2px'
  },
  readyTitle: {
    color: '#22c55e',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  readySubtitle: {
    color: '#888',
    fontSize: '13px',
    margin: 0,
    lineHeight: 1.4
  },
  // Video Hero Toggle Styles
  premiumBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#a855f7',
    fontWeight: '600'
  },
  videoToggleContainer: {
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px'
  },
  videoToggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  videoCheckbox: {
    width: '20px',
    height: '20px',
    accentColor: '#22c55e',
    cursor: 'pointer'
  },
  videoToggleText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  },
  videoIcon: {
    fontSize: '18px'
  },
  videoToggleHint: {
    color: '#888',
    fontSize: '12px',
    marginTop: '10px',
    marginLeft: '32px',
    lineHeight: 1.5
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
function CompleteStep({ result, projectData, onReset, blinkCount, onDeploy, deployReady, onAddTools, industry }) {
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

      {/* Cross-link to tools */}
      {onAddTools && (
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          width: '100%',
          maxWidth: '600px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderRadius: '16px',
            border: '1px solid #fcd34d'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🔧</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                Want tools for your {industry || 'business'} too?
              </div>
              <div style={{ fontSize: '0.85rem', color: '#a16207', marginBottom: '8px' }}>
                Calculators, forms, trackers & more
              </div>
              <button
                onClick={onAddTools}
                style={{
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Add Business Tools →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TOOL COMPLETE SCREEN
// ============================================
function ToolCompleteScreen({ toolResult, onReset, onBuildAnother, onBuildSite, industry }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showTestDetails, setShowTestDetails] = useState(false);

  const tool = toolResult?.tool || {};
  const html = toolResult?.html || '';
  const projectPath = toolResult?.project?.path;
  const testResults = toolResult?.testResults || null;

  // Create blob URL for iframe preview
  const previewUrl = html ? URL.createObjectURL(new Blob([html], { type: 'text/html' })) : null;

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(tool.name || 'tool').toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenFolder = async () => {
    if (!projectPath) return;
    try {
      await fetch(`${API_BASE}/api/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: projectPath })
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  const toolCompleteStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '80vh'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    icon: {
      fontSize: '4rem',
      marginBottom: '16px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '8px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666'
    },
    previewSection: {
      width: '100%',
      maxWidth: '800px',
      marginBottom: '32px'
    },
    previewHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    previewLabel: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#333'
    },
    previewToggle: {
      padding: '6px 12px',
      fontSize: '0.8rem',
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    previewFrame: {
      width: '100%',
      height: '500px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'white'
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none'
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      width: '100%',
      maxWidth: '600px',
      marginBottom: '32px'
    },
    actionCard: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px',
      background: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    actionCardHover: {
      borderColor: '#10b981',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
    },
    actionIcon: {
      fontSize: '2rem',
      marginBottom: '8px'
    },
    actionLabel: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#333'
    },
    actionHint: {
      fontSize: '0.75rem',
      color: '#888',
      marginTop: '4px'
    },
    toolInfo: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: '24px'
    },
    infoBadge: {
      padding: '8px 16px',
      background: '#f0fdf4',
      borderRadius: '8px',
      fontSize: '0.85rem',
      color: '#166534'
    },
    secondaryActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px'
    },
    secondaryBtn: {
      padding: '10px 20px',
      fontSize: '0.9rem',
      background: 'transparent',
      border: '1px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#666'
    },
    primaryBtn: {
      padding: '10px 24px',
      fontSize: '0.9rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: 'white',
      fontWeight: '600'
    },
    // Test results styles
    testResultsSection: {
      width: '100%',
      maxWidth: '600px',
      marginBottom: '24px'
    },
    testResultsHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    },
    testResultsTitle: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#333',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    testSummary: {
      display: 'flex',
      gap: '16px',
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '10px',
      border: '1px solid #e2e8f0'
    },
    testStat: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.85rem'
    },
    testStatIcon: {
      fontSize: '1rem'
    },
    testStatValue: {
      fontWeight: '600'
    },
    testStatLabel: {
      color: '#666'
    },
    testDetailsToggle: {
      fontSize: '0.75rem',
      color: '#666',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    testDetailsList: {
      marginTop: '12px',
      padding: '12px',
      background: '#fafafa',
      borderRadius: '8px',
      fontSize: '0.8rem',
      maxHeight: '200px',
      overflowY: 'auto'
    },
    testDetailItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '4px 0',
      borderBottom: '1px solid #eee'
    },
    testDetailIcon: {
      flexShrink: 0
    },
    testDetailText: {
      color: '#555'
    }
  };

  return (
    <div style={toolCompleteStyles.container}>
      <div style={toolCompleteStyles.header}>
        <div style={toolCompleteStyles.icon}>{tool.icon || '🛠️'}</div>
        <h1 style={toolCompleteStyles.title}>{tool.name || 'Tool'} is Ready!</h1>
        <p style={toolCompleteStyles.subtitle}>
          Your tool is complete and works offline
        </p>
      </div>

      {/* Tool Info Badges */}
      <div style={toolCompleteStyles.toolInfo}>
        {tool.category && (
          <span style={toolCompleteStyles.infoBadge}>
            Category: {tool.category}
          </span>
        )}
        {tool.features && (
          <span style={toolCompleteStyles.infoBadge}>
            {tool.features.length} features
          </span>
        )}
        <span style={toolCompleteStyles.infoBadge}>
          Self-contained HTML
        </span>
      </div>

      {/* Test Results Section */}
      {testResults && (
        <div style={toolCompleteStyles.testResultsSection}>
          <div style={toolCompleteStyles.testResultsHeader}>
            <span style={toolCompleteStyles.testResultsTitle}>
              {testResults.allPassed ? '✅' : testResults.failed > 0 ? '❌' : '⚠️'}
              Validation Tests
            </span>
            {testResults.details && testResults.details.length > 0 && (
              <button
                style={toolCompleteStyles.testDetailsToggle}
                onClick={() => setShowTestDetails(!showTestDetails)}
              >
                {showTestDetails ? 'Hide details' : 'Show details'}
              </button>
            )}
          </div>
          <div style={toolCompleteStyles.testSummary}>
            <div style={toolCompleteStyles.testStat}>
              <span style={toolCompleteStyles.testStatIcon}>✅</span>
              <span style={{...toolCompleteStyles.testStatValue, color: '#10b981'}}>{testResults.passed}</span>
              <span style={toolCompleteStyles.testStatLabel}>passed</span>
            </div>
            {testResults.warnings > 0 && (
              <div style={toolCompleteStyles.testStat}>
                <span style={toolCompleteStyles.testStatIcon}>⚠️</span>
                <span style={{...toolCompleteStyles.testStatValue, color: '#f59e0b'}}>{testResults.warnings}</span>
                <span style={toolCompleteStyles.testStatLabel}>warnings</span>
              </div>
            )}
            {testResults.failed > 0 && (
              <div style={toolCompleteStyles.testStat}>
                <span style={toolCompleteStyles.testStatIcon}>❌</span>
                <span style={{...toolCompleteStyles.testStatValue, color: '#ef4444'}}>{testResults.failed}</span>
                <span style={toolCompleteStyles.testStatLabel}>failed</span>
              </div>
            )}
          </div>
          {showTestDetails && testResults.details && (
            <div style={toolCompleteStyles.testDetailsList}>
              {testResults.details.map((detail, idx) => (
                <div key={idx} style={toolCompleteStyles.testDetailItem}>
                  <span style={toolCompleteStyles.testDetailIcon}>
                    {detail.status === 'pass' ? '✅' : detail.status === 'warning' ? '⚠️' : '❌'}
                  </span>
                  <span style={toolCompleteStyles.testDetailText}>{detail.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {html && (
        <div style={toolCompleteStyles.previewSection}>
          <div style={toolCompleteStyles.previewHeader}>
            <span style={toolCompleteStyles.previewLabel}>Live Preview</span>
            <button
              style={toolCompleteStyles.previewToggle}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
          {showPreview && previewUrl && (
            <div style={toolCompleteStyles.previewFrame}>
              <iframe
                src={previewUrl}
                style={toolCompleteStyles.iframe}
                title="Tool Preview"
                sandbox="allow-scripts allow-forms"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Cards */}
      <div style={toolCompleteStyles.actionsGrid}>
        <div
          style={toolCompleteStyles.actionCard}
          onClick={handleDownload}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, toolCompleteStyles.actionCardHover)}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={toolCompleteStyles.actionIcon}>📥</span>
          <span style={toolCompleteStyles.actionLabel}>Download</span>
          <span style={toolCompleteStyles.actionHint}>Single HTML file</span>
        </div>

        <div
          style={toolCompleteStyles.actionCard}
          onClick={handleCopyCode}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, toolCompleteStyles.actionCardHover)}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={toolCompleteStyles.actionIcon}>{copied ? '✅' : '📋'}</span>
          <span style={toolCompleteStyles.actionLabel}>{copied ? 'Copied!' : 'Copy Code'}</span>
          <span style={toolCompleteStyles.actionHint}>To clipboard</span>
        </div>

        {projectPath && (
          <div
            style={toolCompleteStyles.actionCard}
            onClick={handleOpenFolder}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, toolCompleteStyles.actionCardHover)}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={toolCompleteStyles.actionIcon}>📂</span>
            <span style={toolCompleteStyles.actionLabel}>Open Folder</span>
            <span style={toolCompleteStyles.actionHint}>View files</span>
          </div>
        )}
      </div>

      {/* Secondary Actions */}
      <div style={toolCompleteStyles.secondaryActions}>
        <button style={toolCompleteStyles.secondaryBtn} onClick={onReset}>
          ← Back to Home
        </button>
        <button style={toolCompleteStyles.primaryBtn} onClick={onBuildAnother}>
          + Build Another Tool
        </button>
      </div>

      {/* Cross-link to website */}
      {onBuildSite && (
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          width: '100%',
          maxWidth: '600px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: '16px',
            border: '1px solid #bfdbfe'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                Want a full website for your {industry || 'business'} too?
              </div>
              <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '8px' }}>
                Complete site with pages, backend & admin
              </div>
              <button
                onClick={onBuildSite}
                style={{
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Build Website →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// CHOICE SCREEN - Shown when input is ambiguous
// ============================================
function ChoiceScreen({ detectedIndustry, industryDisplay, industryIcon, originalInput, onChooseSite, onChooseTools, onBack }) {
  const choiceStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      minHeight: '70vh'
    },
    header: {
      textAlign: 'center',
      marginBottom: '48px'
    },
    detected: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderRadius: '50px',
      marginBottom: '24px',
      border: '1px solid #bbf7d0'
    },
    detectedIcon: {
      fontSize: '2rem'
    },
    detectedText: {
      fontSize: '1.1rem',
      color: '#166534'
    },
    detectedIndustry: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    title: {
      fontSize: '2.25rem',
      fontWeight: '800',
      marginBottom: '12px',
      color: '#1f2937'
    },
    subtitle: {
      fontSize: '1.1rem',
      color: '#6b7280',
      maxWidth: '500px'
    },
    cardsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
      width: '100%',
      maxWidth: '700px',
      marginBottom: '32px'
    },
    card: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 24px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    cardSite: {
      ':hover': {
        borderColor: '#3b82f6',
        boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)'
      }
    },
    cardTools: {
      ':hover': {
        borderColor: '#f59e0b',
        boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)'
      }
    },
    cardIcon: {
      fontSize: '3.5rem',
      marginBottom: '16px'
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '12px',
      color: '#1f2937'
    },
    cardDescription: {
      fontSize: '0.95rem',
      color: '#6b7280',
      lineHeight: '1.6',
      marginBottom: '24px',
      minHeight: '60px'
    },
    cardButton: {
      padding: '14px 32px',
      fontSize: '1rem',
      fontWeight: '600',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    cardButtonSite: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white'
    },
    cardButtonTools: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white'
    },
    footer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    },
    footerNote: {
      fontSize: '0.9rem',
      color: '#9ca3af',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    backBtn: {
      padding: '10px 20px',
      fontSize: '0.9rem',
      background: 'transparent',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#6b7280'
    }
  };

  return (
    <div style={choiceStyles.container}>
      <div style={choiceStyles.header}>
        <div style={choiceStyles.detected}>
          <span style={choiceStyles.detectedIcon}>{industryIcon}</span>
          <span style={choiceStyles.detectedText}>
            We detected: <span style={choiceStyles.detectedIndustry}>{industryDisplay}</span>
          </span>
        </div>
        <h1 style={choiceStyles.title}>What would you like to build?</h1>
        <p style={choiceStyles.subtitle}>
          Choose how you want to power your {industryDisplay?.toLowerCase()} business
        </p>
      </div>

      <div style={choiceStyles.cardsContainer}>
        {/* Full Website Card */}
        <div
          style={choiceStyles.card}
          onClick={onChooseSite}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={choiceStyles.cardIcon}>🌐</span>
          <h2 style={choiceStyles.cardTitle}>Full Website</h2>
          <p style={choiceStyles.cardDescription}>
            Complete site with multiple pages, backend integration, and admin dashboard
          </p>
          <button style={{...choiceStyles.cardButton, ...choiceStyles.cardButtonSite}}>
            Build Site →
          </button>
        </div>

        {/* Business Tools Card */}
        <div
          style={choiceStyles.card}
          onClick={onChooseTools}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={choiceStyles.cardIcon}>🧰</span>
          <h2 style={choiceStyles.cardTitle}>Business Tools</h2>
          <p style={choiceStyles.cardDescription}>
            Calculators, forms, trackers & utilities tailored for {industryDisplay?.toLowerCase() || 'your industry'}
          </p>
          <button style={{...choiceStyles.cardButton, ...choiceStyles.cardButtonTools}}>
            See Tools →
          </button>
        </div>
      </div>

      <div style={choiceStyles.footer}>
        <p style={choiceStyles.footerNote}>
          ⚡ Both include branding & customization options
        </p>
        <button style={choiceStyles.backBtn} onClick={onBack}>
          ← Start Over
        </button>
      </div>
    </div>
  );
}

// ============================================
// SITE CUSTOMIZATION SCREEN
// ============================================

function SiteCustomizationScreen({
  industry,
  industryDisplay,
  industryIcon,
  sharedContext,
  onGenerate,
  onBack,
  onUpdateContext
}) {
  const [businessName, setBusinessName] = useState(sharedContext?.businessName || '');
  const [location, setLocation] = useState(sharedContext?.location || '');
  const [tagline, setTagline] = useState(sharedContext?.tagline || '');
  const [brandColor, setBrandColor] = useState(sharedContext?.brandColor || '#3b82f6');
  const [style, setStyle] = useState(sharedContext?.style || 'modern');
  const [logo, setLogo] = useState(sharedContext?.logo || null);
  const [adminLevel, setAdminLevel] = useState('standard');
  const [dragOver, setDragOver] = useState(false);

  // Get page config for this industry
  const industryCategory = getIndustryPageCategory(industry);
  const pageConfig = INDUSTRY_PAGES[industryCategory] || INDUSTRY_PAGES.default;
  const [selectedPages, setSelectedPages] = useState(pageConfig.recommended);

  function getIndustryPageCategory(ind) {
    if (!ind) return 'default';
    const lowerInd = ind.toLowerCase();
    if (['pizza', 'restaurant', 'cafe', 'bar'].includes(lowerInd)) return 'food-beverage';
    if (lowerInd === 'bakery') return 'bakery';
    if (['law-firm', 'accounting', 'consulting', 'real-estate', 'insurance'].includes(lowerInd)) return 'professional-services';
    if (['healthcare', 'dental', 'chiropractic', 'spa-salon'].includes(lowerInd)) return 'healthcare';
    if (['fitness', 'yoga', 'gym'].includes(lowerInd)) return 'fitness';
    if (['saas', 'startup', 'agency', 'tech'].includes(lowerInd)) return 'technology';
    if (['photography', 'wedding', 'portfolio', 'musician', 'podcast'].includes(lowerInd)) return 'creative';
    if (['ecommerce', 'retail', 'shop'].includes(lowerInd)) return 'retail';
    if (['construction', 'plumber', 'electrician', 'landscaping', 'cleaning', 'auto-repair', 'moving', 'hvac', 'roofing'].includes(lowerInd)) return 'trade-services';
    return 'default';
  }

  const togglePage = (pageId) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(p => p !== pageId)
        : [...prev, pageId]
    );
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setLogo(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setLogo(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    // Update shared context
    if (onUpdateContext) {
      onUpdateContext({
        businessName,
        brandColor,
        location,
        industry,
        industryDisplay,
        style,
        logo,
        tagline
      });
    }
    // Call generate with all config
    onGenerate({
      businessName,
      location,
      tagline,
      brandColor,
      style,
      logo,
      selectedPages,
      adminLevel,
      industry,
      industryDisplay
    });
  };

  const customStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '80vh',
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    industryBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderRadius: '50px',
      marginBottom: '16px',
      border: '1px solid #bbf7d0'
    },
    industryIcon: {
      fontSize: '1.5rem'
    },
    industryText: {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#166534',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#1f2937'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#6b7280'
    },
    form: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    section: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    sectionTitle: {
      fontSize: '0.85rem',
      fontWeight: '600',
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: '500',
      color: '#374151'
    },
    required: {
      color: '#ef4444'
    },
    input: {
      padding: '12px 16px',
      fontSize: '1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },
    inputHint: {
      fontSize: '0.8rem',
      color: '#9ca3af',
      fontStyle: 'italic'
    },
    colorSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    },
    colorPicker: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: '#f9fafb',
      borderRadius: '12px',
      border: '2px solid #e5e7eb'
    },
    colorInput: {
      width: '40px',
      height: '40px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    colorPresets: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    colorSwatch: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.2s ease'
    },
    colorSwatchSelected: {
      border: '2px solid #1f2937',
      transform: 'scale(1.1)'
    },
    styleOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px'
    },
    styleOption: {
      padding: '16px 12px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease'
    },
    styleOptionSelected: {
      borderColor: '#3b82f6',
      background: '#eff6ff'
    },
    styleLabel: {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    styleDesc: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    logoDropzone: {
      padding: '24px',
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: '#f9fafb'
    },
    logoDropzoneActive: {
      borderColor: '#3b82f6',
      background: '#eff6ff'
    },
    logoPreview: {
      maxWidth: '120px',
      maxHeight: '80px',
      objectFit: 'contain',
      marginBottom: '8px'
    },
    divider: {
      height: '1px',
      background: '#e5e7eb',
      margin: '8px 0'
    },
    pagesGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px'
    },
    pageCheckbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.9rem'
    },
    pageCheckboxSelected: {
      borderColor: '#3b82f6',
      background: '#eff6ff'
    },
    pageIcon: {
      fontSize: '1.1rem'
    },
    adminOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px'
    },
    adminOption: {
      padding: '16px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      position: 'relative'
    },
    adminOptionSelected: {
      borderColor: '#3b82f6',
      background: '#eff6ff'
    },
    recommendedBadge: {
      position: 'absolute',
      top: '-8px',
      right: '12px',
      padding: '2px 8px',
      background: '#22c55e',
      color: 'white',
      fontSize: '0.65rem',
      fontWeight: '600',
      borderRadius: '4px',
      textTransform: 'uppercase'
    },
    adminLabel: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    adminDesc: {
      fontSize: '0.8rem',
      color: '#6b7280'
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '16px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb'
    },
    backBtn: {
      padding: '12px 24px',
      fontSize: '0.95rem',
      background: 'transparent',
      border: '2px solid #d1d5db',
      borderRadius: '12px',
      cursor: 'pointer',
      color: '#6b7280',
      fontWeight: '500'
    },
    generateBtn: {
      padding: '14px 32px',
      fontSize: '1.1rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
    },
    generateBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={customStyles.container}>
      <div style={customStyles.header}>
        <div style={customStyles.industryBadge}>
          <span style={customStyles.industryIcon}>{industryIcon}</span>
          <span style={customStyles.industryText}>{industryDisplay} Website</span>
        </div>
        <h1 style={customStyles.title}>Customize before we build</h1>
        <p style={customStyles.subtitle}>Fill in what you know, skip what you don't</p>
      </div>

      <div style={customStyles.form}>
        {/* Business Details */}
        <div style={customStyles.section}>
          <div style={customStyles.inputGroup}>
            <label style={customStyles.label}>
              Business Name <span style={customStyles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Sunrise Bakery"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={customStyles.input}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={customStyles.inputGroup}>
            <label style={customStyles.label}>Location</label>
            <input
              type="text"
              placeholder="e.g., Austin, TX"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={customStyles.input}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={customStyles.inputGroup}>
            <label style={customStyles.label}>Tagline</label>
            <input
              type="text"
              placeholder="e.g., Baked fresh daily"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={customStyles.input}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <span style={customStyles.inputHint}>Skip and we'll generate one</span>
          </div>
        </div>

        {/* Brand Color */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Brand Color</span>
          <div style={customStyles.colorSection}>
            <div style={customStyles.colorPicker}>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                style={customStyles.colorInput}
              />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{brandColor}</span>
            </div>
            <div style={customStyles.colorPresets}>
              {COLOR_PRESETS.map((preset) => (
                <div
                  key={preset.color}
                  title={preset.name}
                  style={{
                    ...customStyles.colorSwatch,
                    background: preset.color,
                    ...(brandColor === preset.color ? customStyles.colorSwatchSelected : {})
                  }}
                  onClick={() => setBrandColor(preset.color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Style */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Style</span>
          <div style={customStyles.styleOptions}>
            {STYLE_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                style={{
                  ...customStyles.styleOption,
                  ...(style === opt.key ? customStyles.styleOptionSelected : {})
                }}
                onClick={() => setStyle(opt.key)}
              >
                <div style={customStyles.styleLabel}>{opt.label}</div>
                <div style={customStyles.styleDesc}>{opt.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Logo</span>
          <div
            style={{
              ...customStyles.logoDropzone,
              ...(dragOver ? customStyles.logoDropzoneActive : {})
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleLogoDrop}
            onClick={() => document.getElementById('logo-input').click()}
          >
            {logo ? (
              <>
                <img src={logo} alt="Logo preview" style={customStyles.logoPreview} />
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Click or drop to replace</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                <div style={{ fontSize: '0.95rem', color: '#6b7280' }}>Drop logo image or click to browse</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>Skip and we'll create a text logo</div>
              </>
            )}
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div style={customStyles.divider} />

        {/* Pages */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>
            Pages (we recommend these for {industryDisplay?.toLowerCase() || 'your business'})
          </span>
          <div style={customStyles.pagesGrid}>
            {pageConfig.recommended.map((pageId) => (
              <div
                key={pageId}
                style={{
                  ...customStyles.pageCheckbox,
                  ...customStyles.pageCheckboxSelected
                }}
                onClick={() => togglePage(pageId)}
              >
                <span style={customStyles.pageIcon}>
                  {selectedPages.includes(pageId) ? '✅' : '☐'}
                </span>
                {PAGE_LABELS[pageId] || pageId}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>Optional:</div>
          <div style={customStyles.pagesGrid}>
            {pageConfig.optional.map((pageId) => (
              <div
                key={pageId}
                style={{
                  ...customStyles.pageCheckbox,
                  ...(selectedPages.includes(pageId) ? customStyles.pageCheckboxSelected : {})
                }}
                onClick={() => togglePage(pageId)}
              >
                <span style={customStyles.pageIcon}>
                  {selectedPages.includes(pageId) ? '✅' : '☐'}
                </span>
                {PAGE_LABELS[pageId] || pageId}
              </div>
            ))}
          </div>
        </div>

        {/* Admin Level */}
        <div style={customStyles.section}>
          <span style={customStyles.sectionTitle}>Admin Dashboard Level</span>
          <div style={customStyles.adminOptions}>
            {ADMIN_LEVELS.map((level) => (
              <div
                key={level.key}
                style={{
                  ...customStyles.adminOption,
                  ...(adminLevel === level.key ? customStyles.adminOptionSelected : {})
                }}
                onClick={() => setAdminLevel(level.key)}
              >
                {level.recommended && <span style={customStyles.recommendedBadge}>Recommended</span>}
                <div style={customStyles.adminLabel}>{level.label}</div>
                <div style={customStyles.adminDesc}>{level.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={customStyles.actions}>
          <button style={customStyles.backBtn} onClick={onBack}>
            ← Back
          </button>
          <button
            style={{
              ...customStyles.generateBtn,
              ...(!businessName.trim() ? customStyles.generateBtnDisabled : {})
            }}
            onClick={handleGenerate}
            disabled={!businessName.trim()}
          >
            ⚡ BLINK →
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TOOL CUSTOMIZATION SCREEN (Single Tool)
// ============================================
function ToolCustomizationScreen({
  tool,
  toolName,
  toolIcon,
  sharedContext,
  onGenerate,
  onBack,
  onSkip,
  onUpdateContext
}) {
  const [businessName, setBusinessName] = useState(sharedContext?.businessName || '');
  const [brandColor, setBrandColor] = useState(sharedContext?.brandColor || '#3b82f6');
  const [style, setStyle] = useState(sharedContext?.style || 'modern');
  const [logo, setLogo] = useState(sharedContext?.logo || null);
  const [dragOver, setDragOver] = useState(false);

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setLogo(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setLogo(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (onUpdateContext) {
      onUpdateContext({
        ...sharedContext,
        businessName,
        brandColor,
        style,
        logo
      });
    }
    onGenerate({
      businessName,
      brandColor,
      style,
      logo,
      tool
    });
  };

  const toolStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '70vh',
      maxWidth: '600px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    icon: {
      fontSize: '3rem',
      marginBottom: '12px'
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#1f2937'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#6b7280'
    },
    form: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      padding: '12px 16px',
      fontSize: '1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },
    colorSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    },
    colorPicker: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: '#f9fafb',
      borderRadius: '12px',
      border: '2px solid #e5e7eb'
    },
    colorInput: {
      width: '40px',
      height: '40px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    colorPresets: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    colorSwatch: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.2s ease'
    },
    colorSwatchSelected: {
      border: '2px solid #1f2937',
      transform: 'scale(1.1)'
    },
    styleOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px'
    },
    styleOption: {
      padding: '14px 10px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    styleOptionSelected: {
      borderColor: '#f59e0b',
      background: '#fffbeb'
    },
    logoDropzone: {
      padding: '20px',
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: '#f9fafb'
    },
    logoDropzoneActive: {
      borderColor: '#f59e0b',
      background: '#fffbeb'
    },
    logoPreview: {
      maxWidth: '100px',
      maxHeight: '60px',
      objectFit: 'contain',
      marginBottom: '8px'
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb'
    },
    backBtn: {
      padding: '12px 24px',
      fontSize: '0.95rem',
      background: 'transparent',
      border: '2px solid #d1d5db',
      borderRadius: '12px',
      cursor: 'pointer',
      color: '#6b7280',
      fontWeight: '500'
    },
    skipBtn: {
      padding: '12px 24px',
      fontSize: '0.95rem',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      fontWeight: '500',
      textDecoration: 'underline'
    },
    generateBtn: {
      padding: '14px 28px',
      fontSize: '1.05rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
    }
  };

  return (
    <div style={toolStyles.container}>
      <div style={toolStyles.header}>
        <div style={toolStyles.icon}>{toolIcon || '🔧'}</div>
        <h1 style={toolStyles.title}>{toolName || 'Your Tool'}</h1>
        <p style={toolStyles.subtitle}>Customize your tool (optional)</p>
      </div>

      <div style={toolStyles.form}>
        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Business Name</label>
          <input
            type="text"
            placeholder="e.g., Sunrise Bakery"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            style={toolStyles.input}
            onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Brand Color</label>
          <div style={toolStyles.colorSection}>
            <div style={toolStyles.colorPicker}>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                style={toolStyles.colorInput}
              />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{brandColor}</span>
            </div>
            <div style={toolStyles.colorPresets}>
              {COLOR_PRESETS.map((preset) => (
                <div
                  key={preset.color}
                  title={preset.name}
                  style={{
                    ...toolStyles.colorSwatch,
                    background: preset.color,
                    ...(brandColor === preset.color ? toolStyles.colorSwatchSelected : {})
                  }}
                  onClick={() => setBrandColor(preset.color)}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Style</label>
          <div style={toolStyles.styleOptions}>
            {['Modern', 'Minimal', 'Playful', 'Professional'].map((opt) => (
              <div
                key={opt.toLowerCase()}
                style={{
                  ...toolStyles.styleOption,
                  ...(style === opt.toLowerCase() ? toolStyles.styleOptionSelected : {})
                }}
                onClick={() => setStyle(opt.toLowerCase())}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>

        <div style={toolStyles.inputGroup}>
          <label style={toolStyles.label}>Logo</label>
          <div
            style={{
              ...toolStyles.logoDropzone,
              ...(dragOver ? toolStyles.logoDropzoneActive : {})
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleLogoDrop}
            onClick={() => document.getElementById('tool-logo-input').click()}
          >
            {logo ? (
              <>
                <img src={logo} alt="Logo preview" style={toolStyles.logoPreview} />
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Click or drop to replace</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📁</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Drop image or click to browse</div>
              </>
            )}
            <input
              id="tool-logo-input"
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div style={toolStyles.actions}>
          <button style={toolStyles.backBtn} onClick={onBack}>
            ← Back
          </button>
          <button style={toolStyles.skipBtn} onClick={onSkip}>
            Skip Customization
          </button>
          <button style={toolStyles.generateBtn} onClick={handleGenerate}>
            ⚡ BLINK →
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// RECOMMENDED TOOLS SCREEN
// ============================================
function RecommendedToolsScreen({ recommendations, industry, onSelectTool, onSelectMultiple, onBack, loading, onBuildSite, sharedContext }) {
  const [selectedTools, setSelectedTools] = useState([]);

  const toggleTool = (toolType) => {
    setSelectedTools(prev =>
      prev.includes(toolType)
        ? prev.filter(t => t !== toolType)
        : [...prev, toolType]
    );
  };

  const handleBuildSelected = () => {
    if (selectedTools.length === 1) {
      onSelectTool(selectedTools[0]);
    } else if (selectedTools.length > 1) {
      onSelectMultiple(selectedTools);
    }
  };

  const recStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '70vh'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '8px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666'
    },
    industryBadge: {
      display: 'inline-block',
      padding: '8px 16px',
      background: '#fef3c7',
      borderRadius: '8px',
      fontSize: '0.9rem',
      color: '#92400e',
      marginTop: '12px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      width: '100%',
      maxWidth: '900px',
      marginBottom: '32px'
    },
    card: {
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      background: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    cardSelected: {
      borderColor: '#f59e0b',
      background: '#fffbeb',
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    cardIcon: {
      fontSize: '2rem'
    },
    cardTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    cardDescription: {
      fontSize: '0.9rem',
      color: '#6b7280',
      lineHeight: '1.5',
      flex: 1
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid #f1f5f9'
    },
    buildBtn: {
      padding: '8px 16px',
      fontSize: '0.85rem',
      background: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    checkbox: {
      width: '22px',
      height: '22px',
      accentColor: '#f59e0b'
    },
    actions: {
      display: 'flex',
      gap: '16px',
      marginTop: '16px'
    },
    backBtn: {
      padding: '12px 24px',
      fontSize: '0.95rem',
      background: 'transparent',
      border: '1px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#666'
    },
    buildSelectedBtn: {
      padding: '12px 32px',
      fontSize: '0.95rem',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      opacity: selectedTools.length === 0 ? 0.5 : 1
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '60px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #f59e0b',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  if (loading) {
    return (
      <div style={recStyles.container}>
        <div style={recStyles.loading}>
          <div style={recStyles.spinner} />
          <p>Finding the best tools for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={recStyles.container}>
      <div style={recStyles.header}>
        <h1 style={recStyles.title}>Recommended Tools</h1>
        <p style={recStyles.subtitle}>
          Select one or more tools to build
        </p>
        {industry && (
          <span style={recStyles.industryBadge}>
            For: {industry.charAt(0).toUpperCase() + industry.slice(1)}
          </span>
        )}
      </div>

      <div style={recStyles.grid}>
        {recommendations.map((tool, index) => (
          <div
            key={tool.toolType || index}
            style={{
              ...recStyles.card,
              ...(selectedTools.includes(tool.toolType) ? recStyles.cardSelected : {})
            }}
            onClick={() => toggleTool(tool.toolType)}
          >
            <div style={recStyles.cardHeader}>
              <span style={recStyles.cardIcon}>{tool.icon || '🛠️'}</span>
              <span style={recStyles.cardTitle}>{tool.name}</span>
            </div>
            <p style={recStyles.cardDescription}>{tool.description}</p>
            <div style={recStyles.cardFooter}>
              <input
                type="checkbox"
                checked={selectedTools.includes(tool.toolType)}
                onChange={() => toggleTool(tool.toolType)}
                style={recStyles.checkbox}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                style={recStyles.buildBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTool(tool.toolType, tool.name);
                }}
              >
                Build This
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={recStyles.actions}>
        <button style={recStyles.backBtn} onClick={onBack}>
          ← Back
        </button>
        {selectedTools.length > 0 && (
          <button
            style={recStyles.buildSelectedBtn}
            onClick={handleBuildSelected}
            disabled={selectedTools.length === 0}
          >
            Build {selectedTools.length} Tool{selectedTools.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Cross-link to website */}
      {onBuildSite && (
        <div style={{
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          width: '100%',
          maxWidth: '600px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: '16px',
            border: '1px solid #bfdbfe'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                Want a full website for your {industry || 'business'} too?
              </div>
              <button
                onClick={onBuildSite}
                style={{
                  padding: '8px 20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Build Website →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TOOL SUITE BUILDER SCREEN
// ============================================
function ToolSuiteBuilderScreen({ selectedTools, recommendations, industry, onBuild, onBack }) {
  const [businessName, setBusinessName] = useState(industry ? `${industry.charAt(0).toUpperCase() + industry.slice(1)} Tools` : 'My Tool Suite');
  const [stylePreset, setStylePreset] = useState('modern');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [organization, setOrganization] = useState('auto');
  const [toolOrder, setToolOrder] = useState(selectedTools);
  const [building, setBuilding] = useState(false);
  const [suiteResult, setSuiteResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  // Get full tool info from recommendations
  const tools = toolOrder.map(toolType => {
    const rec = recommendations.find(r => r.toolType === toolType);
    return rec || { toolType, name: toolType, icon: '🔧', description: '' };
  });

  const moveToolUp = (index) => {
    if (index <= 0) return;
    const newOrder = [...toolOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setToolOrder(newOrder);
  };

  const moveToolDown = (index) => {
    if (index >= toolOrder.length - 1) return;
    const newOrder = [...toolOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setToolOrder(newOrder);
  };

  const removeTool = (toolType) => {
    setToolOrder(prev => prev.filter(t => t !== toolType));
  };

  const handleBuildSuite = async () => {
    if (toolOrder.length < 2) {
      setError('At least 2 tools required for a suite');
      return;
    }

    setBuilding(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/orchestrate/build-suite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: tools.map(t => ({
            toolType: t.toolType,
            name: t.name,
            icon: t.icon,
            description: t.description,
            category: t.category
          })),
          branding: {
            businessName,
            colors: { primary: primaryColor, accent: primaryColor },
            style: stylePreset
          },
          options: {
            organization: organization === 'auto' ? null : organization,
            toolOrder
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuiteResult(data);
        onBuild(data);
      } else {
        setError(data.error || 'Failed to build suite');
      }
    } catch (err) {
      setError(`Build failed: ${err.message}`);
    } finally {
      setBuilding(false);
    }
  };

  // Determine suggested organization
  const suggestedOrg = toolOrder.length <= 4 ? 'tabbed' : toolOrder.length <= 8 ? 'grid' : 'sidebar';

  const suiteStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '70vh'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '8px',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666'
    },
    content: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px',
      width: '100%',
      maxWidth: '1000px'
    },
    section: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e2e8f0'
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#1f2937'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#4b5563'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '0.95rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none'
    },
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '0.95rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none',
      background: 'white'
    },
    colorPicker: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    colorInput: {
      width: '50px',
      height: '40px',
      padding: '2px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    colorPresets: {
      display: 'flex',
      gap: '8px'
    },
    colorPreset: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      cursor: 'pointer',
      border: '2px solid transparent'
    },
    toolList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    toolItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '10px',
      border: '1px solid #e2e8f0'
    },
    toolIcon: {
      fontSize: '1.5rem'
    },
    toolInfo: {
      flex: 1
    },
    toolName: {
      fontWeight: '600',
      fontSize: '0.95rem'
    },
    toolDesc: {
      fontSize: '0.8rem',
      color: '#666'
    },
    toolActions: {
      display: 'flex',
      gap: '4px'
    },
    toolBtn: {
      padding: '6px 8px',
      background: '#e2e8f0',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem'
    },
    removeBtn: {
      padding: '6px 8px',
      background: '#fee2e2',
      color: '#dc2626',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem'
    },
    orgOptions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    orgOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      cursor: 'pointer'
    },
    orgOptionSelected: {
      borderColor: '#8b5cf6',
      background: '#f5f3ff'
    },
    orgRadio: {
      width: '18px',
      height: '18px',
      accentColor: '#8b5cf6'
    },
    orgLabel: {
      flex: 1
    },
    orgTitle: {
      fontWeight: '600',
      fontSize: '0.9rem'
    },
    orgDesc: {
      fontSize: '0.8rem',
      color: '#666'
    },
    actions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      marginTop: '32px',
      width: '100%',
      maxWidth: '1000px'
    },
    backBtn: {
      padding: '14px 28px',
      fontSize: '0.95rem',
      background: 'transparent',
      border: '1px solid #ddd',
      borderRadius: '10px',
      cursor: 'pointer',
      color: '#666'
    },
    buildBtn: {
      padding: '14px 40px',
      fontSize: '1rem',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    buildBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    error: {
      color: '#dc2626',
      background: '#fee2e2',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '0.9rem'
    },
    building: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '60px'
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #8b5cf6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  const colorPresets = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#1f2937'];

  if (building) {
    return (
      <div style={suiteStyles.container}>
        <div style={suiteStyles.building}>
          <div style={suiteStyles.spinner} />
          <h2>Building Your Tool Suite</h2>
          <p style={{ color: '#666' }}>Generating {toolOrder.length} tools with shared branding...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={suiteStyles.container}>
      <div style={suiteStyles.header}>
        <h1 style={suiteStyles.title}>🧰 Build Tool Suite</h1>
        <p style={suiteStyles.subtitle}>
          Customize your {toolOrder.length}-tool suite with unified branding
        </p>
      </div>

      {error && <div style={suiteStyles.error}>{error}</div>}

      <div style={suiteStyles.content}>
        {/* Left Column - Branding */}
        <div style={suiteStyles.section}>
          <h3 style={suiteStyles.sectionTitle}>✨ Branding</h3>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Business/Suite Name</label>
            <input
              type="text"
              style={suiteStyles.input}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Business Tools"
            />
          </div>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Brand Color</label>
            <div style={suiteStyles.colorPicker}>
              <input
                type="color"
                style={suiteStyles.colorInput}
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <div style={suiteStyles.colorPresets}>
                {colorPresets.map(color => (
                  <div
                    key={color}
                    style={{
                      ...suiteStyles.colorPreset,
                      background: color,
                      borderColor: primaryColor === color ? '#333' : 'transparent'
                    }}
                    onClick={() => setPrimaryColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Style Preset</label>
            <select
              style={suiteStyles.select}
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value)}
            >
              <option value="modern">Modern - Rounded, subtle shadows</option>
              <option value="minimal">Minimal - Clean, light borders</option>
              <option value="playful">Playful - Bold, rounded corners</option>
              <option value="professional">Professional - Sharp, conservative</option>
            </select>
          </div>

          <div style={suiteStyles.formGroup}>
            <label style={suiteStyles.label}>Layout Organization</label>
            <div style={suiteStyles.orgOptions}>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'auto' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('auto')}
              >
                <input
                  type="radio"
                  checked={organization === 'auto'}
                  onChange={() => setOrganization('auto')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Auto ({suggestedOrg})</div>
                  <div style={suiteStyles.orgDesc}>Best layout for {toolOrder.length} tools</div>
                </div>
              </div>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'tabbed' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('tabbed')}
              >
                <input
                  type="radio"
                  checked={organization === 'tabbed'}
                  onChange={() => setOrganization('tabbed')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Tabbed (All-in-One)</div>
                  <div style={suiteStyles.orgDesc}>Single page with tabs, best for 2-4 tools</div>
                </div>
              </div>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'grid' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('grid')}
              >
                <input
                  type="radio"
                  checked={organization === 'grid'}
                  onChange={() => setOrganization('grid')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Grid Index</div>
                  <div style={suiteStyles.orgDesc}>Dashboard with separate pages, best for 5-8 tools</div>
                </div>
              </div>
              <div
                style={{
                  ...suiteStyles.orgOption,
                  ...(organization === 'sidebar' ? suiteStyles.orgOptionSelected : {})
                }}
                onClick={() => setOrganization('sidebar')}
              >
                <input
                  type="radio"
                  checked={organization === 'sidebar'}
                  onChange={() => setOrganization('sidebar')}
                  style={suiteStyles.orgRadio}
                />
                <div style={suiteStyles.orgLabel}>
                  <div style={suiteStyles.orgTitle}>Sidebar Navigation</div>
                  <div style={suiteStyles.orgDesc}>Categorized sidebar, best for 9+ tools</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tool Selection */}
        <div style={suiteStyles.section}>
          <h3 style={suiteStyles.sectionTitle}>🛠️ Tools ({toolOrder.length})</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px' }}>
            Drag to reorder, or use arrows
          </p>

          <div style={suiteStyles.toolList}>
            {tools.map((tool, index) => (
              <div key={tool.toolType} style={suiteStyles.toolItem}>
                <span style={suiteStyles.toolIcon}>{tool.icon || '🔧'}</span>
                <div style={suiteStyles.toolInfo}>
                  <div style={suiteStyles.toolName}>{tool.name}</div>
                  <div style={suiteStyles.toolDesc}>{tool.description?.substring(0, 50)}...</div>
                </div>
                <div style={suiteStyles.toolActions}>
                  <button
                    style={suiteStyles.toolBtn}
                    onClick={() => moveToolUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    style={suiteStyles.toolBtn}
                    onClick={() => moveToolDown(index)}
                    disabled={index === tools.length - 1}
                  >
                    ↓
                  </button>
                  {toolOrder.length > 2 && (
                    <button
                      style={suiteStyles.removeBtn}
                      onClick={() => removeTool(tool.toolType)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={suiteStyles.actions}>
        <button style={suiteStyles.backBtn} onClick={onBack}>
          ← Back to Selection
        </button>
        <button
          style={{
            ...suiteStyles.buildBtn,
            ...(toolOrder.length < 2 ? suiteStyles.buildBtnDisabled : {})
          }}
          onClick={handleBuildSuite}
          disabled={toolOrder.length < 2}
        >
          🧰 Build Suite ({toolOrder.length} tools)
        </button>
      </div>
    </div>
  );
}

// ============================================
// SUITE COMPLETE SCREEN
// ============================================
function SuiteCompleteScreen({ suiteResult, onReset, onBuildAnother }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const suite = suiteResult?.suite || {};
  const html = suiteResult?.html || '';
  const projectPath = suiteResult?.project?.path;
  const zipFilename = suiteResult?.zipFilename;

  // Create blob URL for iframe preview
  const previewUrl = html ? URL.createObjectURL(new Blob([html], { type: 'text/html' })) : null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownloadZip = () => {
    if (!suiteResult?.project?.name) return;
    window.open(`${API_BASE}/api/orchestrate/download-suite/${suiteResult.project.name}`, '_blank');
  };

  const handleCopyCode = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenFolder = async () => {
    if (!projectPath) return;
    try {
      await fetch(`${API_BASE}/api/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: projectPath })
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  const scStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '80vh'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    icon: {
      fontSize: '4rem',
      marginBottom: '16px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '8px',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666'
    },
    suiteInfo: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: '24px'
    },
    infoBadge: {
      padding: '8px 16px',
      background: '#f5f3ff',
      borderRadius: '8px',
      fontSize: '0.85rem',
      color: '#6d28d9'
    },
    toolsList: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: '24px'
    },
    toolChip: {
      padding: '6px 12px',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    previewSection: {
      width: '100%',
      maxWidth: '900px',
      marginBottom: '32px'
    },
    previewHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    previewLabel: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#333'
    },
    previewToggle: {
      padding: '6px 12px',
      fontSize: '0.8rem',
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    previewFrame: {
      width: '100%',
      height: '500px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'white'
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none'
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      width: '100%',
      maxWidth: '600px',
      marginBottom: '32px'
    },
    actionCard: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px',
      background: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    actionIcon: {
      fontSize: '2rem',
      marginBottom: '8px'
    },
    actionLabel: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#333'
    },
    actionHint: {
      fontSize: '0.75rem',
      color: '#888',
      marginTop: '4px'
    },
    secondaryActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px'
    },
    secondaryBtn: {
      padding: '10px 20px',
      fontSize: '0.9rem',
      background: 'transparent',
      border: '1px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#666'
    },
    primaryBtn: {
      padding: '10px 24px',
      fontSize: '0.9rem',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: 'white',
      fontWeight: '600'
    }
  };

  return (
    <div style={scStyles.container}>
      <div style={scStyles.header}>
        <div style={scStyles.icon}>🧰</div>
        <h1 style={scStyles.title}>{suite.businessName || 'Tool Suite'} is Ready!</h1>
        <p style={scStyles.subtitle}>
          Your {suite.toolCount}-tool suite with {suite.organization} layout
        </p>
      </div>

      <div style={scStyles.suiteInfo}>
        <span style={scStyles.infoBadge}>
          {suite.toolCount} Tools
        </span>
        <span style={scStyles.infoBadge}>
          Layout: {suite.organization}
        </span>
        <span style={scStyles.infoBadge}>
          {suiteResult?.files?.length || 0} Files
        </span>
      </div>

      <div style={scStyles.toolsList}>
        {suite.tools?.map((tool, i) => (
          <span key={i} style={scStyles.toolChip}>
            <span>{tool.icon}</span>
            {tool.name}
          </span>
        ))}
      </div>

      {html && (
        <div style={scStyles.previewSection}>
          <div style={scStyles.previewHeader}>
            <span style={scStyles.previewLabel}>Live Preview (Index Page)</span>
            <button
              style={scStyles.previewToggle}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
          {showPreview && previewUrl && (
            <div style={scStyles.previewFrame}>
              <iframe
                src={previewUrl}
                style={scStyles.iframe}
                title="Suite Preview"
                sandbox="allow-scripts allow-forms"
              />
            </div>
          )}
        </div>
      )}

      <div style={scStyles.actionsGrid}>
        {zipFilename && (
          <div
            style={scStyles.actionCard}
            onClick={handleDownloadZip}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={scStyles.actionIcon}>📦</span>
            <span style={scStyles.actionLabel}>Download ZIP</span>
            <span style={scStyles.actionHint}>All files packaged</span>
          </div>
        )}

        <div
          style={scStyles.actionCard}
          onClick={handleCopyCode}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <span style={scStyles.actionIcon}>{copied ? '✅' : '📋'}</span>
          <span style={scStyles.actionLabel}>{copied ? 'Copied!' : 'Copy Index'}</span>
          <span style={scStyles.actionHint}>Index HTML</span>
        </div>

        {projectPath && (
          <div
            style={scStyles.actionCard}
            onClick={handleOpenFolder}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={scStyles.actionIcon}>📂</span>
            <span style={scStyles.actionLabel}>Open Folder</span>
            <span style={scStyles.actionHint}>View all files</span>
          </div>
        )}
      </div>

      <div style={scStyles.secondaryActions}>
        <button style={scStyles.secondaryBtn} onClick={onReset}>
          ← Back to Home
        </button>
        <button style={scStyles.primaryBtn} onClick={onBuildAnother}>
          + Build Another Suite
        </button>
      </div>
    </div>
  );
}

// ============================================
// DEPLOYING STEP
// ============================================
function DeployingStep({ status, projectName, startTime, onCancel, railwayServices }) {
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

  // Get progress from status object (0-100)
  const progress = typeof status === 'object' ? (status.progress || 0) : 0;

  // Calculate remaining time based on progress (estimated 90 seconds total)
  const estimatedTotal = 90;
  const estimatedRemaining = progress > 0
    ? Math.max(0, Math.round((100 - progress) / progress * elapsedTime))
    : estimatedTotal - elapsedTime;

  // Get current status display
  const statusDisplay = typeof status === 'object'
    ? `${status.icon || '🚀'} ${status.status || 'Deploying...'}`
    : (status || 'Initializing...');

  // Service card display helper
  const getServiceStatus = (service) => {
    if (!service) return { icon: '⏳', label: 'Pending', color: '#666' };
    if (service.isDeployed) return { icon: '✅', label: 'Online', color: '#22c55e' };
    if (service.isFailed) return { icon: '❌', label: 'Failed', color: '#ef4444' };
    if (service.isBuilding) return { icon: '🔨', label: 'Building', color: '#f59e0b' };
    if (service.status === 'DEPLOYING') return { icon: '🚀', label: 'Deploying', color: '#3b82f6' };
    return { icon: '⏳', label: service.status || 'Pending', color: '#666' };
  };

  // Service cards configuration
  const serviceCards = [
    { key: 'postgres', name: 'Database', icon: '🗄️' },
    { key: 'backend', name: 'Backend', icon: '⚙️' },
    { key: 'frontend', name: 'Frontend', icon: '🌐' },
    { key: 'admin', name: 'Admin', icon: '🔧' }
  ];

  return (
    <div style={styles.deployingContainer}>
      <div style={styles.deployingIcon}>🚀</div>
      <h2 style={styles.deployingTitle}>Deploying {projectName}{dots}</h2>
      <p style={styles.deployingSubtitle}>Your site is going live on the internet</p>

      {/* Progress Bar */}
      <div style={deployStepStyles.progressContainer}>
        <div style={deployStepStyles.progressBar}>
          <div style={{
            ...deployStepStyles.progressFill,
            width: `${progress}%`
          }} />
        </div>
        <span style={deployStepStyles.progressText}>{progress}%</span>
      </div>

      <div style={styles.deployingStatusCard}>
        <div style={styles.deployingSpinner}></div>
        <span style={styles.deployingStatus}>{statusDisplay}</span>
      </div>

      {/* Railway Services Status Grid */}
      {railwayServices && (
        <div style={deployStepStyles.servicesGrid}>
          <p style={deployStepStyles.servicesTitle}>Service Status:</p>
          <div style={deployStepStyles.servicesCards}>
            {serviceCards.map(({ key, name, icon }) => {
              const service = railwayServices[key];
              const status = getServiceStatus(service);
              return (
                <div key={key} style={{
                  ...deployStepStyles.serviceCard,
                  borderColor: status.color
                }}>
                  <div style={deployStepStyles.serviceIcon}>{icon}</div>
                  <div style={deployStepStyles.serviceName}>{name}</div>
                  <div style={{ ...deployStepStyles.serviceStatus, color: status.color }}>
                    {status.icon} {status.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={styles.deployingTimeline}>
        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>⏱️</span>
          <span>Elapsed: {formatTime(elapsedTime)}</span>
        </div>
        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>🎯</span>
          <span>~{formatTime(Math.max(0, estimatedRemaining))} remaining</span>
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
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px auto'
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #22c55e)',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  progressText: {
    color: '#22c55e',
    fontWeight: 600,
    fontSize: '14px',
    minWidth: '40px'
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
  },
  // Service status grid styles
  servicesGrid: {
    width: '100%',
    maxWidth: '500px',
    margin: '24px auto 0',
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  servicesTitle: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    fontWeight: 500
  },
  servicesCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  serviceCard: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '10px',
    padding: '16px',
    border: '2px solid',
    borderColor: 'rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  },
  serviceIcon: {
    fontSize: '24px',
    marginBottom: '8px'
  },
  serviceName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '6px'
  },
  serviceStatus: {
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
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
    maxWidth: '1100px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
    maxWidth: '1100px',
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
  pathCardOrchestrator: {
    background: 'rgba(102, 126, 234, 0.08)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  newBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
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

  // Section containers (Build a Business / Build a Tool)
  sectionContainer: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    fontSize: '24px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '20px',
  },

  // Tool cards grid
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    maxWidth: '1100px',
  },
  toolCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    position: 'relative',
  },
  toolCardCustom: {
    background: 'rgba(168, 85, 247, 0.08)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  toolIcon: {
    fontSize: '36px',
    marginBottom: '12px',
  },
  toolName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '6px',
  },
  toolDesc: {
    fontSize: '12px',
    color: '#888',
    lineHeight: '1.4',
  },
  customBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    color: '#fff',
    padding: '3px 8px',
    borderRadius: '8px',
    fontSize: '9px',
    fontWeight: '700',
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
    minHeight: '500px',
    maxHeight: '700px',
    overflow: 'auto',
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