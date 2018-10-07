// showMenuBtn
const menuHeight = Array.from(document.querySelector('.actions').children).reduce((p, e) => p + e.offsetHeight, 0)
document.getElementById('showMenuBtn').addEventListener('click', e => {
  const dataset = e.target.dataset
  const menu = document.querySelector('.actions')
  dataset.open === '0' ? menu.style.maxHeight = dataset.open = `${menuHeight}px` : menu.style.maxHeight = dataset.open = '0'
})
