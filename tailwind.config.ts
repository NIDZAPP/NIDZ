import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			/* Design system §15 gutters: mobile 16 · large mobile/tablet 20-24 ·
			   desktop 24-32. A flat 2rem cost 8% of a 390px viewport. */
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem'
			},
			screens: {
				'2xl': '1400px'
			}
		},
			extend: {
				fontFamily: {
					/* "Noto Sans Arabic" carries ar; Inter has no Arabic glyphs, so
					   without it Arabic fell back to an arbitrary system face (§21).
					   Latin text never reaches it — Inter resolves first. Loaded from
					   the same Google Fonts request as Inter: no new dependency. */
					sans: ["Inter", "Noto Sans Arabic", "ui-sans-serif", "system-ui", "sans-serif"],
					display: ["Playfair Display", "serif"]
				},
				/* Design system §13.3 made real, so screens stop reaching for
				   arbitrary bracket values. Inter needs negative tracking above
				   ~24px; the eyebrow is the only positive-tracking role. */
				fontSize: {
					h1: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
					'h1-lg': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
					price: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
					name: ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
					eyebrow: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.08em' }]
				},
				colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					soft: 'hsl(var(--primary-soft))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))'
				},
				/* Filled-control track: slider, progress, switch-off state. */
				track: 'hsl(var(--track))',
				/* Nidz warm terracotta. NON-INTERACTIVE surfaces only — never a
				   button, link, hover or selected state. See src/index.css. */
				brand: {
					DEFAULT: 'hsl(var(--brand))',
					foreground: 'hsl(var(--brand-foreground))',
					soft: 'hsl(var(--brand-soft))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			/* Nidz radius scale (design system §16): sm 8 · md 12 · lg 16 · xl 24.
			   `rounded-2xl` / `rounded-3xl` are not part of the scale. */
			borderRadius: {
				xl: 'calc(var(--radius) + 12px)',
				lg: 'calc(var(--radius) + 4px)',
				md: 'var(--radius)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			/* Durations follow design system §24: micro-feedback 100-150ms,
			   standard transition 160-220ms, dialog/sheet 200-300ms. */
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.2s ease-out',
				'fade-out': 'fade-out 0.2s ease-out',
				'scale-in': 'scale-in 0.15s ease-out',
				'scale-out': 'scale-out 0.15s ease-out',
				'slide-in-right': 'slide-in-right 0.25s ease-out',
				'slide-out-right': 'slide-out-right 0.25s ease-out',
				enter: 'fade-in 0.2s ease-out, scale-in 0.15s ease-out',
				exit: 'fade-out 0.2s ease-out, scale-out 0.15s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("tailwindcss-rtl")],
} satisfies Config;
