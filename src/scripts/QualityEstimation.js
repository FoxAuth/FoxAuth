import * as PopularPasswords from './PopularPasswords.js';

fetch("../options/popular-password.txt").then(res => res.text()).then(text => PopularPasswords.initialize(text.split("\n")))

const PatternID = {
  LowerAlpha: 'L',
  UpperAlpha: 'U',
  Digit: 'D',
  Special: 'S',
  High: 'H',
  Other: 'X',

  Dictionary: 'W',
  Repetition: 'R',
  Number: 'N',
  DiffSeq: 'C',

  All: "LUDSHXWRNC"
};
const PrintableAsciiSpecial = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const UpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LowerCase = "abcdefghijklmnopqrstuvwxyz";
const Digits = "0123456789";
const HighAnsiChars = (() => {
  let sbHighAnsi = [], ch;
  for(ch = 0x00A1; ch <= 0x00AC; ++ch)
    sbHighAnsi.push(ch);
  for(ch = 0x00AE; ch < 0x00FF; ++ch)
    sbHighAnsi.push(ch);
  sbHighAnsi.push(0x00FF);
  return String.fromCharCode.apply(null, sbHighAnsi);
})();

function Assert(ok, msg) {
  if (!ok) {
    throw new Error(msg);
  }
}


class QeCharType {
  constructor(chTypeID, strAlphabet, bIsConsecutive) {
    let nChars;
    if (typeof strAlphabet === 'string') {
      if(strAlphabet.length === 0) throw new Error();
    } else if (typeof strAlphabet === 'number') {
      if(nChars <= 0) throw new RangeError();
      nChars = strAlphabet;
      strAlphabet = null;
      bIsConsecutive = false;
    } else {
      throw new Error();
    }

    this.TypeID = chTypeID;
    this.Alphabet = strAlphabet;
    this.CharCount = nChars || this.Alphabet.length;
    this.m_chFirst = (bIsConsecutive ? this.Alphabet.charCodeAt(0) : null);
    this.m_chLast = (bIsConsecutive ? this.Alphabet.charCodeAt(this.CharCount - 1) : null);

    this.CharSize = Math.log2(this.CharCount);
    nChars || Assert((this.m_chLast - this.m_chFirst) == (this.CharCount - 1) || !bIsConsecutive);
  }

  Contains(ch)
  {
    if(this.m_chLast !== null)
      return ((ch >= this.m_chFirst) && (ch <= this.m_chLast));

    if (this.Alphabet.length === 0) throw new Error('Don\'t call for catch-none set')
    return (this.Alphabet.indexOf(String.fromCharCode(ch)) >= 0);
  }
}

class EntropyEncoder {
  constructor(strAlphabet, uBaseWeight,
    uCharWeight, uOccExclThreshold)
  {
    if(strAlphabet === null || strAlphabet.length === 0) throw new Error();

    this.m_strAlph = strAlphabet;
    this.m_uBaseWeight = uBaseWeight;
    this.m_uCharWeight = uCharWeight;
    this.m_uOccExclThreshold = uOccExclThreshold;

    this.m_dHisto = {}
  }

  Reset()
  {
    this.m_dHisto = {};
  }

	Write(ch)
  {
    Assert(this.m_strAlph.indexOf(ch) >= 0);

    let uOcc = this.m_dHisto[ch] || 0;
    Assert(ch in this.m_dHisto || uOcc === 0);
    this.m_dHisto[ch] = uOcc + 1;
  }

  GetOutputSize()
  {
    let uTotalWeight = this.m_uBaseWeight * this.m_strAlph.length;
    for (let u of Object.values(this.m_dHisto))
    {
      Assert(u >= 1);
      if(u > this.m_uOccExclThreshold)
        uTotalWeight += (u - this.m_uOccExclThreshold) * this.m_uCharWeight;
    }

    let dSize = 0.0, dTotalWeight = uTotalWeight;
    for (let u of Object.values(this.m_dHisto))
    {
      let uWeight = this.m_uBaseWeight;
      if(u > this.m_uOccExclThreshold)
        uWeight += (u - this.m_uOccExclThreshold) * this.m_uCharWeight;

      dSize -= u * Math.log2(uWeight / dTotalWeight);
    }

    return dSize;
  }
}

