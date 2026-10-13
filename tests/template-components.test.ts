import type { LitElement } from "lit";
import { afterEach, expect, it } from "vitest";
import "../src/cards/template-card/template-card";
import "../src/cards/legacy-template-card/legacy-template-card";
import "../src/cards/chips-card/chips/template-chip";
import "../src/badges/template/template-badge";
import "../src/cards/title-card/title-card";
import { makeHass } from "./setup";
import { assert } from "superstruct";
import { titleCardConfigStruct } from "../src/cards/title-card/title-card-config";

const components = [
  ["mushroom-template-card", "primary"],
  ["mushroom-legacy-template-card", "primary"],
  ["mushroom-template-chip", "content"],
  ["mushroom-template-badge", "content"],
  ["mushroom-title-card", "title"],
] as const;

function renderedText(element: Element): string {
  return (
    (element.shadowRoot?.textContent ?? "") +
    Array.from(element.shadowRoot?.querySelectorAll("*") ?? [])
      .map((child) => (child.shadowRoot ? renderedText(child) : ""))
      .join("")
  );
}

const mounted: HTMLElement[] = [];
afterEach(() => mounted.splice(0).forEach((element) => element.remove()));

it.each(components)(
  "%s renders and updates frontend templates",
  async (tag, field) => {
    const element = document.createElement(tag) as LitElement & {
      hass: unknown;
      setConfig(config: unknown): void;
    };
    const hass = makeHass();
    element.hass = hass as any;
    element.setConfig({
      type: `custom:${tag}`,
      [field]: "{{ user }} {{ states('sensor.test') }}",
      icon: "mdi:home",
    } as any);
    document.body.append(element);
    mounted.push(element);
    await element.updateComplete;
    expect(renderedText(element)).toContain("Ada 12");
    element.setConfig({ type: `custom:${tag}`, [field]: "literal" } as any);
    await element.updateComplete;
    expect(renderedText(element)).toContain("literal");
    expect(renderedText(element)).not.toContain("Ada 12");
    element.setConfig({ type: `custom:${tag}`, [field]: "{{ user }}" } as any);
    element.hass = { ...hass, user: { name: "Grace" } } as any;
    await element.updateComplete;
    expect(renderedText(element)).toContain("Grace");
    expect(hass.connection.subscribeMessage).not.toHaveBeenCalled();
  }
);

it("accepts the documented Title Card entity_id forms", () => {
  for (const entity_id of ["sensor.test", ["sensor.test"], []]) {
    expect(() =>
      assert(
        { type: "custom:mushroom-title-card", entity_id },
        titleCardConfigStruct
      )
    ).not.toThrow();
  }
  expect(() =>
    assert(
      { type: "custom:mushroom-title-card", entity_id: 12 },
      titleCardConfigStruct
    )
  ).toThrow();
});
