/**
 * Utility Routes
 * Extracted from server.cjs
 *
 * Handles: open-folder, open-vscode, analyze-site, generate-theme, analyze-existing-site
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Create utility routes
 * @param {Object} deps - Dependencies
 * @param {string} deps.GENERATED_PROJECTS - Path to generated projects
 * @param {string} deps.MODULE_LIBRARY - Path to module library
 * @param {Object} deps.db - Database connection (can be null)
 */
function createUtilityRoutes(deps) {
  const router = express.Router();
  const { GENERATED_PROJECTS, MODULE_LIBRARY, db } = deps;

  // Open folder in explorer
  router.post('/open-folder', (req, res) => {
    const { path: folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ success: false, error: 'Path required' });
    }

    // SECURITY: Validate path is within allowed directories
    const normalizedPath = path.resolve(folderPath);
    const isAllowedPath = normalizedPath.startsWith(GENERATED_PROJECTS) ||
                          normalizedPath.startsWith(MODULE_LIBRARY);
    if (!isAllowedPath) {
      return res.status(403).json({ success: false, error: 'Access denied - path outside allowed directories' });
    }

    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ success: false, error: 'Path does not exist' });
    }

    // Use shell: true for Windows explorer, but path is validated above
    spawn('explorer', [normalizedPath], { shell: true, detached: true });
    res.json({ success: true });
  });

  // Open in VS Code
  router.post('/open-vscode', (req, res) => {
    const { path: folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ success: false, error: 'Path required' });
    }

    // SECURITY: Validate path is within allowed directories
    const normalizedPath = path.resolve(folderPath);
    const isAllowedPath = normalizedPath.startsWith(GENERATED_PROJECTS) ||
                          normalizedPath.startsWith(MODULE_LIBRARY);
    if (!isAllowedPath) {
      return res.status(403).json({ success: false, error: 'Access denied - path outside allowed directories' });
    }

    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ success: false, error: 'Path does not exist' });
    }

    // Use shell: true for Windows 'code' command, but path is validated above
    spawn('code', [normalizedPath], { shell: true, detached: true });
    res.json({ success: true });
  });

  // Analyze site (with vision)
  router.post('/analyze-site', async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL required' });
    }

    console.log(`🔍 Analyzing site: ${url}`);

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        console.log('   ⚠️ No ANTHROPIC_API_KEY - returning mock analysis');
        return res.json({
          success: true,
          analysis: {
            url: url,
            colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#06b6d4', background: '#0f172a', text: '#e2e8f0' },
            fonts: { heading: 'Inter', body: 'Inter' },
            style: 'modern',
            mood: 'professional',
            mock: true
          }
        });
      }

      const Anthropic = require('@anthropic-ai/sdk');
      const axios = require('axios');
      const client = new Anthropic({ apiKey });

      const screenshotUrl = `https://image.thum.io/get/width/1280/crop/800/png/${url}`;

      let imageBase64;
      let mediaType = 'image/png';
      try {
        const imageResponse = await axios.get(screenshotUrl, {
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: { 'Accept': 'image/png' }
        });
        const buffer = Buffer.from(imageResponse.data);
        imageBase64 = buffer.toString('base64');

        const contentType = imageResponse.headers['content-type'];
        if (contentType && contentType.includes('jpeg')) {
          mediaType = 'image/jpeg';
        } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          mediaType = 'image/jpeg';
        }

        console.log(`   📸 Screenshot captured (${mediaType}, ${buffer.length} bytes)`);
      } catch (imgErr) {
        console.log('   ⚠️ Screenshot failed - using URL analysis only');
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Analyze the website ${url} and suggest a design theme. Return ONLY valid JSON with this structure:
{
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "fonts": { "heading": "font name", "body": "font name" },
  "style": "modern|minimal|bold|elegant|playful",
  "mood": "professional|friendly|luxurious|energetic|calm"
}`
          }]
        });

        // Track API cost
        if (response.usage && db && db.trackApiUsage) {
          const inputTokens = response.usage.input_tokens || 0;
          const outputTokens = response.usage.output_tokens || 0;
          const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
          console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
          try {
            await db.trackApiUsage({
              endpoint: 'claude-api', operation: 'analyze-site-url',
              tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
            });
          } catch (trackingErr) {
            console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
          }
        }

        const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        return res.json({
          success: true,
          analysis: { url: url, ...analysis, mock: false, method: 'url-only' }
        });
      }

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: `Analyze this website screenshot and extract the design system. Return ONLY valid JSON with this exact structure:
{
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "fonts": { "heading": "font name", "body": "font name" },
  "style": "modern|minimal|bold|elegant|playful",
  "mood": "professional|friendly|luxurious|energetic|calm"
}` }
          ]
        }]
      });

      // Track API cost
      if (response.usage && db && db.trackApiUsage) {
        const inputTokens = response.usage.input_tokens || 0;
        const outputTokens = response.usage.output_tokens || 0;
        const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
        console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
        try {
          await db.trackApiUsage({
            endpoint: 'claude-api', operation: 'analyze-site-vision',
            tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
          });
        } catch (trackingErr) {
            console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
          }
      }

      const responseText = response.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      console.log(`   ✅ Analysis complete for ${url}`);

      res.json({
        success: true,
        analysis: { url: url, ...analysis, mock: false, method: 'vision' }
      });

    } catch (err) {
      console.error(`   ❌ Analysis error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Generate theme from references
  router.post('/generate-theme', async (req, res) => {
    const { references } = req.body;

    if (!references || !Array.isArray(references) || references.length === 0) {
      return res.status(400).json({ success: false, error: 'References array required' });
    }

    console.log(`🎨 Generating theme from ${references.length} references`);

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      const refDescriptions = references.map((ref, i) => {
        const likes = ref.selectedStyles?.join(', ') || 'overall design';
        const notes = ref.notes || '';
        const analysis = ref.analysis ? JSON.stringify(ref.analysis) : 'not analyzed';
        return `Reference ${i + 1}: ${ref.url}\n  Likes: ${likes}\n  Notes: ${notes}\n  Analysis: ${analysis}`;
      }).join('\n\n');

      if (!apiKey) {
        console.log('   ⚠️ No ANTHROPIC_API_KEY - returning mock theme');
        return res.json({
          success: true,
          theme: {
            colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#06b6d4', background: '#0f172a', surface: '#1e293b', text: '#e2e8f0', textMuted: '#94a3b8' },
            fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
            borderRadius: '12px',
            style: 'modern',
            mock: true
          }
        });
      }

      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Based on these reference sites and what the user likes about each, generate a cohesive design theme.

${refDescriptions}

Return ONLY valid JSON with this structure:
{
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex", "textMuted": "#hex" },
  "fonts": { "heading": "font-family string", "body": "font-family string" },
  "borderRadius": "Npx",
  "style": "description"
}`
        }]
      });

      // Track API cost
      if (response.usage && db && db.trackApiUsage) {
        const inputTokens = response.usage.input_tokens || 0;
        const outputTokens = response.usage.output_tokens || 0;
        const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
        console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
        try {
          await db.trackApiUsage({
            endpoint: 'claude-api', operation: 'generate-theme',
            tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
          });
        } catch (trackingErr) {
            console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
          }
      }

      const responseText = response.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Could not parse theme response');
      }

      const theme = JSON.parse(jsonMatch[0]);
      console.log(`   ✅ Theme generated`);

      res.json({ success: true, theme: { ...theme, mock: false } });

    } catch (err) {
      console.error(`   ❌ Theme generation error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Analyze existing site (for enhance mode)
  router.post('/analyze-existing-site', async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL required' });
    }

    console.log(`🔍 Analyzing existing site: ${url}`);

    try {
      const axios = require('axios');
      const apiKey = process.env.ANTHROPIC_API_KEY;

      let siteUrl = url.trim();
      if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
        siteUrl = 'https://' + siteUrl;
      }

      let html = '';
      try {
        const response = await axios.get(siteUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          }
        });
        html = response.data;
      } catch (fetchErr) {
        try {
          const altUrl = siteUrl.replace('https://', 'http://');
          const altResponse = await axios.get(altUrl, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          html = altResponse.data;
        } catch (altErr) {
          console.log(`   ⚠️ Failed to fetch site: ${fetchErr.message}`);
          html = '';
        }
      }

      console.log(`   📄 Fetched ${html.length} characters`);

      // Extract design system with enhanced image categorization
      const extractDesignSystem = (html, baseUrl) => {
        const design = { colors: [], fonts: [], images: [], categorizedImages: {}, sections: [], cssVariables: {} };

        // Parse base URL for making absolute URLs
        let urlBase = '';
        try {
          const urlObj = new URL(baseUrl);
          urlBase = urlObj.origin;
        } catch (e) {
          urlBase = baseUrl.replace(/\/[^\/]*$/, '');
        }

        // Helper to make absolute URL
        const makeAbsolute = (src) => {
          if (!src) return null;
          if (src.startsWith('data:')) return null;
          if (src.startsWith('//')) return 'https:' + src;
          if (src.startsWith('http://') || src.startsWith('https://')) return src;
          if (src.startsWith('/')) return urlBase + src;
          return urlBase + '/' + src;
        };

        // Filter out junk images
        const isJunkImage = (src, alt) => {
          const junkPatterns = [
            'pixel', 'tracking', 'spacer', 'blank', 'transparent',
            'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest',
            'google-analytics', 'gtm', 'fbevents', 'analytics',
            'icon-', 'ico-', 'favicon', '.ico', '.svg',
            'loading', 'spinner', 'ajax', 'loader',
            'gravatar', 'avatar-default', 'placeholder',
            '1x1', '2x2', 'pixel.gif', 'clear.gif',
            'wp-content/plugins', 'wp-includes'
          ];
          const srcLower = (src || '').toLowerCase();
          const altLower = (alt || '').toLowerCase();
          return junkPatterns.some(p => srcLower.includes(p) || altLower.includes(p));
        };

        // Categorize image based on context
        const categorizeImage = (src, alt, context) => {
          const srcLower = (src || '').toLowerCase();
          const altLower = (alt || '').toLowerCase();
          const ctxLower = (context || '').toLowerCase();

          // Logo detection
          if (srcLower.includes('logo') || altLower.includes('logo') || ctxLower.includes('logo') ||
              ctxLower.includes('brand') || ctxLower.includes('site-title')) {
            return 'logo';
          }

          // Hero/banner detection
          if (ctxLower.includes('hero') || ctxLower.includes('banner') || ctxLower.includes('slider') ||
              ctxLower.includes('carousel') || ctxLower.includes('jumbotron') || srcLower.includes('hero') ||
              srcLower.includes('banner') || srcLower.includes('slide')) {
            return 'hero';
          }

          // Team/staff detection
          if (altLower.includes('team') || altLower.includes('staff') || altLower.includes('employee') ||
              ctxLower.includes('team') || ctxLower.includes('about-us') || altLower.includes('ceo') ||
              altLower.includes('founder') || altLower.includes('owner') || altLower.includes('manager')) {
            return 'team';
          }

          // Gallery detection
          if (ctxLower.includes('gallery') || ctxLower.includes('portfolio') || ctxLower.includes('lightbox') ||
              ctxLower.includes('grid') || srcLower.includes('gallery')) {
            return 'gallery';
          }

          // Product detection
          if (ctxLower.includes('product') || ctxLower.includes('item') || ctxLower.includes('shop') ||
              ctxLower.includes('menu-item') || ctxLower.includes('service') || srcLower.includes('product')) {
            return 'product';
          }

          // Background detection
          if (ctxLower.includes('background') || ctxLower.includes('bg-') || srcLower.includes('background') ||
              srcLower.includes('-bg')) {
            return 'background';
          }

          return 'general';
        };

        // Extract colors
        const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
        const colorMatches = html.match(colorRegex) || [];
        const colorCounts = {};
        colorMatches.forEach(c => { const n = c.toLowerCase(); colorCounts[n] = (colorCounts[n] || 0) + 1; });
        design.colors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c);

        // Extract fonts
        const fontRegex = /font-family:\s*([^;}"']+)/gi;
        let fontMatch;
        const fontSet = new Set();
        while ((fontMatch = fontRegex.exec(html)) !== null) {
          const font = fontMatch[1].trim().split(',')[0].replace(/["']/g, '').trim();
          if (font && font.length < 50) fontSet.add(font);
        }
        design.fonts = Array.from(fontSet).slice(0, 5);

        // Enhanced image extraction with context
        const imgRegex = /<(?:img|source)[^>]+(?:src|srcset)=["']([^"']+)["'][^>]*>/gi;
        const bgImageRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
        let imgMatch;
        const seenUrls = new Set();

        // Initialize categories
        design.categorizedImages = {
          logo: [],
          hero: [],
          team: [],
          gallery: [],
          product: [],
          background: [],
          general: []
        };

        // Extract <img> and <source> tags with surrounding context
        while ((imgMatch = imgRegex.exec(html)) !== null) {
          let src = imgMatch[1].split(',')[0].split(' ')[0]; // Handle srcset
          src = makeAbsolute(src);

          if (!src || seenUrls.has(src)) continue;

          const altMatch = imgMatch[0].match(/alt=["']([^"']*?)["']/i);
          const alt = altMatch ? altMatch[1] : '';

          if (isJunkImage(src, alt)) continue;

          // Get surrounding context (100 chars before the img tag)
          const imgIndex = imgMatch.index;
          const context = html.substring(Math.max(0, imgIndex - 200), imgIndex);

          const category = categorizeImage(src, alt, context);
          const imgData = { src, alt, category };

          seenUrls.add(src);
          design.images.push(imgData);
          design.categorizedImages[category].push(imgData);
        }

        // Extract CSS background images
        while ((imgMatch = bgImageRegex.exec(html)) !== null) {
          let src = imgMatch[1];
          src = makeAbsolute(src);

          if (!src || seenUrls.has(src) || isJunkImage(src, '')) continue;

          // Get surrounding context
          const bgIndex = imgMatch.index;
          const context = html.substring(Math.max(0, bgIndex - 200), bgIndex + 200);

          const category = categorizeImage(src, '', context);
          const imgData = { src, alt: '', category, isBgImage: true };

          seenUrls.add(src);
          design.images.push(imgData);
          design.categorizedImages[category].push(imgData);
        }

        // Also check for Open Graph / meta images (often high quality)
        const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogImageMatch) {
          const src = makeAbsolute(ogImageMatch[1]);
          if (src && !seenUrls.has(src)) {
            const imgData = { src, alt: 'OG Image', category: 'hero', isOgImage: true };
            design.images.unshift(imgData); // Put at front - usually best quality
            design.categorizedImages.hero.unshift(imgData);
          }
        }

        // Limit images per category
        Object.keys(design.categorizedImages).forEach(cat => {
          design.categorizedImages[cat] = design.categorizedImages[cat].slice(0, 10);
        });
        design.images = design.images.slice(0, 30);

        console.log(`   📸 Images extracted: ${design.images.length} total`);
        console.log(`      Logo: ${design.categorizedImages.logo.length}, Hero: ${design.categorizedImages.hero.length}, Gallery: ${design.categorizedImages.gallery.length}`);

        return design;
      };

      const extractContent = (html) => {
        const content = { headlines: [], paragraphs: [], prices: [] };

        const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
        const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
        content.headlines = [...h1Matches, ...h2Matches].map(h => h.replace(/<[^>]+>/g, '').trim()).filter(h => h.length > 2 && h.length < 200);

        const pMatches = html.match(/<p[^>]*>([^<]{20,500})<\/p>/gi) || [];
        content.paragraphs = pMatches.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(p => p.length > 20).slice(0, 20);

        const priceMatches = html.match(/\$\d+(?:\.\d{2})?/g) || [];
        content.prices = [...new Set(priceMatches)];

        return content;
      };

      if (html.length === 0 && !apiKey) {
        return res.status(400).json({ success: false, error: 'Could not fetch website and no API key for fallback' });
      }

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const phoneRegex = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
      const phones = html.match(phoneRegex) || [];
      const phone = phones[0] || '';

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = html.match(emailRegex) || [];
      const email = emails.find(e => !e.includes('example') && !e.includes('wordpress')) || '';

      const designSystem = extractDesignSystem(html, siteUrl);
      const pageContent = extractContent(html);

      if (!apiKey) {
        return res.json({
          success: true,
          analysis: {
            url: siteUrl,
            businessName: title.split('|')[0].split('-')[0].trim(),
            phone, email,
            industry: 'unknown',
            designSystem, pageContent,
            mock: true
          }
        });
      }

      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const truncatedHtml = html.substring(0, 15000);

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Analyze this website HTML and extract business information. Return ONLY valid JSON.

Website URL: ${siteUrl}
Title: ${title}
Phone: ${phone}
Email: ${email}

HTML Content (truncated):
${truncatedHtml}

Return JSON with this structure:
{
  "businessName": "extracted business name",
  "industry": "detected industry",
  "phone": "phone number",
  "email": "email address",
  "address": "physical address if found",
  "description": "2-3 sentence description",
  "keyServices": ["service1", "service2"],
  "recommendations": {
    "pages": ["home", "about", "services", "contact"],
    "improvements": ["improvement1", "improvement2"]
  }
}`
        }]
      });

      // Track API cost
      if (response.usage && db && db.trackApiUsage) {
        const inputTokens = response.usage.input_tokens || 0;
        const outputTokens = response.usage.output_tokens || 0;
        const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
        console.log(`   💰 API Cost: $${cost.toFixed(4)} (${inputTokens} in / ${outputTokens} out)`);
        try {
          await db.trackApiUsage({
            endpoint: 'claude-api', operation: 'analyze-existing-site',
            tokensUsed: inputTokens + outputTokens, inputTokens, outputTokens, cost, responseStatus: 200
          });
        } catch (trackingErr) {
            console.warn('   ⚠️ API usage tracking failed:', trackingErr.message);
          }
      }

      const responseText = response.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      console.log(`   ✅ Analysis complete: ${analysis.businessName}`);

      res.json({
        success: true,
        analysis: { url: siteUrl, ...analysis, designSystem, pageContent, mock: false }
      });

    } catch (err) {
      console.error(`   ❌ Analysis error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = { createUtilityRoutes };
