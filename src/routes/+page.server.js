export const prerender = true;

export function load() {
  return {
    updated: new Date().toISOString().split('T')[0],
  };
}
