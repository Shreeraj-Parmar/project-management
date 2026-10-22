/** Decorative corner shapes behind the login card (Atlassian sign-in style). Purely visual. */
export function LoginBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <svg className="absolute -bottom-16 -left-24 hidden h-[420px] w-[520px] sm:block" viewBox="0 0 520 420" fill="none">
        <path d="M0 420V190C70 120 170 150 230 220s150 90 290 40v160H0Z" fill="#E9F2FF" />
        <path d="M0 420V280c60-40 130-20 180 30s110 70 190 30v80H0Z" fill="#CCE0FF" />
        <rect x="70" y="120" width="70" height="110" rx="8" fill="#85B8FF" opacity=".55" />
        <rect x="150" y="150" width="70" height="80" rx="8" fill="#579DFF" opacity=".45" />
      </svg>
      <svg className="absolute -right-20 -top-16 hidden h-[380px] w-[480px] sm:block" viewBox="0 0 480 380" fill="none">
        <path d="M480 0v260C400 320 320 290 270 220S150 120 60 140C130 60 220 0 300 0h180Z" fill="#E9F2FF" />
        <path d="M480 0v140c-60 40-120 20-160-30S220 40 160 50C200 20 250 0 300 0h180Z" fill="#CCE0FF" />
        <rect x="330" y="130" width="64" height="96" rx="8" fill="#85B8FF" opacity=".55" />
        <rect x="402" y="150" width="64" height="66" rx="8" fill="#579DFF" opacity=".45" />
      </svg>
    </div>
  );
}
