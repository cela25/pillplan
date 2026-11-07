import { Icon, isIconName } from './Icon';
import styles from './Sticker.module.css';

export type StickerTone = 'yellow' | 'red' | 'blue';

interface StickerProps {
  tone: StickerTone;
  icon: string;
  children: string;
  large?: boolean;
}

/** A warning shown like a pharmacy auxiliary label: color, icon and words together. */
export function Sticker({ tone, icon, children, large = false }: StickerProps) {
  return (
    <span className={[styles.sticker, styles[tone], large ? styles.large : ''].join(' ')}>
      {isIconName(icon) && <Icon name={icon} size={large ? 20 : 16} />}
      {children}
    </span>
  );
}
