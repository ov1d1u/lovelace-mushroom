import { afterEach, describe, expect, it, vi } from "vitest";
import type { HomeAssistant } from "../src/ha";
import { TemplateRenderer } from "../src/utils/template-renderer";
import { makeHass } from "./setup";

const activeRenderers: { hostDisconnected(): void }[] = [];

function fixture(initial: Record<string, any> = {}) {
  let config = initial;
  let hass = makeHass();
  const host = {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
  const renderer = new TemplateRenderer(
    host,
    () => hass as unknown as HomeAssistant,
    () => config,
    ["primary", "secondary", "icon"],
    ["entity", "area"]
  );
  activeRenderers.push(renderer);
  renderer.hostConnected();
  renderer.hostUpdate();
  return {
    renderer,
    host,
    get hass() {
      return hass;
    },
    setHass(value: typeof hass) {
      hass = value;
      renderer.hostUpdate();
    },
    setConfig(value: Record<string, any>) {
      config = value;
      renderer.hostUpdate();
    },
  };
}

afterEach(() => {
  activeRenderers.splice(0).forEach((renderer) => renderer.hostDisconnected());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("frontend templates", () => {
  it("does not render for unrelated state changes with an explicit filter", () => {
    const f = fixture({
      entity_id: "sensor.missing",
      primary: "{{ states('sensor.test') }}",
    });
    const render = vi.spyOn(
      (
        window as unknown as {
          haNunjucks: { env: { renderString(...args: unknown[]): string } };
        }
      ).haNunjucks.env,
      "renderString"
    );
    f.setHass({
      ...f.hass,
      states: {
        "sensor.test": { ...f.hass.states["sensor.test"], state: "20" },
      },
    });
    expect(render).not.toHaveBeenCalled();
    expect(f.renderer.getValue("primary")).toBe("12");
    f.setConfig({
      entity_id: "sensor.test",
      primary: "{{ states('sensor.test') }}",
    });
    expect(f.renderer.getValue("primary")).toBe("20");
  });

  it.each([
    "locale",
    "entities",
    "devices",
    "areas",
    "floors",
    "config",
    "connection",
  ] as const)("invalidates filtered results on %s changes", (key) => {
    const f = fixture({ entity_id: [], primary: "{{ user }}" });
    const render = vi.spyOn(
      (
        window as unknown as {
          haNunjucks: { env: { renderString(...args: unknown[]): string } };
        }
      ).haNunjucks.env,
      "renderString"
    );
    f.setHass({ ...f.hass, [key]: { ...f.hass[key] } });
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("renders literals, multiline syntax, state attributes and context", () => {
    const f = fixture({
      entity: "sensor.test",
      area: "kitchen",
      primary: "literal { braces }",
      secondary:
        "{% if\n is_state(entity, '12') %}{{ user }} {{ area }} {{ config.entity }} {{ state_attr(entity, 'unit_of_measurement') }}{% endif %}",
      icon: "{{ states(entity) }}",
    });
    expect(f.renderer.getValue("primary")).toBe("literal { braces }");
    expect(f.renderer.getValue("secondary")).toBe("Ada kitchen sensor.test °C");
    expect(f.renderer.getValue("icon")).toBe("12");
  });
  it("normalizes booleans and isolates invalid templates", () => {
    const f = fixture({
      primary: "{{ true }}",
      secondary: "{{ missing_function() }}",
      icon: "mdi:home",
    });
    expect(f.renderer.getValue("primary")).toBe("true");
    expect(f.renderer.getValue("secondary")).toBe("{{ missing_function() }}");
    expect(f.renderer.getValue("icon")).toBe("mdi:home");
    f.setConfig({ primary: "{{ false }}" });
    expect(f.renderer.getValue("primary")).toBe("false");
    expect(f.renderer.getValue("icon")).toBeUndefined();
    f.setConfig({ primary: "plain" });
    expect(f.renderer.getValue("primary")).toBe("plain");
  });
  it.each(["sensor.test", ["sensor.test"]])(
    "honors entity filters %s and context invalidation",
    (entity_id) => {
      const f = fixture({
        entity_id,
        primary: "{{ states('sensor.test') }} {{ user }}",
      });
      f.setHass({ ...f.hass, states: { ...f.hass.states } });
      expect(f.renderer.getValue("primary")).toBe("12 Ada");
      f.setHass({
        ...f.hass,
        states: {
          "sensor.test": { ...f.hass.states["sensor.test"], state: "13" },
        },
      });
      expect(f.renderer.getValue("primary")).toBe("13 Ada");
      f.setHass({ ...f.hass, user: { name: "Grace" } });
      expect(f.renderer.getValue("primary")).toBe("13 Grace");
    }
  );
  it("updates without a filter, and replaces the template and entity context", () => {
    const f = fixture({ primary: "{{ states('sensor.test') }}" });
    f.setHass({
      ...f.hass,
      states: {
        "sensor.test": { ...f.hass.states["sensor.test"], state: "14" },
      },
    });
    expect(f.renderer.getValue("primary")).toBe("14");
    f.setConfig({ entity: "sensor.other", primary: "{{ entity }}" });
    expect(f.renderer.getValue("primary")).toBe("sensor.other");
  });
  it("refreshes at minute boundaries independently of filters and cleans up on disconnect", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T12:00:30Z"));
    const f = fixture({ entity_id: [], primary: "{{ now().minute }}" });
    expect(f.renderer.getValue("primary")).toBe("0");
    vi.advanceTimersByTime(30000);
    f.renderer.hostUpdate();
    expect(f.renderer.getValue("primary")).toBe("1");
    expect(vi.getTimerCount()).toBe(1);
    f.renderer.hostDisconnected();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60000);
    f.renderer.hostConnected();
    f.renderer.hostUpdate();
    expect(f.renderer.getValue("primary")).toBe("2");
    f.setConfig({ primary: "literal" });
    expect(vi.getTimerCount()).toBe(0);
  });
});
