import { registerDirective, Component } from 'omi'

interface TransitionOptions {
  name: string;
  delay?: number;
  beforeEnter?: () => void;
  enter?: () => void;
  afterEnter?: () => void;
  beforeLeave?: () => void;
  leave?: () => void;
  afterLeave?: () => void;
}


registerDirective('transition', (dom: HTMLElement | Component, options: TransitionOptions) => {
  const { name, delay = 0 } = options
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'show') {
        const show = getShowAttribute(dom)
        updateClasses(dom, name, show, delay, options)
      }
    })
  })

  observer.observe(dom, { attributes: true })

  const onTransitionEnd = debounce(() => {
    console.log('onTransitionEnd')
    const show = getShowAttribute(dom)
    if (show) {
      options.afterEnter?.()
    } else {
      options.afterLeave?.()
      dom.style.display = 'none' // 添加这行代码
    }
    dom.classList.remove(`${name}-enter-active`)
    dom.classList.remove(`${name}-leave-active`)
  }, 0)

  // 移除旧的事件监听器
  if (dom['__onTransitionEnd']) {
    dom.removeEventListener('transitionend', dom['__onTransitionEnd'])
    dom.removeEventListener('animationend', dom['__onTransitionEnd'])
  }

  // 添加新的事件监听器
  dom.addEventListener('transitionend', onTransitionEnd)
  dom.addEventListener('animationend', onTransitionEnd)

  // 将 onTransitionEnd 函数存储在元素上

  dom['__onTransitionEnd'] = onTransitionEnd

  const show = getShowAttribute(dom)
  updateClasses(dom, name, show, delay, options)
})

function getShowAttribute(dom: HTMLElement | Component<{ show: boolean }>): boolean {
  return dom.getAttribute('show') === 'true' ||
    dom.getAttribute('show') === '1' ||
    dom.props?.show
}
let isFirstRender = true; // 添加这行代码来记录是否是第一次渲染
let previousDisplay: string | null = null; // 添加这行代码来记录display的值

function updateClasses(dom: HTMLElement, name: string, show: boolean, delay: number, options: TransitionOptions) {
  if (show) {
    dom.style.display = previousDisplay || ''
    options.beforeEnter?.()
    dom.classList.remove(`${name}-leave-to`)
    dom.classList.remove(`${name}-leave-active`)
    dom.classList.add(`${name}-enter-from`)
    requestAnimationFrame(() => {
      setTimeout(() => {
        options.enter?.()
        dom.classList.remove(`${name}-enter-from`)
        dom.classList.add(`${name}-enter-to`)
        dom.classList.add(`${name}-enter-active`)
      }, 1 + delay)
    })
  } else {
    previousDisplay = dom.style.display; // 记录display的值
    options.beforeLeave?.()
    if (isFirstRender) { // 如果是第一次渲染
      dom.style.display = 'none'; // 直接隐藏元素
      isFirstRender = false; // 更新 isFirstRender 的值
    } else {
      dom.classList.remove(`${name}-enter-to`)
      dom.classList.remove(`${name}-enter-active`)
      dom.classList.add(`${name}-leave-from`)
      requestAnimationFrame(() => {
        setTimeout(() => {
          options.leave?.()
          dom.classList.remove(`${name}-leave-from`)
          dom.classList.add(`${name}-leave-to`)
          dom.classList.add(`${name}-leave-active`)
        }, 1 + delay)
      })
    }

  }
}

function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout | null
  return function (...args: any[]) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}
