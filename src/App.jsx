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
  OrchestratorStep,
  RebuildStep,
  UploadAssetsStep,
  ReferenceStep,
  CustomizeStep,
  customizeStyles,
  p1Styles,
  layoutStyles,
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

// Initialize global styles
initGlobalStyles();