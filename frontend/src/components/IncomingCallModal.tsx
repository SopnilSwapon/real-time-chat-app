import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";

export default function IncomingCallModal() {
  const { incomingCall, callerId, acceptCall, rejectCall } = useCallStore(
    (state) => state
  );
  const { users } = useChatStore((state) => state);

  if (!incomingCall) return null;

  const caller = users?.find((u) => u._id === callerId);
  console.log(incomingCall, "check call come");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl text-center w-80">
        <h2 className="text-lg font-semibold text-black">Incoming Call</h2>
        <p className="mt-1 text-black">
          {caller?.fullName || "Unknown caller"}
        </p>

        <div className="flex justify-center gap-4 mt-5">
          <button className="btn btn-success" onClick={acceptCall}>
            Accept
          </button>
          <button className="btn btn-error" onClick={rejectCall}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
