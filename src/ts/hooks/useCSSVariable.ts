export default function useCSSVariable(variable: string) {
  let value: string = getComputedStyle(document.documentElement).getPropertyValue(variable);

  if (value.endsWith("em")) {
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return parseFloat(value.replace("em", "")) * fontSize;
  }

  if (value.endsWith("px")) {
    return parseInt(value.replace("px", ""));
  }

  return value;
}
