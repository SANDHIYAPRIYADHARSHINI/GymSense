export type DemoAsset = {
  animationPath: `/animations/${string}.svg`;
  posterPath: `/animations/${string}.svg`;
};
export const demoAssets: Record<string, DemoAsset> = {
  squats: {
    animationPath: "/animations/squats.svg",
    posterPath: "/animations/squats.poster.svg",
  },
  "push-ups": {
    animationPath: "/animations/push-ups.svg",
    posterPath: "/animations/push-ups.poster.svg",
  },
  "jumping-jacks": {
    animationPath: "/animations/jumping-jacks.svg",
    posterPath: "/animations/jumping-jacks.poster.svg",
  },
  lunges: {
    animationPath: "/animations/lunges.svg",
    posterPath: "/animations/lunges.poster.svg",
  },
  plank: {
    animationPath: "/animations/plank.svg",
    posterPath: "/animations/plank.poster.svg",
  },
  "biceps-curls": {
    animationPath: "/animations/biceps-curls.svg",
    posterPath: "/animations/biceps-curls.poster.svg",
  },
};
export function resolveDemoAsset(id: string, path: string): DemoAsset | null {
  const asset = demoAssets[id];
  return asset && asset.animationPath === path ? asset : null;
}
