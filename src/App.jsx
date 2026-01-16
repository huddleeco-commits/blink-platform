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
  LayoutStyleSelector,
  LivePreviewRenderer,
  wizardStyles,
  collapsibleStyles,
  tooltipStyles,
  whatYouGetStyles,
  industryBannerStyles,
  livePreviewStyles
} from './components';
import { styles, errorStepStyles, initGlobalStyles } from './styles';
import {
  ChoosePathStep,
  QuickStep,
  ErrorStep,
  DeployErrorStep,
  GeneratingStep,
  DeployingStep,
  DeployCompleteStep,
  CompleteStep,
  ToolCompleteScreen,
  ChoiceScreen,
  SiteCustomizationScreen,
  ToolCustomizationScreen,
  RecommendedToolsScreen,
  ToolSuiteBuilderScreen,
  SuiteCompleteScreen
} from './screens';

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
// COMPLETE STEP
// ============================================
initGlobalStyles();