import { it, describe, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { Text } from '#components'

describe('Text Component', () => {
  it('renders the passed text content', async () => {
    const wrapper = await mountSuspended(Text, {
      slots: {
        default: 'Hello World'
      }
    })
    expect(wrapper.text()).toContain('Hello World')
  })
  
  it('applies the correct HTML tag based on the "as" prop', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        as: 'p'
      },
      slots: {
        default: 'Hello World'
      }
    })
    expect(wrapper.find('p').exists()).toBe(true)
    
    const spanWrapper = await mountSuspended(Text, {
      props: {
        as: 'span'
      },
      slots: {
        default: 'Hello World'
      }
    })
    expect(spanWrapper.find('span').exists()).toBe(true);
  })
  
  it('applies the correct font size based on size prop', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        size: 'lg'
      },
      slots: {
        default: 'Hello World'
      }
    })
    // Check for the inline style with font-size instead of a class
    expect(wrapper.attributes('style')).toContain('font-size: 1.125rem')
  })

  it('applies default font size based on element when no size prop is provided', async () => {
    const h1Wrapper = await mountSuspended(Text, {
      props: {
        as: 'h1'
      },
      slots: {
        default: 'Heading'
      }
    })
    // h1 should default to 2xl (1.5rem)
    expect(h1Wrapper.attributes('style')).toContain('font-size: 1.5rem')
  })


  it('applies the correct weight class', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        weight: 'bold'
      },
        slots: {
        default: 'Heading'
      }
    })
    // Assuming your component applies a class like "font-bold" for weight
    expect(wrapper.attributes('style')).toContain('font-weight: 700')
  })

 

  it('applies the correct color class', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        color: 'text-primary'
      },
       slots: {
        default: 'Heading'
      }
    })
    // Assuming your component applies a class like "text-primary" for color
    expect(wrapper.attributes('style')).toContain('color: #000')
  })

    it('applies the correct alignment class', async () => {
      const wrapper = await mountSuspended(Text, {
        props: {
          align: 'center'
        },
          slots: {
        default: 'Heading'
      }
      })
      // Assuming your component applies a class like "text-center" for alignment
      expect(wrapper.classes()).toContain('text-center')
    })
      

  it('applies italic styling when italic prop is true', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        fontStyle: 'italic'
      },
       slots: {
        default: 'Heading'
      }
    })
    // Assuming your component applies a class like "italic" for italic styling
    expect(wrapper.attributes('style')).toContain('font-style: italic')
  })

  it('applies font family when fontFamily prop is provided', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        fontFamily: 'inter'
      },
       slots: {
        default: 'Heading'
      }   
      })
    // Assuming your component applies a class like "italic" for italic styling
    expect(wrapper.attributes('style')).toContain('font-family: var(--font-inter);')
  })  

  it('applies custom class when class prop is provided', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        class: 'my-custom-class'
      },
       slots: {
        default: 'custom class'
      }   
    })
    expect(wrapper.classes()).toContain('my-custom-class')
  })
 

  it('applies text transformation when transform prop is provided', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        transform: 'uppercase'
      },
        slots: {
        default: 'custom class'
      }  
    })
      expect(wrapper.attributes('style')).toContain('text-transform: uppercase')
  })
    
  it('renders rich text content when provided HTML', async () => {
    const wrapper = await mountSuspended(Text, {
      props: {
        text: '<strong>Bold text</strong>',
        html: true
      }
    })
    expect(wrapper.find('strong').exists()).toBe(true)
  })
})
   
  