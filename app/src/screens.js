// Screens are discovered, not imported by name, so a half-built app still builds.
const modules = import.meta.glob('./views/**/*Screen.jsx', { eager: true });

export function getScreen(screenKey) {
  const mod = modules[`./views/${screenKey}.jsx`];
  return mod && mod.default ? mod.default : null;
}
