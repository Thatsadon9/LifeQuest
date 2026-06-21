/**
 * Seven-stat spider / radar chart for the Character page.
 */
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { STAT_KEYS, STAT_BY_KEY } from '../data/stats';
import { localizeStatName } from '../i18n/localize';
import { useLanguage, useT } from '../hooks';
import type { Stat, StatKey } from '../types';

export interface StatSpiderChartProps {
  stats: Stat[];
  bestKey?: StatKey | null;
  weakestKey?: StatKey | null;
}

interface ChartRow {
  key: StatKey;
  label: string;
  level: number;
  color: string;
}

function buildRows(stats: Stat[], locale: ReturnType<typeof useLanguage>['locale']): ChartRow[] {
  const byKey = new Map(stats.map((s) => [s.key, s]));
  return STAT_KEYS.map((key) => ({
    key,
    label: localizeStatName(key, locale),
    level: byKey.get(key)?.level ?? 1,
    color: STAT_BY_KEY[key].color,
  }));
}

function SpiderTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ChartRow }[];
}) {
  const { t } = useT();
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border-2 border-[var(--brutal-ink)] bg-surface px-3 py-2 text-xs shadow-[2px_2px_0_0_var(--brutal-shadow-color)]">
      <span className="font-bold" style={{ color: row.color }}>
        {row.label}
      </span>
      <span className="ml-2 tabular-nums text-secondary">
        {t('common.lv')} {row.level}
      </span>
    </div>
  );
}

export function StatSpiderChart({ stats, bestKey, weakestKey }: StatSpiderChartProps) {
  const { locale } = useLanguage();
  const { t } = useT();
  const rows = buildRows(stats, locale);
  const maxLevel = Math.max(5, ...rows.map((r) => r.level));

  return (
    <div className="card p-3 sm:p-4">
      <div className="mb-2 flex flex-col gap-2 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold">{t('character.spiderChart')}</h2>
        {(bestKey || weakestKey) && (
          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
            {bestKey && (
              <span
                className="badge-brutal"
                style={{
                  backgroundColor: STAT_BY_KEY[bestKey].color,
                  color: 'var(--color-on-vivid)',
                }}
              >
                {t('character.strongest')}
              </span>
            )}
            {weakestKey && (
              <span className="badge-brutal bg-warning text-[var(--color-on-vivid)]">
                {t('character.trainNext')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto w-full min-w-0 max-w-[17rem] sm:max-w-xs md:max-w-sm">
        <ResponsiveContainer width="100%" aspect={1}>
          <RadarChart
            data={rows}
            cx="50%"
            cy="50%"
            outerRadius="58%"
            margin={{ top: 4, right: 20, bottom: 4, left: 20 }}
          >
            <PolarGrid stroke="var(--color-border)" strokeWidth={1.5} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, maxLevel]}
              tick={false}
              axisLine={false}
            />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 9, fontWeight: 600, fill: 'var(--color-text)' }}
            />
            <Radar
              name={t('character.stats')}
              dataKey="level"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.35}
              strokeWidth={2.5}
              dot={{
                r: 2.5,
                fill: 'var(--color-primary)',
                stroke: 'var(--brutal-ink)',
                strokeWidth: 1.5,
              }}
            />
            <Tooltip content={<SpiderTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4">
        {rows.map((row) => (
          <li
            key={row.key}
            className="surface-2 flex min-w-0 items-center justify-between gap-1.5 rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2"
          >
            <span className="truncate text-[11px] font-semibold sm:text-xs">{row.label}</span>
            <span
              className="shrink-0 text-[11px] font-bold tabular-nums sm:text-xs"
              style={{ color: row.color }}
            >
              {t('common.lv')} {row.level}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StatSpiderChart;
