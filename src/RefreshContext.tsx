import { createContext, useContext, useRef, useCallback, useEffect } from 'react';

type RefreshFn = () => Promise<void> | void;

const RefreshContext = createContext<{
  register: (fn: RefreshFn) => () => void;
  refreshAll: () => Promise<void>;
}>({ register: () => () => {}, refreshAll: async () => {} });

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const fns = useRef(new Set<RefreshFn>());

  const register = useCallback((fn: RefreshFn) => {
    fns.current.add(fn);
    return () => { fns.current.delete(fn); };
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all(Array.from(fns.current).map(fn => fn()));
  }, []);

  return (
    <RefreshContext.Provider value={{ register, refreshAll }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRegisterRefresh(fn: RefreshFn) {
  const { register } = useContext(RefreshContext);
  useEffect(() => register(fn), [register, fn]);
}

export function useRefreshAll() {
  return useContext(RefreshContext).refreshAll;
}
