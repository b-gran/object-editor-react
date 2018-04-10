import * as util from '../src/util'
import * as R from 'ramda'

describe('parseDecimalInt', () => {
  it('has the same result as parseInt(x, 10)', () => {
    R.times(() => {
      const n = String(Math.random() * Math.pow(10, (Math.random() * 6) | 0))
      const expected = parseInt(n, 10)
      const actual = util.parseDecimalInt(n)
      expect(actual).toBe(expected)
    })
  })
})

describe('keyBy', () => {
  it('creates an object', () => {
    const result = util.keyBy(R.identity, ['a', 'b', 'c'])
    expect(result).toEqual({ a: 'a', b: 'b', c: 'c' })
  })

  it('passes the keys through the iteratee', () => {
    const result = util.keyBy(R.add(1), [1, 2, 3])
    expect(result).toEqual({ 2: 1, 3: 2, 4: 3 })
  })

  it('is curried', () => {
    const result = util.keyBy(R.identity)(['a', 'b', 'c'])
    expect(result).toEqual({ a: 'a', b: 'b', c: 'c' })
  })
})