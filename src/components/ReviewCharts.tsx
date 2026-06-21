/**
 * Recharts visuals for the Weekly Review (lazy-loaded).
 */
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useT } from '../hooks';

export interface DayDatum {
  label: string;
  xp: number;
  best: boolean;
}

export interface StatDatum {
  key: string;
  name: string;
  xp: number;
  color: string;
}

export interface ReviewChartsProps {
  days: DayDatum[];
  stats: StatDatum[];
}

interface TooltipEntry {
  value?: number;
  payload?: { name?: string };
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  const { t } = useT();
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const value = Math.round(entry?.value ?? 0);
  const title = entry?.payload?.name ?? label;
  return (
    <div className="rounded-lg border bg-surface px-2.5 py-1.5 text-xs shadow-lg">
      <span className="font-semibold">{title}</span>
      <span className="ml-2 tabular-nums text-muted">{t('review.chartXp', { value })}</span>
    </div>
  );
}

const axisTick = { fontSize: 11, fill: 'var(--color-muted)' } as const;
const cursorFill = { fill: 'color-mix(in oklab, var(--color-primary) 14%, transparent)' };

export function ReviewCharts({ days, stats }: ReviewChartsProps) {
  const { t } = useT();
  const hasStatXP = stats.length > 0;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold">{t('review.xpPerDay')}</h3>
        <div className="h-44 w-full min-w-0">
          <ResponsiveContainer width="100%" height={176}>
            <BarChart data={days} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                tick={axisTick}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={cursorFill} />
              <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={42}>
                {days.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.best ? 'var(--color-hero)' : 'var(--color-primary)'}
                    fillOpacity={d.best ? 1 : 0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">{t('review.xpByStat')}</h3>
        {hasStatXP ? (
          <div className="h-44 w-full min-w-0">
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={stats} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
                <XAxis dataKey="key" tickLine={false} axisLine={false} tick={axisTick} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tick={axisTick}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={cursorFill} />
                <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {stats.map((s) => (
                    <Cell key={s.key} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted">
            {t('review.noStatXp')}
          </p>
        )}
      </section>
    </div>
  );
}

export default ReviewCharts;
