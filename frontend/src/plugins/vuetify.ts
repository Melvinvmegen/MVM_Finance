import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default createVuetify(
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
 {
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: "#000000",
          secondary: "#ffd966",
          accent: "#FC0B50",
          error: "#f44336",
          warning: "#ff8c00",
          info: "#03a9f4",
          success: "#4caf50",
        }
      },
    },
  }
 }
)
