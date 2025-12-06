export default function SessionCard({ session }: { session: { mentor: string; date: string; time: string } }) {
  return (
    <article className="bg-white rounded-lg p-4 shadow border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[11px] text-gray-600 font-medium">You have a session</p>
          <p className="text-base font-semibold text-gray-900">{session.mentor} today!</p>
          <p className="text-gray-700 text-[12px] mt-1">
            {session.date} | {session.time}
          </p>
        </div>

        <a className="text-[11px] text-gray-700 hover:text-orange-600 font-medium">View →</a>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 bg-orange-500 text-white text-xs rounded-lg font-medium">Join</button>

        <button className="px-4 py-2 border border-gray-300 text-xs text-gray-600 rounded-lg font-medium">
          Message
        </button>

        <button className="px-2 text-gray-800 text-xs hover:text-orange-600 font-medium">Reschedule</button>

        <button className="text-red-600 text-xs font-semibold">Cancel</button>
      </div>
    </article>
  );
}