import { format } from "prettier";
import { mkdir, writeFile } from "node:fs/promises";
const output = new URL("../public/animations/", import.meta.url);
await mkdir(output, { recursive: true });
export const demos = [
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
  ...[
    {
      id: "glute-bridge",
      name: "Glute bridges",
      duration: 4,
      head: [
        [65, 174],
        [65, 174],
      ],
      pose: [
        "M88 184L150 189M150 189L206 147L236 204M150 189L194 150L222 204M90 184L112 201L147 204M95 184L119 196L154 201",
        "M88 184L150 139M150 139L206 147L236 204M150 139L194 150L222 204M90 184L112 201L147 204M95 184L119 196L154 201",
      ],
    },
    {
      id: "mountain-climbers",
      name: "Mountain climbers",
      duration: 2.8,
      head: [
        [75, 112],
        [75, 112],
      ],
      pose: [
        "M95 128L172 151M172 151L212 179L266 202M172 151L126 167L143 193M95 128L99 165L103 204M105 131L114 167L118 204",
        "M95 128L172 151M172 151L126 164L143 193M172 151L212 179L266 202M95 128L99 165L103 204M105 131L114 167L118 204",
      ],
    },
    {
      id: "burpees",
      name: "Burpees",
      duration: 7,
      head: [
        [160, 42],
        [150, 110],
        [76, 112],
        [73, 158],
        [150, 110],
        [160, 28],
      ],
      pose: [
        "M160 65L160 128M160 128L145 168L140 205M160 128L175 168L180 205M150 80L133 115L130 146M170 80L187 115L190 146",
        "M150 133L143 166M143 166L180 170L171 205M143 166L164 184L150 205M143 140L120 170L111 205M150 140L135 175L127 205",
        "M96 128L172 152M172 152L216 178L266 202M172 152L220 184L271 202M96 128L102 168L110 205M107 131L120 168L127 205",
        "M93 174L175 183M175 183L222 190L266 202M175 183L225 194L271 202M93 174L132 181L110 205M105 176L147 186L127 205",
        "M150 133L143 166M143 166L180 170L171 205M143 166L164 184L150 205M143 140L120 170L111 205M150 140L135 175L127 205",
        "M160 51L160 114M160 114L145 151L137 189M160 114L175 151L183 189M150 66L136 43L127 16M170 66L184 43L193 16",
      ],
    },
    {
      id: "hammer-curls",
      name: "Hammer curls",
      duration: 3.6,
      head: [
        [160, 42],
        [160, 42],
      ],
      weightAngle: 90,
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
    {
      id: "triceps-dips",
      name: "Triceps dips",
      duration: 4,
      head: [
        [144, 64],
        [144, 102],
      ],
      props:
        '<path d="M62 137H124M70 137V205M116 137V205" fill="none" stroke="#647653" stroke-width="8" stroke-linecap="round"/>',
      pose: [
        "M141 87L160 139M160 139L211 149L247 205M160 139L198 151L232 205M139 98L125 115L114 132M144 101L135 119L122 132",
        "M141 125L159 175M159 175L209 170L247 205M159 175L196 172L232 205M139 132L119 153L114 132M144 135L130 157L122 132",
      ],
    },
    {
      id: "shoulder-press",
      name: "Shoulder press",
      duration: 4,
      head: [
        [160, 77],
        [160, 77],
      ],
      weights: [
        [
          [111, 83],
          [128, 23],
        ],
        [
          [209, 83],
          [192, 23],
        ],
      ],
      pose: [
        "M160 100L160 148M140 115L180 115M160 148L144 178L139 205M160 148L176 178L181 205M140 115L111 119L111 83M180 115L209 119L209 83",
        "M160 100L160 148M140 115L180 115M160 148L144 178L139 205M160 148L176 178L181 205M140 115L130 65L128 23M180 115L190 65L192 23",
      ],
    },
    {
      id: "lateral-raises",
      name: "Lateral raises",
      duration: 4,
      head: [
        [160, 42],
        [160, 42],
      ],
      weights: [
        [
          [128, 151],
          [73, 88],
        ],
        [
          [192, 151],
          [247, 88],
        ],
      ],
      pose: [
        "M160 65L160 130M140 80L180 80M160 130L144 168L140 205M160 130L176 168L180 205M140 80L129 116L128 151M180 80L191 116L192 151",
        "M160 65L160 130M140 80L180 80M160 130L144 168L140 205M160 130L176 168L180 205M140 80L105 82L73 88M180 80L215 82L247 88",
      ],
    },
    {
      id: "band-rows",
      name: "Band rows",
      duration: 4,
      head: [
        [205, 45],
        [205, 45],
      ],
      props:
        '<path d="M38 68V121" stroke="#647653" stroke-width="8" stroke-linecap="round"/>',
      bands: [["M40 91L129 97M40 91L138 109", "M40 91L180 101M40 91L190 111"]],
      pose: [
        "M201 68L193 130M193 130L183 169L175 205M193 130L211 167L217 205M201 85L162 91L129 97M205 94L172 105L138 109",
        "M201 68L193 130M193 130L183 169L175 205M193 130L211 167L217 205M201 85L230 109L180 101M205 94L239 120L190 111",
      ],
    },
    {
      id: "dumbbell-rows",
      name: "Dumbbell rows",
      duration: 4,
      head: [
        [91, 82],
        [91, 82],
      ],
      weights: [
        [
          [113, 177],
          [157, 136],
        ],
      ],
      pose: [
        "M110 101L179 144M179 144L191 175L193 205M179 144L142 175L130 205M110 101L112 138L113 177M119 106L147 134L174 146",
        "M110 101L179 144M179 144L191 175L193 205M179 144L142 175L130 205M110 101L164 108L157 136M119 106L147 134L174 146",
      ],
    },
    {
      id: "reverse-fly",
      name: "Reverse fly",
      duration: 4,
      head: [
        [160, 76],
        [160, 76],
      ],
      weights: [
        [
          [141, 168],
          [76, 101],
        ],
        [
          [179, 168],
          [244, 101],
        ],
      ],
      pose: [
        "M160 99L160 145M141 111L179 111M160 145L143 177L137 205M160 145L177 177L183 205M141 111L135 140L141 168M179 111L185 140L179 168",
        "M160 99L160 145M141 111L179 111M160 145L143 177L137 205M160 145L177 177L183 205M141 111L111 101L76 101M179 111L209 101L244 101",
      ],
    },
    {
      id: "goblet-squats",
      name: "Goblet squats",
      duration: 4.5,
      head: [
        [178, 45],
        [150, 88],
      ],
      weightAngle: 90,
      weights: [
        [
          [207, 99],
          [199, 130],
        ],
      ],
      pose: [
        "M174 68L160 120M160 120L180 160L180 205M160 120L167 160L167 205M174 80L189 112L207 99M174 80L181 117L207 99",
        "M145 110L115 150M115 150L165 165L180 205M115 150L150 165L167 205M145 118L173 145L199 130M145 118L165 151L199 130",
      ],
    },
    {
      id: "romanian-deadlifts",
      name: "Romanian deadlifts",
      duration: 4.5,
      head: [
        [180, 43],
        [104, 107],
      ],
      weights: [
        [
          [183, 147],
          [126, 184],
        ],
        [
          [195, 154],
          [138, 190],
        ],
      ],
      pose: [
        "M175 66L163 125M163 125L177 167L178 205M163 125L161 167L160 205M174 81L180 114L183 147M181 87L191 120L195 154",
        "M124 123L165 149M165 149L178 171L178 205M165 149L161 171L160 205M130 126L127 154L126 184M139 132L139 160L138 190",
      ],
    },
    {
      id: "calf-raises",
      name: "Calf raises",
      duration: 3.8,
      head: [
        [160, 42],
        [160, 29],
      ],
      pose: [
        "M160 65L160 130M160 130L146 165L140 197M160 130L174 165L180 197M150 80L135 114L132 145M170 80L185 114L188 145M140 197L153 205M180 197L193 205",
        "M160 52L160 117M160 117L146 152L140 184M160 117L174 152L180 184M150 67L135 101L132 132M170 67L185 101L188 132M140 184L153 205M180 184L193 205",
      ],
    },
    {
      id: "leg-raises",
      name: "Leg raises",
      duration: 4,
      head: [
        [62, 177],
        [62, 177],
      ],
      pose: [
        "M85 188L149 192M149 192L207 194L270 195M149 192L205 202L266 203M88 188L110 204L148 205M94 188L120 198L156 200",
        "M85 188L149 192M149 192L158 126L166 61M149 192L171 127L179 63M88 188L110 204L148 205M94 188L120 198L156 200",
      ],
    },
    {
      id: "russian-twists",
      name: "Russian twists",
      duration: 4,
      head: [
        [144, 99],
        [162, 99],
      ],
      pose: [
        "M149 121L176 182M176 182L215 153L257 203M176 182L203 159L242 205M144 133L120 158L120 185M156 133L135 160L120 185",
        "M161 121L176 182M176 182L215 153L257 203M176 182L203 159L242 205M155 133L197 154L209 181M167 133L208 152L209 181",
      ],
    },
    {
      id: "side-plank",
      name: "Side plank",
      duration: 4,
      head: [
        [73, 132],
        [73, 131],
      ],
      pose: [
        "M92 151L170 170M170 170L220 182L268 196M170 170L221 189L271 201M92 151L103 194L138 205M97 150L108 116L109 81",
        "M92 150L170 169M170 169L220 182L268 196M170 169L221 189L271 201M92 150L103 194L138 205M97 149L108 115L109 80",
      ],
    },
    {
      id: "triceps-extensions",
      name: "Overhead triceps extensions",
      duration: 4,
      head: [
        [155, 82],
        [155, 82],
      ],
      weightAngle: 90,
      weights: [
        [
          [189, 103],
          [184, 27],
        ],
      ],
      pose: [
        "M155 105L155 151M155 151L140 180L135 205M155 151L170 180L175 205M155 114L181 55L186 102M165 114L190 58L193 104",
        "M155 105L155 151M155 151L140 180L135 205M155 151L170 180L175 205M155 114L181 55L179 26M165 114L190 58L190 29",
      ],
    },
    {
      id: "march-in-place",
      name: "Brisk march in place",
      duration: 2.8,
      head: [
        [160, 42],
        [160, 42],
      ],
      pose: [
        "M160 65L160 129M160 129L124 145L129 179M160 129L175 168L180 205M147 82L130 102L138 70M173 82L190 116L186 149",
        "M160 65L160 129M160 129L145 168L140 205M160 129L196 145L191 179M147 82L130 116L134 149M173 82L190 102L182 70",
      ],
    },
  ],
];
function animate(attribute, frames, duration, transform = false) {
  const values =
    frames.length === 2
      ? [frames[0], frames[0], frames[1], frames[1], frames[0]]
      : [...frames, frames[0]];
  const times =
    frames.length === 2
      ? [0, 0.1, 0.45, 0.6, 1]
      : values.map((_, i) => i / (values.length - 1));
  const tag = transform ? "animateTransform" : "animate";
  return (
    "<" +
    tag +
    ' attributeName="' +
    attribute +
    '" ' +
    (transform ? 'type="translate" ' : "") +
    'values="' +
    values.join(";") +
    '" keyTimes="' +
    times.join(";") +
    '" calcMode="spline" keySplines="' +
    times
      .slice(1)
      .map(() => ".42 0 .58 1")
      .join(";") +
    '" dur="' +
    duration +
    's" repeatCount="indefinite"/>'
  );
}
export function figure(demo, moving) {
  const head = demo.head[0];
  let html = demo.props ?? "";
  for (const band of demo.bands ?? [])
    html +=
      '<path d="' +
      band[0] +
      '" fill="none" stroke="#84b9e8" stroke-width="4">' +
      (moving ? animate("d", band, demo.duration) : "") +
      "</path>";
  html +=
    '<g fill="none" stroke="#ccf66b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="' +
    head[0] +
    '" cy="' +
    head[1] +
    '" r="13">' +
    (moving
      ? animate(
          "cx",
          demo.head.map((p) => p[0]),
          demo.duration,
        ) +
        animate(
          "cy",
          demo.head.map((p) => p[1]),
          demo.duration,
        )
      : "") +
    '</circle><path d="' +
    demo.pose[0] +
    '">' +
    (moving ? animate("d", demo.pose, demo.duration) : "") +
    "</path></g>";
  for (const positions of demo.weights ?? []) {
    const initial = positions[0];
    html +=
      '<g transform="translate(' +
      initial.join(" ") +
      ')">' +
      (moving
        ? animate(
            "transform",
            positions.map((p) => p.join(" ")),
            demo.duration,
            true,
          )
        : "") +
      '<g transform="rotate(' +
      (demo.weightAngle ?? 0) +
      ')" fill="#98b66a" stroke="#10170d" stroke-width="2"><path d="M-13-5H13V5H-13Z"/><rect x="-16" y="-10" width="7" height="20" rx="2"/><rect x="9" y="-10" width="7" height="20" rx="2"/></g></g>';
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
const manifest = Object.fromEntries(
  demos.map((demo) => [
    demo.id,
    {
      animationPath: "/animations/" + demo.id + ".svg",
      posterPath: "/animations/" + demo.id + ".poster.svg",
    },
  ]),
);
const manifestLines = [
  "// Generated by scripts/generate-demos.mjs.",
  "export type DemoAsset = {",
  "  animationPath: `/animations/${string}.svg`;",
  "  posterPath: `/animations/${string}.svg`;",
  "};",
  "export const demoAssets: Record<string, DemoAsset> = " +
    JSON.stringify(manifest, null, 2) +
    ";",
  "export function resolveDemoAsset(id: string, path: string): DemoAsset | null {",
  "  const asset = demoAssets[id];",
  "  return asset && asset.animationPath === path ? asset : null;",
  "}",
];
await writeFile(
  new URL("../src/data/animationAssets.ts", import.meta.url),
  await format(manifestLines.join("\n") + "\n", { parser: "typescript" }),
);
