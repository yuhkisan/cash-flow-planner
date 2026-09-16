import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./home";

describe("Home", () => {
  it("アプリ名を表示する", () => {
    render(<Home />);

    expect(screen.getByRole("main")).toHaveTextContent("Cash Flow Planner");
  });
});
