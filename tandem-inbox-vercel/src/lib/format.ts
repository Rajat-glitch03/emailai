export function formatTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
  if (date.getFullYear() === today.getFullYear()) return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: '2-digit' }).format(date);
}

export function formatFullDate(value: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function firstName(value: string) { return value.split(' ')[0] || value; }
