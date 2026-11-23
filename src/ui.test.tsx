// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  location.hash = '';
  vi.stubGlobal('confirm', () => true);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** Beantwortet die aktuelle Karte irgendwie (Ziel: Abläufe testen, nicht Wissen). */
function answerCurrent() {
  const reveal = screen.queryByRole('button', { name: 'Aufdecken' });
  if (reveal) {
    fireEvent.click(reveal);
    fireEvent.click(screen.getByRole('button', { name: /Gewusst/ }));
    return;
  }
  const inputs = screen.queryAllByRole('textbox');
  if (inputs.length) {
    inputs.forEach((i) => fireEvent.change(i, { target: { value: '1' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    return;
  }
  const selects = screen.queryAllByRole('combobox');
  const chips = document.querySelectorAll('li');
  if (selects.length || document.querySelector('[aria-pressed]')) {
    selects.forEach((s) => fireEvent.change(s, { target: { value: (s as HTMLSelectElement).options[1].value } }));
    chips.forEach((li) => {
      const b = li.querySelector('[aria-pressed]');
      if (b) fireEvent.click(b);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    return;
  }
  fireEvent.click(screen.getAllByRole('listitem')[0]);
}

function runSession(max = 80) {
  for (let n = 0; n < max; n++) {
    if (screen.queryByText(/Geschafft!|Prüfung beendet/)) return n;
    answerCurrent();
    act(() => vi.advanceTimersByTime(400));
    const next = screen.queryByRole('button', { name: /Weiter|Abschließen/ });
    if (next) fireEvent.click(next);
    act(() => vi.advanceTimersByTime(50));
  }
  throw new Error('Sitzung endet nicht');
}

describe('App', () => {
  it('Startseite zeigt fällige Karten, Serie und Tagesziel', () => {
    render(<App />);
    expect(screen.getByText('Heute fällig')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Lernen starten/ })).toBeTruthy();
    expect(screen.getByText('Serie')).toBeTruthy();
    expect(screen.getByText('Tagesziel')).toBeTruthy();
  });

  it('Tägliches Lernen: Feedback mit Icon + Text, Fortschritt wird gespeichert', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Lernen starten/ }));
    answerCurrent();
    // Ergebnis wird als Text angezeigt (nicht nur Farbe)
    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/Richtig|Falsch|Teilweise richtig|Gewusst|Unsicher|Nicht gewusst/);
    expect(status.querySelector('svg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Weiter|Abschließen/ }));
    const answered = runSession() + 1;
    expect(answered).toBeGreaterThan(5);
    fireEvent.click(screen.getAllByRole('button', { name: 'Zur Startseite' })[0]);
    const saved = JSON.parse(localStorage.getItem('ap2-lernapp-progress-v1')!);
    expect(Object.keys(saved.cards).length).toBeGreaterThan(5);
    expect(screen.getAllByText(/✓ Ziel erreicht|\/ 30/).length).toBeGreaterThan(0);
  });

  it('Prüfungssimulation endet mit Punkten und IHK-Note', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Prüfung/ }));
    expect(screen.getByLabelText(/Restzeit/)).toBeTruthy();
    runSession(25);
    expect(screen.getByText(/Note [1-6] –/)).toBeTruthy();
    expect(screen.getByText(/\/ 100/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Zur Startseite' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Statistik/ }));
    expect(screen.getByText('Prüfungssimulationen')).toBeTruthy();
  });

  it('Prüfung endet automatisch nach 30 Minuten', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Prüfung/ }));
    act(() => vi.advanceTimersByTime(30 * 60 * 1000 + 2000));
    expect(screen.getByText('Prüfung beendet')).toBeTruthy();
  });

  it('Nur Rechnen zeigt Rechenweg', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nur Rechnen/ }));
    answerCurrent();
    expect(screen.getByText('Rechenweg')).toBeTruthy();
  });

  it('Themen, Statistik und Einstellungen lassen sich öffnen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Themen/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /^RAID/ })[0]);
    expect(screen.getAllByText('RAID').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Sitzung beenden' }));
    fireEvent.click(screen.getByRole('button', { name: /Statistik/ }));
    expect(screen.getByText('Fortschritt pro Kategorie')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Einstellungen/ }));
    const nav = screen.getByRole('navigation');
    expect(within(nav).getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText(/Fragen mit Prüfvermerk/)).toBeTruthy();
  });
  it('Beenden fragt mit eigener Bestätigung nach (ohne window.confirm)', () => {
    vi.stubGlobal('confirm', () => false); // wie in eingebetteten Vorschauen
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nur Rechnen/ }));
    answerCurrent();
    fireEvent.click(screen.getByRole('button', { name: 'Sitzung beenden' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sitzung beenden' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Beenden' }));
    expect(screen.getByText('Heute fällig')).toBeTruthy();
  });
  it('keine Sackgassen: jede Unterseite und das Sitzungsende haben oben einen Weg zurück', () => {
    render(<App />);
    for (const tab of [/Thema wählen/, /Themen/, /Statistik/, /Einstellungen/]) {
      const btn = screen.getAllByRole('button', { name: tab })[0];
      fireEvent.click(btn);
      fireEvent.click(screen.getByRole('button', { name: 'Zurück zur Startseite' }));
      expect(screen.getByText('Heute fällig')).toBeTruthy();
    }
    // Sitzungsende: Schließen-Knopf oben
    fireEvent.click(screen.getByRole('button', { name: /Nur Rechnen/ }));
    runSession(40);
    fireEvent.click(screen.getAllByRole('button', { name: 'Zur Startseite' })[0]);
    expect(screen.getByText('Heute fällig')).toBeTruthy();
  });

  it('Unterseiten setzen einen Hash, Zurück im Browser führt zur Startseite', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Statistik/ }));
    expect(location.hash).toBe('#statistik');
    act(() => {
      location.hash = '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByText('Heute fällig')).toBeTruthy();
  });
  it('„Keine Ahnung“ zeigt Lösung + Erklärung und zählt als nicht gewusst', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nur Rechnen/ }));
    fireEvent.click(screen.getByRole('button', { name: /Keine Ahnung/ }));
    expect(screen.getByRole('status').textContent).toMatch(/Keine Ahnung – hier ist die Erklärung/);
    expect(screen.getByText('Lösung')).toBeTruthy();
    expect(screen.getByText('Warum das so ist')).toBeTruthy();
    expect(screen.getByText('Rechenweg')).toBeTruthy();
    expect(screen.getByText(/von 11/)).toBeTruthy(); // kommt in der Sitzung noch einmal
    const saved = JSON.parse(localStorage.getItem('ap2-lernapp-progress-v1')!);
    const card = Object.values(saved.cards)[0] as { box: number; wrong: number };
    expect(card).toMatchObject({ box: 1, wrong: 1 });
  });

  it('„Keine Ahnung“ gibt es bei Wissensfragen, aber nicht bei Karteikarten', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Lernen starten/ }));
    for (let n = 0; n < 15; n++) {
      const isFlash = !!screen.queryByRole('button', { name: 'Aufdecken' });
      expect(!!screen.queryByRole('button', { name: /Keine Ahnung/ })).toBe(!isFlash);
      answerCurrent();
      const next = screen.queryByRole('button', { name: /Weiter|Abschließen/ });
      if (!next) break;
      fireEvent.click(next);
      if (screen.queryByText('Geschafft!')) break;
    }
  });

  it('Extra-Fragen sind standardmäßig aus und lassen sich in den Einstellungen einschalten', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Einstellungen' }));
    const sw = screen.getByRole('switch', { name: /Auch Extra-Fragen anzeigen/ }) as HTMLInputElement;
    expect(sw.checked).toBe(false);
    expect(screen.getByText(/Extra-Fragen sind ausgeblendet/)).toBeTruthy();
    fireEvent.click(sw);
    expect(sw.checked).toBe(true);
    expect(JSON.parse(localStorage.getItem('ap2-lernapp-progress-v1')!).settings.showExtra).toBe(true);
  });
});
