import { describe, expect, it } from 'vitest';
import { SERVICE_SLUGS } from '../src/lib/slug';

describe('SERVICE_SLUGS', () => {
  it('mantém os 9 slugs de serviço das URLs atuais', () => {
    expect(SERVICE_SLUGS).toHaveLength(9);
    expect(new Set(SERVICE_SLUGS).size).toBe(9);
  });
});
