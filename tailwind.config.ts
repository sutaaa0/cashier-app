import type { Config } from "tailwindcss";


export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
	extend: {
	  colors: {
		main: '#ffffff',
		sec: '#000',
		overlay: 'rgba(0,0,0,0.8)', // background color overlay for alert dialogs, modals, etc.
  
		// light mode
		bg: '#dfe5f2',
		text: '#000',
		border: '#000',
  
		// dark mode
		darkBg: '#272933',
		darkText: '#eeefe9',
		darkBorder: '#000',
		secondaryBlack: '#212121', // opposite of plain white, not used pitch black because borders and box-shadows are that color 
	  },
	  borderRadius: {
		base: '5px'
	  },
	  boxShadow: {
		light: '4px 4px 0px 0px #000',
		dark: '4px 4px 0px 0px #000',
	  },
	  translate: {
		boxShadowX: '4px',
		boxShadowY: '4px',
		reverseBoxShadowX: '-4px',
		reverseBoxShadowY: '-4px',
	  },
	  fontFamily: {
        sans: ['var(--font-cera-medium)'],
        mono: ['var(--font-geist-mono)'],
		normalaja: ['var(--font-cera-normal)']
      },
	  fontWeight: {
		base: '500',
		heading: '700',
	  },
	},
  },
  plugins: [],
} satisfies Config;
