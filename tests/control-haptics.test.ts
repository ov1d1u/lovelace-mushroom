import { afterEach, expect, it, vi } from "vitest";
import { Button } from "../src/shared/button";
import { InputNumber } from "../src/shared/input-number";

const mounted: HTMLElement[] = [];

afterEach(() => {
  mounted.splice(0).forEach((element) => element.remove());
  vi.useRealTimers();
});

async function mount<T extends Button | InputNumber>(element: T) {
  // Listen outside the shadow tree to verify that feedback reaches HA.
  const container = document.createElement("div");
  const haptic = vi.fn();
  container.addEventListener("haptic", haptic);
  container.append(element);
  document.body.append(container);
  mounted.push(container);
  await element.updateComplete;
  return haptic;
}

function nativeButton(element: Button | InputNumber, selector = "button") {
  return element.shadowRoot!.querySelector<HTMLButtonElement>(selector)!;
}

it("emits one light haptic without interrupting the control click", async () => {
  const element = new Button();
  const haptic = await mount(element);
  const click = vi.fn();
  element.addEventListener("click", click);

  nativeButton(element).click();

  expect(click).toHaveBeenCalledTimes(1);
  expect(haptic).toHaveBeenCalledTimes(1);
  expect(haptic.mock.calls[0][0]).toMatchObject({
    detail: "light",
    bubbles: true,
    composed: true,
  });
});

it("does not emit haptics from disabled controls", async () => {
  const element = new Button();
  element.disabled = true;
  const haptic = await mount(element);
  nativeButton(element).click();
  // Even an explicitly dispatched click must respect the disabled guard.
  nativeButton(element).dispatchEvent(new MouseEvent("click"));
  expect(haptic).not.toHaveBeenCalled();
});

it("pulses immediately for each number step while debouncing changes", async () => {
  vi.useFakeTimers();
  const element = new InputNumber();
  element.value = 20;
  element.step = 0.5;
  const haptic = await mount(element);
  const change = vi.fn();
  const click = vi.fn();
  element.addEventListener("change", change);
  element.addEventListener("click", click);

  nativeButton(element, ".plus").click();
  expect(element.value).toBe(20.5);
  expect(haptic).toHaveBeenCalledTimes(1);
  expect(change).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  nativeButton(element, ".minus").click();
  expect(element.value).toBe(20);
  expect(haptic).toHaveBeenCalledTimes(2);
  expect(haptic.mock.calls.every(([event]) => event.detail === "light")).toBe(
    true
  );
  expect(click).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1999);
  expect(change).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(change).toHaveBeenCalledTimes(1);
  expect(change.mock.calls[0][0].detail).toEqual({ value: 20 });
});

it.each([
  [".plus", 10],
  [".minus", 0],
])(
  "pulses at the %s boundary without exceeding bounds",
  async (selector, value) => {
    vi.useFakeTimers();
    const element = new InputNumber();
    element.value = value;
    element.min = 0;
    element.max = 10;
    const haptic = await mount(element);
    nativeButton(element, selector).click();
    expect(element.value).toBe(value);
    expect(haptic).toHaveBeenCalledTimes(1);
  }
);

it.each(["disabled", "missing value"])(
  "ignores number buttons with %s",
  async (state) => {
    const element = new InputNumber();
    element.disabled = state === "disabled";
    element.value = element.disabled ? 5 : undefined;
    const haptic = await mount(element);
    const change = vi.fn();
    element.addEventListener("change", change);
    for (const selector of [".plus", ".minus"]) {
      nativeButton(element, selector).click();
      nativeButton(element, selector).dispatchEvent(new MouseEvent("click"));
    }
    expect(haptic).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(element.value).toBe(element.disabled ? 5 : undefined);
  }
);
