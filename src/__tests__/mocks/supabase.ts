import { vi } from 'vitest'

type MockFn = ReturnType<typeof vi.fn>

interface ChainProxy {
  [key: string]: MockFn
  _resolve: { data: unknown; error: unknown }
}

function createChain(
  resolveWith: { data: unknown; error: unknown } = { data: null, error: null }
): ChainProxy {
  const state = { _resolve: resolveWith }

  const proxy = new Proxy(state, {
    get(target, prop: string) {
      if (prop === '_resolve') return target._resolve
      if (prop === '_setResolve') {
        return (val: { data: unknown; error: unknown }) => {
          target._resolve = val
        }
      }
      if (prop === 'then') {
        return (resolve: (val: unknown) => void) => resolve(target._resolve)
      }
      if (!target[prop]) {
        target[prop] = vi.fn().mockImplementation(() => proxy)
      }
      return target[prop]
    },
  }) as unknown as ChainProxy

  return proxy
}

export function createMockSupabase() {
  const chain = createChain()

  const storage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/image.png' },
      }),
    }),
  }

  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  }

  return {
    from: vi.fn().mockImplementation(() => chain),
    storage,
    auth,
    _chain: chain,
  }
}

export type MockSupabase = ReturnType<typeof createMockSupabase>
