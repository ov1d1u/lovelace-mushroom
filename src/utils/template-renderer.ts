import { renderTemplate } from "ha-nunjucks";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { HomeAssistant } from "../ha";
import { isTemplate } from "../ha/common/string/has-template";

type TemplateConfig = {
  entity_id?: string | string[];
  entity?: string;
  area?: string;
};

/** Render locally before the host renders, with instance-local invalidation. */
export class TemplateRenderer<
  Config extends TemplateConfig,
  Key extends string,
> implements ReactiveController {
  private _results: Partial<Record<Key, string>> = {};
  private _hass?: HomeAssistant;
  private _config?: Config;
  private _connected = false;
  private _refresh = true;
  private _timer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly _host: ReactiveControllerHost,
    private readonly _getHass: () => HomeAssistant | undefined,
    private readonly _getConfig: () => Config | undefined,
    private readonly _keys: readonly Key[],
    private readonly _contextKeys: readonly ("entity" | "area")[] = []
  ) {
    _host.addController(this);
  }

  public hostConnected(): void {
    this._connected = true;
    this._refresh = true;
    this._host.requestUpdate();
  }

  public hostDisconnected(): void {
    this._connected = false;
    this._stopTimer();
  }

  public isTemplate(key: Key): boolean {
    const value = this._getConfig()?.[key as keyof Config];
    return typeof value === "string" && isTemplate(value);
  }

  public getValue(key: Key): string | undefined {
    const value = this._getConfig()?.[key as keyof Config];
    return this.isTemplate(key)
      ? this._results[key]
      : typeof value === "string"
        ? value
        : undefined;
  }

  public hostUpdate(): void {
    const hass = this._getHass();
    const config = this._getConfig();
    if (!hass || !config) {
      this._stopTimer();
      return;
    }
    const hasTemplates = this._keys.some((key) => this.isTemplate(key));
    if (
      this._refresh ||
      config !== this._config ||
      this._hassChanged(hass, config)
    ) {
      const context: Record<string, unknown> = {
        config,
        user: hass.user?.name ?? "",
      };
      for (const key of this._contextKeys) context[key] = config[key];
      this._results = {};
      for (const key of this._keys) {
        if (!this.isTemplate(key)) continue;
        const value = config[key as keyof Config] as string;
        try {
          this._results[key] = String(
            // The bundled HA types lag behind the actual frontend hass object.
            renderTemplate(
              hass as unknown as Parameters<typeof renderTemplate>[0],
              value,
              context,
              false
            )
          );
        } catch {
          // One invalid field must not prevent the remaining fields rendering.
          this._results[key] = value;
        }
      }
    }
    this._config = config;
    this._hass = hass;
    this._refresh = false;
    if (hasTemplates && this._connected) this._startTimer();
    else this._stopTimer();
  }

  private _hassChanged(hass: HomeAssistant, config: Config): boolean {
    const previous = this._hass;
    if (!previous) return true;
    // Context and registry changes must not be hidden by entity filtering.
    const contextKeys = [
      "user",
      "locale",
      "language",
      "entities",
      "devices",
      "areas",
      "floors",
      "config",
      "connection",
      "connected",
    ] as const;
    if (
      contextKeys.some(
        (key) => Reflect.get(hass, key) !== Reflect.get(previous, key)
      )
    )
      return true;
    if (config.entity_id === undefined) return hass !== previous;
    const entities =
      typeof config.entity_id === "string"
        ? [config.entity_id]
        : config.entity_id;
    return entities.some(
      (entity) => hass.states[entity] !== previous.states[entity]
    );
  }

  private _startTimer(): void {
    if (this._timer !== undefined) return;
    this._timer = setTimeout(
      () => {
        this._timer = undefined;
        this._refresh = true;
        this._host.requestUpdate();
      },
      60000 - (Date.now() % 60000)
    );
  }

  private _stopTimer(): void {
    clearTimeout(this._timer);
    this._timer = undefined;
  }
}
