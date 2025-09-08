import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Debug logging removed

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AuraAnalysis {
  id: string
  username: string
  profile_image_url: string
  aura_percentage: number
  description: string
  created_at: string
}

export async function getAuraAnalysis(username: string): Promise<AuraAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from('aura_analyses')
      .select('*')
      .eq('username', username.toLowerCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Supabase error in getAuraAnalysis:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return data
  } catch (err) {
    console.error('Network error in getAuraAnalysis:', err)
    throw new Error(`Failed to connect to database: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

export async function createAuraAnalysis(
  username: string,
  profileImageUrl: string,
  auraPercentage: number,
  description: string
): Promise<AuraAnalysis> {
  const { data, error } = await supabase
    .from('aura_analyses')
    .insert([
      {
        username: username.toLowerCase(),
        profile_image_url: profileImageUrl,
        aura_percentage: auraPercentage,
        description: description
      }
    ])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}