import { labelName } from '../../assessments';

export default function ClassScores({ classes }) {
  return (
    <ul className="space-y-2">
      {classes.map(({ label, score }) => (
        <li key={label} className="flex items-center gap-3 text-sm">
          <span className="w-32 sm:w-40 capitalize">{labelName(label)}</span>
          <progress className="flex-1 min-w-0 h-1.5 score-bar" max={1} value={score} aria-label={labelName(label)} />
          <span className="w-14 text-right tabular-nums">{(score * 100).toFixed(1)}%</span>
        </li>
      ))}
    </ul>
  );
}
