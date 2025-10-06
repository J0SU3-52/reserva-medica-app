// __tests__/http.secure.test.ts
import MockAdapter from 'axios-mock-adapter';
import { httpSecure } from '../src/services/http.secure';
import { auth } from '../src/lib/firebase';
import { signOut } from 'firebase/auth';

describe('http.secure interceptor', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(httpSecure);
    (auth as any).currentUser = null;
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  it('inyecta Authorization Bearer cuando hay usuario', async () => {
    (auth as any).currentUser = {
      getIdToken: jest.fn().mockResolvedValue('FAKE_TOKEN'),
    };

    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer FAKE_TOKEN');
      return [200, { ok: true }];
    });

    const res = await httpSecure.get('/ping');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });
  });

  it('hace signOut cuando el servidor responde 401', async () => {
    mock.onGet('/secret').reply(401, { msg: 'no auth' });

    await expect(httpSecure.get('/secret')).rejects.toBeTruthy();
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('hace signOut cuando el servidor responde 403', async () => {
    mock.onPost('/admin').reply(403, { msg: 'forbidden' });

    await expect(httpSecure.post('/admin')).rejects.toBeTruthy();
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
