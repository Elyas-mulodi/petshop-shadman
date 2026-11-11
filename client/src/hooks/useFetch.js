import { useCallback, useEffect, useRef, useState } from "react";

export const useFetch = (fetcher) => {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    return fetcherRef
      .current()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState((prev) => ({ ...prev, loading: false, error })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
};