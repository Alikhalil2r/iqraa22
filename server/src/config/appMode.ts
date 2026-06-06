/** وضع التطوير التجريبي — يُفعّل فقط عند DEMO_MODE=true */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}
