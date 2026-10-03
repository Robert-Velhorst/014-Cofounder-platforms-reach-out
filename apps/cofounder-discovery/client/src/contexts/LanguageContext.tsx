import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiLanguage = "en" | "nl";
export const UI_LANGUAGE_STORAGE_KEY = "cofounder:ui-language:v1";
// These journeys are still English; declare their actual content language for
// assistive technology rather than implying that selection translates them.
export function interfaceContentLanguage(
  path: string,
  language: UiLanguage
): UiLanguage {
  return ["/outreach", "/admin/security", "/dashboard"].includes(path)
    ? "en"
    : language;
}
type LanguageStorage = Pick<Storage, "getItem" | "setItem">;

export function readUiLanguage(storage?: LanguageStorage): UiLanguage {
  try {
    return storage?.getItem(UI_LANGUAGE_STORAGE_KEY) === "nl" ? "nl" : "en";
  } catch {
    return "en";
  }
}

export function saveUiLanguage(
  language: UiLanguage,
  storage?: LanguageStorage
): void {
  if (language !== "en" && language !== "nl") return;
  try {
    storage?.setItem(UI_LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* In-memory choice still works when browser storage is unavailable. */
  }
}

export function localizedText(
  language: UiLanguage,
  english: string,
  dutch: string
): string {
  return language === "nl" ? dutch : english;
}

function browserStorage(): LanguageStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

const LanguageContext = createContext({
  language: "en" as UiLanguage,
  setLanguage: (_language: UiLanguage) => {},
  text: (english: string, _dutch: string) => english,
});

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: UiLanguage;
}) {
  const [language, updateLanguage] = useState<UiLanguage>(
    () => initialLanguage ?? readUiLanguage(browserStorage())
  );
  const setLanguage = useCallback((next: UiLanguage) => {
    if (next !== "en" && next !== "nl") return;
    updateLanguage(next);
    saveUiLanguage(next, browserStorage());
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      text: (english: string, dutch: string) =>
        localizedText(language, english, dutch),
    }),
    [language, setLanguage]
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
