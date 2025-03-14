import { QuestionGroup } from '../shared/interfaces/analysis.interface';

/**
 * Builds a prompt for analyzing architecture diagrams
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for architecture diagram analysis
 */
export function buildImagePrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  let prompt = `
  Analyze the provided architecture diagram against the following Well-Architected best practices.
  
  <kb>
  ${kbContexts.join('\n\n')}
  </kb>

  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  Refer to the attached supporting document "${supportingDocName}" for additional context when completing the review. 
  The supporting document is about: ${supportingDocDescription}
  </supporting_document>
  `;
  }

  return prompt;
}

/**
 * Builds a prompt for analyzing IaC templates
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for IaC template analysis
 */
export function buildPrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  let prompt = `
  <kb>
  ${kbContexts.join('\n\n')}
  </kb>

  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  Refer to the attached supporting document "${supportingDocName}" for additional context when completing the review. 
  The supporting document is about: ${supportingDocDescription}
  </supporting_document>
  `;
  }

  return prompt;
}

/**
 * Builds a prompt for analyzing projects (multiple files or zip)
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for project analysis
 */
export function buildProjectPrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  let prompt = `
  <kb>
  ${kbContexts.join('\n\n')}
  </kb>

  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  Refer to the attached supporting document "${supportingDocName}" for additional context when completing the review. 
  The supporting document is about: ${supportingDocDescription}
  </supporting_document>
  `;
  }

  return prompt;
}