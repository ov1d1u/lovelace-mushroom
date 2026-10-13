# Title card

Templates are rendered in your browser using [ha-nunjucks](https://github.com/Nerwyn/ha-nunjucks), without Home Assistant server-side template rendering. See its documentation for supported functions and syntax differences from Python/Jinja templates. Existing templates may need adjustments; there is no server-side fallback. A modern browser supporting ES2022 and top-level `await` is required. Invalid templates display their original text without stopping other fields from rendering.

Templates refresh on every Home Assistant frontend update by default. Set `entity_id` to a string or list to restrict state-triggered template refreshes to those entities. Configuration, user, locale, registry, and connection changes also refresh templates. While connected, templates refresh at minute boundaries, including time templates such as `now()`; there is no automatic entity dependency detection.


![Title light](../images/title-light.png)
![Title dark](../images/title-dark.png)

## Description

A Title block to separate sections of cards

## Configuration variables

All the options are available in the lovelace editor but you can use `yaml` if you want.

| Name                  | Type            | Default  | Description                                                                                                                         |
| :-------------------- | :-------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | string          | Optional | Title to render. May contain [templates](https://github.com/Nerwyn/ha-nunjucks).                             |
| `subtitle`            | string          | Optional | Subtitle to render. May contain [templates](https://github.com/Nerwyn/ha-nunjucks).                          |
| `entity_id`           | `string` `list` | Optional | Restricts state-triggered template updates to these entities; otherwise all frontend updates refresh templates. |
| `title_tap_action`    | action          | `none`   | Home assistant action to perform on title tap                                                                                       |
| `subtitle_tap_action` | action          | `none`   | Home assistant action to perform on subtitle tap                                                                                    |
