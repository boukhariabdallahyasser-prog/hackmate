// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { CredentialFields } from "@/components/credential-fields";

afterEach(cleanup);

test("registration flags an invalid university email", async () => {
  render(<CredentialFields screen="register" />);
  const input = screen.getByRole("textbox", { name: "University email" });
  fireEvent.change(input, { target: { value: "invalid-email" } });
  fireEvent.blur(input);
  await waitFor(() => expect(input.getAttribute("aria-invalid")).toBe("true"));
});

test("password recovery asks for an email only", () => {
  render(<CredentialFields screen="recover" />);
  expect(
    screen.getByRole("textbox", { name: "University email" }),
  ).toBeTruthy();
  expect(screen.queryByLabelText("Password")).toBeNull();
});
