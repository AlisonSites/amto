export default function Loader({ texto = 'Carregando...' }) {
  return (
    <div className="tela-loading">
      <div className="spinner" />
      <span>{texto}</span>
    </div>
  );
}
