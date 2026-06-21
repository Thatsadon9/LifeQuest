/**
 * Page-specific skeleton layouts — mirror each route's content structure.
 */
import {
  Sk,
  SkCard,
  SkLines,
  SkList,
  SkPageHeader,
  SkSettingCard,
} from './Skeleton';

export { SkeletonScreen as SkScreen } from './Skeleton';
export {
  Sk,
  SkCard,
  SkLines,
  SkList,
  SkPageHeader,
  SkSettingCard,
  SkeletonScreen,
} from './Skeleton';

export function TodayPageSkeleton() {
  return (
  <>
      <SkCard padded={false}>
        <div className="flex min-h-[11rem] sm:min-h-[13rem]">
          <Sk className="aspect-square w-[7.5rem] shrink-0 rounded-none border-0 sm:w-44 md:w-52" />
          <div className="flex flex-1 flex-col justify-center gap-2 p-4">
            <Sk className="h-6 w-32" />
            <Sk className="h-4 w-48" />
            <Sk className="mt-2 h-2 w-full" />
            <div className="mt-2 flex gap-2">
              <Sk className="h-6 w-14 rounded-full" />
              <Sk className="h-6 w-20" />
            </div>
          </div>
        </div>
      </SkCard>

      <SkCard>
        <div className="flex items-center gap-3">
          <Sk className="h-[4.125rem] w-12 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex justify-between gap-2">
              <Sk className="h-4 w-16" />
              <Sk className="h-7 w-14 rounded-lg" />
            </div>
            <Sk className="h-4 w-full" />
          </div>
        </div>
      </SkCard>

      <SkCard>
        <Sk className="h-4 w-36" />
        <Sk className="mt-3 h-10 w-full rounded-xl" />
      </SkCard>

      <div className="space-y-2.5 px-1">
        <Sk className="h-4 w-28" />
        <SkList count={3} />
      </div>
  </>
  );
}

export function QuestsPageSkeleton() {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <SkPageHeader className="flex-1" />
        <Sk className="h-10 w-24 shrink-0 rounded-xl" />
      </div>

      <SkCard className="space-y-3">
        <Sk className="h-10 w-full rounded-xl" />
        <Sk className="h-4 w-12" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Sk key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <Sk className="h-4 w-10" />
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Sk key={i} className="h-8 w-8 rounded-lg" />
          ))}
        </div>
        <Sk className="h-8 w-24 rounded-full" />
      </SkCard>

      <SkList count={4} />
    </>
  );
}

export function CharacterPageSkeleton() {
  return (
    <>
      <SkCard padded={false}>
        <div className="flex min-h-[12rem] flex-col sm:min-h-[14rem] sm:flex-row">
          <Sk className="aspect-square w-full shrink-0 rounded-none border-0 sm:w-48" />
          <div className="flex flex-1 flex-col gap-3 p-4">
            <Sk className="h-7 w-40" />
            <Sk className="h-4 w-56" />
            <div className="flex gap-2">
              <Sk className="h-6 w-14 rounded-full" />
              <Sk className="h-6 w-24" />
            </div>
            <Sk className="h-2 w-full" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Sk key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </SkCard>

      <SkCard className="flex min-h-[16rem] items-center justify-center p-6">
        <Sk className="mx-auto aspect-square w-full max-w-[14rem] rounded-full" />
      </SkCard>

      <div className="space-y-2">
        <Sk className="h-4 w-28" />
        <SkCard>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <Sk className="h-9 w-9 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Sk className="h-4 w-3/4" />
                <Sk className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </SkCard>
      </div>
    </>
  );
}

export function SkillTreePageSkeleton() {
  return (
    <>
      <SkCard className="p-5">
        <div className="flex items-start justify-between gap-3">
          <SkPageHeader className="flex-1" />
          <Sk className="h-12 w-12 shrink-0 rounded-xl" />
        </div>
        <Sk className="mt-4 h-9 w-full" />
      </SkCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkCard key={i} className="space-y-4">
            <div className="flex items-center gap-3">
              <Sk className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-4 w-28" />
                <Sk className="h-3 w-full" />
              </div>
            </div>
            <Sk className="h-1 w-full rounded-full" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex gap-3">
                  <Sk className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Sk className="h-4 w-3/4" />
                    <Sk className="h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </SkCard>
        ))}
      </div>
    </>
  );
}

