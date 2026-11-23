import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssRtl from "tailwindcss-rtl";

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
					/* ONE family, both scripts (Nidz 1.4, design system amendment
					   0.1-B). Readex Pro was drawn for Arabic and Latin together, so
					   the two scripts share weight, x-height and rhythm instead of
					   Inter beside a Noto fallback that never matched it. Self-hosted
					   through @fontsource (imported in main.tsx): no request to a
					   third-party font host, and the PWA has it offline. */
					sans: ["Readex Pro Variable", "ui-sans-serif", "system-ui", "sans-serif"]
				},
				/* Type scale. Readex Pro is wide, so sizes sit a step below where
				   Inter's were; display roles tighten their tracking. */
				fontSize: {
					display: ['2.125rem', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
					'display-lg': ['3.25rem', { lineHeight: '1.04', letterSpacing: '-0.035em' }],
					h1: ['1.75rem', { lineHeight: '1.14', letterSpacing: '-0.025em' }],
					'h1-lg': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
					title: ['1.25rem', { lineHeight: '1.25', letterSpacing: '-0.015em' }],
					price: ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
					name: ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
					eyebrow: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.04em' }]
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
					soft: 'hsl(var(--primary-soft))',
					deep: 'hsl(var(--primary-deep))',
					'on-deep': 'hsl(var(--primary-on-deep))'
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
				/* Warm supporting surfaces for animals and people (illustration
				   tiles). Never a state colour — see src/index.css. */
				sand: 'hsl(var(--sand))',
				sky: 'hsl(var(--sky))',
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
			/* Nidz 1.4 radius scale: sm 10 · md 14 · lg 18 · xl 22 · 2xl 28 ·
			   3xl 36 · full. Cards are xl, sheets and hero panels 2xl, every
			   button and chip full (the pill). */
			borderRadius: {
				'3xl': 'calc(var(--radius) + 22px)',
				'2xl': 'calc(var(--radius) + 14px)',
				xl: 'calc(var(--radius) + 8px)',
				lg: 'calc(var(--radius) + 4px)',
				md: 'var(--radius)',
				sm: 'calc(var(--radius) - 4px)'
			},
			/* One light source, above and slightly in front: every shadow has a
			   y offset and a soft blur, tinted from the ink rather than black.
			   `card` is a resting white surface on the mist ground; `pill` a white
			   control on it; `raised` something that genuinely floats (the tab
			   bar, popovers, sheets). */
			boxShadow: {
				card: '0 1px 2px hsl(var(--shadow) / 0.05), 0 8px 24px -6px hsl(var(--shadow) / 0.08)',
				pill: '0 1px 2px hsl(var(--shadow) / 0.06), 0 4px 12px -3px hsl(var(--shadow) / 0.10)',
				raised: '0 2px 6px hsl(var(--shadow) / 0.06), 0 18px 40px -10px hsl(var(--shadow) / 0.22)',
				'chrome-b': '0 1px 0 0 hsl(var(--border))',
				'chrome-t': '0 -10px 24px -14px hsl(var(--shadow) / 0.18)'
			},
			transitionTimingFunction: {
				/* Emil Kowalski's ease-out family: fast start, long settle. */
				out: 'cubic-bezier(0.23, 1, 0.32, 1)',
				'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
				drawer: 'cubic-bezier(0.32, 0.72, 0, 1)'
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
					'0%': { opacity: '0', transform: 'translateY(6px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(6px)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.96)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.96)', opacity: '0' }
				},
				/* A screen arriving: content rises 8px into place. Starts from
				   opacity 0.01 rather than 0 so the first frame is never a blank
				   page if the animation is skipped. */
				'page-in': {
					'0%': { opacity: '0.01', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				/* A check or a count appearing inside a control. */
				pop: {
					'0%': { opacity: '0', transform: 'scale(0.6)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
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
			/* Durations (design system §24, retuned 1.4): press 120-160ms,
			   standard 180-240ms, arrival 280ms, sheet 300ms. */
			animation: {
				'accordion-down': 'accordion-down 0.22s cubic-bezier(0.23, 1, 0.32, 1)',
				'accordion-up': 'accordion-up 0.18s cubic-bezier(0.23, 1, 0.32, 1)',
				'fade-in': 'fade-in 0.22s cubic-bezier(0.23, 1, 0.32, 1)',
				'fade-out': 'fade-out 0.18s cubic-bezier(0.23, 1, 0.32, 1)',
				'scale-in': 'scale-in 0.18s cubic-bezier(0.23, 1, 0.32, 1)',
				'scale-out': 'scale-out 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
				'page-in': 'page-in 0.28s cubic-bezier(0.23, 1, 0.32, 1) both',
				pop: 'pop 0.2s cubic-bezier(0.23, 1, 0.32, 1) both',
				'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
				'slide-out-right': 'slide-out-right 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
				enter: 'fade-in 0.22s cubic-bezier(0.23, 1, 0.32, 1), scale-in 0.18s cubic-bezier(0.23, 1, 0.32, 1)',
				exit: 'fade-out 0.18s cubic-bezier(0.23, 1, 0.32, 1), scale-out 0.15s cubic-bezier(0.23, 1, 0.32, 1)'
			}
		}
	},
	plugins: [tailwindcssAnimate, tailwindcssRtl],
} satisfies Config;
