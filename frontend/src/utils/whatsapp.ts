const MENSAGEM = 'Olá! Vim pelo site da NorDTF e quero tirar uma dúvida.'

export const ROTULO_DO_WHATSAPP = 'Falar no WhatsApp (abre em nova aba)'

export function linkDoWhatsApp() {
  const numero = import.meta.env.VITE_WHATSAPP_NUMERO
  if (!numero || !/^\d+$/.test(numero)) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM)}`
}
