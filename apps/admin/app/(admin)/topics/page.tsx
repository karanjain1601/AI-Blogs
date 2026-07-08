import { createAdminClient } from "@/lib/supabase";
import { createTopicAction, deleteTopicAction } from "./actions";

export const metadata = { title: "Topics" };

async function getTopics() {
  try {
    const supa = createAdminClient();
    const { data } = await supa
      .from("topics")
      .select("id,slug,name,icon,parent_id,sort_order,description")
      .order("sort_order");
    return (data ?? []) as {
      id: string;
      slug: string;
      name: string;
      icon: string | null;
      parent_id: string | null;
      sort_order: number;
      description: string | null;
    }[];
  } catch {
    return null;
  }
}

const INPUT_CLS =
  "w-full px-3 py-2 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white placeholder-[#4a5058] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent text-sm";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const topics = await getTopics();

  // Build a flat tree for display
  const rootTopics = topics?.filter((t) => !t.parent_id) ?? [];
  const childTopics = (parentId: string) =>
    topics?.filter((t) => t.parent_id === parentId) ?? [];

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-6">Topics</h1>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2 mb-4">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Topic tree */}
        <div>
          <h2 className="text-sm font-medium text-[#8b919a] uppercase tracking-wider mb-3">
            Topic tree
          </h2>
          {topics === null ? (
            <p className="text-[#8b919a] text-sm">Supabase not configured.</p>
          ) : topics.length === 0 ? (
            <p className="text-[#8b919a] text-sm">No topics yet.</p>
          ) : (
            <div className="space-y-1">
              {rootTopics.map((topic) => (
                <div key={topic.id}>
                  <TopicRow topic={topic} />
                  {childTopics(topic.id).map((child) => (
                    <div key={child.id} className="ml-6 mt-1">
                      <TopicRow topic={child} isChild />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create topic form */}
        <div>
          <h2 className="text-sm font-medium text-[#8b919a] uppercase tracking-wider mb-3">
            New topic
          </h2>
          <form action={createTopicAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#c9cdd4] mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="Databases"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-xs text-[#c9cdd4] mb-1">
                  Slug <span className="text-red-400">*</span>
                </label>
                <input
                  name="slug"
                  required
                  placeholder="databases"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#c9cdd4] mb-1">
                  Parent topic
                </label>
                <select
                  name="parent_id"
                  className={INPUT_CLS}
                >
                  <option value="">— Root —</option>
                  {(topics ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#c9cdd4] mb-1">
                  Icon
                </label>
                <input
                  name="icon"
                  placeholder="🗄️"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#c9cdd4] mb-1">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Short description"
                rows={2}
                className={INPUT_CLS + " resize-none"}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create topic
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TopicRow({
  topic,
  isChild,
}: {
  topic: {
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    sort_order: number;
    description: string | null;
  };
  isChild?: boolean;
}) {
  const deleteAction = deleteTopicAction.bind(null, topic.id);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#131619] border border-[#2a2e35] rounded-lg">
      {topic.icon && <span className="text-base">{topic.icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white font-medium">{topic.name}</div>
        <div className="text-xs text-[#8b919a] font-mono">{topic.slug}</div>
      </div>
      <form action={deleteAction}>
        <button
          type="submit"
          className="text-xs text-[#8b919a] hover:text-red-400 transition-colors px-2 py-1 rounded"
        >
          ✕
        </button>
      </form>
    </div>
  );
}
