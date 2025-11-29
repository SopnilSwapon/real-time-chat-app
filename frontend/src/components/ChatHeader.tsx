// import { X } from "lucide-react";
// import { useAuthStore } from "../store/useAuthStore";
// import { useChatStore } from "../store/useChatStore";

// const ChatHeader = () => {
//   const { selectedUser, setSelectedUser } = useChatStore((state) => state);
//   const { onlineUsers } = useAuthStore((state) => state);

//   return (
//     <div className="p-2.5 border-b border-base-300">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           {/* Avatar */}
//           <div className="avatar">
//             <div className="size-10 rounded-full relative">
//               <img
//                 src={selectedUser?.profilePic || "/avatar.png"}
//                 alt={selectedUser?.fullName}
//               />
//             </div>
//           </div>

//           {/* User info */}
//           <div>
//             <h3 className="font-medium">{selectedUser?.fullName}</h3>
//             <p className="text-sm text-base-content/70">
//               {onlineUsers?.includes(selectedUser!._id) ? "Online" : "Offline"}
//             </p>
//           </div>
//         </div>

//         {/* Close button */}
//         <button onClick={() => setSelectedUser(null)}>
//           <X />
//         </button>
//       </div>
//     </div>
//   );
// };
// export default ChatHeader;

import { X, Phone } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore((state) => state);
  const { onlineUsers } = useAuthStore((state) => state);
  const { startCall } = useCallStore((state) => state);

  if (!selectedUser) return null;

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full">
              <img src={selectedUser.profilePic || "/avatar.png"} />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers?.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => startCall(selectedUser._id)}
          >
            <Phone size={18} />
          </button>

          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setSelectedUser(null)}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
