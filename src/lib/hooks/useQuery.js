import { useState, useEffect, useCallback, useRef } from 'react';

export function useQuery(queryFn, deps = [], options = {}) {
  const { enabled = true, initialData = null } = options;

  const [state, setState] = useState(() => ({
    data: initialData,
    error: null,
    isLoading: Boolean(enabled),
  }));

  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const requestIdRef = useRef(0);

  const execute = useCallback(
    async (execOptions = { force: false }) => {
      const currentRequestId = ++requestIdRef.current;
      setState((prev) => ({
        ...prev,
        error: null,
        isLoading: true,
      }));

      try {
        const result = await queryFnRef.current(execOptions);
        if (requestIdRef.current === currentRequestId) {
          setState({
            data: result,
            error: null,
            isLoading: false,
          });
        }
        return result;
      } catch (err) {
        if (requestIdRef.current === currentRequestId) {
          setState((prev) => ({
            ...prev,
            error: err,
            isLoading: false,
          }));
        }
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    const currentRequestId = ++requestIdRef.current;

    Promise.resolve().then(async () => {
      if (cancelled || requestIdRef.current !== currentRequestId) return;
      setState((prev) => ({
        ...prev,
        error: null,
        isLoading: true,
      }));

      try {
        const result = await queryFnRef.current({ force: false });
        if (!cancelled && requestIdRef.current === currentRequestId) {
          setState({
            data: result,
            error: null,
            isLoading: false,
          });
        }
      } catch (err) {
        if (!cancelled && requestIdRef.current === currentRequestId) {
          setState((prev) => ({
            ...prev,
            error: err,
            isLoading: false,
          }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, execute, ...deps]);

  const refetch = useCallback(
    (refetchOptions = { force: true }) => execute(refetchOptions),
    [execute]
  );

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    refetch,
  };
}

export default useQuery;

