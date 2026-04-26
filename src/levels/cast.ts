import type { StorySender } from '../engine/types'

/**
 * Metadata for the recurring Möller Coffee cast.
 *
 * - `name` and `role` are shown in chat headers in the level intro modal.
 * - `accent` is a single color used for the avatar disc and name. Picked
 *   to read in both dark (default) and light themes — bias toward muted.
 * - `initial` is the single letter shown inside the avatar disc.
 */
export interface CastMember {
  name: string
  role: string
  accent: string
  initial: string
}

export const CAST: Record<StorySender, CastMember> = {
  priya: { name: 'Priya Raman', role: 'Head of Data', accent: '#8b9eff', initial: 'P' },
  yuki: { name: 'Yuki Aoki', role: 'Marketing', accent: '#ffb38a', initial: 'Y' },
  sofie: { name: 'Sofie Möller', role: 'CFO', accent: '#7ed3a3', initial: 'S' },
  marcus: { name: 'Marcus Holm', role: 'former', accent: '#9aa0a6', initial: 'M' },
}
