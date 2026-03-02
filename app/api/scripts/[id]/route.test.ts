import { describe, it, expect, mock, beforeAll, beforeEach } from "bun:test";

const mockGetUser = mock(() =>
  Promise.resolve({
    data: { user: { id: "user-123", email: "test@test.com" } as { id: string; email: string } | null },
  })
);

function createChainMock(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {};
  chain.select = mock(() => chain);
  chain.eq = mock(() => chain);
  chain.single = mock(() => Promise.resolve({ data: { id: "script-1" }, error: null }));
  chain.update = mock(() => chain);
  chain.delete = mock(() => chain);
  Object.assign(chain, overrides);
  return chain;
}

let ownershipChain: ReturnType<typeof createChainMock>;
let updateChain: ReturnType<typeof createChainMock>;
let deleteChain: ReturnType<typeof createChainMock>;

const mockSupabaseFrom = mock((_table: string) => {
  // The first call is always the ownership check (select -> eq -> eq -> single)
  // The second call is the actual operation
  const callCount = mockSupabaseFrom.mock.calls.length;
  if (callCount % 2 === 1) return ownershipChain; // odd call = ownership
  return updateChain; // even call = operation
});

mock.module("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockSupabaseFrom,
    }),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

beforeEach(() => {
  mockGetUser.mockImplementation(() =>
    Promise.resolve({
      data: { user: { id: "user-123", email: "test@test.com" } },
    })
  );
  mockSupabaseFrom.mockClear();

  ownershipChain = createChainMock();
  updateChain = createChainMock({
    single: mock(() =>
      Promise.resolve({
        data: {
          id: "script-1",
          user_id: "user-123",
          title: "Updated Title",
          script_body: "{}",
          updated_at: new Date().toISOString(),
        },
        error: null,
      })
    ),
  });
  deleteChain = createChainMock({
    delete: mock(() => {
      const c: Record<string, unknown> = {};
      c.eq = mock(() => c);
      c.then = undefined; // make the chain complete when eq is called twice
      // simulate final resolution
      return {
        eq: mock(() => Promise.resolve({ error: null })),
      };
    }),
  });
});

describe("PATCH /api/scripts/[id]", () => {
  it("updates a script with partial data", async () => {
    const { PATCH } = await import("@/app/api/scripts/[id]/route");
    const request = new Request("http://localhost:3000/api/scripts/script-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "script-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe("Updated Title");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: null } })
    );

    const { PATCH } = await import("@/app/api/scripts/[id]/route");
    const request = new Request("http://localhost:3000/api/scripts/script-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "test" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "script-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when script not found or not owned", async () => {
    ownershipChain = createChainMock({
      single: mock(() => Promise.resolve({ data: null, error: null })),
    });

    const { PATCH } = await import("@/app/api/scripts/[id]/route");
    const request = new Request("http://localhost:3000/api/scripts/not-exist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "test" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "not-exist" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { PATCH } = await import("@/app/api/scripts/[id]/route");
    const request = new Request("http://localhost:3000/api/scripts/script-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "script-1" }),
    });
    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/scripts/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: null } })
    );

    const { DELETE } = await import("@/app/api/scripts/[id]/route");
    const request = new Request("http://localhost:3000/api/scripts/script-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "script-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when script not found", async () => {
    ownershipChain = createChainMock({
      single: mock(() => Promise.resolve({ data: null, error: null })),
    });

    const { DELETE } = await import("@/app/api/scripts/[id]/route");
    const request = new Request("http://localhost:3000/api/scripts/not-exist", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "not-exist" }),
    });
    expect(response.status).toBe(404);
  });
});
