// Utilitários de máscara, validação e cálculo de idade usados em todo o sistema.

export function onlyDigits(value) {
  return (value || '').toString().replace(/\D/g, '');
}

export function maskCPF(value) {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskRG(value) {
  return onlyDigits(value)
    .slice(0, 9)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})$/, '$1-$2');
}

export function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/** Validação completa do CPF com cálculo dos dígitos verificadores. */
export function validarCPF(cpfRaw) {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
  let resto = 11 - (soma % 11);
  const digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(cpf[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
  resto = 11 - (soma % 11);
  const digito2 = resto >= 10 ? 0 : resto;
  if (digito2 !== parseInt(cpf[10], 10)) return false;

  return true;
}

/** Calcula a idade completa em anos a partir de uma data de nascimento (string yyyy-mm-dd). */
export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(`${dataNascimento}T00:00:00`);
  if (Number.isNaN(nasc.getTime())) return null;

  let idade = hoje.getFullYear() - nasc.getFullYear();
  const diffMes = hoje.getMonth() - nasc.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

export function isMenorDeIdade(dataNascimento) {
  const idade = calcularIdade(dataNascimento);
  return idade === null ? false : idade < 18;
}

export function formatarData(dataISO) {
  if (!dataISO) return '-';
  const [ano, mes, dia] = dataISO.split('-');
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

export function dataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
