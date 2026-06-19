import { onlyDigits, validarCPF } from './masks';

export function required(value, mensagem = 'Campo obrigatório.') {
  if (value === null || value === undefined) return mensagem;
  if (typeof value === 'string' && value.trim() === '') return mensagem;
  return null;
}

export function validarCampoCPF(value, { obrigatorio = true } = {}) {
  const digitos = onlyDigits(value);
  if (!digitos) return obrigatorio ? 'CPF é obrigatório.' : null;
  if (digitos.length !== 11) return 'CPF deve conter 11 dígitos.';
  if (!validarCPF(digitos)) return 'CPF inválido.';
  return null;
}

export function validarSenha(value, { minimo = 4, obrigatorio = true } = {}) {
  if (!value) return obrigatorio ? 'Senha é obrigatória.' : null;
  if (value.length < minimo) return `Senha deve ter ao menos ${minimo} caracteres.`;
  return null;
}

/**
 * Executa um conjunto de validadores e retorna um objeto { campo: mensagem }.
 * `validadores` é um objeto { campo: () => mensagem | null }
 */
export function validarFormulario(validadores) {
  const erros = {};
  Object.entries(validadores).forEach(([campo, fn]) => {
    const mensagem = fn();
    if (mensagem) erros[campo] = mensagem;
  });
  return erros;
}

export function formularioValido(erros) {
  return Object.keys(erros).length === 0;
}
