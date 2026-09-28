import type { PreparedStat } from "./prepare-map-stats";

export interface DangerResult {
  level: "Low" | "Medium" | "High" | "Extreme";
  score: number;
  flags: string[];
}

const PATTERNS: Array<{ re: RegExp; label: string; weight: number }> = [
  { re: /reflect/i, label: "Reflect", weight: 4 },
  {
    re: /maximum (player )?resistances|to all maximum resistances/i,
    label: "−Max res",
    weight: 3,
  },
  {
    re: /cannot regenerate|no regeneration|less recovery|reduced recovery (rate )?of|less life recovery/i,
    label: "No recovery",
    weight: 3,
  },
  {
    re: /monsters (deal|gain|have).*(extra|added).*damage as/i,
    label: "Extra damage",
    weight: 2,
  },
  { re: /penetrat/i, label: "Penetration", weight: 3 },
  {
    re: /additional projectile|extra projectile|projectiles/i,
    label: "Extra projectiles",
    weight: 2,
  },
  { re: /critical/i, label: "Crit", weight: 1 },
  { re: /chaos damage/i, label: "Chaos damage", weight: 2 },
  { re: /curse/i, label: "Curses", weight: 1 },
  {
    re: /increased (attack|cast|action) speed|are faster|increased speed/i,
    label: "Monster speed",
    weight: 1,
  },
  { re: /increased area of effect/i, label: "AoE", weight: 1 },
  { re: /stun/i, label: "Stun", weight: 1 },
  { re: /ailment|ignite|poison|bleed/i, label: "Ailments", weight: 1 },
  {
    re: /reduced effect|reduced duration.*flask|flask.*reduced/i,
    label: "Flask reduction",
    weight: 1,
  },
  {
    re: /enraged|on death|explode|corpse/i,
    label: "On-death effects",
    weight: 2,
  },
  { re: /life regeneration|leech/i, label: "Monster sustain", weight: 1 },
  {
    re: /rare monsters|unique boss|unique bosses/i,
    label: "Extra bosses",
    weight: 2,
  },
  {
    re: /players have.*less|reduced.*player|-#% to all/i,
    label: "Player debuff",
    weight: 2,
  },
];

export function dangerScore(stats: PreparedStat[]): DangerResult {
  let score = 0;
  const flags: string[] = [];
  for (const stat of stats) {
    for (const p of PATTERNS) {
      if (p.re.test(stat.matcher)) {
        score += p.weight;
        if (!flags.includes(p.label)) flags.push(p.label);
        break;
      }
    }
  }
  const level: DangerResult["level"] =
    score >= 13
      ? "Extreme"
      : score >= 8
        ? "High"
        : score >= 3
          ? "Medium"
          : "Low";
  return { level, score, flags };
}