class MultiEntropyEncoder {
  constructor() {
    this.m_dEncs = {};
  }

  AddEncoder(chTypeID, ec)
  {
    Assert(ec);

    Assert(!(chTypeID in this.m_dEncs));
    this.m_dEncs[chTypeID] = ec;
  }

  Reset()
  {
    for(let ec of Object.values(this.m_dEncs)) {
      ec.Reset();
    }
  }

  Write(chTypeID, chData)
  {
    let ec = this.m_dEncs[chTypeID];
    if(!ec)
      return false;

    ec.Write(chData);
    return true;
  }

  GetOutputSize()
  {
    let d = 0.0;

    for (let ec of Object.values(this.m_dEncs))
    {
      d += ec.GetOutputSize();
    }

    return d;
  }
}

class QePatternInstance
{
  constructor(iPosition, nLength, chPatternID, dblCost) {
    let ctSingle;
    if (typeof dblCost === 'number') {
      this.Position = iPosition;
      this.Length = nLength;
      this.PatternID = chPatternID;
      this.Cost = dblCost;
      this.SingleCharType = null;
    } else {
      ctSingle = chPatternID;

      this.Position = iPosition;
      this.Length = nLength;
      this.PatternID = ctSingle.TypeID;
      this.Cost = ctSingle.CharSize;
      this.SingleCharType = ctSingle;
    }
  }
}

class QePathState {
  constructor(iPosition, lPath) {
    this.Position = iPosition;
    this.Path = lPath;
  }
}

let m_objSyncInit;
let m_lCharTypes;

function EnsureInitialized() {
  if(m_lCharTypes == null)
  {
    let strSpecial = PrintableAsciiSpecial;
    strSpecial = strSpecial + " ";

    let nSp = strSpecial.length;
    let nHi = HighAnsiChars.length;

    m_lCharTypes = [];

    m_lCharTypes.push(new QeCharType(PatternID.LowerAlpha,
      LowerCase, true));
    m_lCharTypes.push(new QeCharType(PatternID.UpperAlpha,
      UpperCase, true));
    m_lCharTypes.push(new QeCharType(PatternID.Digit,
      Digits, true));
    m_lCharTypes.push(new QeCharType(PatternID.Special,
      strSpecial, false));
    m_lCharTypes.push(new QeCharType(PatternID.High,
      HighAnsiChars, false));
    m_lCharTypes.push(new QeCharType(PatternID.Other,
      0x10000 - (2 * 26) - 10 - nSp - nHi));
  }
}

function GetCharType(ch) {
  let nTypes = m_lCharTypes.length;
  Assert((nTypes > 0) && (m_lCharTypes[nTypes - 1].CharCount > 256));

  for(let i = 0; i < (nTypes - 1); ++i)
  {
    if(m_lCharTypes[i].Contains(ch))
      return m_lCharTypes[i];
  }

  return m_lCharTypes[nTypes - 1];
}

function ComputePathCost(l, vPassword, ecPattern, mcData)
{
  ecPattern.Reset();
  for(let i = 0; i < l.length; ++i)
    ecPattern.Write(l[i].PatternID);
  let dblPatternCost = ecPattern.GetOutputSize();

  mcData.Reset();
  let dblDataCost = 0.0;
  for(let pi of l)
  {
    let tChar = pi.SingleCharType;
    if(tChar != null)
    {
      let ch = vPassword[pi.Position];
      if(!mcData.Write(tChar.TypeID, ch))
        dblDataCost += pi.Cost;
    }
    else dblDataCost += pi.Cost;
  }
  dblDataCost += mcData.GetOutputSize();

  return (dblPatternCost + dblDataCost);
}


