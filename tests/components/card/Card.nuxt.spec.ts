// tests/components/Card.spec.ts
import { it, describe, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
// import { Card } from '#components'

describe('Card Component', () => {
  it('renders the passed slot content', async () => {
    // const wrapper = await mountSuspended(Card, {
    //   slots: {
    //     default: 'This is a card content',
    //   },
    // })

    // expect(wrapper.text()).toContain('This is a card content')
  })

  it('renders fallback content when no slot content is passed', async () => {
    // const wrapper = await mountSuspended(Card)

    // expect(wrapper.text()).toContain('No content provided')
  })
})
