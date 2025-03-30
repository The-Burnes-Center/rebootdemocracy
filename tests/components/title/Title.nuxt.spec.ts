// tests/components/Card.spec.ts
import { it, describe, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
// import { Title } from '#components'

describe('Card Component', () => {
  it('renders the passed slot content', async () => {
    // const wrapper = await mountSuspended(Title, {
    //   slots: {
    //     default: 'This is a card content',
    //   },
    // props: {
    //     level: 'h1',
    //     weight: 'bold',
    //     size: 'lg',
    //     color: 'primary',
    //     style: {{}},
    //     class: 'custom-class',
    // }
    // })

    // <Title weight="light" level="h4">
    //   The Federation of American Scientists Call on OMB to Maintain the Agency AI Use Case Inventories at Their...
    // </Title>

    // <Title level="h2" >
    //   The Federation of American Scientists Call on OMB to Maintain the Agency AI Use Case Inventories at Their...
    // </Title>

    /**
     * const component = await mountSuspended(Button, {
      props: {
        label: 'Click Me',
        onClick,
        variant: 'primary',
      },
    })
     */

    // expect(wrapper.text()).toContain('This is a card content')
  })

  it('renders fallback content when no slot content is passed', async () => {
    // const wrapper = await mountSuspended(Card)

    // expect(wrapper.text()).toContain('No content provided')
  })
})
