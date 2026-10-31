import {
  fields,
  roles,
  seasons,
  visibleField,
  requiredField,
  applicationSchema,
} from "../shared/applications.mjs";

export function initApplicationForm() {
  const form = document.querySelector<HTMLFormElement>("#contact-form");
  if (!form) return;
  const title = document.querySelector<HTMLElement>("#application-title")!;
  const status = document.querySelector<HTMLElement>("#application-status")!;
  const type = form.elements.namedItem("type") as HTMLSelectElement;
  const season = form.elements.namedItem("season") as HTMLSelectElement;
  const container = document.querySelector<HTMLElement>("#application-fields")!;
  const submit = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  )!;
  let requestId = crypto.randomUUID();
  let lastPayload = "";
  let busy = false;
  let saved = false;
  for (const window of seasons) season.add(new Option(window.label, window.id));
  for (const field of fields) {
    const wrapper = document.createElement(
      field.type === "checks" ? "fieldset" : "div",
    );
    wrapper.className = "application-field";
    wrapper.dataset.field = field.name;
    const label = document.createElement(
      field.type === "checks" ? "legend" : "label",
    );
    label.textContent = field.label + (field.required ? " *" : "");
    if (label instanceof HTMLLabelElement)
      label.htmlFor = `application-${field.name}`;
    wrapper.append(label);
    if (field.type === "checks") {
      for (const option of field.options || []) {
        const choice = document.createElement("label");
        choice.className = "application-check";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = field.name;
        input.value = option;
        choice.append(input, document.createTextNode(option));
        wrapper.append(choice);
      }
    } else {
      const input = document.createElement(
        field.type === "textarea"
          ? "textarea"
          : field.type === "select"
            ? "select"
            : "input",
      );
      input.name = field.name;
      input.id = `application-${field.name}`;
      if (input instanceof HTMLSelectElement) {
        input.add(new Option("Choose an option", ""));
        for (const option of field.options || [])
          input.add(new Option(option, option));
      } else {
        input.maxLength = field.max || 300;
        if (input instanceof HTMLInputElement) {
          input.type = field.type || "text";
          if (field.autocomplete)
            input.setAttribute("autocomplete", field.autocomplete);
        } else input.rows = 3;
      }
      input.required = Boolean(field.required);
      wrapper.append(input);
    }
    const error = document.createElement("span");
    error.id = `error-${field.name}`;
    error.className = "field-error";
    wrapper.append(error);
    wrapper
      .querySelectorAll("input, select, textarea")
      .forEach((input) => input.setAttribute("aria-describedby", error.id));
    container.append(wrapper);
  }
  function values() {
    const data = new FormData(form!);
    const result: Record<string, unknown> = Object.fromEntries(data);
    for (const field of fields)
      if (
        field.type === "checks" &&
        form!.querySelector(`[name="${field.name}"]:not(:disabled)`)
      )
        result[field.name] = data.getAll(field.name);
    result.acknowledgment = data.has("acknowledgment");
    result.updates = data.has("updates");
    result.requestId = requestId;
    return result;
  }
  function update() {
    const data = values();
    data.categories = [
      ...form!.querySelectorAll<HTMLInputElement>(
        '[name="categories"]:checked',
      ),
    ].map((input) => input.value);
    title.textContent = roles[type.value as keyof typeof roles];
    document.querySelector<HTMLElement>(
      "#application-description",
    )!.textContent =
      "Tell us what you’d like to bring. Required fields are marked *.";
    for (const field of fields) {
      const wrapper = container.querySelector<HTMLElement>(
        `[data-field="${field.name}"]`,
      )!;
      const visible = visibleField(field, data);
      wrapper.hidden = !visible;
      const required = requiredField(field, data);
      wrapper.querySelector("label, legend")!.textContent =
        field.label + (required ? " *" : field.required ? " (optional)" : "");
      wrapper
        .querySelectorAll<HTMLInputElement>("input, select, textarea")
        .forEach((input) => {
          input.disabled = !visible;
          if (field.type !== "checks") input.required = required;
        });
    }
    document
      .querySelectorAll<HTMLButtonElement>("[data-application]")
      .forEach((button) =>
        button.setAttribute(
          "aria-expanded",
          String(
            button.dataset.application === type.value &&
              document.querySelector<HTMLDetailsElement>(
                "#application-preview",
              )!.open,
          ),
        ),
      );
  }
  function errors(items: Record<string, string[] | undefined>) {
    container.querySelectorAll(".field-error").forEach((node) => {
      node.textContent = "";
    });
    form!
      .querySelectorAll("[aria-invalid]")
      .forEach((node) => node.removeAttribute("aria-invalid"));
    for (const [name, messages] of Object.entries(items)) {
      const error = document.getElementById(`error-${name}`);
      if (error) error.textContent = messages?.[0] || "";
      form!
        .querySelectorAll(`[name="${name}"]`)
        .forEach((node) => node.setAttribute("aria-invalid", "true"));
    }
    form!.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
  form.addEventListener("change", update);
  document
    .querySelectorAll<HTMLButtonElement>("[data-application]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        if (busy || saved) return;
        type.value = button.dataset.application!;
        const details = document.querySelector<HTMLDetailsElement>(
          "#application-preview",
        )!;
        details.open = true;
        update();
        details.querySelector("summary")!.focus({ preventScroll: true });
        details.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
          block: "start",
        });
      }),
    );
  document
    .querySelector("#application-preview")!
    .addEventListener("toggle", () => {
      if (!busy && !saved) update();
    });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || saved) return;
    errors({});
    const parsed = applicationSchema.safeParse(values());
    if (!parsed.success) {
      errors(parsed.error.flatten().fieldErrors);
      status.textContent = "Please check the highlighted fields.";
      return;
    }
    const comparable = JSON.stringify({ ...parsed.data, requestId: undefined });
    if (lastPayload && comparable !== lastPayload)
      requestId = crypto.randomUUID();
    lastPayload = comparable;
    parsed.data.requestId = requestId;
    busy = true;
    submit.disabled = true;
    submit.textContent = "Sending…";
    status.textContent = "Submitting your application…";
    const controls = [
      ...form.querySelectorAll<HTMLInputElement>(
        "input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
      ),
    ];
    controls.forEach((control) => {
      control.disabled = true;
    });
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(60000),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.fields) errors(result.fields);
        throw Error(
          result.error || "Submission unavailable. Please try again.",
        );
      }
      if (!result.id)
        throw Error("We could not confirm your submission. Please try again.");
      saved = true;
      status.textContent = `${result.message} Your reference: ${result.id}`;
      submit.textContent = "Application received";
      status.focus();
    } catch (error) {
      status.textContent =
        error instanceof Error &&
        error.name !== "SyntaxError" &&
        error.name !== "TimeoutError" &&
        error.name !== "TypeError"
          ? error.message
          : "We could not confirm your submission. Your answers are still here. Please retry; unchanged retries will not create duplicates.";
    } finally {
      busy = false;
      if (!saved) {
        controls.forEach((control) => {
          control.disabled = false;
        });
        submit.disabled = false;
        submit.textContent = "Send application";
      }
    }
  });
  update();
}