export default function QualityEstimation(vPassword)
{
  if (typeof vPassword !== 'string' || vPassword.length === 0) return 0;
  if (PopularPasswords.IsPopularPassword(vPassword.toLowerCase())) return "Matched";

  EnsureInitialized();

  let n = vPassword.length;
  let vPatterns = [];

  for (let i = 0; i < n; i++) {
    vPatterns[i] = [
      new QePatternInstance(i, 1, GetCharType(vPassword.charCodeAt(i)))
    ];
  }

  FindRepetitions(vPassword, vPatterns);
  FindNumbers(vPassword, vPatterns);
  FindDiffSeqs(vPassword, vPatterns);
  FindPopularPasswords(vPassword, vPatterns);

  // Encoders must not be static, because the entropy estimation
  // may run concurrently in multiple threads and the encoders are
  // not read-only
  let ecPattern = new EntropyEncoder(PatternID.All, 0, 1, 0);
  let mcData = new MultiEntropyEncoder();

  for(let i = 0; i < (m_lCharTypes.length - 1); ++i)
  {
    // Let m be the alphabet size. In order to ensure that two same
    // characters cost at least as much as a single character, for
    // the probability p and weight w of the character it must hold:
    //     -log(1/m) >= -2*log(p)
    // <=> log(1/m) <= log(p^2) <=> 1/m <= p^2 <=> p >= sqrt(1/m);
    //     sqrt(1/m) = (1+w)/(m+w)
    // <=> m+w = (1+w)*sqrt(m) <=> m+w = sqrt(m) + w*sqrt(m)
    // <=> w*(1-sqrt(m)) = sqrt(m) - m <=> w = (sqrt(m)-m)/(1-sqrt(m))
    // <=> w = (sqrt(m)-m)*(1+sqrt(m))/(1-m)
    // <=> w = (sqrt(m)-m+m-m*sqrt(m))/(1-m) <=> w = sqrt(m)
    let uw = Math.sqrt(m_lCharTypes[i].CharCount) | 0;

    mcData.AddEncoder(m_lCharTypes[i].TypeID, new EntropyEncoder(
      m_lCharTypes[i].Alphabet, 1, uw, 1));
  }

  let dblMinCost = Infinity;
  let tStart = Date.now();
  
  let sRec = [];
  sRec.push(new QePathState(0, []));


  while(sRec.length > 0)
  {
    let tDiff = Date.now() - tStart;
    if(tDiff > 500) break;

    let s = sRec.pop();

    if(s.Position >= n)
    {
      Assert(s.Position === n);

      let dblCost = ComputePathCost(s.Path, vPassword,
        ecPattern, mcData);
      if(dblCost < dblMinCost) dblMinCost = dblCost;
    }
    else
    {
      let lSubs = vPatterns[s.Position];
      for(let i = lSubs.length - 1; i >= 0; --i)
      {
        let pi = lSubs[i];
        Assert(pi.Position == s.Position);
        Assert(pi.Length >= 1);

        let lNewPath = [];
        lNewPath.push(...s.Path);
        lNewPath.push(pi);

        let sNew = new QePathState(s.Position +
          pi.Length, lNewPath);
        sRec.push(sNew);
      }
    }
  }

  return Math.ceil(dblMinCost);
}

function FindRepetitions(vPassword, vPatterns)
{
  let v = stringToArray(vPassword);
  let n = vPassword.length;

  let chErased = 0xffff;
  for(let m = (n / 2); m >= 3; --m)
  {
    for(let x1 = 0; x1 <= (n - (2 * m)); ++x1)
    {
      let bFoundRep = false;

      for(let x2 = (x1 + m); x2 <= (n - m); ++x2)
      {
        if(PartsEqual(v, x1, x2, m))
        {
          let dblCost = Math.log2(x1 + 1) + Math.log2(m);
          vPatterns[x2].push(new QePatternInstance(x2, m,
            PatternID.Repetition, dblCost));

          chErased = ErasePart(v, x2, m, chErased);

          bFoundRep = true;
        }
      }

      if (bFoundRep) chErased = ErasePart(v, x1, m, chErased);
    }
  }
}

