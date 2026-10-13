import { TemplateRenderer } from "../../utils/template-renderer";
import { css, CSSResultGroup, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import {
  actionHandler,
  ActionHandlerEvent,
  computeRTL,
  handleAction,
  HomeAssistant,
  LovelaceCard,
  LovelaceCardEditor,
} from "../../ha";
import "../../shared/shape-icon";
import "../../shared/state-info";
import "../../shared/state-item";
import { MushroomBaseElement } from "../../utils/base-element";
import { cardStyle } from "../../utils/card-styles";
import { registerCustomCard } from "../../utils/custom-cards";
import { TITLE_CARD_EDITOR_NAME, TITLE_CARD_NAME } from "./const";
import { TitleCardConfig } from "./title-card-config";

registerCustomCard({
  type: TITLE_CARD_NAME,
  name: "Mushroom Title Card",
  description: "Title and subtitle to separate sections",
});

const TEMPLATE_KEYS = ["title", "subtitle"] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

@customElement(TITLE_CARD_NAME)
export class TitleCard extends MushroomBaseElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./title-card-editor");
    return document.createElement(TITLE_CARD_EDITOR_NAME) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    _hass: HomeAssistant
  ): Promise<TitleCardConfig> {
    return {
      type: `custom:${TITLE_CARD_NAME}`,
      title: "Hello, {{ user }} !",
    };
  }

  @state() private _config?: TitleCardConfig;

  private readonly _templates = new TemplateRenderer(
    this,
    () => this.hass,
    () => this._config,
    TEMPLATE_KEYS,
    []
  );

  getCardSize(): number | Promise<number> {
    return 1;
  }

  setConfig(config: TitleCardConfig): void {
    this._config = {
      title_tap_action: {
        action: "none",
      },
      subtitle_tap_action: {
        action: "none",
      },
      ...config,
    };
  }

  public isTemplate(key: TemplateKey) {
    return this._templates.isTemplate(key);
  }

  private getValue(key: TemplateKey) {
    return this._templates.getValue(key);
  }

  private _handleTitleAction(ev: ActionHandlerEvent) {
    const config = {
      tap_action: this._config!.title_tap_action,
    };
    handleAction(this, this.hass!, config, ev.detail.action!);
  }

  private _handleSubtitleAction(ev: ActionHandlerEvent) {
    const config = {
      tap_action: this._config!.subtitle_tap_action,
    };
    handleAction(this, this.hass!, config, ev.detail.action!);
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    const title = this.getValue("title");
    const subtitle = this.getValue("subtitle");
    let alignment = "";
    if (this._config.alignment) {
      alignment = `align-${this._config.alignment}`;
    }

    const actionableTitle = Boolean(
      this._config.title_tap_action &&
      this._config.title_tap_action.action !== "none"
    );
    const actionableSubtitle = Boolean(
      this._config.subtitle_tap_action &&
      this._config.subtitle_tap_action.action !== "none"
    );

    const rtl = computeRTL(this.hass);

    return html`
      <ha-card class="header ${alignment}" ?rtl=${rtl}>
        ${title
          ? html`
              <div
                role=${ifDefined(actionableTitle ? "button" : undefined)}
                tabindex=${ifDefined(actionableTitle ? "0" : undefined)}
                class=${classMap({
                  actionable: actionableTitle,
                })}
                @action=${this._handleTitleAction}
                .actionHandler=${actionHandler()}
              >
                <h1 class="title">${title}${this.renderArrow()}</h1>
              </div>
            `
          : nothing}
        ${subtitle
          ? html`
              <div
                role=${ifDefined(actionableSubtitle ? "button" : undefined)}
                tabindex=${ifDefined(actionableSubtitle ? "0" : undefined)}
                class=${classMap({
                  actionable: actionableSubtitle,
                })}
                @action=${this._handleSubtitleAction}
                .actionHandler=${actionHandler()}
              >
                <h2 class="subtitle">${subtitle}${this.renderArrow()}</h2>
              </div>
            `
          : nothing}
      </ha-card>
    `;
  }

  private renderArrow() {
    const rtl = computeRTL(this.hass);
    return html` <ha-icon
      .icon=${rtl ? "mdi:chevron-left" : "mdi:chevron-right"}
    ></ha-icon>`;
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      cardStyle,
      css`
        .header {
          display: block;
          padding: var(--title-padding);
          background: none;
          border: none;
          box-shadow: none;
          text-align: var(--card-text-align, inherit);
        }
        .header div * {
          margin: 0;
          white-space: pre-wrap;
        }
        .header div:not(:last-of-type) {
          margin-bottom: var(--title-spacing);
        }
        .actionable {
          cursor: pointer;
        }
        .header ha-icon {
          display: none;
        }
        .actionable ha-icon {
          display: inline-block;
          margin-left: 4px;
          transition: transform 180ms ease-in-out;
        }
        .actionable:hover ha-icon {
          transform: translateX(4px);
        }
        [rtl] .actionable ha-icon {
          margin-left: initial;
          margin-right: 4px;
        }
        [rtl] .actionable:hover ha-icon {
          transform: translateX(-4px);
        }
        .title {
          color: var(--title-color);
          font-size: var(--title-font-size);
          font-weight: var(--title-font-weight);
          line-height: var(--title-line-height);
          letter-spacing: var(--title-letter-spacing);
          --mdc-icon-size: var(--title-font-size);
        }
        .subtitle {
          color: var(--subtitle-color);
          font-size: var(--subtitle-font-size);
          font-weight: var(--subtitle-font-weight);
          line-height: var(--subtitle-line-height);
          letter-spacing: var(--subtitle-letter-spacing);
          --mdc-icon-size: var(--subtitle-font-size);
        }
        .align-start {
          text-align: start;
        }
        .align-end {
          text-align: end;
        }
        .align-center {
          text-align: center;
        }
        .align-justify {
          text-align: justify;
        }
      `,
    ];
  }
}
