import { getAllContent, CONTENT_TYPES } from '@/lib/content'
import type { Language, ContentItem } from '@/lib/content'

export interface ArticleLink {
  url: string
  title: string
}

export type ModuleLinkMap = Record<string, ArticleLink | null>

interface ArticleWithType extends ContentItem {
  contentType: string
}

// Module sub-field mapping: moduleKey -> { field, nameKey }
const MODULE_FIELDS: Record<string, { field: string; nameKey: string }> = {
  beginnerGuide: { field: 'steps', nameKey: 'title' },
  tierList: { field: 'tiers', nameKey: 'tier' },
  bestBuilds: { field: 'builds', nameKey: 'cookie' },
  cookiesList: { field: 'cookies', nameKey: 'name' },
  gameModes: { field: 'modes', nameKey: 'name' },
  currencyGuide: { field: 'currencies', nameKey: 'name' },
  rolesGuide: { field: 'roles', nameKey: 'name' },
  ovenCrownRoad: { field: 'steps', nameKey: 'title' },
  summonGuide: { field: 'summons', nameKey: 'name' },
  inviteCodes: { field: 'items', nameKey: 'title' },
  friendsParty: { field: 'steps', nameKey: 'title' },
  ratesGuide: { field: 'tables', nameKey: 'name' },
  costumes: { field: 'items', nameKey: 'name' },
  updates: { field: 'channels', nameKey: 'name' },
  troubleshooting: { field: 'items', nameKey: 'question' },
}

// Extra semantic keywords per module to boost matching for h2 titles
// These supplement the module title text when matching against articles
const MODULE_EXTRA_KEYWORDS: Record<string, string[]> = {
  beginnerGuide: ['beginner', 'how to play', 'starter', 'guide', 'progression'],
  tierList: ['tier list', 'best character', 'meta', 'ranking'],
  bestBuilds: ['build', 'spell card', 'loadout', 'cookie build'],
  cookiesList: ['cookies', 'character', 'rarity', 'role'],
  gameModes: ['battle', 'arena', 'pvp', 'mode'],
  currencyGuide: ['gems', 'coins', 'currency', 'resources'],
  rolesGuide: ['tank', 'support', 'attacker', 'role'],
  ovenCrownRoad: ['crown road', 'progression', 'missions', 'kingdom'],
  summonGuide: ['summon', 'gacha', 'banner', 'pull'],
  inviteCodes: ['invite', 'referral', 'code', 'reward'],
  friendsParty: ['friends', 'party', 'co op', 'multiplayer'],
  ratesGuide: ['rates', 'probability', 'gacha rates', 'drop rate'],
  costumes: ['costume', 'skin', 'exclusive', 'outfit'],
  updates: ['update', 'patch', 'news', 'official'],
  troubleshooting: ['error', 'crash', 'fix', 'not working', 'lagging'],
}

const FILLER_WORDS = ['cookie', 'run', 'ovensmash', '2026', '2025', 'complete', 'the', 'and', 'for', 'how', 'with', 'our', 'this', 'your', 'all', 'from', 'learn', 'master']

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSignificantTokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter(w => w.length > 2 && !FILLER_WORDS.includes(w))
}

function matchScore(queryText: string, article: ArticleWithType, extraKeywords?: string[]): number {
  const normalizedQuery = normalize(queryText)
  const normalizedTitle = normalize(article.frontmatter.title)
  const normalizedDesc = normalize(article.frontmatter.description || '')
  const normalizedSlug = article.slug.replace(/-/g, ' ').toLowerCase()

  let score = 0

  // Exact phrase match in title (stripped of "Lucid Blocks")
  const strippedQuery = normalizedQuery.replace(/cookie\s*run\s*ovensmash?\s*/g, '').trim()
  const strippedTitle = normalizedTitle.replace(/cookie\s*run\s*ovensmash?\s*/g, '').trim()
  if (strippedQuery.length > 3 && strippedTitle.includes(strippedQuery)) {
    score += 100
  }

  // Token overlap from query text
  const queryTokens = getSignificantTokens(queryText)
  for (const token of queryTokens) {
    if (normalizedTitle.includes(token)) score += 20
    if (normalizedDesc.includes(token)) score += 5
    if (normalizedSlug.includes(token)) score += 15
  }

  // Extra keywords scoring (for module h2 titles)
  if (extraKeywords) {
    for (const kw of extraKeywords) {
      const normalizedKw = normalize(kw)
      if (normalizedTitle.includes(normalizedKw)) score += 15
      if (normalizedDesc.includes(normalizedKw)) score += 5
      if (normalizedSlug.includes(normalizedKw)) score += 10
    }
  }

  return score
}

function findBestMatch(
  queryText: string,
  articles: ArticleWithType[],
  extraKeywords?: string[],
  threshold = 20,
): ArticleLink | null {
  let bestScore = 0
  let bestArticle: ArticleWithType | null = null

  for (const article of articles) {
    const score = matchScore(queryText, article, extraKeywords)
    if (score > bestScore) {
      bestScore = score
      bestArticle = article
    }
  }

  if (bestScore >= threshold && bestArticle) {
    return {
      url: `/${bestArticle.contentType}/${bestArticle.slug}`,
      title: bestArticle.frontmatter.title,
    }
  }

  return null
}

export async function buildModuleLinkMap(locale: Language): Promise<ModuleLinkMap> {
  // 1. Load all articles across all content types
  const allArticles: ArticleWithType[] = []
  for (const contentType of CONTENT_TYPES) {
    const items = await getAllContent(contentType, locale)
    for (const item of items) {
      allArticles.push({ ...item, contentType })
    }
  }

  // 2. Load module data from en.json (use English for keyword matching)
  const enMessages = (await import('../locales/en.json')).default as any

  const linkMap: ModuleLinkMap = {}

  // 3. For each module, match h2 title and sub-items
  for (const [moduleKey, fieldConfig] of Object.entries(MODULE_FIELDS)) {
    const moduleData = enMessages.modules?.[moduleKey]
    if (!moduleData) continue

    // Match module h2 title (use extra keywords + lower threshold for broader matching)
    const moduleTitle = moduleData.title as string
    if (moduleTitle) {
      const extraKw = MODULE_EXTRA_KEYWORDS[moduleKey] || []
      linkMap[moduleKey] = findBestMatch(moduleTitle, allArticles, extraKw, 15)
    }

    // Match sub-items
    const subItems = moduleData[fieldConfig.field] as any[]
    if (Array.isArray(subItems)) {
      for (let i = 0; i < subItems.length; i++) {
        const itemName = subItems[i]?.[fieldConfig.nameKey] as string
        if (itemName) {
          const key = `${moduleKey}::${fieldConfig.field}::${i}`
          linkMap[key] = findBestMatch(itemName, allArticles)
        }
      }
    }
  }

  return linkMap
}
