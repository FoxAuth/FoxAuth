const m_dicts = {};

export function getMaxLength() {
  let iMaxLen = 0;
  for (let iLen of Object.keys(m_dicts)) {
    if (parseInt(iLen) > iMaxLen) iMaxLen = parseInt(iLen);
  }
  return iMaxLen;
}

export function ContainsLength(nLength) {
  return nLength in m_dicts;
}

export function IsPopularPassword(password) {
  if (password == null) throw new Error();
  if (password.length == 0) { return false; }

  if (!(password.length in m_dicts)) {
    return false;
  }

  return m_dicts[password.length].includes(password);
}

export function GetDictSize(length) {

  if (!(length in m_dicts)) {
    return 0;
  }

  return m_dicts[length].length;
}

export function initialize(passwordList) {
  for (let pw of passwordList) {
    if (pw.length in m_dicts) {
      m_dicts[pw.length].push(pw);
    } else {
      m_dicts[pw.length] = [pw];
    }
  }
}