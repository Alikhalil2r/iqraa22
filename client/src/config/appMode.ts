/** وضع التطوير التجريبي — يُفعّل فقط عند VITE_DEMO_MODE=true */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true'
}
