import { components } from 'tg.service/apiSchema.generated';

type AiReviewRuleModel = components['schemas']['AiReviewRuleModel'];
type AiReviewRuleRequest = components['schemas']['AiReviewRuleRequest'];

export type RuleFormValues = {
  name: string;
  tagIn: string[];
  tagNotIn: string[];
  namespaceIn: string[];
  namespaceNotIn: string[];
  languageIds: number[];
  /** Every language unchecked; the rule can't be saved like that. */
  noLanguages: boolean;
  branchIn: string[];
  branchNotIn: string[];
  threshold: number | string;
  never: boolean;
  mode: AiReviewRuleModel['mode'];
  promptId: number | '';
  skipOpenQaIssues: boolean;
};

export const getRuleInitialValues = (
  rule?: AiReviewRuleModel
): RuleFormValues => ({
  name: rule?.name ?? '',
  tagIn: rule?.tagIn ?? [],
  tagNotIn: rule?.tagNotIn ?? [],
  namespaceIn: rule?.namespaceIn ?? [],
  namespaceNotIn: rule?.namespaceNotIn ?? [],
  languageIds: rule?.languageIds ?? [],
  noLanguages: false,
  branchIn: rule?.branchIn ?? [],
  branchNotIn: rule?.branchNotIn ?? [],
  threshold: rule?.threshold ?? 85,
  never: rule?.never ?? false,
  mode: rule?.mode ?? 'DRY_RUN',
  promptId: rule?.promptId ?? '',
  skipOpenQaIssues: rule?.skipOpenQaIssues ?? true,
});

export const ruleValuesToRequest = (
  values: RuleFormValues,
  enabled: boolean
): AiReviewRuleRequest => ({
  name: values.name,
  enabled,
  tagIn: values.tagIn,
  tagNotIn: values.tagNotIn,
  namespaceIn: values.namespaceIn,
  namespaceNotIn: values.namespaceNotIn,
  languageIds: values.languageIds,
  branchIn: values.branchIn,
  branchNotIn: values.branchNotIn,
  threshold: toThreshold(values.threshold),
  never: values.never,
  mode: values.mode,
  promptId: values.promptId === '' ? undefined : values.promptId,
  skipOpenQaIssues: values.skipOpenQaIssues,
});

function toThreshold(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== '' ? parsed : 85;
}
