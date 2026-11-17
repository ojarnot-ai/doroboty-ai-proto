import { Component, createRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "./shell";
import { STORAGE_KEY } from "./storage";
import { downloadText } from "./settings";

/** Raw browser save, read directly so it works even when in-memory state caused the failure. */
function readSave() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Replaces a crashed page with recovery instructions while the shell stays usable.
 * Mount it inside an element keyed by route so navigation clears the error.
 * Nothing is reported or logged here: participants send the file to the facilitator themselves.
 */
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  private screen = createRef<HTMLElement>();
  static getDerivedStateFromError() {
    return { failed: true };
  }
  // Deferred so it runs after the shell moves focus to <main> on navigation.
  private focusScreen() {
    setTimeout(() => this.screen.current?.focus());
  }
  componentDidMount() {
    if (this.state.failed) this.focusScreen();
  }
  componentDidUpdate(_: unknown, previous: { failed: boolean }) {
    if (this.state.failed && !previous.failed) this.focusScreen();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const save = readSave();
    return (
      <section
        ref={this.screen}
        className="prototype-section"
        tabIndex={-1}
        role="alert"
        aria-labelledby="page-error-title"
      >
        <PageTitle>
          <span id="page-error-title">Coś poszło nie tak</span>
        </PageTitle>
        <div className="prototype-panel prototype-form">
          <p>
            Tej strony nie udało się wyświetlić. Twoje dane zostają w tej przeglądarce – możesz
            przejść do innej strony z menu albo spróbować ponownie.
          </p>
          <p>
            Aby zgłosić problem, zrób zrzut ekranu, pobierz plik z danymi i wyślij oba prowadzącemu
            szkolenie. Nic nie jest wysyłane automatycznie.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => this.setState({ failed: false })}>Spróbuj ponownie</Button>
            {save !== null && (
              <Button
                variant="outline"
                onClick={() => downloadText("doroboty-zgloszenie-problemu.json", save)}
              >
                Pobierz plik z danymi
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }
}
