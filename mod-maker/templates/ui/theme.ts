// 테마 색 — /mod-color 가 쓰는 파일이다. 손으로 고치지 말고 `/mod-color <색>` 으로 바꾼다.
// dark 는 어두운 화면, light 는 밝은 화면에서 쓰는 한 쌍(from → to). flat 이면 둘이 같다.
export const themeColor = {
  input: 'default',
  flat: false,
  dark: { from: '#e6b44c', to: '#e05a8c' },
  light: { from: '#b88314', to: '#b11b53' },
} as const
