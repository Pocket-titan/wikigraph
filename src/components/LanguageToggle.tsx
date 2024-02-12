import { Typography } from "@material-ui/core";
import { useStore } from "ts/hooks/useStore";
import { Language } from "ts/wiki";

const languages: Language[] = ["en", "nl"];

const languageNames: { [key in Language]: string } = {
  en: "English",
  nl: "Dutch",
  fr: "French",
  de: "German",
};

const LanguageToggle = () => {
  const [currentLanguage, setLanguage] = useStore((state) => [state.language, state.setLanguage]);

  return (
    <div className="toggle">
      <div className="options">
        {languages.map((x, i) => (
          <div
            className={`option option-${i + 1}`}
            key={x}
            onClick={() => currentLanguage !== x && setLanguage(x)}
            title={`Switch to ${languageNames[x]} Wikipedia`}
          >
            <input
              className="input"
              type="radio"
              name="x"
              id={x}
              value={x}
              checked={currentLanguage === x}
            />
            <label className="label" htmlFor={x}>
              <Typography variant="body1">{x}</Typography>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageToggle;
