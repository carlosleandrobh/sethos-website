import { describe, expect, it } from 'vitest';
import { canonicalPath } from '../src/lib/url';

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
