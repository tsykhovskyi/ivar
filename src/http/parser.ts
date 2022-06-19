export enum Section {
  response,
  source,
  variables,
  trace,
}

enum CODES {
  colorYellow = '\x1b[0;33;49m',
  colorPurple = '\x1b[0;35;49m',
  colorGreen = '\x1b[0;32;49m',
  colorBlue = '\x1b[0;36;49m',
  fontBold = '\x1b[1;37;49m',
  fontNormal = '\x1b[0;37;49m',
  end = '\x1b[0m',
}

export function responseToHtml(payload: string | null, section: Section) {
  if (payload === null) {
    return null;
  }

  if (section === Section.variables) {
    payload = payload.replaceAll('<value> ', '');
  }

  payload = consoleContentToHtml(payload);

  const prependTitle = (str: string, title: string) => `<span style="font-style: italic; color: lightblue; padding-bottom: 10px;">${title}</span>${str}`;
  switch (section) {
    case Section.variables:
      payload = prependTitle(payload, 'Variables:');
      break;
    case Section.response:
      payload = prependTitle(payload, 'Step execution result:');
      break;
    case Section.trace:
      payload = prependTitle(payload, 'Trace:');
      break;
  }

  return payload;
}

function consoleContentToHtml(payload: string) {
  const spanStart = () => `<span>`
  const spanStartBold = () => `<span style="font-weight: bold">`
  const spanStartColored = (color: string) => `<span style="color: ${color}">`

  const res = payload
    .replaceAll(/[\u00A0-\u9999<>\&]/g, (i) => '&#'+i.charCodeAt(0)+';')
    .replaceAll(CODES.colorYellow, spanStartColored('yellow'))
    .replaceAll(CODES.colorPurple, spanStartColored('lightpink'))
    .replaceAll(CODES.colorGreen, spanStartColored('lightgreen'))
    .replaceAll(CODES.colorBlue, spanStartColored('lightblue'))
    .replaceAll(CODES.fontBold, spanStartBold())
    .replaceAll(CODES.fontNormal, spanStart())
    .replaceAll(CODES.end, '</span>')


  return res;
}
