import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative assets make the same build work below the portfolio's Pages path.
export default defineConfig({ plugins: [react()], base: './' });
