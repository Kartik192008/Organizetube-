import { Github, Mail } from 'lucide-react';

type LoginViewProps = {
  signInWithGitHub: () => void;
  signInWithGoogle: () => void;
};

export default function LoginView({ signInWithGitHub, signInWithGoogle }: LoginViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full flex flex-col items-center gap-8 p-8">
        <img src="/logo.png" alt="Organizer" className="h-16 w-16 object-contain" />

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold text-primary-900">Welcome to Organizer</h1>
          <p className="text-primary-600">
            Sign in to save your study library privately. Your courses and progress are tied to your
            account.
          </p>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            type="button"
            onClick={signInWithGitHub}
            className="flex w-full h-12 items-center justify-center gap-3 bg-white border border-primary-200 px-6 font-semibold text-primary-900 shadow-sm transition-colors hover:bg-primary-50 hover:border-primary-300"
          >
            <Github className="h-5 w-5 fill-current" />
            Continue with GitHub
          </button>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex w-full h-12 items-center justify-center gap-3 bg-white border border-primary-200 px-6 font-semibold text-primary-900 shadow-sm transition-colors hover:bg-primary-50 hover:border-primary-300"
          >
            <Mail className="h-5 w-5" />
            Continue with Google
          </button>
        </div>

        <p className="text-xs text-primary-400">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
