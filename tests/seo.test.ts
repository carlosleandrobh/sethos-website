import { describe, expect, it } from 'vitest';
import { lastModified, sourcesFor } from '../scripts/lib/lastmod.mjs';
import { breadcrumbs, faqPage, organization, service, toScript } from '../src/lib/jsonld';
import { canonicalPath, ogSlug } from '../src/lib/url';

describe('ogSlug (nome da imagem de compartilhamento)', () => {
  it.each([
    ['/', 'home'],
    ['/index.html', 'home'],
    ['/quem-somos', 'quem-somos'],
    ['/quem-somos.html', 'quem-somos'],
    ['/servicos/consultoria-rh', 'servicos-consultoria-rh'],
    ['/servicos/consultoria-rh.html', 'servicos-consultoria-rh'],
    ['/termos-de-uso', 'termos-de-uso'],
  ])('%s → %s', (path, slug) => expect(ogSlug(path)).toBe(slug));
  it('é consistente com canonicalPath', () => expect(canonicalPath('/servicos/x.html')).toBe('/servicos/x'));
});

describe('dados estruturados (JSON-LD)', () => {
  const org = organization({
    name: 'SETHOS', legalName: 'SETHOS Ltda', url: 'https://sethos.com.br', email: 'a@b.com', telephone: '+5531972457451',
    cnpj: '29.298.410/0001-42', locality: 'Belo Horizonte', region: 'MG', sameAs: ['https://linkedin.com/company/sethos'], description: 'desc',
  });
  it('organização com endereço, contato e redes', () => {
    expect(org['@type']).toBe('ProfessionalService');
    expect(org['@id']).toBe('https://sethos.com.br/#organization');
    expect(org.address).toMatchObject({ addressLocality: 'Belo Horizonte', addressRegion: 'MG', addressCountry: 'BR' });
    expect(org.telephone).toBe('+5531972457451');
    expect(org.logo).toBe('https://sethos.com.br/icon-512.png');
    expect(org.sameAs).toEqual(['https://linkedin.com/company/sethos']);
  });
  it('serviço aponta para a organização', () => {
    const s = service({ siteUrl: 'https://sethos.com.br', slug: 'consultoria-rh', name: 'Consultoria', description: 'd', keywords: ['consultoria RH', 'folha'] });
    expect(s).toMatchObject({ '@type': 'Service', url: 'https://sethos.com.br/servicos/consultoria-rh', provider: { '@id': 'https://sethos.com.br/#organization' }, serviceType: 'consultoria RH' });
  });
  it('FAQ e trilha', () => {
    const f = faqPage([{ question: 'P?', answer: 'R.' }]);
    expect(f.mainEntity[0]).toMatchObject({ '@type': 'Question', name: 'P?', acceptedAnswer: { text: 'R.' } });
    const b = breadcrumbs('https://sethos.com.br', [{ name: 'Início', path: '/' }, { name: 'Serviços', path: '/servicos' }]);
    expect(b.itemListElement.map((i) => [i.position, i.item])).toEqual([[1, 'https://sethos.com.br/'], [2, 'https://sethos.com.br/servicos']]);
  });
  it('toScript não deixa um "</script>" fechar a tag', () => {
    expect(toScript({ x: '</script><script>alert(1)</script>' })).not.toContain('</script>');
    expect(JSON.parse(toScript({ x: '<b>' })).x).toBe('<b>');
  });
});

describe('lastmod do sitemap', () => {
  it('mapeia cada página para o arquivo de conteúdo certo', () => {
    expect(sourcesFor('/')).toEqual(['src/content/pages/home.yaml']);
    expect(sourcesFor('/quem-somos')).toEqual(['src/content/pages/about.yaml']);
    expect(sourcesFor('/servicos/consultoria-rh')).toEqual(['src/content/services/consultoria-rh.md']);
    expect(sourcesFor('/politica-de-cookies')).toEqual(['src/content/legal/politica-de-cookies.md']);
    expect(sourcesFor('/servicos')).toContain('src/content/pages/services-index.yaml');
    expect(sourcesFor('/servicos').length).toBeGreaterThan(5);
  });
  it('devolve uma data AAAA-MM-DD ou null (nunca uma data inventada)', () => {
    const d = lastModified('/');
    expect(d === null || /^\d{4}-\d{2}-\d{2}$/.test(d)).toBe(true);
    expect(lastModified('/pagina-que-nao-existe-no-conteudo/x/y')).toBeNull();
  });
});
