import { describe, expect, it } from "vitest";
import { applyEditAction, parseEditActions } from "../src/editing/editActions";

describe("parseEditActions", () => {
  it("extracts provider-neutral edit actions from fenced JSON", () => {
    const actions = parseEditActions(
      "Here is the edit.\n```j-chat-edit\n{\"actions\":[{\"type\":\"replace-selection\",\"text\":\"new text\"}]}\n```"
    );

    expect(actions).toEqual([{ type: "replace-selection", text: "new text" }]);
  });
});

describe("applyEditAction", () => {
  it("applies replace-selection to a selected range", () => {
    const result = applyEditAction("hello old world", { from: 6, to: 9 }, { type: "replace-selection", text: "new" });

    expect(result).toBe("hello new world");
  });

  it("applies append and prepend without requiring a selection", () => {
    expect(applyEditAction("body", null, { type: "append", text: "\nend" })).toBe("body\nend");
    expect(applyEditAction("body", null, { type: "prepend", text: "start\n" })).toBe("start\nbody");
  });
});

