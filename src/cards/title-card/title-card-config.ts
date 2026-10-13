import { array, assign, object, optional, string, union } from "superstruct";
import { ActionConfig, actionConfigStruct, LovelaceCardConfig } from "../../ha";
import { lovelaceCardConfigStruct } from "../../shared/config/lovelace-card-config";

export interface TitleCardConfig extends LovelaceCardConfig {
  entity_id?: string | string[];
  title?: string;
  subtitle?: string;
  alignment?: string;
  title_tap_action?: ActionConfig;
  subtitle_tap_action?: ActionConfig;
}

export const titleCardConfigStruct = assign(
  lovelaceCardConfigStruct,
  object({
    entity_id: optional(union([string(), array(string())])),
    title: optional(string()),
    subtitle: optional(string()),
    alignment: optional(string()),
    title_tap_action: optional(actionConfigStruct),
    subtitle_tap_action: optional(actionConfigStruct),
  })
);
