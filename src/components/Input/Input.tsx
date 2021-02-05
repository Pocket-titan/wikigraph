import React, { useRef, useState, useEffect } from "react";
import _ from "lodash";
import * as wiki from "ts/wiki";
import "./Input.css";

const Input = React.forwardRef<
  HTMLInputElement,
  {
    onResultClick?: (result: string) => void;
    width?: number | string;
    height?: number;
  }
>(
  (
    { onResultClick = () => {}, width = "clamp(200px, 25vw, 400px)", height = 60 },
    ref
  ) => {
    const [value, setValue] = useState("");
    const [results, setResults] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedAutocomplete = useRef(
      _.debounce(async (input: string) => {
        setLoading(true);

        try {
          let results = await wiki.search(input);
          setResults(results);
        } catch {
        } finally {
          setLoading(false);
        }
      }, 1000)
    );

    const resetInput = () => {
      setValue("");
      setResults([]);
      debouncedAutocomplete.current.cancel();
    };

    return (
      <div style={{ position: "relative", width }}>
        <div
          className="search"
          style={{
            height,
            display: "grid",
            gridTemplateRows: `${height}px`,
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
                debouncedAutocomplete.current.cancel();
                setResults([]);
              } else {
                debouncedAutocomplete.current(value);
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
                    debouncedAutocomplete.current.flush();
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
  }
);

export default Input;
