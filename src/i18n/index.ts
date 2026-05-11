import { useStore } from '../store'
import { locales, type MessageKey } from './locales'

export { type Locale, type MessageKey } from './locales'

export function useT() {
  const locale = useStore((s) => s.locale)
  return (key: MessageKey) => locales[locale][key]
}
