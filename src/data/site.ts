// Dados globais do site (navegação, contato, rodapé). Textos migrados do site antigo (valor do banco prevalece).
export const site = {
  name: 'SETHOS',
  legalName: 'SETHOS Tecnologia da Informação Ltda',
  cnpj: '29.298.410/0001-42',
  url: 'https://sethos.com.br',
  email: 'falecom@sethos.com.br',
  phone: { display: '(31) 97245-7451', tel: '+5531972457451', whatsapp: '5531972457451' },
  whatsappMessage:
    'Olá! Gostaria de saber mais sobre os serviços de consultoria Totvs RM RH da SETHOS.',
  social: [
    { label: 'LinkedIn', icon: 'simple-icons:linkedin', href: 'https://linkedin.com/company/sethos' },
    { label: 'Instagram', icon: 'simple-icons:instagram', href: 'https://instagram.com/sethos.ti' },
    { label: 'Facebook', icon: 'simple-icons:facebook', href: 'https://www.facebook.com/sethos.ti' },
  ],
  nav: [
    { href: '/', label: 'Início' },
    { href: '/quem-somos', label: 'Quem Somos' },
    { href: '/servicos', label: 'Serviços' },
    { href: '/nossos-valores', label: 'Nossos Valores' },
    { href: '/contato', label: 'Contato' },
  ],
  legalNav: [
    { href: '/politica-de-privacidade', label: 'Política de Privacidade' },
    { href: '/politica-de-cookies', label: 'Política de Cookies' },
    { href: '/termos-de-uso', label: 'Termos de Uso' },
  ],
  footer: {
    description:
      'Especialistas em Totvs RM com foco em Departamento Pessoal e Gestão de Pessoas. Oferecemos soluções personalizadas para otimizar seus processos e maximizar a eficiência operacional da sua empresa.',
    disclaimer:
      'A SETHOS TECNOLOGIA DA INFORMAÇÃO LTDA é uma empresa independente e não possui nenhum vínculo, direto ou indireto, com a TOTVS, suas franquias ou representantes. RM e SmartView são produtos de propriedade da TOTVS S.A., sendo TOTVS uma marca registrada.',
  },
  cta: { label: 'Solicite um contato', href: '/contato' },
} as const;

export const whatsappUrl = (message: string = site.whatsappMessage) =>
  `https://wa.me/${site.phone.whatsapp}?text=${encodeURIComponent(message)}`;
