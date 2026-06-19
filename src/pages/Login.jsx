import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/logo.png'

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginInput, setLoginInput] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!loginInput.trim() || !senha) {
      setErro('Informe login e senha para continuar.');
      return;
    }

    setEnviando(true);
    const resultado = await login(loginInput, senha);
    setEnviando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <div className="login-page">
      <aside className="login-aside">
        <div className="login-marca">
          <div className="marca">AM</div>
          <div>
            <div className="titulo">AMTO</div>
            <div className="subtitulo">Associação Macauense de Taekwondo</div>
          </div>
        </div>

        <div className="login-frase">
          <h2>Disciplina, respeito e evolução em cada faixa conquistada.</h2>
          <p>
            Plataforma de gestão da AMTO. Acesse com as
            credenciais fornecidas pela sua unidade.
          </p>
        </div>

        <div className="login-faixas" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
      </aside>

      <div className="login-form-side">
        <div className="login-box">
          <img src={Logo} alt="" className='Logo_imagem'/>
          <h1>Bem-vindo ao sistema <strong>AMTO</strong> </h1>
          <p className="descricao">Entre com seu login e senha para acessar o sistema.</p>

          {erro && <div className="alert alert-danger mt-16" style={{ marginBottom: 16 }}>{erro}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login">Login</label>
              <input
                id="login"
                type="text"
                autoComplete="username"
                placeholder="Seu login de acesso"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="login-rodape">
            Alunos: o login é o CPF cadastrado. Em caso de dúvidas, fale com seu mestre ou professor.
          </p>
        </div>
      </div>
    </div>
  );
}
