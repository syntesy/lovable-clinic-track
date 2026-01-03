import { z } from 'zod';

// Esquema de validação de senha forte
export const strongPasswordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um símbolo (!@#$%^&*...)');

// Esquema de validação de email
export const emailSchema = z
  .string()
  .trim()
  .email('Email inválido')
  .max(255, 'Email muito longo');

// Esquema completo de signup
export const signupSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  fullName: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
});

// Esquema de login (menos restritivo para senha)
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
});

// Função para calcular força da senha
export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, label: 'Muito fraca', color: '#FF4D4D', feedback: ['Digite uma senha'] };
  }

  // Verificar comprimento
  if (password.length >= 8) score++;
  else feedback.push('Mínimo 8 caracteres');
  
  if (password.length >= 12) score++;

  // Verificar maiúsculas
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Adicione letra maiúscula');

  // Verificar minúsculas
  if (/[a-z]/.test(password)) {
    // Não conta ponto mas é necessário
  } else {
    feedback.push('Adicione letra minúscula');
  }

  // Verificar números
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Adicione um número');

  // Verificar símbolos
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Adicione um símbolo (!@#$%...)');

  // Normalizar score para 0-4
  score = Math.min(4, score);

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: 'Muito fraca', color: '#FF4D4D' },
    1: { label: 'Fraca', color: '#FF8C42' },
    2: { label: 'Razoável', color: '#FFD166' },
    3: { label: 'Boa', color: '#90BE6D' },
    4: { label: 'Forte', color: '#43AA8B' }
  };

  return {
    score,
    label: labels[score].label,
    color: labels[score].color,
    feedback
  };
}

// Validar senha e retornar erros formatados
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const result = strongPasswordSchema.safeParse(password);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(e => e.message)
  };
}

// Validar signup completo
export function validateSignup(data: { email: string; password: string; fullName: string }): {
  valid: boolean;
  errors: Record<string, string[]>;
} {
  const result = signupSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: {} };
  }
  
  const errors: Record<string, string[]> = {};
  result.error.errors.forEach(e => {
    const field = e.path[0] as string;
    if (!errors[field]) errors[field] = [];
    errors[field].push(e.message);
  });
  
  return { valid: false, errors };
}