function PartsEqual(v, x1, x2, nLength)
{
  for(let i = 0; i < nLength; ++i)
  {
    if(v[x1 + i] != v[x2 + i]) return false;
  }

  return true;
}

function ErasePart(v, i, n, chErased)
{
  for(let j = 0; j < n; ++j) {
    v[i + j] = chErased;
    --chErased;
  }

  return chErased;
}

function stringToArray(string) {
  let array = [];
  for (let i = 0; i < string.length; i++) {
    array.push(string.charCodeAt(i));
  }
  return array;
}

function FindNumbers(vPassword, vPatterns)
{
  let n = vPassword.length;
  let sb = [];

  for(let i = 0; i < n; ++i)
  {
    let ch = vPassword.charCodeAt(i);
    if((ch >= 0x30) && (ch <= 0x39)) sb.push(ch);
    else
    {
      AddNumberPattern(vPatterns, sb, i - sb.length);
      sb = [];
    }
  }
  AddNumberPattern(vPatterns, sb, n - sb.length);
}

function AddNumberPattern(vPatterns, sb, i)
{
  if(sb.length <= 2) return;
  let strNumber = String.fromCharCode.apply(null,sb);

  let nZeros = 0;
  for(let j = 0; j < strNumber.length; ++j)
  {
    if(strNumber.charCodeAt(j) != 0x30) break;
    ++nZeros;
  }

  let dblCost = Math.log2(nZeros + 1);
  if(nZeros < strNumber.length)
  {
    let strNonZero = strNumber.substring(nZeros);

    dblCost += Math.log2(parseFloat(strNonZero));
  }

  vPatterns[i].push(new QePatternInstance(i, strNumber.length,
    PatternID.Number, dblCost));
}

function FindDiffSeqs(vPassword, vPatterns) {
  let n = vPassword.length;
  let d = Infinity, p = 0;

  for(let i = 1; i <= n; ++i)
  {
    let dCur = ((i == n) ? Infinity :
      (vPassword.charCodeAt(i) - vPassword.charCodeAt(i - 1)));
    if(dCur != d)
    {
      if((i - p) >= 3) // At least 3 chars involved
      {
        let ct = GetCharType(vPassword.charCodeAt(p));
        let dblCost = ct.CharSize + Math.log2(i - p - 1);

        vPatterns[p].push(new QePatternInstance(p,
          i - p, PatternID.DiffSeq, dblCost));
      }

      d = dCur;
      p = i - 1;
    }
  }
}

function DecodeLeet(str) {
  let newstr = '';
  for (let i = 0; i < str.length; i++) {
    let char = str.charAt(i);
    let decoded = DecodeLeetChar(char);
    newstr += decoded;
  }
  return newstr;
}

function FindPopularPasswords(vPassword, vPatterns) {
  let n = vPassword.length;

  let vLower = vPassword.toLowerCase();
  let vLeet = DecodeLeet(vLower);

  for(let nSubLen = Math.min(n, PopularPasswords.getMaxLength()); nSubLen >= 3; --nSubLen) {
    if (!PopularPasswords.ContainsLength(nSubLen)) continue;

    for(let i = 0; i <= (n - nSubLen); ++i)
		{
      let vSub = vLower.substring(i, i + nSubLen);

      if (!vSub || vSub.indexOf('\u0000') !== -1) {
        continue;
      }

      if(!EvalAddPopularPasswordPattern(vPatterns, vPassword,
        i, vSub, 0.0))
      {
        let vLeetSub = vLeet.substring(i, nSubLen);
        if(EvalAddPopularPasswordPattern(vPatterns, vPassword,
          i, vLeetSub, 1.5))
        {
          vLower = StringClear(vLower, i, nSubLen); // Not vLeet
        }
      }
      else
      {
        vLower = StringClear(vLower, i, nSubLen); // Not vLeet
      }
    }
  }
}

function StringClear(str, pos, count) {
  let erased = ''
  for (let i = 0;i < count;i++) {
    erased += '\u0000'
  }
  return str.substring(0, pos) + erased + str.substring(pos + count);
}

