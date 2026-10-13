import { TemplateRenderer } from "../../../utils/template-renderer";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  nothing,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  actionHandler,
  ActionHandlerEvent,
  computeRTL,
  handleAction,
  hasAction,
  HomeAssistant,
} from "../../../ha";
import { computeRgbColor } from "../../../utils/colors";
import { getWeatherSvgIcon } from "../../../utils/icons/weather-icon";
import {
  computeChipComponentName,
  computeChipEditorComponentName,
} from "../../../utils/lovelace/chip/chip-element";
import {
  LovelaceChip,
  TemplateChipConfig,
} from "../../../utils/lovelace/chip/types";
import { LovelaceChipEditor } from "../../../utils/lovelace/types";
import { weatherSVGStyles } from "../../../utils/weather";

const TEMPLATE_KEYS = ["content", "icon", "icon_color", "picture"] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

@customElement(computeChipComponentName("template"))
export class TemplateChip extends LitElement implements LovelaceChip {
  public static async getConfigElement(): Promise<LovelaceChipEditor> {
    await import("./template-chip-editor");
    return document.createElement(
      computeChipEditorComponentName("template")
    ) as LovelaceChipEditor;
  }

  public static async getStubConfig(
    _hass: HomeAssistant
  ): Promise<TemplateChipConfig> {
    return {
      type: `template`,
    };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: TemplateChipConfig;

  private readonly _templates = new TemplateRenderer(
    this,
    () => this.hass,
    () => this._config,
    TEMPLATE_KEYS,
    ["entity"]
  );

  public setConfig(config: TemplateChipConfig): void {
    this._config = {
      tap_action: {
        action: "toggle",
      },
      hold_action: {
        action: "more-info",
      },
      ...config,
    };
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }

  public isTemplate(key: TemplateKey) {
    return this._templates.isTemplate(key);
  }

  private getValue(key: TemplateKey) {
    return this._templates.getValue(key);
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const icon = this.getValue("icon");
    const iconColor = this.getValue("icon_color");
    const content = this.getValue("content");
    const picture = this.getValue("picture");

    const rtl = computeRTL(this.hass);
    const weatherSvg = getWeatherSvgIcon(icon);

    return html`
      <mushroom-chip
        ?rtl=${rtl}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleClick: hasAction(this._config.double_tap_action),
        })}
        .avatar=${picture ? (this.hass as any).hassUrl(picture) : undefined}
        .avatarOnly=${(picture && !content) || false}
      >
        ${!picture
          ? weatherSvg
            ? weatherSvg
            : icon
              ? this.renderIcon(icon, iconColor)
              : nothing
          : nothing}
        ${content ? this.renderContent(content) : nothing}
      </mushroom-chip>
    `;
  }

  protected renderIcon(icon: string, iconColor?: string): TemplateResult {
    const iconStyle = {};
    if (iconColor) {
      const iconRgbColor = computeRgbColor(iconColor);
      iconStyle["--color"] = `rgb(${iconRgbColor})`;
    }
    return html`<ha-state-icon
      .hass=${this.hass}
      .icon=${icon}
      style=${styleMap(iconStyle)}
    ></ha-state-icon>`;
  }

  protected renderContent(content: string): TemplateResult {
    return html`<span>${content}</span>`;
  }

  static get styles(): CSSResultGroup {
    return css`
      mushroom-chip {
        cursor: pointer;
      }
      ha-state-icon {
        color: var(--color);
      }
      ${weatherSVGStyles}
    `;
  }
}
