import { describe, it, expect } from 'vitest'
import { generateSlug } from './slug'

describe('generateSlug', () => {
  it('lowercases and kebab-cases the title', () => {
    const slug = generateSlug('Hello World Event')
    expect(slug).toMatch(/^hello-world-event-[a-z0-9]{6}$/)
  })

  it('strips special characters', () => {
    const slug = generateSlug('Event! @#$% Name')
    expect(slug).toMatch(/^event-name-[a-z0-9]{6}$/)
  })

  it('collapses multiple spaces and hyphens', () => {
    const slug = generateSlug('Event   ---   Name')
    expect(slug).toMatch(/^event-name-[a-z0-9]{6}$/)
  })

  it('trims leading and trailing hyphens', () => {
    const slug = generateSlug('  Event Name  ')
    expect(slug).toMatch(/^event-name-[a-z0-9]{6}$/)
  })

  it('truncates very long titles to 50 chars before suffix', () => {
    const longTitle = 'a'.repeat(100)
    const slug = generateSlug(longTitle)
    const base = slug.replace(/-[a-z0-9]{6}$/, '')
    expect(base.length).toBeLessThanOrEqual(50)
  })

  it('appends a unique 6-char suffix', () => {
    const slug1 = generateSlug('Same Title')
    const slug2 = generateSlug('Same Title')
    expect(slug1).not.toBe(slug2)
  })

  it('returns a non-empty string for empty input', () => {
    const slug = generateSlug('')
    expect(slug).toMatch(/^[a-z0-9]{6}$/)
  })
})
