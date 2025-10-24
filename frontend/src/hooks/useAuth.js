import { useAuth as useAuthCtx } from "../context/AuthContext";
export default function useAuth() { return useAuthCtx(); }
export const useAuthHook = useAuth;