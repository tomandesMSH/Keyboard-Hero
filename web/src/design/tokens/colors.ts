// "Alternativní paleta 4" — periwinkle / hyper magenta / gradient neon.

export const colors = {
  bg: '#0B0818',
  bgCard: '#1B2062',
  bgCardAlt: '#241C3D',

  periwinkle: '#BF40FA',
  periwinkleDark: '#4928C2',
  magenta: '#E02F75',
  magentaDark: '#A81F58',
  coral: '#FF5A57',
  coralDark: '#C23A38',

  xpPink: '#FCCBF0',
  textPrimary: '#F8F5FF',
  textMuted: '#9186B8',
  border: '#3A2F5C',
} as const

export const gradients = {
  warm: 'linear-gradient(135deg, #FF5A57 0%, #E02F75 45%, #6700A3 100%)',
  cool: 'linear-gradient(135deg, #BF40FA 0%, #4928C2 100%)',
  xp: 'linear-gradient(120deg, #FCCBF0 0%, #FF5A57 100%)',
  active: 'linear-gradient(120deg, #BF40FA 0%, #E02F75 100%)',
  cosmicBg:
    'radial-gradient(circle at 25% 15%, #3A1B6E 0%, #1B2062 38%, #0B0818 72%, #040607 100%)',
} as const
