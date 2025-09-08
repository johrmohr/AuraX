// Profile picture extraction - Twitter/X only, no alternatives

export async function extractProfilePicture(username: string): Promise<string> {
  console.log(`Attempting to extract profile picture for: ${username}`)
  
  // Clean the username
  const cleanUsername = username.replace('@', '').trim()
  
  // Try multiple methods in order
  const methods = [
    () => getViaTwitterOEmbed(cleanUsername),
    () => getTwitterProfileViaUnavatar(cleanUsername),
    () => tryDirectScrape(cleanUsername)
  ]
  
  for (const method of methods) {
    try {
      const imageUrl = await method()
      if (imageUrl) {
        console.log(`Successfully found Twitter/X profile image: ${imageUrl}`)
        return imageUrl
      }
    } catch (error) {
      console.log(`Method failed, trying next...`)
      continue
    }
  }
  
  // If we can't get the profile picture, throw an error
  throw new Error(`Unable to find Twitter/X profile picture for @${cleanUsername}. The account may be private, suspended, or inaccessible.`)
}

async function getViaTwitterOEmbed(username: string): Promise<string | null> {
  try {
    console.log(`Trying Twitter oEmbed API for ${username}`)
    
    // Get the user's latest tweet via oEmbed to extract profile image
    const oembedUrl = `https://publish.twitter.com/oembed?url=https://twitter.com/${username}`
    
    const response = await fetch(oembedUrl)
    if (!response.ok) {
      console.log(`oEmbed API failed with status ${response.status}`)
      return null
    }
    
    const data = await response.json()
    if (data && data.author_url) {
      // Try to get profile from the HTML in the oEmbed response
      const html = data.html || ''
      
      // Look for profile image in the embedded HTML
      const imgMatch = html.match(/https:\/\/pbs\.twimg\.com\/profile_images\/[^"'\s]+/i)
      if (imgMatch) {
        let profileUrl = imgMatch[0]
        // Convert to high quality
        if (!profileUrl.includes('_400x400')) {
          profileUrl = profileUrl
            .replace('_normal', '_400x400')
            .replace('_bigger', '_400x400')
            .replace('_200x200', '_400x400')
            .replace('_mini', '_400x400')
        }
        console.log(`Found profile image via oEmbed: ${profileUrl}`)
        return profileUrl
      }
    }
    
    return null
  } catch (error) {
    console.error('oEmbed method failed:', error)
    return null
  }
}

async function getTwitterProfileViaUnavatar(username: string): Promise<string | null> {
  try {
    // Use unavatar.io specifically for Twitter/X
    const urls = [
      `https://unavatar.io/x/${username}`,
      `https://unavatar.io/twitter/${username}`
    ]
    
    for (const baseUrl of urls) {
      try {
        console.log(`Fetching from: ${baseUrl}`)
        
        // First, check if the profile exists (with fallback=false)
        const checkUrl = `${baseUrl}?fallback=false`
        const checkResponse = await fetch(checkUrl, {
          method: 'HEAD',
          redirect: 'manual'
        })
        
        console.log(`Check response status: ${checkResponse.status}`)
        
        // If we get 404 with fallback=false, try without it to check for Link header
        if (checkResponse.status === 404) {
          console.log(`Got 404 with fallback=false, checking base URL for possible Link header`)
          
          // Some profiles might still have Link headers even with 404
          const baseResponse = await fetch(baseUrl, {
            method: 'HEAD'
          })
          
          const linkHeader = baseResponse.headers.get('link')
          if (linkHeader) {
            const match = linkHeader.match(/<([^>]+)>/)
            if (match && match[1] && (match[1].includes('pbs.twimg.com') || match[1].includes('abs.twimg.com'))) {
              let highQualityUrl = match[1]
              if (!match[1].includes('_400x400')) {
                highQualityUrl = match[1].replace(/_normal|_bigger|_200x200|_mini/, '_400x400')
              }
              console.log(`Found Twitter CDN URL in Link header: ${highQualityUrl}`)
              return highQualityUrl
            }
          }
          
          continue // Skip to next URL since this one doesn't have the profile
        }
        
        // Now fetch with GET to check headers
        const response = await fetch(checkUrl, {
          method: 'GET',
          redirect: 'manual'
        })
        
        console.log(`Response status: ${response.status}`)
        
        // Check the Link header first (for cached responses)
        const linkHeader = response.headers.get('link')
        if (linkHeader) {
          // Parse the Link header to get the canonical URL
          const match = linkHeader.match(/<([^>]+)>/)
          if (match && match[1]) {
            const canonicalUrl = match[1]
            console.log(`Found canonical URL in Link header: ${canonicalUrl}`)
            
            if (canonicalUrl.includes('pbs.twimg.com') || canonicalUrl.includes('abs.twimg.com')) {
              // This is the real Twitter profile image URL
              let highQualityUrl = canonicalUrl
              
              // Ensure we have the high quality version
              if (!canonicalUrl.includes('_400x400')) {
                highQualityUrl = canonicalUrl
                  .replace('_normal', '_400x400')
                  .replace('_bigger', '_400x400')
                  .replace('_200x200', '_400x400')
                  .replace('_mini', '_400x400')
                
                // If no size modifier was found, try to add one
                if (highQualityUrl === canonicalUrl && !canonicalUrl.includes('_400x400')) {
                  highQualityUrl = canonicalUrl.replace(/(\.\w+)(\?.*)?$/, '_400x400$1$2')
                }
              }
              
              console.log(`Using Twitter CDN image from Link header: ${highQualityUrl}`)
              return highQualityUrl
            }
          }
        }
        
        // Check if we got a redirect (302 or 301)
        if (response.status === 302 || response.status === 301) {
          const location = response.headers.get('location')
          console.log(`Got redirect to: ${location}`)
          
          if (location && (location.includes('pbs.twimg.com') || location.includes('abs.twimg.com'))) {
            // This is a real Twitter profile image
            let highQualityUrl = location
              .replace('_normal', '_400x400')
              .replace('_bigger', '_400x400')
              .replace('_200x200', '_400x400')
              .replace('_mini', '_400x400')
            
            if (highQualityUrl === location && !location.includes('_400x400')) {
              highQualityUrl = location.replace(/(\.\w+)(\?.*)?$/, '_400x400$1$2')
            }
            
            console.log(`Found Twitter CDN image via redirect: ${highQualityUrl}`)
            return highQualityUrl
          }
        }
        
        // If we got a 200 response, check if it's a real image
        if (response.status === 200) {
          const contentType = response.headers.get('content-type')
          const contentLength = response.headers.get('content-length')
          
          console.log(`Got 200 response, content-type: ${contentType}, size: ${contentLength}`)
          
          // Only accept larger images (> 10KB) to avoid placeholders
          if (contentType && contentType.includes('image') && contentLength && parseInt(contentLength) > 10000) {
            // Check if there's a Link header with the actual Twitter URL
            if (!linkHeader) {
              // This is likely the proxied Twitter image
              console.log(`Accepting unavatar.io proxied Twitter image: ${checkUrl}`)
              return checkUrl
            }
          } else {
            console.log(`Image too small (${contentLength} bytes), likely a placeholder`)
          }
        }
        
      } catch (error) {
        console.error(`Error with ${baseUrl}:`, error)
        continue
      }
    }
    
    console.log(`Could not find Twitter profile image via unavatar for ${username}`)
    return null
    
  } catch (error) {
    console.error('Error getting Twitter profile via unavatar:', error)
    return null
  }
}

async function tryDirectScrape(username: string): Promise<string | null> {
  try {
    console.log(`Attempting direct scrape for ${username}`)
    
    // Try different Twitter URLs
    const urls = [
      `https://twitter.com/${username}`,
      `https://x.com/${username}`,
      `https://mobile.twitter.com/${username}`
    ]
    
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        })
        
        // Skip if we get blocked
        if (response.status === 403 || response.status === 401) {
          console.log(`Access blocked for ${url} (${response.status})`)
          continue
        }
        
        if (!response.ok) {
          continue
        }
        
        const html = await response.text()
        
        // Look for profile images in various formats
        const patterns = [
          /https:\/\/pbs\.twimg\.com\/profile_images\/[\d]+\/[^"'\s]+/gi,
          /<meta\s+property="og:image"\s+content="([^"]+)"/i,
          /<meta\s+content="([^"]+)"\s+property="og:image"/i,
          /<meta\s+name="twitter:image"\s+content="([^"]+)"/i,
          /<meta\s+content="([^"]+)"\s+name="twitter:image"/i,
          /"profile_image_url_https":"([^"]+)"/i
        ]
        
        for (const pattern of patterns) {
          const matches = html.match(pattern)
          if (matches) {
            for (const match of matches) {
              // Extract URL from meta tag or use direct match
              let imageUrl = match
              if (match.includes('content=')) {
                const urlMatch = match.match(/content="([^"]+)"/)
                if (urlMatch) imageUrl = urlMatch[1]
              } else if (match.includes('profile_image_url_https')) {
                const urlMatch = match.match(/"([^"]+)"/)
                if (urlMatch) imageUrl = urlMatch[1]
              }
              
              // Clean up URL
              imageUrl = imageUrl.replace(/\\u002F/g, '/').replace(/\\/g, '')
              
              if (imageUrl.includes('pbs.twimg.com') || imageUrl.includes('abs.twimg.com')) {
                let highQualityUrl = imageUrl
                  .replace('_normal', '_400x400')
                  .replace('_bigger', '_400x400')
                  .replace('_200x200', '_400x400')
                  .replace('_mini', '_400x400')
                
                console.log(`Found Twitter image via direct scrape: ${highQualityUrl}`)
                return highQualityUrl
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error)
        continue
      }
    }
    
    return null
  } catch (error) {
    console.error('Direct scrape failed:', error)
    return null
  }
}