import request from 'supertest';
import express from 'express';
import { i18nMiddleware } from '../middleware/i18n';

const app = express();
app.use(i18nMiddleware as unknown);
app.get('/ping', (req, res) => {
  res.json({ ok: true });
});

describe('i18n middleware', () => {
  it('sets Content-Language from Accept-Language header', async () => {
    const res = await request(app).get('/ping').set('Accept-Language', 'es-ES,es;q=0.9');
    expect(res.headers['content-language']).toBe('es');
    expect(res.body.ok).toBe(true);
  });

  it('defaults to en when invalid', async () => {
    const res = await request(app).get('/ping').set('Accept-Language', 'xx');
    expect(res.headers['content-language']).toBe('en');
    expect(res.body.ok).toBe(true);
  });
});
