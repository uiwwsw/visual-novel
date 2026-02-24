import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { validateScenario } from "../packages/vn-schema/index.js";

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(`tests/fixtures/${name}`, "utf8"));
}

test("invalid_dangling_edge.json triggers GRAPH_E002", () => {
  const issues = validateScenario(loadFixture("invalid_dangling_edge.json"));
  assert.ok(issues.some((i) => i.code === "GRAPH_E002"));
});

test("invalid_no_entry.json triggers GRAPH_E001", () => {
  const issues = validateScenario(loadFixture("invalid_no_entry.json"));
  assert.ok(issues.some((i) => i.code === "GRAPH_E001"));
});

test("invalid_unreachable_ending.json triggers GRAPH_E003", () => {
  const issues = validateScenario(loadFixture("invalid_unreachable_ending.json"));
  assert.ok(issues.some((i) => i.code === "GRAPH_E003"));
});

test("invalid_choice_overflow.json triggers RULE_E001", () => {
  const issues = validateScenario(loadFixture("invalid_choice_overflow.json"));
  assert.ok(issues.some((i) => i.code === "RULE_E001"));
});

test("invalid_in_operator.json triggers DSL_E006", () => {
  const issues = validateScenario(loadFixture("invalid_in_operator.json"));
  assert.ok(issues.some((i) => i.code === "DSL_E006"));
});

test("invalid_condition_type.json triggers DSL_E005", () => {
  const issues = validateScenario(loadFixture("invalid_condition_type.json"));
  assert.ok(issues.some((i) => i.code === "DSL_E005"));
});
