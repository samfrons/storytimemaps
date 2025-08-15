export function getThemeVariables(themeName: string): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const computed = getComputedStyle(document.documentElement);
  const variables: Record<string, string> = {};
  
  const cssVariables = [
    '--primary', '--primary-rgb', '--primary-light', '--secondary',
    '--background', '--background-rgb', '--foreground', '--foreground-muted',
    '--success', '--warning', '--danger', '--muted', '--muted-rgb',
    '--accent-orange', '--accent-yellow', '--accent-green', '--accent-blue', '--accent-purple',
    '--border', '--shadow', '--input-bg', '--input-bg-rgb', '--dropdown-bg',
    '--card-bg', '--card-bg-rgb', '--placeholder-color', '--map-overlay',
    '--active-text', '--active-text-secondary',
    '--declining-text', '--declining-text-secondary',
    '--closed-text', '--closed-text-secondary'
  ];

  cssVariables.forEach(varName => {
    const value = computed.getPropertyValue(varName).trim();
    if (value) {
      variables[varName] = value;
    }
  });

  const savedCustom = localStorage.getItem(`theme-custom-${themeName}`);
  if (savedCustom) {
    try {
      const custom = JSON.parse(savedCustom);
      Object.assign(variables, custom);
    } catch (e) {
      console.error('Failed to parse custom theme', e);
    }
  }

  return variables;
}

export function updateCSSVariable(name: string, value: string): void {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty(name, value);
  }
}

export function resetThemeToDefaults(themeName: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(`theme-custom-${themeName}`);
  
  const root = document.documentElement;
  const styles = root.style;
  const length = styles.length;
  
  for (let i = length - 1; i >= 0; i--) {
    const property = styles[i];
    if (property.startsWith('--')) {
      root.style.removeProperty(property);
    }
  }
}

export function applyCustomTheme(themeName: string): void {
  if (typeof window === 'undefined') return;
  
  const savedCustom = localStorage.getItem(`theme-custom-${themeName}`);
  if (savedCustom) {
    try {
      const custom = JSON.parse(savedCustom);
      Object.entries(custom).forEach(([key, value]) => {
        updateCSSVariable(key, value as string);
      });
    } catch (e) {
      console.error('Failed to apply custom theme', e);
    }
  }
}

export function exportTheme(themeName: string, variables: Record<string, string>): string {
  return JSON.stringify({
    themeName,
    timestamp: new Date().toISOString(),
    variables
  }, null, 2);
}

export function importTheme(jsonString: string, themeName: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.variables) {
      localStorage.setItem(`theme-custom-${themeName}`, JSON.stringify(data.variables));
      applyCustomTheme(themeName);
      return true;
    }
  } catch (e) {
    console.error('Failed to import theme', e);
  }
  return false;
}