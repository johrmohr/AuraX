import type { APIRoute } from 'astro'
import { getAuraAnalysis, createAuraAnalysis } from '../../lib/supabase'
import { extractProfilePicture } from '../../lib/firecrawl'
import { analyzeAura } from '../../lib/anthropic'
import { getAuraDescription } from '../../lib/aura-descriptions'

export const POST: APIRoute = async ({ request }) => {
  try {
    let username: string
    
    try {
      const body = await request.json()
      username = body.username
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const cleanUsername = username.trim().replace('@', '').toLowerCase()

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'Invalid username format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if analysis already exists
    const existingAnalysis = await getAuraAnalysis(cleanUsername)
    if (existingAnalysis) {
      return new Response(
        JSON.stringify({
          username: existingAnalysis.username,
          aura_percentage: existingAnalysis.aura_percentage,
          description: existingAnalysis.description,
          profile_image_url: existingAnalysis.profile_image_url,
          cached: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract profile picture using Firecrawl
    const profileImageUrl = await extractProfilePicture(cleanUsername)

    // Analyze aura using Anthropic
    const auraResult = await analyzeAura(profileImageUrl)
    
    // Override the description with our predefined ones
    const description = getAuraDescription(auraResult.percentage)

    // Save to database
    const savedAnalysis = await createAuraAnalysis(
      cleanUsername,
      profileImageUrl,
      auraResult.percentage,
      description
    )

    return new Response(
      JSON.stringify({
        username: savedAnalysis.username,
        aura_percentage: savedAnalysis.aura_percentage,
        description: savedAnalysis.description,
        profile_image_url: savedAnalysis.profile_image_url,
        cached: false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze endpoint:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}