/**
 * Builds a prompt for getting detailed analysis of IaC template best practices
 * @param item The selected best practice item
 * @param fileContent The content of the IaC template
 * @param previousContent Any previous content from earlier analysis
 * @returns A prompt for detailed analysis
 */
export function buildDetailsPrompt(item: any, fileContent: string, previousContent: string): string {
    return `
      <bp_recommendation_analysis>
      ${JSON.stringify([item], null, 2)}
      </bp_recommendation_analysis>
      
      <iac_document>
      ${fileContent}
      </iac_document>
      ${previousContent ? `\nPreviously generated content:\n${previousContent}` : ''}
    `;
}

/**
 * Builds a prompt for getting detailed analysis of architecture diagram best practices
 * @param item The selected best practice item
 * @param previousContent Any previous content from earlier analysis
 * @returns A prompt for detailed image analysis
 */
export function buildImageDetailsPrompt(item: any, previousContent: string): string {
    return `<bp_recommendation_analysis>${JSON.stringify([item], null, 2)}</bp_recommendation_analysis>
    ${previousContent ? `\nPreviously generated content:\n${previousContent}` : ''}`;
}