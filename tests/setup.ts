import { vi } from "vitest";

export function makeHass() {
  return {
    connected: true,
    states: {
      "sensor.test": {
        entity_id: "sensor.test",
        state: "12",
        attributes: { unit_of_measurement: "°C" },
      },
    },
    user: { name: "Ada" },
    locale: {
      language: "en",
      translationMetadata: { translations: {} },
      number_format: "language",
      time_format: "24",
      time_zone: "local",
    },
    language: "en",
    translationMetadata: { translations: {} },
    config: { time_zone: "UTC" },
    entities: {},
    devices: {},
    areas: {},
    floors: {},
    themes: {},
    hassUrl: (path: string) => path,
    connection: {
      connected: true,
      haVersion: "2026.10.0",
      subscribeEvents: vi.fn(async () => () => {}),
      subscribeMessage: vi.fn(async () => () => {}),
      sendMessagePromise: vi.fn(async (message: { type: string }) =>
        message.type === "repairs/list_issues" ? { issues: [] } : []
      ),
    },
    callWS: vi.fn(async (message: { type: string }) =>
      message.type === "repairs/list_issues" ? { issues: [] } : []
    ),
  };
}
const ha = document.createElement("home-assistant");
Object.assign(ha, { hass: makeHass() });
document.body.append(ha);
