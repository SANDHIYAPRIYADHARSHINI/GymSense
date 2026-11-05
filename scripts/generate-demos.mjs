import { mkdir, writeFile } from "node:fs/promises";
const output = new URL("../public/animations/", import.meta.url);
await mkdir(output, { recursive: true });
const demos = [
  {
    id: "squats",
    name: "Squats",
    duration: 4,
    head: [
      [178, 45],
      [150, 88],
    ],
    pose: [
      "M174 68L160 120M160 120L180 160L180 205M160 120L167 160L167 205M174 80L198 100L220 90M174 80L188 100L210 90",
      "M145 110L115 150M115 150L165 165L180 205M115 150L150 165L167 205M145 118L184 118L216 110M145 118L175 128L207 120",
    ],
  },
  {
    id: "push-ups",
    name: "Push-ups",
    duration: 3.6,
    head: [
      [78, 122],
      [75, 161],
    ],
    pose: [
      "M98 135L175 160L270 190M175 160L229 180L270 190M98 135L101 169L105 203M108 139L115 169L119 203",
      "M95 172L178 181L270 190M178 181L229 187L270 190M95 172L131 184L105 203M105 174L142 187L119 203",
    ],
  },
  {
    id: "jumping-jacks",
    name: "Jumping jacks",
    duration: 2.4,
    head: [
      [160, 45],
      [160, 38],
    ],
    pose: [
      "M160 68L160 132M160 132L150 168L145 205M160 132L170 168L175 205M160 82L138 117L135 145M160 82L182 117L185 145",
      "M160 61L160 125M160 125L130 165L98 205M160 125L190 165L222 205M160 78L126 60L112 28M160 78L194 60L208 28",
    ],
  },
  {
    id: "lunges",
    name: "Lunges",
    duration: 4,
    head: [
      [180, 40],
      [176, 78],
    ],
    pose: [
      "M175 63L160 112M160 112L190 158L190 205M160 112L130 158L100 205M172 80L190 112L177 136M172 80L150 107L163 131",
      "M171 101L154 148M154 148L195 158L190 205M154 148L130 192L100 205M170 119L185 144L169 165M170 119L147 141L160 162",
    ],
  },
  {
    id: "plank",
    name: "Plank",
    duration: 4,
    head: [
      [70, 128],
      [70, 127],
    ],
    pose: [
      "M90 145L170 165L265 188M170 165L224 181L265 188M90 145L105 190L138 203M100 148L118 190L151 203",
      "M90 144L170 164L265 188M170 164L224 181L265 188M90 144L105 190L138 203M100 147L118 190L151 203",
    ],
  },
  {
    id: "biceps-curls",
    name: "Biceps curls",
    duration: 3.6,
    head: [
      [160, 42],
      [160, 42],
    ],
    weights: [
      [
        [132, 156],
        [142, 80],
      ],
      [
        [188, 156],
        [178, 80],
      ],
    ],
    pose: [
      "M160 65L160 132M140 82L180 82M160 132L145 169L140 205M160 132L175 169L180 205M140 82L132 115L132 156M180 82L188 115L188 156",
      "M160 65L160 132M140 82L180 82M160 132L145 169L140 205M160 132L175 169L180 205M140 82L132 115L142 80M180 82L188 115L178 80",
    ],
  },
];
function animate(attribute, start, end, duration) {
  return `<animate attributeName="${attribute}" values="${start};${start};${end};${end};${start}" keyTimes="0;.1;.45;.6;1" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1" dur="${duration}s" repeatCount="indefinite"/>`;
}
function figure(demo, moving) {
  const head = demo.head[0];
  let html = `<g fill="none" stroke="#ccf66b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="${head[0]}" cy="${head[1]}" r="13">${moving ? animate("cx", head[0], demo.head[1][0], demo.duration) + animate("cy", head[1], demo.head[1][1], demo.duration) : ""}</circle><path d="${demo.pose[0]}">${moving ? animate("d", demo.pose[0], demo.pose[1], demo.duration) : ""}</path></g>`;
  for (const [start, end] of demo.weights ?? []) {
    html += `<g transform="translate(${start[0]} ${start[1]})" fill="#98b66a" stroke="#10170d" stroke-width="2"><path d="M-13-5H13V5H-13Z"/><rect x="-16" y="-10" width="7" height="20" rx="2"/><rect x="9" y="-10" width="7" height="20" rx="2"/>${moving ? `<animateTransform attributeName="transform" type="translate" values="${start.join(" ")};${start.join(" ")};${end.join(" ")};${end.join(" ")};${start.join(" ")}" keyTimes="0;.1;.45;.6;1" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1" dur="${demo.duration}s" repeatCount="indefinite"/>` : ""}</g>`;
  }
  return html;
}
for (const demo of demos) {
  const prefix = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" role="img"><title>${demo.name} stickman demonstration</title><desc>Simplified movement guide. Follow the numbered instructions for technique.</desc><path d="M58 210H290" stroke="#ccf66b" stroke-opacity=".17" stroke-width="2"/>`;
  if (demo.id === "push-ups")
    demo.pose = demo.pose.map((pose) => pose + "M270 190L285 205");
  if (demo.id === "plank")
    demo.pose = demo.pose.map((pose) => pose + "M265 188L280 205");
  const still = figure(demo, false);
  await writeFile(
    new URL(`${demo.id}.svg`, output),
    prefix +
      `<style>.still{display:none}@media(prefers-reduced-motion:reduce){.motion{display:none}.still{display:inline}}</style><g class="motion">${figure(demo, true)}</g><g class="still">${still}</g></svg>\n`,
  );
  await writeFile(
    new URL(`${demo.id}.poster.svg`, output),
    prefix + still + "</svg>\n",
  );
}
console.log(`Generated ${demos.length} SVG demos and static posters.`);
