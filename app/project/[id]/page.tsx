import { supabase } from "@/lib/supabase";
import ProjectEditor from "@/components/ProjectEditor";

type Stage = {
  id: string;
  stage_type: "start" | "rough" | "final" | "lessons";
  media_urls: string[];
  notes: string;
  stage_order: number;
};

type Project = {
  id: string;
  title: string;
  summary: string;
  project_stages: Stage[];
};

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from ?? "/jmatt/profile";

  const { data, error } = await supabase
    .from("projects")
    .select("*, project_stages(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div style={{ padding: "4rem", fontFamily: "var(--font-haskoy), sans-serif" }}>
        <p>Could not load project. {error?.message}</p>
      </div>
    );
  }

  const project = data as Project;
  const stages = [...project.project_stages].sort(
    (a, b) => a.stage_order - b.stage_order
  );

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#F7F4EC",
        color: "#17160F",
        fontFamily: "var(--font-haskoy), sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${NOISE_URI})`,
          backgroundRepeat: "repeat",
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "720px",
          margin: "0 auto",
          padding: "3.5rem 1.5rem 6rem",
        }}
      >
        <ProjectEditor
          projectId={project.id}
          title={project.title}
          summary={project.summary}
          stages={stages}
          editable={backHref === "/jmatt/profile" || backHref === "/jmatt"}
          backHref={backHref}
        />
      </div>
    </main>
  );
}