function DecodeLeetChar(chLeet) {
  if((chLeet.charCodeAt(0) >= 0x00C0) && (chLeet.charCodeAt(0) <= 0x00C6)) return 'a';
  if((chLeet.charCodeAt(0) >= 0x00C8) && (chLeet.charCodeAt(0) <= 0x00CB)) return 'e';
  if((chLeet.charCodeAt(0) >= 0x00CC) && (chLeet.charCodeAt(0) <= 0x00CF)) return 'i';
  if((chLeet.charCodeAt(0) >= 0x00D2) && (chLeet.charCodeAt(0) <= 0x00D6)) return 'o';
  if((chLeet.charCodeAt(0) >= 0x00D9) && (chLeet.charCodeAt(0) <= 0x00DC)) return 'u';
  if((chLeet.charCodeAt(0) >= 0x00E0) && (chLeet.charCodeAt(0) <= 0x00E6)) return 'a';
  if((chLeet.charCodeAt(0) >= 0x00E8) && (chLeet.charCodeAt(0) <= 0x00EB)) return 'e';
  if((chLeet.charCodeAt(0) >= 0x00EC) && (chLeet.charCodeAt(0) <= 0x00EF)) return 'i';
  if((chLeet.charCodeAt(0) >= 0x00F2) && (chLeet.charCodeAt(0) <= 0x00F6)) return 'o';
  if((chLeet.charCodeAt(0) >= 0x00F9) && (chLeet.charCodeAt(0) <= 0x00FC)) return 'u';

  switch(chLeet)
  {
    case '4':
    case '@':
    case '?':
    case '^':
    case '\u00AA': return 'a';
    case '8':
    case '\u00DF': return 'b';
    case '(':
    case '{':
    case '[':
    case '<':
    case '\u00A2':
    case '\u00A9':
    case '\u00C7':
    case '\u00E7': return 'c';
    case '\u00D0':
    case '\u00F0': return 'd';
    case '3':
    case '\u20AC':
    case '&':
    case '\u00A3': return 'e';
    case '6':
    case '9': return 'g';
    case '#': return 'h';
    case '1':
    case '!':
    case '|':
    case '\u00A1':
    case '\u00A6': return 'i';
    case '\u00D1':
    case '\u00F1': return 'n';
    case '0':
    case '*':
    case '\u00A4': // Currency
    case '\u00B0': // Degree
    case '\u00D8':
    case '\u00F8': return 'o';
    case '\u00AE': return 'r';
    case '$':
    case '5':
    case '\u00A7': return 's';
    case '+':
    case '7': return 't';
    case '\u00B5': return 'u';
    case '%':
    case '\u00D7': return 'x';
    case '\u00A5':
    case '\u00DD':
    case '\u00FD':
    case '\u00FF': return 'y';
    case '2': return 'z';
    default: return chLeet;
  }
}

function EvalAddPopularPasswordPattern(vPatterns, vPassword, i, sub, dblCostPerMod)
{
  let IsPopularPassword = PopularPasswords.IsPopularPassword(sub);
  let uDictSize = PopularPasswords.GetDictSize(sub.length);
  if(!IsPopularPassword)
    return false;

  let n = sub.length;
  let d = HammingDist(sub, 0, vPassword, i, n);

  let dblCost = Math.log2(uDictSize);

  // dblCost += Math.log2(n binom d)
  let k = Math.min(d, n - d);
  for(let j = n; j > (n - k); --j)
    dblCost += Math.log2(j);
  for(let j = k; j >= 2; --j)
    dblCost -= Math.log2(j);

  dblCost += dblCostPerMod * d;

  vPatterns[i].push(new QePatternInstance(i, n, PatternID.Dictionary,
    dblCost));
  return true;
}

function HammingDist(v1, iOffset1, v2, iOffset2, nLength)
{
  let nDist = 0;
  for(let i = 0; i < nLength; ++i)
  {
    if(v1.charCodeAt(iOffset1 + i) !== v2.charCodeAt(iOffset2 + i)) ++nDist;
  }

  return nDist;
}