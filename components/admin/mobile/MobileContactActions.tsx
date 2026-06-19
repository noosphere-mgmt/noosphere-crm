"use client";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function whatsAppHref(value: string): string {
  const digits = digitsOnly(value);
  return digits ? `https://wa.me/${digits}` : "#";
}

export function MobileContactActions({
  phone,
  whatsapp,
  email,
}: {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}) {
  const wa = (whatsapp ?? phone)?.trim();
  const tel = phone?.trim();
  const mail = email?.trim();

  if (!tel && !wa && !mail) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      {tel ? (
        <a
          href={`tel:${tel}`}
          className="inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-800"
        >
          Call
        </a>
      ) : null}
      {wa ? (
        <a
          href={whatsAppHref(wa)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center rounded-lg bg-[#DCFCE7] px-3 text-sm font-medium text-[#166534]"
        >
          WhatsApp
        </a>
      ) : null}
      {mail ? (
        <a
          href={`mailto:${mail}`}
          className="inline-flex min-h-10 items-center rounded-lg bg-[#EFF6FF] px-3 text-sm font-medium text-[#1D4ED8]"
        >
          Email
        </a>
      ) : null}
    </div>
  );
}
