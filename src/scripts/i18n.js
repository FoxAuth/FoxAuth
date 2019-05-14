/**
 * @param {string} name
 */
const getMessage = browser.i18n.getMessage

/**
 * @param {HTMLElement | Document | undefined} context
 * @param {string} i18nAttrName
 * @param {string} attrName
 */
function renderAttribute(context, i18nAttrName, attrName) {
  const elements = context.querySelectorAll(`[${i18nAttrName}]`)
  for (const elem of elements) {
    elem.setAttribute(attrName, getMessage(elem.getAttribute(i18nAttrName)))
  }
}
/**
 * @param {HTMLElement | Document | undefined} context
 */
function render(context) {
  context = context || document

  const i18ns = context.querySelectorAll('[data-i18n]')
  for (const elem of i18ns) {
    const text = document.createTextNode(getMessage(elem.getAttribute('data-i18n')))
    elem.appendChild(text)
  }

  const htmls = context.querySelectorAll('[data-i18n-html]')
  for (const elem of htmls) {
    elem.innerHTML = getMessage(elem.getAttribute('data-i18n-html'))
  }

  renderAttribute(context, 'data-i18n-placeholder', 'placeholder')
  renderAttribute(context, 'data-i18n-title', 'title')
}

export {
  render,
  getMessage,
}
