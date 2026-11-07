import type { Strings } from '@/shared/i18n';
import type { Preparation } from '@/shared/domain/time';

/** Everything the film says. Built from the typed strings, so no key can go missing. */
export interface IntroText {
  locale: string;
  problem: string;
  oldWay: readonly string[];
  counter: string;
  typedSigna: string;
  rule: string;
  ruleSub: string;
  everyEight: string;
  formsTitle: string;
  forms: Record<Preparation, string>;
  shakeTag: string;
  reminder: string;
  home: string;
  name: string;
  tagline: string;
}

export function introText(t: Strings): IntroText {
  const w = t.welcome;
  return {
    locale: t.locale,
    problem: w.problem,
    oldWay: w.oldWay,
    counter: w.counter,
    typedSigna: w.typedSigna,
    rule: w.rule,
    ruleSub: w.ruleSub,
    everyEight: t.interval.every(8),
    formsTitle: w.formsTitle,
    forms: t.preparation.names,
    shakeTag: w.shakeTag,
    reminder: w.reminder,
    home: w.home,
    name: t.app.name,
    tagline: w.tagline,
  };
}
