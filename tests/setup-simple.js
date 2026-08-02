require('@testing-library/jest-dom')
const { TextEncoder, TextDecoder } = require('util')

// Polyfills básicos para Node.js
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// TensorFlow.js: usa CPU no jsdom (evita tentativa WebGL e ruído nos logs)
let tfSetupPromise
beforeAll(async () => {
  if (!tfSetupPromise) {
    tfSetupPromise = (async () => {
      const tf = require('@tensorflow/tfjs')
      require('@tensorflow/tfjs-backend-cpu')
      await tf.setBackend('cpu')
      await tf.ready()
    })()
  }
  await tfSetupPromise
})

const originalConsoleWarn = console.warn
const originalConsoleError = console.error
const tfJsNoisePatterns = [
  /HTMLCanvasElement\.prototype\.getContext/,
  /Initialization of backend webgl failed/,
  /WebGL is not supported/,
  /Could not get context for WebGL/,
  /running TensorFlow\.js in Node\.js/,
]

function isTfJsNoise(args) {
  const message = args.map(String).join(' ')
  return tfJsNoisePatterns.some((pattern) => pattern.test(message))
}

beforeAll(() => {
  console.warn = (...args) => {
    if (isTfJsNoise(args)) return
    originalConsoleWarn(...args)
  }
  console.error = (...args) => {
    if (isTfJsNoise(args)) return
    originalConsoleError(...args)
  }
})

afterAll(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

// Mock básico do fetch
global.fetch = jest.fn()

// Mock básico do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock básico do sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock básico do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})
