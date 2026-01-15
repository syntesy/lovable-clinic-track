/**
 * Geração de hash SHA-256 para integridade de relatórios
 */

/**
 * Gera um hash SHA-256 de uma string usando a Web Crypto API
 */
export async function generateReportHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Gera hash de um objeto JSON para verificação de integridade
 */
export async function generateReportJsonHash(reportJson: unknown): Promise<string> {
  const jsonString = JSON.stringify(reportJson, null, 0); // Sem formatação para consistência
  return generateReportHash(jsonString);
}
