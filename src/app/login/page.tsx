import { LoginForm } from "@/app/login/login-form";

export const metadata = {
  title: "Sign in | Blend CRM",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f5f7f6] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-[#102d23] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-2xl font-bold">BLEND</p>
          <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-100/60">
            PROPERTY GROUP
          </p>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#50d5a6]">
            One connected pipeline
          </p>
          <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight">
            Every property lead, managed in one place.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-emerald-50/65">
            Track enquiries from every Blend website, respond faster, and move opportunities forward.
          </p>
        </div>
        <p className="text-xs text-emerald-100/40">Blend Property Group CRM</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[#e0e7e3] bg-white p-8 shadow-[0_18px_60px_rgba(20,45,35,0.08)] sm:p-10">
          <div className="lg:hidden">
            <p className="text-xl font-bold text-[#102d23]">BLEND</p>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#60746c]">PROPERTY GROUP</p>
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-[#159a70] lg:mt-0">
            Blend CRM
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#17211d]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6d7b75]">
            Sign in with your Blend administrator account.
          </p>
          <LoginForm />
          <p className="mt-7 text-center text-xs text-[#87928d]">
            Secure access for authorised Blend Property Group staff
          </p>
        </div>
      </section>
    </main>
  );
}
