import { beforeEach, expect, test, vi } from "vitest";

const { rpc, revalidatePath, requireMember } = vi.hoisted(() => ({
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
  requireMember: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireMember }));

import { updateTeam } from "@/app/teams/actions";

const team = "00000000-0000-4000-8000-000000000001";
const member = "00000000-0000-4000-8000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ client: { rpc } });
  rpc.mockResolvedValue({ data: null, error: null });
});

for (const decision of ["remove", "transfer"] as const) {
  test(`a team member ${decision} calls only manage_member`, async () => {
    const form = new FormData();
    form.set("member", member);
    form.set("decision", decision);

    const result = await updateTeam("membership", team, { message: "" }, form);

    expect(result.success).toBe(true);
    expect(requireMember).toHaveBeenCalledWith("verified");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("manage_member", {
      team,
      member,
      transfer: decision === "transfer",
    });
    expect(revalidatePath).not.toHaveBeenCalledWith("/staff");
  });
}

test("a failed member action must not cancel any invitation", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "Not authorized" } });
  const form = new FormData();
  form.set("member", member);
  form.set("decision", "remove");

  const result = await updateTeam("membership", team, { message: "" }, form);

  expect(result.success).not.toBe(true);
  expect(rpc).toHaveBeenCalledOnce();
  expect(rpc).toHaveBeenCalledWith("manage_member", {
    team,
    member,
    transfer: false,
  });
});

test("cancelling an invitation still calls its dedicated RPC", async () => {
  const result = await updateTeam(
    "cancel-invitation",
    team,
    { message: "" },
    new FormData(),
  );

  expect(result.success).toBe(true);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("cancel_invitation", {
    invitation: team,
  });
  expect(revalidatePath).toHaveBeenCalledWith("/staff");
});
