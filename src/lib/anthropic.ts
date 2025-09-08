import Anthropic from '@anthropic-ai/sdk'

const apiKey = import.meta.env.ANTHROPIC_API_KEY

if (!apiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable. Please check your .env file.')
}

const anthropic = new Anthropic({
  apiKey: apiKey,
})

export interface AuraResult {
  percentage: number
  description: string
}

export async function analyzeAura(imageUrl: string): Promise<AuraResult> {
  try {
    // Fetch the image to convert to base64
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    
    // Determine media type based on the actual image headers or content
    let mediaType = 'image/jpeg' // default
    
    // Try to detect the actual content type from the response
    const imageResponse = await fetch(imageUrl, { method: 'HEAD' })
    if (imageResponse.ok) {
      const contentType = imageResponse.headers.get('content-type')
      if (contentType && contentType.startsWith('image/')) {
        mediaType = contentType
      }
    }
    
    // Fallback to URL-based detection if headers don't help
    if (mediaType === 'image/jpeg') {
      if (imageUrl.includes('.png')) mediaType = 'image/png'
      else if (imageUrl.includes('.webp')) mediaType = 'image/webp'
      else if (imageUrl.includes('.gif')) mediaType = 'image/gif'
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this Twitter/X profile picture and rate its "aura" on a scale of 0-100%. 

Be HARSH and REALISTIC with your ratings. Most profile pictures should score between 20-70%.
- 0-20%: Terrible profile pictures (blurry, unflattering, zero effort)
- 20-40%: Below average (poor quality, awkward, bad lighting)
- 40-60%: Average/normal profile pictures (most people fall here)
- 60-80%: Above average (good quality, nice composition, good vibes)
- 80-90%: Exceptional (professional, striking, memorable)
- 90-100%: Extremely rare, truly legendary (reserve for absolutely exceptional cases)

This profile picture could be anything - a person, animal, object, artwork, meme, landscape, etc.

Consider:
- Visual impact and first impression
- Photo/image quality (lighting, composition, clarity)
- Uniqueness and memorability
- The vibe/energy it projects
- Authenticity vs trying too hard
- Context appropriateness for a profile pic

For people: expression, confidence, natural vs posed
For objects/art: aesthetic appeal, creativity, relevance
For memes: humor value, originality, timing

BE CRITICAL. Most pics are average. High scores should be RARE.

Respond with ONLY a JSON object:
{"percentage": 45}

Just the percentage, nothing else.`
            }
          ]
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    try {
      const jsonMatch = responseText.match(/\{[^}]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const result = JSON.parse(jsonMatch[0])
      
      // Validate the response
      if (typeof result.percentage !== 'number') {
        throw new Error('Invalid response format')
      }
      
      // Clamp percentage between 0-100
      let percentage = Math.max(0, Math.min(100, Math.round(result.percentage)))
      
      // Add some randomness to avoid clustering (±3%)
      const variance = Math.floor(Math.random() * 7) - 3
      percentage = Math.max(0, Math.min(100, percentage + variance))
      
      // We'll generate the description in the other file based on percentage
      return {
        percentage,
        description: '' // Will be set by getAuraDescription
      }
    } catch (parseError) {
      console.error('Failed to parse Anthropic response:', responseText)
      throw new Error('Failed to parse aura analysis result')
    }
    
  } catch (error) {
    console.error('Error analyzing aura:', error)
    throw new Error('Failed to analyze profile picture aura')
  }
}