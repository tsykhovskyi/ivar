enum Ascii {
  "CR" = 13,
  "LF" = 10,

  ":"= ":".charCodeAt(0),
  "+"= "+".charCodeAt(0),
  "-"= "-".charCodeAt(0),
  "*"= "*".charCodeAt(0),
  "$"= "$".charCodeAt(0),
}

export const getAsciiCode = (code: string): number => {
  switch (code) {
    case "CR": return 13;
    case "LF": return 10;
  }
  if (code.length !== 1) {
    throw new Error(`Ascii code ${code} is not supported`);
  }
  return code.charCodeAt(0);
}
