import * as R from 'ramda'
import { ModalManager } from 'material-ui/Modal'

// Return true if the argument is non-nil
export const isDefined = R.complement(R.isNil)

// If the argument is an array, returns the argument.
// Otherwise, returns an array with the argument as its only element.
export const wrapArray = R.when(R.complement(Array.isArray), R.of)

// Like R.assoc, but respects the property's current enumerability
export const defineProperty = R.curry((prop, value, object) => {
  const isPropertyEnumerable = R.defaultTo(true)(
    R.path(['enumerable'], Object.getOwnPropertyDescriptor(object, prop))
  )

  Object.defineProperty(object, prop, { value: value, enumerable: isPropertyEnumerable })
  return object
})

// Returns a version of a function that will be called at most
// once during a predefined period.
export const throttle = R.curry((durationMs, f) => {
  let waiting = false

  const handler = (...args) => {
    if (!waiting) {
      waiting = true
      setTimeout(
        () => (waiting = false),
        durationMs
      )
      return f(...args)
    }
  }

  return defineProperty('length', f.length, handler)
})

// Returns a throttled function that calls f `duration`
// time after it is called.
export const delay = R.curry((durationMs, f) => {
  const delayMs = Math.max(durationMs | 0, 20)
  const handler = defineProperty('length', f.length)(
    (...args) => setTimeout(
      () => f(...args),
      delayMs
    )
  )
  return throttle(delayMs + 5, handler)
})

// Like R.path(), but can accept Strings for the path
export const safePath = R.useWith(R.path, [wrapArray])

// isFunctionProp :: (String | [String]) -> Object -> Boolean
const isFunctionProp = R.curryN(2, R.pipe(safePath, R.is(Function)))

// node's EventEmitter.once() for EventTargets
export const eventOnce = R.curry((event, f, eventTarget) => {
  if (!isFunctionProp('addEventListener', eventTarget)) {
    throw new Error('`eventTarget` is not an EventTarget (missing function addEventListener)')
  }

  function handler (...args) {
    eventTarget.removeEventListener(event, handler)
    f(...args)
  }

  eventTarget.addEventListener(event, handler)
})

/* *********************************** *
 * ***********    STRING   *********** *
 * *********************************** */

export const capitalize = str => {
  if (!str) {
    return str
  }

  return `${str[0].toUpperCase()}${str.slice(1)}`
}

/* *********************************** *
 * *********** MATERIAL UI *********** *
 * *********************************** */

// By default, material-ui modals will hide the scrollbar on the <body />
// This custom ModalManager (specified as a prop to the Popover) will prevent the
// Modal from hiding the scroll bar.
export const NoOverflowModalManager = new ModalManager({ handleContainerOverflow: false })
