// @ts-expect-error missing types
import { TextEncoder, TextDecoder } from 'fastestsmallesttextencoderdecoder'
if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder
}
if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextEncoder
}
