import { describe, expect, test } from '@jest/globals'
import { hello } from '../index'

describe('hello space', () => {
  test('hello test', () => {
    expect(hello()).toBe(5)
  })
})
