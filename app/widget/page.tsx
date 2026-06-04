import { ChatWidget } from "@/components/chat/chat-widget";

export default function WidgetPreviewPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-xl border border-[#eadde1] bg-[#fbf7f8] px-6 py-16">
          <p className="text-sm font-black uppercase tracking-wider text-[#B5212F]">
            AwesomeTech website mock
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-[#171015]">
            Mortgage technology services for modern lending teams
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6e6269]">
            This page previews how Awesome Genie would sit on top of the public website as a
            floating chatbot widget.
          </p>
        </div>
      </section>
      <ChatWidget defaultOpen={false} />
    </main>
  );
}
