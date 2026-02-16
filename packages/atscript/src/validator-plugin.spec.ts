import { foormValidatorPlugin } from './validator-plugin'

describe('foormValidatorPlugin', () => {
  it('returns undefined when no validators present', () => {
    const plugin = foormValidatorPlugin()
    const ctx = { error: vi.fn() }
    const def = { name: 'field', metadata: { get: () => undefined } }

    const result = plugin(ctx, def, 'test')

    expect(result).toBeUndefined()
    expect(ctx.error).not.toHaveBeenCalled()
  })

  it('runs validator and passes on success', () => {
    const plugin = foormValidatorPlugin({ data: {}, context: {} })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'field',
      metadata: {
        get: (key: string) => (key === 'foorm.validate' ? '() => true' : undefined),
      },
    }

    const result = plugin(ctx, def, 'test')

    expect(result).toBeUndefined()
    expect(ctx.error).not.toHaveBeenCalled()
  })

  it('runs validator and fails with error message', () => {
    const plugin = foormValidatorPlugin({ data: {}, context: {} })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'field',
      metadata: {
        get: (key: string) => (key === 'foorm.validate' ? '() => "Error message"' : undefined),
      },
    }

    const result = plugin(ctx, def, 'test')

    expect(result).toBe(false)
    expect(ctx.error).toHaveBeenCalledWith('Error message')
  })

  it('passes entry object to validators', () => {
    const plugin = foormValidatorPlugin({ data: {}, context: {} })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'testField',
      metadata: {
        get: (key: string) => {
          if (key === 'foorm.validate') {
            return '(v, data, context, entry) => entry.field === "testField" || "Wrong field"'
          }
          if (key === 'foorm.type') return 'text'
          return undefined
        },
      },
    }

    const result = plugin(ctx, def, 'testValue')

    expect(result).toBeUndefined()
    expect(ctx.error).not.toHaveBeenCalled()
  })

  it('evaluates static options and passes via entry', () => {
    const plugin = foormValidatorPlugin({ data: {}, context: {} })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'country',
      metadata: {
        get: (key: string) => {
          if (key === 'foorm.validate') {
            return '(v, data, context, entry) => entry.options.map(o => typeof o === "string" ? o : o.key).includes(v) || "Invalid"'
          }
          if (key === 'foorm.options') {
            return [
              { label: 'United States', value: 'us' },
              { label: 'Canada', value: 'ca' },
            ]
          }
          if (key === 'foorm.type') return 'select'
          return undefined
        },
      },
    }

    // Valid value
    const result1 = plugin(ctx, def, 'us')
    expect(result1).toBeUndefined()
    expect(ctx.error).not.toHaveBeenCalled()

    // Invalid value
    ctx.error.mockClear()
    const result2 = plugin(ctx, def, 'fr')
    expect(result2).toBe(false)
    expect(ctx.error).toHaveBeenCalledWith('Invalid')
  })

  it('evaluates computed options with context', () => {
    const plugin = foormValidatorPlugin({
      data: {},
      context: { cities: ['NYC', 'LA', 'Chicago'] },
    })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'city',
      metadata: {
        get: (key: string) => {
          if (key === 'foorm.validate') {
            return '(v, data, context, entry) => entry.options.includes(v) || "Invalid city"'
          }
          if (key === 'foorm.fn.options') {
            return '(v, data, context, entry) => context.cities || []'
          }
          if (key === 'foorm.type') return 'select'
          return undefined
        },
      },
    }

    // Valid value
    const result1 = plugin(ctx, def, 'NYC')
    expect(result1).toBeUndefined()
    expect(ctx.error).not.toHaveBeenCalled()

    // Invalid value
    ctx.error.mockClear()
    const result2 = plugin(ctx, def, 'Miami')
    expect(result2).toBe(false)
    expect(ctx.error).toHaveBeenCalledWith('Invalid city')
  })

  it('evaluates static constraints', () => {
    const plugin = foormValidatorPlugin({ data: {}, context: {} })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'field',
      metadata: {
        get: (key: string) => {
          if (key === 'foorm.validate') {
            return '(v, data, context, entry) => entry.disabled ? "Should not validate disabled" : true'
          }
          if (key === 'foorm.disabled') return true
          if (key === 'foorm.type') return 'text'
          return undefined
        },
      },
    }

    const result = plugin(ctx, def, 'test')

    expect(result).toBe(false)
    expect(ctx.error).toHaveBeenCalledWith('Should not validate disabled')
  })

  it('evaluates computed constraints', () => {
    const plugin = foormValidatorPlugin({
      data: { hasPermission: false },
      context: {},
    })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'field',
      metadata: {
        get: (key: string) => {
          if (key === 'foorm.validate') {
            return '(v, data, context, entry) => entry.readonly ? "Cannot edit readonly" : true'
          }
          if (key === 'foorm.fn.readonly') {
            return '(v, data, context, entry) => !data.hasPermission'
          }
          if (key === 'foorm.type') return 'text'
          return undefined
        },
      },
    }

    const result = plugin(ctx, def, 'test')

    expect(result).toBe(false)
    expect(ctx.error).toHaveBeenCalledWith('Cannot edit readonly')
  })

  it('runs multiple validators in order', () => {
    const plugin = foormValidatorPlugin({ data: {}, context: {} })
    const ctx = { error: vi.fn() }
    const def = {
      name: 'field',
      metadata: {
        get: (key: string) => {
          if (key === 'foorm.validate') {
            return [
              '(v) => v.length > 0 || "Required"',
              '(v) => v.length >= 3 || "Too short"',
            ]
          }
          if (key === 'foorm.type') return 'text'
          return undefined
        },
      },
    }

    // Fails first validator
    const result1 = plugin(ctx, def, '')
    expect(result1).toBe(false)
    expect(ctx.error).toHaveBeenCalledWith('Required')

    // Fails second validator
    ctx.error.mockClear()
    const result2 = plugin(ctx, def, 'ab')
    expect(result2).toBe(false)
    expect(ctx.error).toHaveBeenCalledWith('Too short')

    // Passes both
    ctx.error.mockClear()
    const result3 = plugin(ctx, def, 'abc')
    expect(result3).toBeUndefined()
    expect(ctx.error).not.toHaveBeenCalled()
  })
})
