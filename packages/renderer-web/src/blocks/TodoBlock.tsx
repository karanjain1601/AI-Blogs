import type { TodoBlock as TodoBlockType } from "@notes/blocks";

export function TodoBlock({ block }: { block: TodoBlockType }) {
  return (
    <ul className="nb-todo">
      {block.items.map((item, i) => (
        <li key={i} className={item.checked ? "done" : undefined}>
          <input type="checkbox" checked={item.checked} readOnly aria-hidden="true" />
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
