let pending = 0
let hasError = false
const listeners = new Set()

function notify() {
  listeners.forEach(fn => fn({ pending, hasError }))
}

export function trackSave(promise) {
  pending++
  notify()
  return promise
    .then(result => {
      pending--
      if (result?.error) hasError = true
      else if (pending === 0) hasError = false
      notify()
      return result
    })
    .catch(err => {
      pending--
      hasError = true
      notify()
      throw err
    })
}

export function useSaveState(setState) {
  function subscribe() {
    listeners.add(setState)
    return () => listeners.delete(setState)
  }
  return { subscribe, current: () => ({ pending, hasError }) }
}
