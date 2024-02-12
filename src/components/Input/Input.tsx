import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import _ from "lodash";
import * as wiki from "ts/wiki";
import "./Input.css";
import { useStore } from "ts/hooks/useStore";

const Input = React.forwardRef<
  HTMLInputElement,
  {
    onResultClick?: (result: string) => void;
    width?: number | string;
    height?: number;
  }
>(({ onResultClick = () => {}, width = "100%", height = 60 }, ref) => {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const language = useStore((state) => state.language);

  const search = async (input: string) => {
    setLoading(true);

    try {
      let results = await wiki.search(input, language);
      setResults(results);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const searchRef = useRef(search);

  useEffect(() => {
    searchRef.current = search;
  }, [language]);

  const debouncedSearch = useMemo(() => {
    const fn = (input: string) => {
      searchRef.current?.(input);
    };

    return _.debounce(fn, 1000);
  }, []);

  const resetInput = () => {
    setValue("");
    setResults([]);
    debouncedSearch.cancel();
  };

  useEffect(() => {
    resetInput();
  }, [language]);

  return (
    <div style={{ position: "relative", width }}>
      <div
        className="search"
        style={{
          // height,
          display: "grid",
          gridTemplateRows: `var(--height)`,
          gridTemplateColumns: "minmax(0, 1fr) 100px",
          boxShadow: "0px 5px 10px rgba(0,0,0,0.19), 2px 2px 5px rgba(0,0,0,0.20)",
        }}
      >
        <input
          ref={ref}
          type="text"
          value={value}
          placeholder="Add pages..."
          style={{ fontSize: 22 }}
          onChange={({ target: { value } }) => {
            setValue(value);

            if (value.length === 0) {
              debouncedSearch.cancel();
              setResults([]);
            } else {
              debouncedSearch(value);
            }
          }}
          onKeyDown={(event) => {
            switch (event.key) {
              case "Enter": {
                if (results.length === 0) {
                  return;
                }

                onResultClick(results[0]);
                resetInput();
                break;
              }
              case "Escape": {
                resetInput();
                break;
              }
            }
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          {value.length > 0 && (
            <button
              className="clear-button"
              onClick={() => {
                resetInput();
                (ref as React.MutableRefObject<HTMLInputElement>).current?.focus();
              }}
            >
              <i className="icon ion-android-close" />
            </button>
          )}
          {loading ? (
            <button disabled={true}>
              <div className="loader" />
            </button>
          ) : (
            <button
              className="search-button"
              onClick={(event) => {
                event.preventDefault();

                if (value.length > 0) {
                  debouncedSearch.flush();
                }
              }}
            >
              <i className="icon ion-android-search" />
            </button>
          )}
        </div>
      </div>
      <div
        className="results"
        style={{
          zIndex: 999,
          position: "absolute",
          top: "100%",
          width,
          overflow: "hidden",
          boxShadow: "0px 5px 10px rgba(0,0,0,0.19), 2px 2px 5px rgba(0,0,0,0.20)",
        }}
      >
        {results.map((result) => (
          <div
            key={result}
            className="result"
            onClick={() => {
              onResultClick(result);
              resetInput();
            }}
          >
            {result.slice(0, value.length).toLowerCase() === value.toLowerCase() ? (
              <>
                <span
                  style={{
                    fontWeight: "bold",
                  }}
                >
                  {result.slice(0, value.length)}
                </span>
                <span>{result.slice(value.length)}</span>
              </>
            ) : (
              <span>{result}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Input;
