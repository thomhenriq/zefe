import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Os tamanhos do sistema v2 (text-ds-*) são tamanhos, não cores: sem isto o twMerge descarta um deles.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["ds-display-xl", "ds-display-lg", "ds-display", "ds-h2", "ds-h3", "ds-lead", "ds-body", "ds-small", "ds-caption"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
