export function getAuraDescription(percentage: number): string {
  // More varied descriptions with some randomness
  const descriptions: { [key: string]: string[] } = {
    legendary: [ // 95-100
      "God-tier aura",
      "Legendary presence", 
      "Untouchable energy",
      "Main character vibes",
      "Absolutely unmatched",
      "Hall of fame worthy"
    ],
    elite: [ // 90-94
      "Elite status",
      "Insane presence",
      "Powerful aura",
      "Top tier energy",
      "Exceptional vibes"
    ],
    excellent: [ // 85-89
      "Commanding presence",
      "Strong aura game",
      "Impressive energy",
      "Notable presence",
      "Striking vibes"
    ],
    veryGood: [ // 80-84
      "Very solid aura",
      "Great energy",
      "Strong presence",
      "Quality vibes",
      "Respectable aura"
    ],
    good: [ // 70-79
      "Good presence",
      "Solid vibes",
      "Nice energy",
      "Above average",
      "Pretty decent"
    ],
    aboveAverage: [ // 60-69
      "Decent aura",
      "Not bad honestly",
      "Acceptable vibes",
      "Fair presence",
      "Alright energy"
    ],
    average: [ // 50-59
      "Mid tier",
      "Average vibes",
      "Standard issue",
      "Nothing special",
      "Basic energy"
    ],
    belowAverage: [ // 40-49
      "Below mid",
      "Lacking presence",
      "Weak sauce",
      "Needs work",
      "Low vibes"
    ],
    poor: [ // 30-39
      "Poor showing",
      "Weak aura",
      "Not it chief",
      "Missing something",
      "Rough vibes"
    ],
    veryPoor: [ // 20-29
      "Very weak",
      "Bad energy",
      "Aura deficit",
      "Major L",
      "Tough scene"
    ],
    terrible: [ // 10-19
      "Zero presence",
      "Aura bankruptcy",
      "Complete miss",
      "Big yikes",
      "Down bad"
    ],
    catastrophic: [ // 0-9
      "Negative aura",
      "Aura vacuum",
      "Rock bottom",
      "Absolutely cooked",
      "Beyond saving"
    ]
  }
  
  // Select appropriate category and pick random description
  let category: string[]
  
  if (percentage >= 95) category = descriptions.legendary
  else if (percentage >= 90) category = descriptions.elite
  else if (percentage >= 85) category = descriptions.excellent
  else if (percentage >= 80) category = descriptions.veryGood
  else if (percentage >= 70) category = descriptions.good
  else if (percentage >= 60) category = descriptions.aboveAverage
  else if (percentage >= 50) category = descriptions.average
  else if (percentage >= 40) category = descriptions.belowAverage
  else if (percentage >= 30) category = descriptions.poor
  else if (percentage >= 20) category = descriptions.veryPoor
  else if (percentage >= 10) category = descriptions.terrible
  else category = descriptions.catastrophic
  
  // Return random description from category
  return category[Math.floor(Math.random() * category.length)]
}

export function getAuraColor(percentage: number): string {
  // More nuanced color gradients
  if (percentage >= 95) return "#FFD700" // Gold
  if (percentage >= 90) return "#FFA500" // Orange-gold
  if (percentage >= 85) return "#FF6B35" // Burnt orange
  if (percentage >= 80) return "#FF4757" // Red-orange
  if (percentage >= 75) return "#C44569" // Deep pink
  if (percentage >= 70) return "#8B5CF6" // Purple
  if (percentage >= 65) return "#6366F1" // Indigo
  if (percentage >= 60) return "#3B82F6" // Blue
  if (percentage >= 55) return "#06B6D4" // Cyan
  if (percentage >= 50) return "#10B981" // Emerald
  if (percentage >= 45) return "#84CC16" // Lime
  if (percentage >= 40) return "#EAB308" // Yellow
  if (percentage >= 35) return "#F97316" // Orange
  if (percentage >= 30) return "#EF4444" // Red
  if (percentage >= 25) return "#DC2626" // Dark red
  if (percentage >= 20) return "#991B1B" // Darker red
  if (percentage >= 15) return "#7F1D1D" // Very dark red
  if (percentage >= 10) return "#6B7280" // Gray
  if (percentage >= 5) return "#4B5563" // Dark gray
  return "#1F2937" // Almost black
}