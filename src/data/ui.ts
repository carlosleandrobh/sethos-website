// Rótulos fixos das páginas (não vêm das coleções de conteúdo). Textos do site antigo.
export const ui = {
  breadcrumb: { label: 'Breadcrumb', home: 'Início', services: 'Serviços', allServices: 'Todos os serviços' },
  service: {
    about: 'Sobre este serviço',
    benefits: 'Principais Benefícios',
    features: 'O que está incluso',
    faq: 'Perguntas Frequentes',
    previous: 'Serviço Anterior',
    next: 'Próximo Serviço',
    interested: 'Interessado neste serviço?',
    proposalPrefix: 'Fale conosco e receba uma proposta personalizada para ',
    whatsapp: 'Conversar no WhatsApp',
    share: 'Compartilhar este serviço',
    shareLinkedIn: 'Compartilhar no LinkedIn',
    shareEmail: 'Compartilhar por email',
    copyLink: 'Copiar link',
    linkCopied: 'Link copiado!',
    form: {
      name: 'Seu nome completo',
      email: 'Seu melhor e-mail',
      phone: 'Telefone para contato',
      message: 'Conte-nos mais sobre sua necessidade',
    },
    whatsappMessage: (title: string) =>
      `Olá! Gostaria de saber mais sobre o serviço de ${title} da SETHOS.`,
  },
  legal: {
    ctaTitle: 'Precisa de ajuda com consultoria Totvs RM RH?',
    ctaText: 'Entre em contato conosco para saber como podemos ajudar sua empresa.',
    ctaPrimary: 'Fale Conosco',
    ctaSecondary: 'Nossos Serviços',
  },
  contact: {
    whatsappMessage:
      'Olá! Vim através da página de contato e gostaria de saber mais sobre os serviços da SETHOS.',
    scheduleUrl: 'https://outlook.office.com/book/SETHOS@sethos.com.br/?ismsaljsauthenabled',
  },
} as const;