export function ReviewPageSkeleton() {
  return (
    <>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sk className="h-8 w-40" />
          <Sk className="h-6 w-16 rounded-full" />
        </div>
        <Sk className="h-4 w-72 max-w-full" />
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkCard key={i} className="!p-3">
            <Sk className="h-3 w-16" />
            <Sk className="mt-2 h-5 w-12" />
          </SkCard>
        ))}
      </div>

      <SkCard className="space-y-3 p-5">
        <Sk className="h-4 w-32" />
        <SkLines count={3} />
      </SkCard>

      <SkCard className="space-y-6 p-5">
        <Sk className="h-44 w-full rounded-xl" />
        <Sk className="h-44 w-full rounded-xl" />
      </SkCard>

      <SkCard className="space-y-4 p-5">
        <Sk className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Sk className="h-4 w-40" />
            <Sk className="h-20 w-full rounded-xl" />
          </div>
        ))}
        <Sk className="h-11 w-full rounded-xl sm:w-40" />
      </SkCard>

      <div className="space-y-3">
        <Sk className="h-5 w-32" />
        <SkList count={2} />
      </div>
    </>
  );
}

export function SettingsPageSkeleton() {
  return (
    <>
      <SkPageHeader />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkSettingCard key={i} />
        ))}
      </div>
    </>
  );
}

export function MiraPageSkeleton() {
  return (
    <>
      <SkPageHeader />
      <div className="flex flex-col gap-4 md:flex-row">
        <SkCard className="h-48 w-full md:h-auto md:w-56 md:shrink-0">
          <Sk className="h-4 w-20" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Sk key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </SkCard>
        <SkCard className="min-h-[min(72dvh,36rem)] flex-1 space-y-4" padded={false}>
          <div className="flex items-center gap-2.5 border-b-2 border-[var(--brutal-ink)]/10 p-3">
            <Sk className="h-12 w-10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Sk className="h-4 w-16" />
              <Sk className="h-3 w-32" />
            </div>
          </div>
          <div className="space-y-3 p-4">
            <Sk className="ml-auto h-12 w-3/4 rounded-xl" />
            <Sk className="h-16 w-4/5 rounded-xl" />
            <Sk className="ml-auto h-10 w-2/3 rounded-xl" />
          </div>
          <div className="mt-auto border-t-2 border-[var(--brutal-ink)]/10 p-3">
            <Sk className="h-16 w-full rounded-xl" />
          </div>
        </SkCard>
      </div>
    </>
  );
}

export function FocusPageSkeleton() {
  return (
    <main
      className="flex min-h-[100dvh] flex-col px-5 pt-safe pb-safe"
      aria-busy="true"
      role="status"
    >
      <div className="flex items-center justify-between pt-4">
        <Sk className="h-10 w-20 rounded-xl" />
        <Sk className="h-7 w-28 rounded-full" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
        <Sk className="h-3 w-24" />
        <Sk className="h-9 w-64 max-w-full" />
        <Sk className="h-4 w-48 max-w-full" />
        <Sk className="mt-6 h-52 w-52 rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-md space-y-3 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Sk key={i} className="h-14 rounded-xl" />
          ))}
        </div>
        <Sk className="mx-auto h-4 w-40" />
        <Sk className="h-14 w-full rounded-xl" />
      </div>
    </main>
  );
}

export function ReviewChartsSkeleton() {
  return (
    <div className="space-y-6">
      <Sk className="h-44 w-full rounded-xl" />
      <Sk className="h-44 w-full rounded-xl" />
    </div>
  );
}

export function HabitListSkeleton() {
  return <SkList count={3} />;
}

export function QuestListSkeleton() {
  return <SkList count={4} />;
}
