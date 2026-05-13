import styles from './TocPanel.module.css'
import type { TocItem } from '../../../lib/toc'
import { useT } from '../../../i18n'

interface Props {
  items: TocItem[]
  activeId: string
  onClose: () => void
}

const LEVEL_CLASS: Record<number, string> = {
  1: styles.level1,
  2: styles.level2,
  3: styles.level3,
}

export default function TocPanel({ items, activeId, onClose }: Props) {
  const t = useT()
  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>{t('toc')}</span>
        <button className={styles.closeBtn} onClick={onClose} title={t('toc')}>‹</button>
      </div>
      <div className={styles.list}>
        {items.map((item) => (
          <button
            key={item.id}
            className={[styles.item, LEVEL_CLASS[item.level], item.id === activeId ? styles.itemActive : undefined].filter(Boolean).join(' ')}
            onClick={() => handleClick(item.id)}
            title={item.text}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  )
}
