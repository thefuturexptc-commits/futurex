export default {
  "content": [
    "./index.html",
    "./App.tsx",
    "./{pages,components,context,services,utils}/**/*.{js,ts,tsx}"
  ],
  "darkMode": "class",
  "theme": {
    "extend": {
      "fontFamily": {
        "sans": [
          "Outfit",
          "sans-serif"
        ],
        "display": [
          "Space Grotesk",
          "sans-serif"
        ]
      },
      "colors": {
        "primary": {
          "50": "rgb(var(--color-primary-50) / <alpha-value>)",
          "100": "rgb(var(--color-primary-100) / <alpha-value>)",
          "200": "rgb(var(--color-primary-200) / <alpha-value>)",
          "300": "rgb(var(--color-primary-300) / <alpha-value>)",
          "400": "rgb(var(--color-primary-400) / <alpha-value>)",
          "500": "rgb(var(--color-primary-500) / <alpha-value>)",
          "600": "rgb(var(--color-primary-600) / <alpha-value>)",
          "700": "rgb(var(--color-primary-700) / <alpha-value>)",
          "800": "rgb(var(--color-primary-800) / <alpha-value>)",
          "900": "rgb(var(--color-primary-900) / <alpha-value>)"
        },
        "dark": {
          "bg": "#050505",
          "surface": "#0a0a0a",
          "border": "#1f1f1f"
        }
      },
      "animation": {
        "fade-in-up": "fadeInUp 0.45s ease-out forwards",
        "card-reveal": "cardReveal 0.55s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "float-fast": "float 6s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 15s linear infinite",
        "bounce-slow": "bounce 3s infinite",
        "gradient-x": "gradientX 7s ease-in-out infinite",
        "modal-pop": "modalPop 0.3s ease-out forwards"
      },
      "keyframes": {
        "fadeInUp": {
          "0%": {
            "opacity": "0",
            "transform": "translateY(20px)"
          },
          "100%": {
            "opacity": "1",
            "transform": "translateY(0)"
          }
        },
        "cardReveal": {
          "0%": {
            "opacity": "0",
            "transform": "translateY(14px) scale(0.95)"
          },
          "100%": {
            "opacity": "1",
            "transform": "translateY(0) scale(1)"
          }
        },
        "fadeIn": {
          "0%": {
            "opacity": "0"
          },
          "100%": {
            "opacity": "1"
          }
        },
        "float": {
          "0%, 100%": {
            "transform": "translateY(0)"
          },
          "50%": {
            "transform": "translateY(-20px)"
          }
        },
        "gradientX": {
          "0%, 100%": {
            "backgroundPosition": "0% 50%"
          },
          "50%": {
            "backgroundPosition": "100% 50%"
          }
        },
        "modalPop": {
          "0%": {
            "opacity": "0",
            "transform": "translateY(18px) scale(0.95)"
          },
          "100%": {
            "opacity": "1",
            "transform": "translateY(0) scale(1)"
          }
        }
      }
    }
  }
};
