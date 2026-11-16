import { ArrowRightLeft, CheckCircle2, CircleHelp, UserRound } from 'lucide-react';
import type { Responsibility } from '../types';

const options: Record<Responsibility, { label: string; className: string; Icon: typeof UserRound }> = {
  assistant_to_reply: { label: 'Assistant to reply', className: 'badge-assistant', Icon: ArrowRightLeft },
  client_to_reply: { label: 'Client to reply', className: 'badge-client', Icon: UserRound },
  no_reply_needed: { label: 'No reply needed', className: 'badge-no-reply', Icon: CheckCircle2 },
  needs_review: { label: 'Needs review', className: 'badge-review', Icon: CircleHelp },
};

export default function ResponsibilityBadge({ value, compact = false }: { value: Responsibility; compact?: boolean }) {
  const option = options[value] || options.needs_review;
  const { Icon } = option;
  return <span className={`responsibility-badge ${option.className} ${compact ? 'is-compact' : ''}`}><Icon size={13} strokeWidth={2.1} />{!compact && option.label}</span>;
}
