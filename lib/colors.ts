const presetColors = [
    "#f7768e",
    "#ff9e64",
    "#73daca",
    "#bb9af7",
    "#7dcfff",
    "#7aa2f7",
    "#ffc107",
  ];
  
  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }
  
  export function getDynamicColor(categoryName: string): string {
    const hash = hashString(categoryName);
    return presetColors[hash % presetColors.length];
  }
  