import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTACT_CHANNELS, contactChannel, trackContact } from '../src/lib/trackers';

describe('contactChannel', () => {
  it.each(CONTACT_CHANNELS)('aceita o canal %s', (channel) => expect(contactChannel(channel)).toBe(channel));
  it.each([undefined, '', 'WhatsApp', 'fax', 'whatsapp '])('descarta %j', (value) => expect(contactChannel(value)).toBeNull());
});

describe('trackContact', () => {
  const w = globalThis as unknown as { window?: Record<string, unknown> };
  afterEach(() => delete w.window);

  it('avisa Meta (Contact) e Google (contact) com o canal', () => {
    const fbq = vi.fn();
    const gtag = vi.fn();
    w.window = { fbq, gtag };
    trackContact('whatsapp');
    expect(fbq).toHaveBeenCalledWith('track', 'Contact', { channel: 'whatsapp' });
    expect(gtag).toHaveBeenCalledWith('event', 'contact', { method: 'whatsapp' });
  });

  it('sem consentimento (ferramentas não carregadas) não faz nada', () => {
    w.window = {};
    expect(() => trackContact('phone')).not.toThrow();
  });
});
