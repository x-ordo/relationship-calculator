import { createDarkTheme, createLightTheme, type BrandVariants } from '@fluentui/react-components'

const brand: BrandVariants = {
  10: '#020305',
  20: '#111723',
  30: '#16263D',
  40: '#193253',
  50: '#1B3F6A',
  60: '#1B4C82',
  70: '#18599B',
  80: '#0F6CBD',
  90: '#2899F5',
  100: '#3AA0F3',
  110: '#5EB3F5',
  120: '#82C7FF',
  130: '#A5D6FF',
  140: '#C7E4FF',
  150: '#E8F4FF',
  160: '#F5FAFF',
}

export const customDarkTheme = createDarkTheme(brand)
export const customLightTheme = createLightTheme(brand)

// Override for darker background
customDarkTheme.colorNeutralBackground1 = '#1f1f1f'
customDarkTheme.colorNeutralBackground2 = '#292929'
customDarkTheme.colorNeutralBackground3 = '#141414'
customDarkTheme.colorNeutralBackground4 = '#0a0a0a'
