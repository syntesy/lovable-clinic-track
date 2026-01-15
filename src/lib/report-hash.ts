/**
 * Geração de hash SHA-256 para integridade de relatórios
 * Utiliza stable stringify para garantir hash determinístico
 */

/**
 * Ordena as chaves de um objeto recursivamente para garantir
 * serialização determinística (stable stringify)
 */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => stableStringify(item)).join(',') + ']';
  }
  
  if (typeof obj === 'object') {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys.map(key => {
      const value = (obj as Record<string, unknown>)[key];
      return JSON.stringify(key) + ':' + stableStringify(value);
    });
    return '{' + pairs.join(',') + '}';
  }
  
  return JSON.stringify(obj);
}

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
 * Utiliza stable stringify para garantir resultado determinístico
 */
export async function generateReportJsonHash(reportJson: unknown): Promise<string> {
  const jsonString = stableStringify(reportJson);
  return generateReportHash(jsonString);
}

/**
 * Exporta stable stringify para uso em comparações
 */
export { stableStringify };
