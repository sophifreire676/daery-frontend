import { ApiError } from '../services/api'

// Mensagens da API (em inglês) traduzidas para o usuário final.
const MESSAGES: Record<string, string> = {
  'Invalid credentials': 'E-mail ou senha incorretos.',
  'Email already in use': 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.',
  'CPF already in use': 'Este CPF já está cadastrado.',
  'CNPJ already in use': 'Este CNPJ já está cadastrado.',
  'Professional registration already in use': 'Este registro profissional já está cadastrado.',
  'Registration data already in use': 'Alguns dados informados já estão cadastrados.',
  'Too many attempts, please try again later': 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.',
  'Authentication required': 'Sua sessão terminou. Entre novamente.',
  'Invalid or expired token': 'Sua sessão terminou. Entre novamente.',
  'You do not have permission to perform this action': 'Seu perfil não tem permissão para esta ação.',
}

/** Mensagem legível para qualquer erro vindo da camada de API. */
export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.'
    }
    if (MESSAGES[error.message]) return MESSAGES[error.message]
    if (error.status === 429) return MESSAGES['Too many attempts, please try again later']
    if (error.status === 400) return 'Revise os campos destacados.'
    if (error.status >= 500) return 'O servidor encontrou um erro. Tente de novo em instantes.'
  }
  return 'Algo deu errado. Tente de novo.'
}
