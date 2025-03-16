/**
 * Builds a prompt for getting detailed analysis of IaC template best practices
 * @param item The selected best practice item
 * @param fileContent The content of the IaC template
 * @param previousContent Any previous content from earlier analysis
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for detailed analysis
 */
export function buildDetailsPrompt(
  item: any,
  fileContent: string,
  previousContent: string,
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  let prompt = `
    <bp_recommendation_analysis>
    ${JSON.stringify([item], null, 2)}
    </bp_recommendation_analysis>
    
    <iac_document_or_project>
    ${fileContent}
    </iac_document_or_project>
    ${previousContent ? `\nPreviously generated content:\n${previousContent}` : ''}
  `;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
    
    <supporting_document>
    Refer to the attached supporting document "${supportingDocName}" for additional context or guidelines to consider when providing detailed analysis. 
    The supporting document is about: ${supportingDocDescription}
    </supporting_document>
    `;
  }

  return prompt;
}

/**
 * Builds a prompt for getting detailed analysis of architecture diagram best practices
 * @param item The selected best practice item
 * @param previousContent Any previous content from earlier analysis
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for detailed image analysis
 */
export function buildImageDetailsPrompt(
  item: any,
  previousContent: string,
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  let prompt = `<bp_recommendation_analysis>${JSON.stringify([item], null, 2)}</bp_recommendation_analysis>
  ${previousContent ? `\nPreviously generated content:\n${previousContent}` : ''}`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  Refer to the attached supporting document "${supportingDocName}" for additional context or guidelines to consider when providing detailed analysis. 
  The supporting document is about: ${supportingDocDescription}
  </supporting_document>
  `;
  }

  return prompt;
}