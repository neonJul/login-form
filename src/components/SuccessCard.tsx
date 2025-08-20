import { CheckIcon } from "./CheckIcon.tsx";

export function SuccessCard({ email }: { email: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
        <CheckIcon className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        You're in!
      </h2>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Signed in as {email}.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
      >
        Sign out (reset demo)
      </button>
    </div>
  );
}
