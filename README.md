# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Code Cleanup & Optimization

### Recent Refactoring (May 13, 2026)

- Removed dead code and unused variables from MapView.jsx
- Converted 150+ inline styles to CSS classes for better maintainability
- Eliminated duplitcate popup-card styling in favor of ios-card
- Improved CSS organization with 45+ new semantic classes
- Cleaned up removed mobileRouteOpen state and related UI

**Files optimized:**

- `src/components/Map/MapView.jsx` - Dead code cleanup, style refactoring
- `src/components/Finance/FinanceView.jsx` - Inline style to CSS conversion
- `src/styles/global.css` - New CSS classes for improved organization
