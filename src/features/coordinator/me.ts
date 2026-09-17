import type { CoordinatorId } from '@/session/types'

/**
 * Whose queue this is. Lives in its own module because both the layout and
 * every view need it — importing it from the layout created a cycle
 * (layout -> view -> layout) that typechecked but threw
 * "Cannot access 'ME' before initialization" at runtime.
 */
export const ME: CoordinatorId = 'sarah'
