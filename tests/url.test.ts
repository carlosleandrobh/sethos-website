import { describe, expect, it } from 'vitest';
import { canonicalPath, contactFormHref, SERVICE_PARAM } from '../src/lib/url';

describe('canonicalPath', () => {
  it.each([
    ['/', '/'],
    ['/index.html', '/'],
    ['/quem-somos.html', '/quem-somos'],
    ['/quem-somos', '/quem-somos'],
    ['/quem-somos/', '/quem-somos'],
    ['/servicos/consultoria-rh.html', '/servicos/consultoria-rh'],
    ['/404.html', '/404'],
  ])('%s -> %s', (input, expected) => expect(canonicalPath(input)).toBe(expected));
});

describe('contactFormHref', () => {
  it('sem serviço aponta para o formulário', () => expect(contactFormHref()).toBe('/contato#formulario'));
  it('com serviço leva o identificador no parâmetro da URL', () => {
    expect(contactFormHref('dashboards-rh')).toBe(`/contato?${SERVICE_PARAM}=dashboards-rh#formulario`);
  });
});
