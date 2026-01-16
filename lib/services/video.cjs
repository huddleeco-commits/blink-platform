/**
 * Video Services
 * Extracted from server.cjs
 *
 * Handles: Pexels video fetching, industry video selection
 */

// Dynamic video cache (in-memory, resets on server restart)
const videoCache = new Map();

/**
 * Fetch video from Pexels API based on search query
 */
async function fetchPexelsVideo(searchQuery) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || apiKey === 'your_pexels_api_key_here') {
    console.log('   ⚠️ Pexels API key not configured');
    return null;
  }

  // Check cache first
  const cacheKey = searchQuery.toLowerCase().trim();
  if (videoCache.has(cacheKey)) {
    console.log(`   📹 Using cached video for: ${searchQuery}`);
    return videoCache.get(cacheKey);
  }

  try {
    console.log(`   🔍 Searching Pexels for video: ${searchQuery}`);
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    );

    if (!response.ok) {
      console.log(`   ⚠️ Pexels API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.videos && data.videos.length > 0) {
      // Find HD or higher quality video file
      const video = data.videos[0];
      const hdFile = video.video_files.find(f => f.quality === 'hd' || f.quality === 'uhd' || f.height >= 720);
      const videoUrl = hdFile ? hdFile.link : video.video_files[0].link;

      console.log(`   ✅ Found Pexels video: ${videoUrl.substring(0, 60)}...`);

      // Cache the result
      videoCache.set(cacheKey, videoUrl);

      return videoUrl;
    }

    console.log(`   ⚠️ No Pexels videos found for: ${searchQuery}`);
    return null;
  } catch (err) {
    console.log(`   ⚠️ Pexels API fetch error: ${err.message}`);
    return null;
  }
}

/**
 * Get video URL for an industry - tries dynamic fetch first, falls back to null
 */
async function getIndustryVideo(industryName, businessName = '') {
  // Build search terms based on industry and business name
  const searchTerms = [];

  // Add industry-specific terms
  const industryLower = industryName.toLowerCase();
  if (industryLower.includes('pizza')) searchTerms.push('pizza making', 'pizzeria');
  else if (industryLower.includes('restaurant') || industryLower.includes('food')) searchTerms.push('restaurant cooking', 'chef cooking');
  else if (industryLower.includes('spa') || industryLower.includes('wellness')) searchTerms.push('spa massage', 'wellness relaxation');
  else if (industryLower.includes('fitness') || industryLower.includes('gym')) searchTerms.push('gym workout', 'fitness training');
  else if (industryLower.includes('salon') || industryLower.includes('hair')) searchTerms.push('hair salon', 'hairstylist');
  else if (industryLower.includes('plumb')) searchTerms.push('plumber working', 'plumbing repair');
  else if (industryLower.includes('electric')) searchTerms.push('electrician working', 'electrical work');
  else if (industryLower.includes('construct')) searchTerms.push('construction site', 'building construction');
  else if (industryLower.includes('dental') || industryLower.includes('dentist')) searchTerms.push('dental office', 'dentist');
  else if (industryLower.includes('landscap') || industryLower.includes('lawn')) searchTerms.push('landscaping garden', 'lawn care');
  else if (industryLower.includes('clean')) searchTerms.push('cleaning service', 'house cleaning');
  else if (industryLower.includes('auto') || industryLower.includes('mechanic')) searchTerms.push('auto repair', 'mechanic working');
  else if (industryLower.includes('pet') || industryLower.includes('vet')) searchTerms.push('pet grooming', 'veterinary');
  else if (industryLower.includes('hotel') || industryLower.includes('hospitality')) searchTerms.push('luxury hotel', 'hotel lobby');
  else if (industryLower.includes('real estate')) searchTerms.push('luxury home', 'real estate');
  else if (industryLower.includes('law') || industryLower.includes('attorney')) searchTerms.push('law office', 'lawyer');
  else if (industryLower.includes('cafe') || industryLower.includes('coffee')) searchTerms.push('coffee shop', 'barista coffee');
  else if (industryLower.includes('bakery') || industryLower.includes('pastry')) searchTerms.push('bakery', 'baking bread');
  else if (industryLower.includes('tattoo')) searchTerms.push('tattoo artist', 'tattoo studio');
  else if (industryLower.includes('barber')) searchTerms.push('barber shop', 'barber haircut');
  else searchTerms.push(industryName); // Use industry name as search term

  // Try to fetch from Pexels
  for (const term of searchTerms) {
    const videoUrl = await fetchPexelsVideo(term);
    if (videoUrl) return videoUrl;
  }

  // Fallback: return null (will use hardcoded or no video)
  return null;
}

module.exports = {
  fetchPexelsVideo,
  getIndustryVideo,
  videoCache
};
