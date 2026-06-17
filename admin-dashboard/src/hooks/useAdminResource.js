import {useState, useCallback} from 'react';
import api from '../services/api';

/**
 * Generic async hook for admin API resources.
 * Covers list fetch + create, update, delete, and arbitrary actions.
 */
export function useAdminResource(basePath) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, path, body = null, params = null) => {
    setLoading(true);
    setError(null);
    try {
      const config = {params};
      const response = body
        ? await api[method](path, body, config)
        : await api[method](path, config);
      return {ok: true, data: response.data};
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Something went wrong';
      setError(msg);
      return {ok: false, error: msg};
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchList = useCallback(
    (params) => request('get', basePath, null, params).then(res => {
      if (res.ok) setData(res.data?.data ?? res.data);
      return res;
    }),
    [request, basePath],
  );

  const fetchOne = useCallback(
    (id) => request('get', `${basePath}/${id}`).then(res => {
      if (res.ok) setData(res.data?.data ?? res.data);
      return res;
    }),
    [request, basePath],
  );

  const create = useCallback(
    (body) => request('post', basePath, body),
    [request, basePath],
  );

  const update = useCallback(
    (id, body, method = 'put') => request(method, `${basePath}/${id}`, body),
    [request, basePath],
  );

  const remove = useCallback(
    (id) => request('delete', `${basePath}/${id}`),
    [request, basePath],
  );

  const action = useCallback(
    (method, path, body = null, params = null) => request(method, path, body, params),
    [request],
  );

  return {data, loading, error, setData, setError, fetchList, fetchOne, create, update, remove, action};
}
