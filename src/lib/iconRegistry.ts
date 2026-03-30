import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * 图标注册表 - 所有可用图标的单一来源
 *
 * 添加新图标的步骤：
 * 1. 在这里添加图标名称和组件的映射
 * 2. 在翻译文件中使用相同的名称
 * 3. 运行 `bun run validate:icons` 验证
 */
export const iconRegistry: Record<string, LucideIcon> = {
  // 导航和模块图标
  BookOpen: LucideIcons.BookOpen,
  Gift: LucideIcons.Gift,
  Trophy: LucideIcons.Trophy,
  Wrench: LucideIcons.Wrench,
  Users: LucideIcons.Users,
  Swords: LucideIcons.Swords,
  Coins: LucideIcons.Coins,
  ShieldCheck: LucideIcons.ShieldCheck,
  Crown: LucideIcons.Crown,
  Sparkles: LucideIcons.Sparkles,
  UserPlus: LucideIcons.UserPlus,
  Handshake: LucideIcons.Handshake,
  BarChart3: LucideIcons.BarChart3,
  Shirt: LucideIcons.Shirt,
  Bell: LucideIcons.Bell,
  LifeBuoy: LucideIcons.LifeBuoy,

  // UI 交互图标
  ChevronDown: LucideIcons.ChevronDown,
  ArrowRight: LucideIcons.ArrowRight,
  Check: LucideIcons.Check,
  Copy: LucideIcons.Copy,
  ExternalLink: LucideIcons.ExternalLink,
  Clock: LucideIcons.Clock,
  X: LucideIcons.X,
  Star: LucideIcons.Star,
  Shield: LucideIcons.Shield,
  AlertTriangle: LucideIcons.AlertTriangle,
  MessageCircle: LucideIcons.MessageCircle,
  Download: LucideIcons.Download,

  // 默认回退图标
  HelpCircle: LucideIcons.HelpCircle,
}

/**
 * 获取图标组件（带类型安全和回退）
 * @param name - 图标名称（来自翻译文件）
 * @returns 图标组件或默认图标
 */
export function getIcon(name: string): LucideIcon {
  const icon = iconRegistry[name]

  if (!icon) {
    console.warn(`[Icon Registry] Icon "${name}" not found, using HelpCircle as fallback`)
    return iconRegistry.HelpCircle
  }

  return icon
}

/**
 * 检查图标是否存在
 * @param name - 图标名称
 * @returns 是否存在
 */
export function hasIcon(name: string): boolean {
  return name in iconRegistry
}

/**
 * 获取所有已注册的图标名称
 * @returns 图标名称数组
 */
export function getRegisteredIconNames(): string[] {
  return Object.keys(iconRegistry).filter(name => name !== 'HelpCircle')
}
