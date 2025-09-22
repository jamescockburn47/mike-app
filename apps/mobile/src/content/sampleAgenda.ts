export type SampleAgendaItem = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  location?: string;
  type: 'focus' | 'meeting' | 'personal';
};

function at(date: Date, hours: number, minutes: number) {
  const instance = new Date(date);
  instance.setHours(hours, minutes, 0, 0);
  return instance;
}

export function buildSampleAgenda(date: Date = new Date()): SampleAgendaItem[] {
  const base = new Date(date);
  const standUp = at(base, 9, 0);
  const maker = at(base, 9, 30);
  const sync = at(base, 11, 0);
  const walk = at(base, 13, 0);

  return [
    {
      id: 'focus-window',
      title: 'Focus window — ship investor checkpoint',
      startISO: standUp.toISOString(),
      endISO: maker.toISOString(),
      type: 'focus',
    },
    {
      id: 'team-sync',
      title: 'Squad sync with product + design',
      startISO: maker.toISOString(),
      endISO: sync.toISOString(),
      location: 'Signal HQ • Atlas Room',
      type: 'meeting',
    },
    {
      id: 'intentional-break',
      title: 'Intentional reset walk',
      startISO: walk.toISOString(),
      endISO: at(base, 13, 20).toISOString(),
      type: 'personal',
    },
  ];
}
