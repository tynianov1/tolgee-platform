import { useProject } from 'tg.hooks/useProject';

import { useAiReviewEnabled } from 'tg.ee.module/aiReview/hooks/useAiReviewEnabled';

export const useAiReviewActive = () => {
  const project = useProject();
  const aiReviewEnabled = useAiReviewEnabled();
  return aiReviewEnabled && project.useAiReview;
};
