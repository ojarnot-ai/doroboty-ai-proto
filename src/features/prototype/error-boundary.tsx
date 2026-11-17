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

type State = { failed: boolean; retries: number };

/**
 * Replaces a crashed page with recovery instructions while the shell stays usable.
 * Mount it inside an element keyed by route so navigation clears the error.
 * Nothing is sent anywhere; React still prints the technical error to the browser console.
 */
export class PageErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, retries: 0 };
  private screen = createRef<HTMLElement>();
  private focusTimer: ReturnType<typeof setTimeout> | undefined;
  static getDerivedStateFromError() {
    return { failed: true };
  }
  // Deferred so it runs after the shell moves focus to <main> on navigation.
  private focusScreen() {
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => this.screen.current?.focus());
  }
  componentDidMount() {
    if (this.state.failed) this.focusScreen();
  }
  componentDidUpdate(_: unknown, previous: State) {
    // A failed retry re-creates the screen, so focus must be restored as well.
    if (this.state.failed && (!previous.failed || this.state.retries > previous.retries))
      this.focusScreen();
  }
  componentWillUnmount() {
    clearTimeout(this.focusTimer);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const save = readSave();
    return (
      <section
        ref={this.screen}
        className="prototype-section"
        tabIndex={-1}
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
          {/* Always mounted so screen readers announce the text when a retry fails. */}
          <p role="status" className={this.state.retries > 0 ? undefined : "sr-only"}>
            {this.state.retries > 0 ? "Ponowna próba nie pomogła. Przejdź do innej strony." : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                this.setState((previous) => ({ failed: false, retries: previous.retries + 1 }))
              }
            >
              Spróbuj ponownie
            </Button>
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
