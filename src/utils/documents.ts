// Mesmas regras de src/utils/documents.ts do back-end: o front valida antes de enviar
// para dar retorno imediato, e o back-end valida de novo (fonte da verdade).

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

const allSameDigit = (digits: string) => /^(\d)\1+$/.test(digits)

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || allSameDigit(cpf)) return false
  const digit = (length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(cpf.charAt(i)) * (length + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return digit(9) === Number(cpf.charAt(9)) && digit(10) === Number(cpf.charAt(10))
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14 || allSameDigit(cnpj)) return false
  const digit = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(cnpj.charAt(i)) * weights[i]
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return digit(12) === Number(cnpj.charAt(12)) && digit(13) === Number(cnpj.charAt(13))
}

export function maskCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCnpj(value: string): string {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
