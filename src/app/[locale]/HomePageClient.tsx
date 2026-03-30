'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Copy,
  Crown,
  ExternalLink,
  Gift,
  Handshake,
  LifeBuoy,
  MessageCircle,
  Shield,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Swords,
  Trophy,
  UserPlus,
  Users,
  Wrench,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { useMessages } from 'next-intl'
import { VideoFeature } from '@/components/home/VideoFeature'
import { LatestGuidesAccordion } from '@/components/home/LatestGuidesAccordion'
import { NativeBannerAd, AdBanner } from '@/components/ads'
import { scrollToSection } from '@/lib/scrollToSection'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import type { ContentItemWithType } from '@/lib/getLatestArticles'
import type { ModuleLinkMap } from '@/lib/buildModuleLinkMap'

// Lazy load heavy components
const HeroStats = lazy(() => import('@/components/home/HeroStats'))
const FAQSection = lazy(() => import('@/components/home/FAQSection'))
const CTASection = lazy(() => import('@/components/home/CTASection'))

// Loading placeholder
const LoadingPlaceholder = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`} />
)

interface HomePageClientProps {
  latestArticles: ContentItemWithType[]
  moduleLinkMap: ModuleLinkMap
  locale: string
}

// Section IDs matching the 16 modules
const MODULE_NAV = [
  { id: 'beginner-guide', icon: BookOpen, label: 'Beginner Guide' },
  { id: 'codes', icon: Gift, label: 'Codes' },
  { id: 'tier-list', icon: Trophy, label: 'Tier List' },
  { id: 'best-builds', icon: Wrench, label: 'Best Builds' },
  { id: 'cookies-list', icon: Users, label: 'Cookies List' },
  { id: 'game-modes', icon: Swords, label: 'Game Modes' },
  { id: 'currency-guide', icon: Coins, label: 'Currency' },
  { id: 'roles-guide', icon: ShieldCheck, label: 'Roles' },
  { id: 'oven-crown-road', icon: Crown, label: 'Crown Road' },
  { id: 'summon-guide', icon: Sparkles, label: 'Summon' },
  { id: 'invite-codes', icon: UserPlus, label: 'Invite Codes' },
  { id: 'friends-party', icon: Handshake, label: 'Friends & Party' },
  { id: 'rates-guide', icon: BarChart3, label: 'Rates' },
  { id: 'costumes', icon: Shirt, label: 'Costumes' },
  { id: 'updates', icon: Bell, label: 'Updates' },
  { id: 'troubleshooting', icon: LifeBuoy, label: 'Troubleshooting' },
]

export default function HomePageClient({ latestArticles, moduleLinkMap, locale }: HomePageClientProps) {
  const t = useMessages() as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cookierunovensmash.wiki'

  // Structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: "CookieRun: OvenSmash Wiki",
        description: "Complete CookieRun: OvenSmash Wiki covering cookies, builds, tier lists, codes, battle modes, spell cards, and beginner tips for iOS, Android, and PC players.",
        image: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "CookieRun: OvenSmash - Urban Fantasy PvP Brawler",
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: "CookieRun: OvenSmash Wiki",
        alternateName: "CookieRun OvenSmash",
        url: siteUrl,
        description: "Complete CookieRun: OvenSmash Wiki resource hub for cookies, builds, tier lists, codes, battle modes, and beginner guides",
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "CookieRun: OvenSmash Wiki - Urban Fantasy PvP Brawler",
        },
        sameAs: [
          'https://game.devsisters.com/en/ovensmash/',
          'https://discord.gg/crovensmash',
          'https://www.reddit.com/r/cookierunovensmash/',
          'https://www.youtube.com/@cookierunovensmash',
          'https://x.com/CROvenSmash',
        ],
      },
      {
        '@type': 'VideoGame',
        name: "CookieRun: OvenSmash",
        gamePlatform: ['iOS', 'Android', 'PC'],
        applicationCategory: 'Game',
        genre: ['Action', 'PvP', 'Brawler', 'Urban Fantasy'],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 8,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: '0',
          availability: 'https://schema.org/InStock',
          url: 'https://play.google.com/store/apps/details?id=com.devsisters.cos',
        },
      },
    ],
  }

  // Accordion states
  const [modeExpanded, setModeExpanded] = useState<number | null>(null)
  const [summonExpanded, setSummonExpanded] = useState<number | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal-visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 移动端横幅 Sticky */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-6">
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-sm font-medium">{t.hero.badge}</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => scrollToSection('codes')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-lg transition-colors"
              >
                <Gift className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://play.google.com/store/apps/details?id=com.devsisters.cos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-lg transition-colors"
              >
                {t.hero.playOnGooglePlayCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* 广告位 2: 原生横幅 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ''} />

      {/* Video Section */}
      <section className="px-4 py-12">
        <div className="scroll-reveal container mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <VideoFeature
              videoId="Um9Z8X9MalE"
              title="CookieRun: OvenSmash Official Launch Trailer"
              posterImage="/images/hero.webp"
            />
          </div>
        </div>
      </section>

      {/* Module Navigation - Right below video */}
      <section className="px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6 scroll-reveal">
            <h2 className="text-lg font-semibold text-[hsl(var(--nav-theme-light))]">
              {t.moduleNav?.title || 'Jump to Guide'}
            </h2>
          </div>
          <div className="scroll-reveal flex flex-wrap justify-center gap-2">
            {MODULE_NAV.map((nav) => {
              const Icon = nav.icon
              return (
                <button
                  key={nav.id}
                  onClick={() => scrollToSection(nav.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                             bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.2)]
                             hover:bg-[hsl(var(--nav-theme)/0.15)] hover:border-[hsl(var(--nav-theme)/0.4)]
                             transition-all duration-200 text-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))]" />
                  <span>{nav.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <LatestGuidesAccordion articles={latestArticles} locale={locale} max={30} />

      {/* 广告位 3: 标准横幅 728×90 */}
      <AdBanner type="banner-728x90" adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90} />

      {/* Tools Grid - 16 Navigation Cards */}
      <section className="px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t.tools.title}{' '}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {t.tools.cards.map((card: any, index: number) => {
              const sectionId = MODULE_NAV[index]?.id || ''

              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="scroll-reveal group p-6 rounded-xl border border-border
                             bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                             transition-all duration-300 cursor-pointer text-left
                             hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg mb-4
                                  bg-[hsl(var(--nav-theme)/0.1)]
                                  flex items-center justify-center
                                  group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                                  transition-colors">
                    <DynamicIcon
                      name={card.icon}
                      className="w-6 h-6 text-[hsl(var(--nav-theme-light))]"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 广告位 4: 方形广告 300×250 */}
      <AdBanner type="banner-300x250" adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250} />

      {/* Module 1: Beginner Guide */}
      <section id="beginner-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t.modules.beginnerGuide.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t.modules.beginnerGuide.intro}
            </p>
          </div>

          {/* Steps with highlights */}
          <div className="scroll-reveal space-y-6 mb-10">
            {t.modules.beginnerGuide.steps.map((step: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border-2 border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center">
                    <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {step.highlights && (
                  <div className="ml-16 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {step.highlights.map((h: string, hi: number) => (
                      <div key={hi} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Tips */}
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-lg">Quick Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.beginnerGuide.quickTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 广告位 5: 中型横幅 468×60 */}
      <AdBanner type="banner-468x60" adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60} />

      {/* Module 2: Codes */}
      <section id="codes" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.codes.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.codes.intro}</p>
          </div>

          {/* Active Codes */}
          <div className="scroll-reveal mb-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              {t.modules.codes.activeCodes.title}
            </h3>
            <div className="space-y-3">
              {t.modules.codes.activeCodes.entries.map((entry: any, index: number) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-white/5 border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-lg font-mono font-bold text-[hsl(var(--nav-theme-light))]">{entry.code}</code>
                      <button onClick={() => copyCode(entry.code)} className="p-1 hover:bg-white/10 rounded transition-colors">
                        {copiedCode === entry.code ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.reward}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">{entry.status}</span>
                    <span className="text-xs text-muted-foreground">{entry.lastVerified}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expired Codes */}
          <div className="scroll-reveal mb-8">
            <h3 className="text-xl font-bold mb-3 text-muted-foreground">{t.modules.codes.expiredCodes.title}</h3>
            <p className="text-sm text-muted-foreground p-4 bg-white/5 border border-border rounded-xl">{t.modules.codes.expiredCodes.emptyState}</p>
          </div>

          {/* How to Redeem */}
          <div className="scroll-reveal mb-8">
            <h3 className="text-2xl font-bold mb-4">{t.modules.codes.redeemSteps.title}</h3>
            <div className="space-y-3">
              {t.modules.codes.redeemSteps.entries.map((entry: any) => (
                <div key={entry.step} className="flex gap-4 p-4 bg-white/5 border border-border rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--nav-theme)/0.2)] flex items-center justify-center">
                    <span className="text-sm font-bold text-[hsl(var(--nav-theme-light))]">{entry.step}</span>
                  </div>
                  <p className="text-muted-foreground text-sm pt-1">{entry.instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Fields */}
          <div className="scroll-reveal">
            <h3 className="text-xl font-bold mb-3">{t.modules.codes.couponFields.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {t.modules.codes.couponFields.entries.map((entry: any, index: number) => (
                <div key={index} className="p-4 bg-white/5 border border-border rounded-xl">
                  <p className="font-semibold text-[hsl(var(--nav-theme-light))] mb-1">{entry.field}</p>
                  <p className="text-sm text-muted-foreground">{entry.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Module 3: Tier List */}
      <section id="tier-list" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.tierList.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.tierList.intro}</p>
          </div>

          <div className="scroll-reveal space-y-8">
            {t.modules.tierList.tiers.map((tier: any, ti: number) => {
              const tierColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                S: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
                A: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/40 text-blue-400' },
                B: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', badge: 'bg-slate-500/20 border-slate-500/40 text-slate-400' },
              }
              const colors = tierColors[tier.tier] || tierColors.B

              return (
                <div key={ti} className={`p-6 ${colors.bg} border ${colors.border} rounded-xl`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-3xl font-black ${colors.text}`}>{tier.tier}</span>
                    <span className="text-sm text-muted-foreground">{tier.summary}</span>
                  </div>

                  {/* Cookie Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                    {tier.cookies.map((cookie: any, ci: number) => (
                      <div key={ci} className="p-3 bg-white/5 border border-border rounded-lg">
                        <p className="font-semibold text-sm">{cookie.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.badge}`}>{cookie.role}</span>
                      </div>
                    ))}
                  </div>

                  {/* Featured Notes */}
                  {tier.featuredNotes && (
                    <div className="space-y-1.5">
                      {tier.featuredNotes.map((note: string, ni: number) => (
                        <div key={ni} className="flex items-start gap-2">
                          <Star className={`w-4 h-4 ${colors.text} mt-0.5 flex-shrink-0`} />
                          <span className="text-sm text-muted-foreground">{note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 4: Best Builds */}
      <section id="best-builds" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.bestBuilds.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.bestBuilds.intro}</p>
          </div>

          <div className="scroll-reveal space-y-6">
            {t.modules.bestBuilds.builds.map((build: any, bi: number) => (
              <div key={bi} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Wrench className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <h3 className="text-xl font-bold">{build.cookie}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{build.role}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-border">{build.rarity}</span>
                </div>

                {/* Build Details */}
                {build.build.basic && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Basic</p>
                      <p className="text-sm font-semibold">{build.build.basic}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Special</p>
                      <p className="text-sm font-semibold">{build.build.special}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Ultimate</p>
                      <p className="text-sm font-semibold">{build.build.ultimate}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Power Biscuits</p>
                      <p className="text-sm font-semibold">{build.build.powerBiscuits?.join(', ')}</p>
                    </div>
                  </div>
                )}

                {/* Core Rules (for Build Progression) */}
                {build.build.coreRules && (
                  <div className="mb-4 space-y-2">
                    {build.build.coreRules.map((rule: string, ri: number) => (
                      <div key={ri} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{rule}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Playstyle */}
                <div className="space-y-1.5">
                  {build.playstyle.map((tip: string, ti2: number) => (
                    <div key={ti2} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 5: Cookies List */}
      <section id="cookies-list" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.cookiesList.title}</h2>
            {t.modules.cookiesList.subtitle && (
              <p className="text-muted-foreground text-base max-w-3xl mx-auto mb-3">{t.modules.cookiesList.subtitle}</p>
            )}
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.cookiesList.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.modules.cookiesList.cookies.map((cookie: any, index: number) => {
              const rarityColors: Record<string, string> = {
                Epic: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                Rare: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                Common: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
              }
              return (
                <div key={index} className="p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                    <h3 className="font-bold text-sm">{cookie.name}</h3>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${rarityColors[cookie.rarity] || ''}`}>{cookie.rarity}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{cookie.role}</span>
                  </div>
                  {cookie.signature && (
                    <p className="text-sm text-[hsl(var(--nav-theme-light))] font-medium mb-1">{cookie.signature}</p>
                  )}
                  {cookie.bestUse && (
                    <p className="text-xs text-muted-foreground">{cookie.bestUse}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 6: Game Modes */}
      <section id="game-modes" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.gameModes.title}</h2>
            {t.modules.gameModes.subtitle && (
              <p className="text-muted-foreground text-base max-w-3xl mx-auto mb-3">{t.modules.gameModes.subtitle}</p>
            )}
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.gameModes.intro}</p>
          </div>
          <div className="scroll-reveal space-y-2">
            {t.modules.gameModes.modes.map((mode: any, index: number) => (
              <div key={index} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setModeExpanded(modeExpanded === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Swords className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                    <span className="font-semibold">{mode.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{mode.teamSize}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${modeExpanded === index ? 'rotate-180' : ''}`} />
                </button>
                {modeExpanded === index && (
                  <div className="px-5 pb-5 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[hsl(var(--nav-theme-light))] uppercase mb-1">Objective</p>
                      <p className="text-muted-foreground text-sm">{mode.objective}</p>
                    </div>
                    {mode.howToWin && (
                      <div>
                        <p className="text-xs font-semibold text-[hsl(var(--nav-theme-light))] uppercase mb-1">How to Win</p>
                        <p className="text-muted-foreground text-sm">{mode.howToWin}</p>
                      </div>
                    )}
                    {mode.bestFor && (
                      <div>
                        <p className="text-xs font-semibold text-[hsl(var(--nav-theme-light))] uppercase mb-1">Best For</p>
                        <p className="text-muted-foreground text-sm">{mode.bestFor}</p>
                      </div>
                    )}
                    {mode.tips && (
                      <div className="space-y-1.5">
                        {mode.tips.map((tip: string, ti3: number) => (
                          <div key={ti3} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 7: Currency Guide */}
      <section id="currency-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.currencyGuide.title}</h2>
            {t.modules.currencyGuide.subtitle && (
              <p className="text-muted-foreground text-base max-w-3xl mx-auto mb-3">{t.modules.currencyGuide.subtitle}</p>
            )}
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.currencyGuide.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {t.modules.currencyGuide.currencies.map((currency: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <h3 className="font-bold">{currency.name}</h3>
                </div>
                {currency.type && (
                  <p className="text-xs text-[hsl(var(--nav-theme-light))] font-medium mb-3">{currency.type}</p>
                )}
                {currency.howToGet && (
                  <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">How to Get:</span> {currency.howToGet}</p>
                )}
                {currency.bestFirstUse && (
                  <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">Best First Use:</span> {currency.bestFirstUse}</p>
                )}
                {currency.mainUses && (
                  <p className="text-sm text-muted-foreground"><span className="font-semibold">Main Uses:</span> {currency.mainUses}</p>
                )}
                {currency.source && (
                  <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">Source:</span> {currency.source}</p>
                )}
                {currency.usage && (
                  <p className="text-sm text-muted-foreground"><span className="font-semibold">Usage:</span> {currency.usage}</p>
                )}
              </div>
            ))}
          </div>
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold">Spending Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.currencyGuide.spendingTips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Module 8: Roles Guide */}
      <section id="roles-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.rolesGuide.title}</h2>
            {t.modules.rolesGuide.subtitle && (
              <p className="text-muted-foreground text-base max-w-3xl mx-auto mb-3">{t.modules.rolesGuide.subtitle}</p>
            )}
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.rolesGuide.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.modules.rolesGuide.roles.map((role: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <h3 className="font-bold text-lg text-[hsl(var(--nav-theme-light))]">{role.name}</h3>
                </div>
                {role.summary && (
                  <p className="text-sm text-muted-foreground mb-3">{role.summary}</p>
                )}
                {role.description && !role.summary && (
                  <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                )}
                {role.responsibilities && (
                  <div className="space-y-1.5 mb-3">
                    {role.responsibilities.map((r: string, ri: number) => (
                      <div key={ri} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {role.playTip && (
                  <div className="p-3 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.2)] rounded-lg mb-3">
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-[hsl(var(--nav-theme-light))]">Tip:</span> {role.playTip}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {role.examples.map((ex: string, ei: number) => (
                    <span key={ei} className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{ex}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 6: 移动端横幅 320×50 */}
      <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />

      {/* Module 9: Oven Crown Road */}
      <section id="oven-crown-road" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.ovenCrownRoad.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.ovenCrownRoad.intro}</p>
          </div>
          <div className="scroll-reveal space-y-4 mb-8">
            {t.modules.ovenCrownRoad.steps.map((step: any, index: number) => (
              <div key={index} className="flex gap-4 p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border-2 border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center">
                  <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {t.modules.ovenCrownRoad.milestones.map((m: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Crown className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Module 10: Summon Guide */}
      <section id="summon-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.summonGuide.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.summonGuide.intro}</p>
          </div>
          <div className="scroll-reveal space-y-2">
            {t.modules.summonGuide.summons.map((summon: any, index: number) => (
              <div key={index} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setSummonExpanded(summonExpanded === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                    <span className="font-semibold">{summon.name}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${summonExpanded === index ? 'rotate-180' : ''}`} />
                </button>
                {summonExpanded === index && (
                  <div className="px-5 pb-5 text-muted-foreground text-sm">{summon.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 11: Invite Codes */}
      <section id="invite-codes" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.inviteCodes.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.inviteCodes.intro}</p>
          </div>
          <div className="scroll-reveal space-y-3">
            {t.modules.inviteCodes.howItWorks.map((entry: any) => (
              <div key={entry.step} className="flex gap-4 p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--nav-theme)/0.2)] flex items-center justify-center">
                  <span className="text-sm font-bold text-[hsl(var(--nav-theme-light))]">{entry.step}</span>
                </div>
                <p className="text-muted-foreground text-sm pt-2">{entry.instruction}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 12: Friends & Party */}
      <section id="friends-party" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.friendsParty.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.friendsParty.intro}</p>
          </div>
          <div className="scroll-reveal space-y-4">
            {t.modules.friendsParty.steps.map((step: any, index: number) => (
              <div key={index} className="flex gap-4 p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border-2 border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center">
                  <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 13: Rates Guide */}
      <section id="rates-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.ratesGuide.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.ratesGuide.intro}</p>
          </div>
          <div className="scroll-reveal space-y-6">
            {t.modules.ratesGuide.tables.map((table: any, ti4: number) => (
              <div key={ti4} className="p-6 bg-white/5 border border-border rounded-xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  {table.name}
                </h3>
                <div className="space-y-2">
                  {table.rows.map((row: any, ri2: number) => (
                    <div key={ri2} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm">{row.item}</span>
                      <span className="text-sm font-mono font-bold text-[hsl(var(--nav-theme-light))]">{row.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 14: Costumes */}
      <section id="costumes" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.costumes.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.costumes.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.modules.costumes.sections.map((section: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <Shirt className="w-6 h-6 text-[hsl(var(--nav-theme-light))] mb-3" />
                <h3 className="font-bold mb-2">{section.name}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 15: Updates */}
      <section id="updates" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.updates.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.updates.intro}</p>
          </div>
          <div className="scroll-reveal relative pl-6 border-l-2 border-[hsl(var(--nav-theme)/0.3)] space-y-8 mb-8">
            {t.modules.updates.entries.map((entry: any, index: number) => (
              <div key={index} className="relative">
                <div className="absolute -left-[1.4rem] w-4 h-4 rounded-full bg-[hsl(var(--nav-theme))] border-2 border-background" />
                <div className="p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{entry.type}</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold mb-1">{entry.title}</h3>
                  <p className="text-muted-foreground text-sm">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Update channels */}
          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {t.modules.updates.channels.map((ch: any, i: number) => (
              <a key={i} href={ch.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                {ch.name} <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Module 16: Troubleshooting */}
      <section id="troubleshooting" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.modules.troubleshooting.title}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.troubleshooting.intro}</p>
          </div>
          <div className="scroll-reveal space-y-4 mb-8">
            {t.modules.troubleshooting.steps.map((step: any, index: number) => (
              <div key={index} className="flex gap-4 p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border-2 border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center">
                  <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="scroll-reveal p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-400 mb-2">Still having issues?</h3>
                <p className="text-sm text-muted-foreground mb-3">Report bugs with your device details through the official channels:</p>
                <div className="flex flex-wrap gap-3">
                  <a href="https://discord.gg/crovensmash" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                    <MessageCircle className="w-4 h-4" /> Discord <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://cs-cookierunovensmash.devsisters.com/hc/en-us" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                    Help Center <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner */}
      <AdBanner type="banner-728x90" adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90} />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">{t.footer.description}</p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://discord.gg/crovensmash" target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.discord}
                  </a>
                </li>
                <li>
                  <a href="https://x.com/CROvenSmash" target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.twitter}
                  </a>
                </li>
                <li>
                  <a href="https://www.reddit.com/r/cookierunovensmash/" target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.reddit}
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@cookierunovensmash" target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.youtube}
                  </a>
                </li>
                <li>
                  <a href="https://game.devsisters.com/en/ovensmash/" target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.officialSite}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link href="/copyright" className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition">
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.footer.copyright}</p>
              <p className="text-xs text-muted-foreground">{t.footer.disclaimer}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
