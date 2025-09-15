// tests/components/Button.spec.ts
import { it, expect, vi, describe } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { Button } from '#components'

describe('BaseButton', () => {
  it('renders label and handles click', async () => {
    const onClick = vi.fn()

    const component = await mountSuspended(Button, {
      props: {
        onClick,
        variant: 'primary',
      },
    })

  

    // Check correct class applied for variant
    expect(component.find('button').classes()).toContain('base__button--primary')

    // Simulate click
    await component.find('button').trigger('click')
    expect(onClick).toHaveBeenCalled()
  })

  it('renders slot content if provided', async () => {
    const onClick = vi.fn()

    const component = await mountSuspended(Button, {
      props: {
        onClick,
        variant: 'secondary',
      },
      slots: {
        default: 'Custom Slot Content',
      },
    })

    expect(component.text()).toContain('Custom Slot Content')
    expect(component.find('button').classes()).toContain('base__button--secondary')
  })
})
