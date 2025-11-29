import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";

export default function CallingModal() {
  const { isCalling, receiverId, cancelCall } = useCallStore((state) => state);
  const { users } = useChatStore((state) => state);

  if (!isCalling) return null;

  const receiver = users?.find((u) => u._id === receiverId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl text-center w-80">
        <h2 className="text-xl font-semibold mb-2">
          Calling {receiver?.fullName || "User"}…
        </h2>

        <div className="animate-pulse text-gray-600">Ringing…</div>

        <button className="btn btn-error w-full mt-5" onClick={cancelCall}>
          Cancel Call
        </button>
      </div>
    </div>
  );
}
