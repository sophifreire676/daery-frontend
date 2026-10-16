import { Link } from 'react-router-dom'

// Recuperação de senha por e-mail: requisito RF-011 (Could), fora do escopo da Fase 02 (decisão D9).
// A tela explica o caminho atual em vez de simular um envio que não acontece.
export default function ForgotPassword() {
  return (
    <div className="flex flex-col min-h-screen font-dm">
      <nav className="bg-[#0B2D2A] px-8 py-3.5 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500 flex items-center justify-center bg-teal-950">
            <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="leading-none">
            <p className="text-white font-sora font-semibold text-lg tracking-tight">Daery</p>
            <p className="text-teal-500 text-[10px] tracking-widest uppercase font-light">Vigilância Focada</p>
          </div>
        </div>

        <div className="ml-auto">
          <Link
            to="/login"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-150"
          >
            Voltar ao login
          </Link>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-56px)] bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-9 w-full max-w-[520px] shadow-sm">
          <h1 className="font-sora text-xl font-semibold text-slate-800 mb-2">Esqueci minha senha</h1>
          <p className="text-sm text-slate-600 mb-5">
            A recuperação de senha por e-mail ainda não está disponível no Daery.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
            Para recuperar o acesso agora, fale com a equipe do Daery. Um administrador pode redefinir sua senha.
          </div>
          <Link
            to="/login"
            className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold font-sora px-5 py-3 rounded-lg transition-colors"
          >
            Voltar para o login
          </Link>
        </div>
      </main>
    </div>
  )
}
