# Template Badge

Templates are rendered in your browser using [ha-nunjucks](https://github.com/Nerwyn/ha-nunjucks), without Home Assistant server-side template rendering. See its documentation for supported functions and syntax differences from Python/Jinja templates. Existing templates may need adjustments; there is no server-side fallback. A modern browser supporting ES2022 and top-level `await` is required. Invalid templates display their original text without stopping other fields from rendering.

Templates refresh on every Home Assistant frontend update by default. Set `entity_id` to a string or list to restrict state-triggered template refreshes to those entities. Configuration, user, locale, registry, and connection changes also refresh templates. While connected, templates refresh at minute boundaries, including time templates such as `now()`; there is no automatic entity dependency detection.


![Template light](../images/template-badge-light.png)
![Template dark](../images/template-badge-dark.png)

## Description

The **Template Badge** allows you to create a fully customizable badge for your dashboard.
It supports [templating](https://github.com/Nerwyn/ha-nunjucks) in most fields.

When defining an `entity` or an `area`, you can reference them inside templates with the `entity` and `area` variables. For example:

```yaml
content: "{{ states(entity) }}"
label: "{{ area_name(area) }}"
````


---

## Configuration

All options are available in the **Lovelace editor**, but you can also configure the badge directly in **YAML**.

| Name                | Type          | Default  | Description                                                                                           |
| :------------------ | :------------ | :------- | :---------------------------------------------------------------------------------------------------- |
| `entity`            | string        | Optional | Entity used for templating and interactions.                                                               |
| `area`                   | string        | Optional | Area used for templating.
| `icon`              | string        | Optional | Icon to display. Supports [templating](https://github.com/Nerwyn/ha-nunjucks). |
| `color`             | string        | Optional | Color applied to the icon or badge. Supports [templating](https://github.com/Nerwyn/ha-nunjucks).                                           |
| `label`             | string        | Optional | Label displayed below the badge. Only shown if not empty. Supports [templating](https://github.com/Nerwyn/ha-nunjucks).                       |
| `content`           | string        | Optional | Main content inside the badge (e.g., state, text, number). Supports [templating](https://github.com/Nerwyn/ha-nunjucks).                    |
| `picture`           | string        | Optional | Image to display instead of an icon. Supports [templating](https://github.com/Nerwyn/ha-nunjucks).                                          |
| `tap_action`        | action        | `none`   | Action performed when the badge is tapped.                                                            |
| `hold_action`       | action        | `none`   | Action performed when the badge is long-pressed.                                                      |
| `double_tap_action` | action        | `none`   | Action performed when the badge is double-tapped.                                                     |
| `entity_id`         | string / list | Optional | Restricts state-triggered template updates to these entities; otherwise all frontend updates refresh templates. |
---

## Theming

This badge is not compatible with Mushroom themes because it based on the official [badges](https://www.home-assistant.io/dashboards/badges/).

## Available Colors

You can use **color tokens** (theme-aware) or regular **hexadecimal colors**.

### Theme color tokens

* `primary`
* `accent`
* `disabled`
* `primary-text`
* `secondary-text`
* `disabled-text`
* `red`
* `pink`
* `purple`
* `deep-purple`
* `indigo`
* `blue`
* `light-blue`
* `cyan`
* `teal`
* `green`
* `light-green`
* `lime`
* `yellow`
* `amber`
* `orange`
* `deep-orange`
* `brown`
* `light-grey`
* `grey`
* `dark-grey`
* `blue-grey`
* `black`
* `white`

---
## Notes

* You can render **weather SVG icons** by using the [standard weather entity states](https://developers.home-assistant.io/docs/core/entity/weather/#recommended-values-for-state-and-condition) as icon values:

  ```
  weather-clear-night
  weather-cloudy
  weather-fog
  weather-lightning
  weather-lightning-rainy
  weather-partlycloudy
  weather-pouring
  weather-rainy
  weather-hail
  weather-snowy
  weather-snowy-rainy
  weather-sunny
  weather-windy
  weather-windy-variant
  ```

---

## Example YAML

```yaml
type: custom:mushroom-template-badge
entity: sensor.living_room_temperature
icon: mdi:thermometer
color: >
  {% if states(entity) | float > 25 %}
    red
  {% else %}
    blue
  {% endif %}
label: "Living Room"
content: "{{ states(entity) }} °C"
tap_action:
  action: more-info
```

This configuration:

* Displays a thermometer icon.
* Changes the badge color to **red** if the temperature is above 25°C, otherwise **blue**.
* Shows *Living Room* as the label.
* Displays the current temperature as the main badge content.
* Opens the more-info dialog on tap.

```

---

👉 Do you also want me to add an **"Available colors"** section (like we did for Template Card) so users know what predefined colors they can use in badges?
```
