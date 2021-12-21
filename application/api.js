import * as config from './config'

export function healthcheck() {
  return fetch(`${config.apiBaseUrl}/health`)
}

export function loadBehaviours() {
  return fetch(`${config.apiBaseUrl}/behaviors`).then(response => response.json())
}

export function loadKeycodes() {
  return fetch(`${config.apiBaseUrl}/keycodes`).then(response => response.json())
}

export function loadKeymap(keyboardId) {
  return fetch(`${config.apiBaseUrl}/keymap?id=${keyboardId}`)
    .then(response => response.json())
}

export function loadLayout(keyboardId) {
  return fetch(`${config.apiBaseUrl}/layout?id=${keyboardId}`)
    .then(response => response.json())
}
